// Bộ thử tự tạo và gỡ một dự án Supabase trên máy chạy Docker.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { cp, mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";

const work = await mkdtemp(join(tmpdir(), "fb-room-network-"));
const dir = join(work, "supabase");
const cli = (...args) =>
  execFileSync("supabase", [...args, "--workdir", work], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    maxBuffer: 16 * 1024 * 1024,
  });
const clients = [];
const freshClient = (url, key) => {
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  clients.push(client);
  return client;
};
const data = ({ data, error }) => {
  if (error) throw new Error(error.message);
  return data;
};
const call = async (client, name, args = {}) =>
  data(await client.rpc(name, args));
const denied = async (client, name, args) =>
  assert.ok((await client.rpc(name, args)).error, name);
const room = { p_room: "toan" };

function subscribe(channel) {
  return new Promise((resolve) => {
    channel.subscribe((state, error) => {
      if (["SUBSCRIBED", "CHANNEL_ERROR", "TIMED_OUT"].includes(state))
        resolve({ state, reason: error?.message });
    }, 20_000);
  });
}

try {
  await mkdir(dir);
  await cp(new URL("../migrations", import.meta.url), join(dir, "migrations"), {
    recursive: true,
  });
  await writeFile(
    join(dir, "config.toml"),
    [
      'project_id = "fb-network-' + randomUUID() + '"',
      "[api]",
      "port = 57621",
      "[db]",
      "port = 57622",
      "shadow_port = 57620",
      "major_version = 17",
      "[db.seed]",
      "enabled = false",
      "[auth]",
      "enable_anonymous_sign_ins = true",
      "[analytics]",
      "enabled = false",
    ].join("\n"),
  );
  console.log("Khởi động Auth, PostgreSQL, PostgREST và Realtime cục bộ.");
  cli(
    "start",
    "-x",
    "storage-api,imgproxy,mailpit,postgres-meta,studio,edge-runtime,logflare,vector,supavisor",
  );
  const status = JSON.parse(cli("status", "-o", "json"));
  for (const [value, port] of [
    [status.API_URL, "57621"],
    [status.DB_URL, "57622"],
  ]) {
    const url = new URL(value);
    assert.ok(
      ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) &&
        url.port === port,
    );
  }
  const pub = status.PUBLISHABLE_KEY || status.ANON_KEY;
  const admin = freshClient(
    status.API_URL,
    status.SECRET_KEY || status.SERVICE_ROLE_KEY,
  );
  const guest = freshClient(status.API_URL, pub);
  assert.equal((await call(guest, "fb_community_status")).enabled, false);
  data(await guest.auth.signInAnonymously());
  await denied(guest, "fb_room_join", room);

  async function account() {
    const email = randomUUID() + "@example.test",
      password = randomUUID();
    data(
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      }),
    );
    const client = freshClient(status.API_URL, pub);
    const { user, session } = data(
      await client.auth.signInWithPassword({ email, password }),
    );
    await client.realtime.setAuth(session.access_token);
    return { client, id: user.id };
  }
  const [author, reader, moderator] = await Promise.all([
    account(),
    account(),
    account(),
  ]);
  execFileSync(
    "psql",
    [
      status.DB_URL,
      "-Xq",
      "-v",
      "ON_ERROR_STOP=1",
      "-v",
      "moderator=" + moderator.id,
      "-f",
      "-",
    ],
    {
      input:
        "insert into buddy_community.moderators(account) values (:'moderator'::uuid);\nupdate buddy_community.settings set enabled=true;",
      stdio: ["pipe", "ignore", "pipe"],
    },
  );
  await denied(guest, "fb_room_join", room);
  await call(author.client, "fb_room_join", room);
  const topic = "focus-buddy-room:toan";
  const options = { config: { private: true } };
  const outside = reader.client.channel(topic, options);
  const rejection = await subscribe(outside);
  assert.equal(
    rejection.state,
    "CHANNEL_ERROR",
    "Tài khoản chưa vào phòng phải bị từ chối.",
  );
  await reader.client.removeChannel(outside);
  await call(reader.client, "fb_room_join", room);

  let revision = 0;
  const channel = reader.client.channel(topic, options).on(
    "postgres_changes",
    {
      event: "UPDATE",
      schema: "public",
      table: "fb_room_updates",
      filter: "room=eq.toan",
    },
    ({ new: next }) => {
      assert.deepEqual(Object.keys(next).sort(), ["revision", "room"]);
      revision = next.revision;
    },
  );
  const joined = await subscribe(channel);
  assert.equal(joined.state, "SUBSCRIBED", joined.reason);
  const id = await call(author.client, "fb_room_send", {
    ...room,
    p_body: "Mình đang học về phân số.",
  });
  await denied(author.client, "fb_room_send", {
    ...room,
    p_body: "Tin kế tiếp.",
  });
  const feed = async () =>
    (await call(reader.client, "fb_room_feed", room)).messages;
  assert.equal((await feed()).length, 0);
  const action = { p_message: id, p_action: "approve" };
  await denied(reader.client, "fb_moderate", action);
  await call(moderator.client, "fb_moderate", action);
  for (let turn = 0; turn < 60 && !revision; turn++) await delay(250);
  assert.ok(
    revision > 0,
    "Thành viên phải nhận được tín hiệu Realtime sau kiểm duyệt.",
  );
  assert.equal((await feed())[0]?.id, id);
  await call(reader.client, "fb_room_feedback", {
    p_message: id,
    p_action: "report",
    p_value: "spam",
  });
  await call(reader.client, "fb_room_feedback", {
    p_message: id,
    p_action: "block",
  });
  assert.equal((await feed()).length, 0);
  await call(moderator.client, "fb_moderate", {
    p_message: id,
    p_action: "suspend",
  });
  await denied(author.client, "fb_room_join", room);
  console.log(
    "Đạt kiểm tra JWT, kênh riêng, kiểm duyệt, Realtime, hạn mức, báo cáo, chặn và đình chỉ.",
  );
} catch (error) {
  // CLI có thể trả khóa cục bộ trong stdout. Chỉ ghi mã lỗi và thông báo đã lọc.
  if (error.cmd) {
    const detail = String(error.stderr ?? "")
      .split("\n")
      .filter(
        (line) =>
          /error|failed|fatal|permission denied|unknown flag/i.test(line) &&
          !/key|token|secret|eyJ|postgresql:\/\//i.test(line),
      )
      .slice(-4)
      .join("\n");
    console.error("Dịch vụ thử nghiệm gặp lỗi.", detail);
  } else console.error(error.message);
  process.exitCode = 1;
} finally {
  await Promise.allSettled(
    clients.map(async (client) => {
      await client.removeAllChannels();
      client.realtime.disconnect();
      await client.auth.stopAutoRefresh();
    }),
  );
  try {
    cli("stop", "--no-backup");
  } catch {
    /* Dự án có thể chưa khởi động. */
  }
  await rm(work, { recursive: true, force: true });
}
