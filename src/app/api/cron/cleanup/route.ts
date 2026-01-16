import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { photos } from '@/db/schema';
import { lt, eq } from 'drizzle-orm';
import { getCloudflareContext } from '@opennextjs/cloudflare';


export async function GET(req: Request) {
    // Block cron in local development
    if ((process.env.NODE_ENV as string) !== 'production') {
        return NextResponse.json({ message: 'Cron job skipped in local environment' });
    }

    try {
        // Auth check (optional but recommended even for Cron)
        // Cloudflare Cron Triggers usually don't set headers unless configured.
        // For external cron, check API Key.
        const apiKey = req.headers.get('x-api-key');
        const ctx = await getCloudflareContext();
        const env = ctx.env as { API_KEY: string; BUCKET: R2Bucket; DB: D1Database };

        // Allow if API Key matches OR if called internally (hard to detect reliability in all envs)
        // Let's enforce API Key for simplicity if external. 
        if (apiKey !== env.API_KEY && process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const db = await getDb();
        const now = new Date();

        // Find expired photos
        const expired = await db.select().from(photos).where(lt(photos.expiresAt, now));

        if (expired.length === 0) {
            return NextResponse.json({ message: 'No expired photos found' });
        }

        const results = [];
        for (const photo of expired) {
            try {
                // Delete from R2
                await env.BUCKET.delete(photo.uid);
                await env.BUCKET.delete(`${photo.uid}_thumb`);
                await env.BUCKET.delete(`${photo.uid}_mid`);

                // Delete from D1
                await db.delete(photos).where(eq(photos.id, photo.id));

                results.push({ uid: photo.uid, status: 'deleted' });
            } catch (e: unknown) {
                console.error(`Failed to delete ${photo.uid}`, e);
                results.push({ uid: photo.uid, status: 'failed', error: (e as Error).message });
            }
        }

        return NextResponse.json({
            success: true,
            deletedCount: results.filter(r => r.status === 'deleted').length,
            results
        });

    } catch (error) {
        console.error('Cleanup Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
