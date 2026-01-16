import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getCloudflareContext } from '@opennextjs/cloudflare';

// This is an Edge Runtime API (OpenNext/Cloudflare)
export const runtime = 'edge';

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
        const env = ctx.env as { API_KEY: string; BUCKET: R2Bucket; DB: D1Database };

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
        const prisma = getPrisma(env.DB);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days

        // Generate 10-character UID
        const uid = generateId(10);

        const record = await prisma.photo.create({
            data: {
                uid: uid,
                filename: file.name,
                size: file.size,
                mimeType: file.type,
                expiresAt: expiresAt,
            }
        });

        const objectKey = `${record.uid}`;

        // 4. Upload to R2
        const arrayBuffer = await file.arrayBuffer();
        await env.BUCKET.put(objectKey, arrayBuffer, {
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
            data: record
        });

    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
