'use server'

import { getCloudflareContext } from "@opennextjs/cloudflare";

export default async function getBaseUrl() {
    const { env } = await getCloudflareContext({ async: true });

    const base =
        env.CF_PREVIEW_DOMAIN ?? "";

    return base;
}