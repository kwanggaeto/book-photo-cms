import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const runtime = 'edge';

export async function GET(req: Request) {
    try {
        // Auth check (optional but recommended even for Cron)
        // Cloudflare Cron Triggers usually don't set headers unless configured.
        // For external cron, check API Key.
        const apiKey = req.headers.get('x-api-key');
        const ctx = await getCloudflareContext();
        const env = ctx.env as { API_KEY: string; BUCKET: R2Bucket; DB: D1Database };

        // Allow if API Key matches OR if called internally (hard to detect reliability in all envs)
        // Let's enforce API Key for simplicity if external. 
        // If internal worker trigger, passed via event?
        // OpenNext doesn't expose event easily in Route.

        if (apiKey !== env.API_KEY && process.env.NODE_ENV !== 'development') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const prisma = getPrisma(env.DB);
        const now = new Date();

        // Find expired photos
        const expired = await prisma.photo.findMany({
            where: {
                expiresAt: {
                    lt: now
                }
            }
        });

        if (expired.length === 0) {
            return NextResponse.json({ message: 'No expired photos found' });
        }

        const results = [];
        for (const photo of expired) {
            try {
                // Delete from R2
                await env.BUCKET.delete(photo.uid);

                // Delete from D1
                await prisma.photo.delete({
                    where: { id: photo.id }
                });
                results.push({ uid: photo.uid, status: 'deleted' });
            } catch (e: any) {
                console.error(`Failed to delete ${photo.uid}`, e);
                results.push({ uid: photo.uid, status: 'failed', error: e.message });
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
