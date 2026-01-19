import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { photos } from '@/db/schema';
import { getCloudflareContext } from '@opennextjs/cloudflare';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { eq } from 'drizzle-orm';


function generateId(length: number = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    return Array.from(values).map((v) => chars[v % chars.length]).join('');
}

export async function GET(req: NextRequest) {
    try {
        // 1. Auth Check
        const apiKey = req.headers.get('x-api-key');
        const contentType = req.headers.get('content-type') ?? 'image/png';
        const contentLength = req.headers.get('content-length') ?? '0';
        const filename = req.headers.get('filename') ?? `${Date.now()}.png`;
        const ctx = await getCloudflareContext();
        const env = ctx.env as {
            API_KEY: string;
            BUCKET: R2Bucket;
            DB: D1Database,
            IMAGES: ImagesBinding,
            ALIVE_DAYS: string,
            R2_ACCOUNT_ID: string,
            R2_ACCESS_KEY_ID: string,
            R2_SECRET_ACCESS_KEY: string,
            R2_BUCKET_NAME: string,
        };

        if (apiKey !== env.API_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
            filename: filename,
            size: parseInt(contentLength),
            mimeType: contentType,
            expiresAt: expiresAt,
            // createdAt is default now()`
        }).returning();

        const objectKey = `${newPhoto[0].uid}`;
        const s3 = new S3Client({
            region: "auto", // R2 S3 API region은 auto :contentReference[oaicite:3]{index=3}
            endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/`,
            credentials: {
                accessKeyId: env.R2_ACCESS_KEY_ID,
                secretAccessKey: env.R2_SECRET_ACCESS_KEY,
            },
        });

        // presigned PUT URL 생성
        const expiresIn = 60; // 초: 1분 (원하면 늘려)
        const cmd = new PutObjectCommand({
            Bucket: env.R2_BUCKET_NAME,
            Key: objectKey,
            ContentType: contentType, // ⭐ PUT 요청에도 동일하게 넣어야 서명 검증 통과하기 쉬움
            // (선택) Metadata: { uid }
        });

        const uploadUrl = await getSignedUrl(s3, cmd, { expiresIn });

        return NextResponse.json({
            success: true,
            data: {
                uploadUrl: uploadUrl,
                photo: newPhoto[0]
            }
        });

    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}


export async function POST(req: NextRequest) {

    // 1. Auth Check
    const apiKey = req.headers.get('x-api-key');
    const ctx = await getCloudflareContext();
    const env = ctx.env as {
        API_KEY: string;
        DB: D1Database,
    };

    if (apiKey !== env.API_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();
    const uid = formData.get('uid') as string;
    const uploaded = formData.get('uploaded') as string;
    const uploadedValue = uploaded ? Boolean(uploaded) : false;

    const db = await getDb();
    const photo = await db.select().from(photos).where(eq(photos.uid, uid));

    if (!photo) {
        return NextResponse.json({ error: 'Photo not found' }, { status: 404 });
    }

    if (!uploadedValue) {
        await db.delete(photos).where(eq(photos.uid, uid));
    }

    return NextResponse.json({ success: true, data: photo });
}