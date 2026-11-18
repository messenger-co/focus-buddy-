export const MESSAGE_LENGTH = 320;
export const SEND_INTERVAL_MS = 3000;
export const VISIBLE_MESSAGES = 80;
export const STUDY_ROOMS = [
  {
    id: "tu-hoc",
    name: "Bàn tự học",
    description: "Trao đổi cách chia thời gian và giữ nhịp học.",
    subject: "Phương pháp học",
  },
  {
    id: "go-bai",
    name: "Cùng gỡ bài",
    description: "Chia sẻ chỗ còn vướng để các bạn cùng gợi ý.",
    subject: "Bài tập",
  },
  {
    id: "doc-sach",
    name: "Góc đọc sách",
    description: "Kể về một cuốn sách hoặc đoạn văn bạn thích.",
    subject: "Đọc cùng nhau",
  },
] as const;
export type StudyRoom = (typeof STUDY_ROOMS)[number];
type Writer = { author: string; key: CryptoKey };
export interface Note {
  id: string;
  author: string;
  body: string;
  signature: string;
}
export interface DisplayNote {
  id: string;
  author: string;
  body: string;
  received: number;
}

export function channelName(room: StudyRoom["id"], origin: string) {
  return `focus-buddy-2:${origin}:${room}`;
}
const base64 = (bytes: ArrayBuffer) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
const bytes = (s: string) =>
  Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (ch) =>
    ch.charCodeAt(0),
  );
const encodeNote = (room: string, id: string, author: string, body: string) =>
  new TextEncoder().encode(JSON.stringify([room, id, author, body]));
const isValidText = (body: unknown): body is string =>
  typeof body === "string" &&
  body.length > 0 &&
  body.length <= MESSAGE_LENGTH &&
  body === body.trim() &&
  !/[\u0000-\u001f\u007f\u202a-\u202e\u2066-\u2069]/u.test(body);

export async function createWriter(): Promise<Writer> {
  const keys = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign", "verify"],
  );
  return {
    author: base64(await crypto.subtle.exportKey("raw", keys.publicKey)),
    key: keys.privateKey,
  };
}
let writer: Promise<Writer> | undefined;
export function sessionWriter() {
  writer ??= createWriter().catch((error) => {
    writer = undefined;
    throw error;
  });
  return writer;
}

export function nickname(author: string) {
  const creatures = ["Cáo", "Cú", "Mèo", "Thỏ", "Gấu", "Rồng"];
  const colors = ["Mây", "Trúc", "Nắng", "Sương", "Đậu", "Mơ", "Lá"];
  return `${creatures[author.charCodeAt(4) % creatures.length]} ${colors[author.charCodeAt(5) % colors.length]} · ${author.slice(8, 13)}`;
}

export async function signNote(
  writer: Writer,
  room: string,
  draft: string,
): Promise<Note> {
  const body = draft.trim();
  if (!isValidText(body))
    throw new Error("Nhập từ 1 đến 320 ký tự trên một dòng.");
  const id = crypto.randomUUID();
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    writer.key,
    encodeNote(room, id, writer.author, body),
  );
  return { id, author: writer.author, body, signature: base64(signature) };
}

// Mỗi biệt danh gắn với một khóa của phiên. Các trình duyệt chỉ hiển thị tin do chính khóa đó ký cho phòng này.
export async function readNote(
  value: unknown,
  room: string,
): Promise<DisplayNote | null> {
  if (!value || typeof value !== "object") return null;
  const { id, author, body, signature } = value as Partial<Note>;
  if (
    typeof id !== "string" ||
    !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/.test(id) ||
    typeof author !== "string" ||
    !/^[\w-]{87}$/.test(author) ||
    typeof signature !== "string" ||
    !/^[\w-]{86}$/.test(signature) ||
    !isValidText(body)
  )
    return null;
  try {
    const publicKey = await crypto.subtle.importKey(
      "raw",
      bytes(author),
      { name: "ECDSA", namedCurve: "P-256" },
      false,
      ["verify"],
    );
    const ok = await crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      publicKey,
      bytes(signature),
      encodeNote(room, id, author, body),
    );
    return ok ? { id, author, body, received: Date.now() } : null;
  } catch {
    return null;
  }
}
