import type { SupabaseClient } from "@supabase/supabase-js";
import { readNote, type DisplayNote, type Note } from "./messages";

export type RoomStatus = "joining" | "online" | "offline";
const EVENT = "tin-nhan-v1";
const leaving = new Map<string, Promise<void>>();

export async function connectRoom(
  client: SupabaseClient,
  topic: string,
  signal: AbortSignal,
  onStatus: (s: RoomStatus) => void,
  onNote: (note: DisplayNote) => void,
) {
  // Supabase tái sử dụng kênh cùng tên. Chờ lần rời phòng trước hoàn tất khi người dùng nhấn kết nối lại.
  await leaving.get(topic);
  if (signal.aborted) return null;

  let online = false;
  let queue = Promise.resolve();
  let pending = 0;
  const channel = client.channel(topic, {
    config: { broadcast: { ack: true, self: false } },
  });
  signal.addEventListener(
    "abort",
    () => {
      const done = client
        .removeChannel(channel)
        .then(() => {})
        .catch(() => {});
      leaving.set(topic, done);
      void done.then(() => {
        if (leaving.get(topic) === done) leaving.delete(topic);
      });
    },
    { once: true },
  );

  channel
    .on("broadcast", { event: EVENT }, ({ payload }) => {
      if (signal.aborted || pending >= 24) return;
      pending++;
      queue = queue
        .then(async () => {
          if (signal.aborted) return;
          const note = await readNote(payload, topic);
          if (!signal.aborted && note) onNote(note);
        })
        .catch(() => {})
        .finally(() => {
          pending--;
        });
    })
    .subscribe((status) => {
      if (signal.aborted) return;
      online = status === "SUBSCRIBED";
      onStatus(online ? "online" : "offline");
    });

  return {
    async send(note: Note) {
      if (signal.aborted || !online)
        throw new Error("Phòng đang mất kết nối. Bạn hãy kết nối lại.");
      const ack = await channel.send(
        { type: "broadcast", event: EVENT, payload: note },
        { timeout: 6500 },
      );
      if (ack !== "ok")
        throw new Error("Phòng chưa xác nhận đã nhận tin. Bạn có thể gửi lại.");
    },
  };
}
