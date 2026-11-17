import { handleRequest, MemoryQuota, type Env } from "./handler.ts";
const read = (name: string) => Deno.env.get(name) || "";
const env: Env = {
  SUPABASE_URL: read("SUPABASE_URL"),
  SUPABASE_PUBLISHABLE_KEY: read("SUPABASE_ANON_KEY"),
  OPENROUTER_API_KEY: read("OPENROUTER_API_KEY"),
  OPENROUTER_MODEL:
    read("OPENROUTER_MODEL") || "nvidia/nemotron-3-ultra-550b-a55b:free",
  ALLOWED_ORIGIN: read("ALLOWED_ORIGIN"),
  QUOTA: new MemoryQuota(),
};
// JWT vẫn bắt buộc và được xác minh qua Supabase Auth trước mỗi lượt hỏi.
// Không gọi SQL, REST cơ sở dữ liệu hoặc dùng khóa service_role.
Deno.serve((request) => handleRequest(request, env));
