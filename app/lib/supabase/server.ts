import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { requireEnv } from "../env";

type CookieJar = { getAll(): { name: string; value: string }[]; setAll(list: { name: string; value: string; options: CookieOptions }[]): void };

/** Supabase client acting as the signed-in visitor (anon key + their auth cookies). Used for Auth only; data goes through the service role. */
export function supabaseForCookies(jar: CookieJar) {
  return createServerClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"), {
    cookies: { getAll: () => jar.getAll(), setAll: (list) => jar.setAll(list) },
  });
}

/** For route handlers and server components. Server components cannot write cookies; the proxy refreshes tokens instead. */
export async function supabaseServer() {
  const jar = await cookies();
  return supabaseForCookies({
    getAll: () => jar.getAll(),
    setAll: (list) => {
      try {
        for (const { name, value, options } of list) jar.set(name, value, options);
      } catch {
        // Called from a server component: read-only cookies. proxy.ts already refreshed the session for this request.
      }
    },
  });
}
