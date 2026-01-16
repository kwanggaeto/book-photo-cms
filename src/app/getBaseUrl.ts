'use server'

import { getCloudflareContext } from "@opennextjs/cloudflare";

export default async function getBaseUrl() {
    const ctx = await getCloudflareContext();
    const env = ctx.env as { BUCKET: R2Bucket; DB: D1Database; IMAGES: ImagesBinding; BASE_URL: string };

    const base = env.BASE_URL;

    return base;
}