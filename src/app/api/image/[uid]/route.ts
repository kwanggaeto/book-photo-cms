import { NextRequest, NextResponse } from 'next/server';
import { getCloudflareContext } from '@opennextjs/cloudflare';



export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ uid: string }> }
) {
    const url = new URL(req.url);
    const { uid } = await params;

    try {
        const ctx = await getCloudflareContext();
        const env = ctx.env as { BUCKET: R2Bucket; DB: D1Database; IMAGES: ImagesBinding };


        // 변환 파라미터
        const w = url.searchParams.get("w");
        const q = url.searchParams.get("q");


        const object = await env.BUCKET.get(uid);

        if (object === null) {
            return new NextResponse('Image not found or expired', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        // Stream the body
        return new NextResponse(object.body, {
            headers,
        });

    } catch (error) {
        console.error('Serve Image Error:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
