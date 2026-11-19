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
export async function rpc<T>(
  name: string,
  args: Record<string, unknown> = {},
): Promise<T> {
  if (!supabase) throw new Error("Cần kết nối để dùng phòng học chung.");
  const { data, error } = await supabase.rpc(name, args);
  if (error) {
    const safe =
      /^(Tin cần|Hãy |Cần |Phòng |Tài khoản |Bạn |Nội dung |Tin |Thao tác |Chỉ người|Cổng )/.test(
        error.message,
      );
    throw new Error(
      safe ? error.message : "Chưa kết nối được phòng học. Hãy thử lại sau.",
    );
  }
  return data as T;
}
