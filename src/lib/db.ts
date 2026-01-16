import { drizzle } from 'drizzle-orm/d1';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import * as schema from '@/db/schema';

export async function getDb() {
    const ctx = await getCloudflareContext();
    const env = ctx.env as { DB: D1Database };
    return drizzle(env.DB, { schema });
}
