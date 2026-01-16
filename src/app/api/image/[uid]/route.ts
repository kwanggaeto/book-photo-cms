import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';



export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    const { uid } = await params;

    try {
        const ctx = await getCloudflareContext();
        const env = ctx.env as { BUCKET: R2Bucket; DB: D1Database; IMAGES: ImagesBinding };

        const object = await env.BUCKET.get(uid);

        console.log(`object?.httpMetadata: ${object?.httpMetadata}`);

        if (object === null) {
            return new NextResponse('Image not found or expired', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);

        headers.set("content-type", "image/jpeg");
        // ✅ 캐시(원본은 장기 캐시 OK, uid가 불변 key라는 전제)
        headers.set("cache-control", "public, max-age=31536000, immutable");
        headers.set("etag", object.httpEtag);

        // Stream the body
        return new NextResponse(object.body, {
            headers,
        });

    } catch (error) {
        console.error('Serve Image Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
