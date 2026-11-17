import { handleRequest, type Env } from './handler.ts';
const read = (name: string) => Deno.env.get(name) || '';
const env: Env = {
  SUPABASE_URL: read('SUPABASE_URL'),
  SUPABASE_PUBLISHABLE_KEY: read('SUPABASE_ANON_KEY'),
  OPENROUTER_API_KEY: read('OPENROUTER_API_KEY'),
  OPENROUTER_MODEL: read('OPENROUTER_MODEL'),
  ALLOWED_ORIGIN: read('ALLOWED_ORIGIN'),
  RATE_LIMITER: {
    idFromName: id => id,
    get: id => ({ fetch: async () => {
      const secret = read('SUPABASE_SERVICE_ROLE_KEY');
      return await fetch(`${read('SUPABASE_URL')}/rest/v1/rpc/consume_ai_quota`, {
        method: 'POST',
        headers: { apikey: secret, Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ p_user_id: id }),
        signal: AbortSignal.timeout(8000),
      });
    } }),
  },
};
// JWT được xác minh ở handler qua Supabase Auth trước khi dùng mã người dùng.
Deno.serve(request => handleRequest(request, env));
