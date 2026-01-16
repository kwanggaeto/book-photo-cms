import { NextRequest, NextResponse } from 'next/server';
import { getPhotos, deletePhoto } from '@/services/photo';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const date = searchParams.get('date') || undefined;

        const result = await getPhotos({ page, date });

        return NextResponse.json(result);

    } catch (error) {
        console.error('List Photos Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const apiKey = req.headers.get('x-api-key');
        // Note: We need context just for env check here, 
        // but deletePhoto service also grabs context. 
        // Optimally pass env to service, but service self-contained is fine.
        const ctx = await getCloudflareContext();
        const env = ctx.env as { API_KEY: string; BUCKET: R2Bucket; DB: D1Database };

        if (apiKey !== env.API_KEY) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const uid = searchParams.get('uid');

        if (!uid) {
            return NextResponse.json({ error: 'UID required' }, { status: 400 });
        }

        const success = await deletePhoto(uid);

        if (success) {
            return NextResponse.json({ success: true });
        } else {
            // Assuming failure means not found or DB error, but service returns boolean.
            // Improve error handling if needed.
            return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
        }

    } catch (error) {
        console.error('Delete Photo Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
