import { supabase } from "../cloud";

export interface Room {
  id: string;
  name: string;
  description: string;
  private?: boolean;
}
export interface Status {
  enabled: boolean;
  verified: boolean;
  moderator: boolean;
  rooms: Room[];
}
export interface Profile {
  alias: string;
  buddy: string;
  theme: string;
  interest: string;
}
export interface Message extends Profile {
  id: string;
  body: string;
  mine: boolean;
  created: string;
  state: "pending" | "approved";
  pinned: boolean;
  reply: string | null;
  reactions: Record<string, number>;
  myReaction: string | null;
}
export interface Feed {
  online: number;
  messages: Message[];
}
export interface Review {
  id: string;
  room: string;
  body: string;
  alias: string;
  state: string;
  reasons: string[];
}
export type RoomEntryMode = "live" | "self-study";

/** Server-side moderation gates must always decide whether live chat opens.
 * Every subject remains open as a local self-study topic when the gate is closed.
 */
export function roomEntryMode(status: Pick<Status, "enabled" | "verified">): RoomEntryMode {
  return status.enabled && status.verified ? "live" : "self-study";
}
export function decodeCommunityStatus(value: unknown): Status {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Trạng thái phòng học không hợp lệ. Vui lòng thử kết nối lại.");
  const data = value as Partial<Status>;
  if (
    typeof data.enabled !== "boolean" ||
    typeof data.verified !== "boolean" ||
    typeof data.moderator !== "boolean" ||
    !Array.isArray(data.rooms)
  )
    throw new Error("Trạng thái phòng học chưa đầy đủ. Vui lòng thử kết nối lại.");
  const rooms: Room[] = [];
  for (const room of data.rooms) {
    if (
      !room ||
      typeof room !== "object" ||
      typeof room.id !== "string" ||
      !/^[a-z0-9-]{1,64}$/.test(room.id) ||
      typeof room.name !== "string" ||
      !room.name.trim() ||
      room.name.length > 100 ||
      typeof room.description !== "string" ||
      room.description.length > 280
    ) throw new Error("Danh mục phòng học không hợp lệ. Vui lòng thử kết nối lại.");
    rooms.push({
      id: room.id,
      name: room.name,
      description: room.description,
      private: room.private === true,
    });
  }
  return {
    enabled: data.enabled,
    verified: data.verified,
    moderator: data.moderator,
    rooms,
  };
}

/** Only show actionable, public-facing diagnostics; no raw database or JWT details. */
export function roomErrorMessage(error: unknown): string {
  const message =
    error instanceof Error ? error.message :
      error && typeof error === "object" && "message" in error
        ? String(error.message) : "";
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code) : "";
  if (code === "PGRST202" || code === "42883" ||
    /could not find the function|function public\.fb_|schema cache/i.test(message))
    return "Máy chủ chưa cài đặt đầy đủ phòng thảo luận. Quản trị viên cần áp dụng các migration Supabase theo tài liệu dự án.";
  if (code === "42501" || code === "PGRST301" ||
    /\b(jwt|not authenticated|permission denied|unauthorized|invalid token)\b/i.test(message))
    return "Phiên đăng nhập chưa hợp lệ hoặc chưa đủ quyền. Hãy đăng nhập lại bằng email đã xác minh.";
  if (/failed to fetch|networkerror|network request failed|fetch failed|timed out/i.test(message))
    return "Không kết nối được máy chủ phòng thảo luận. Kiểm tra mạng rồi thử lại.";
  if (/^(Tin cần|Hãy |Cần |Phòng |Tài khoản |Bạn |Nội dung |Tin |Thao tác |Chỉ người|Cổng |Trạng thái |Danh mục )/.test(message))
    return message;
  return "Chưa kết nối được phòng thảo luận. Hãy thử lại hoặc báo quản trị viên kiểm tra Supabase.";
}

export async function rpc<T>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (!supabase)
    throw new Error(
      "Phòng thảo luận trực tuyến chưa được cấu hình. Bạn vẫn có thể vào chủ đề tự học trên thiết bị.",
    );
  const { data, error } = await supabase.rpc(name, args);
  if (error) throw new Error(roomErrorMessage(error));
  return data as T;
}
