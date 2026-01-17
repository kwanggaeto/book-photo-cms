import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { photos } from '@/db/schema';
import { getCloudflareContext } from '@opennextjs/cloudflare';


function generateId(length: number = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    return Array.from(values).map((v) => chars[v % chars.length]).join('');
}

export async function POST(req: NextRequest) {
    try {
        // 1. Auth Check
        const apiKey = req.headers.get('x-api-key');
        const ctx = await getCloudflareContext();
        const env = ctx.env as { API_KEY: string; BUCKET: R2Bucket; DB: D1Database, IMAGES: ImagesBinding, ALIVE_DAYS: string };

        if (apiKey !== env.API_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 2. Parse Multipart
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // 3. Prepare Metadata
        const db = await getDb();
        const now = new Date();
        const ex = parseInt(env.ALIVE_DAYS ?? '3');
        const expiresAt = new Date(now.getTime() + ex * 24 * 60 * 60 * 1000);

        // Generate 10-character UID
        const uid = generateId(10);

        // 4. Save to D1 via Drizzle
        const newPhoto = await db.insert(photos).values({
            uid: uid,
            filename: file.name,
            size: file.size,
            mimeType: file.type,
            expiresAt: expiresAt,
            // createdAt is default now()`
        }).returning();

        const objectKey = `${newPhoto[0].uid}`;

        // 5. Upload to R2
        await env.BUCKET.put(objectKey, file, {
            httpMetadata: {
                contentType: file.type,
            },
            customMetadata: {
                originalName: file.name,
                uploadedAt: now.toISOString(),
            }
        });

        return NextResponse.json({
            success: true,
            data: newPhoto[0]
        });

    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
