import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const date = searchParams.get('date'); // YYYY-MM-DD
        const limit = 20;
        const skip = (page - 1) * limit;

        /* const ctx = await getCloudflareContext();
        const env = ctx.env as { DB: D1Database };
        const prisma = getPrisma(env.DB);

        // Build filter
        const where: any = {};
        if (date) {
            // Filter by createdAt date range
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);

            if (!isNaN(startDate.getTime())) {
                where.createdAt = {
                    gte: startDate,
                    lt: endDate
                };
            }
        } */

        const total = 0;
        const photos: any = [];
        /* const [total, photos] = await Promise.all([
            prisma.photo.count({ where }),
            prisma.photo.findMany({
                where,
                take: limit,
                skip,
                orderBy: { createdAt: 'desc' }
            })
        ]); */

        return NextResponse.json({
            data: photos,
            pagination: {
                page,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });

    } catch (error) {
        console.error('List Photos Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const apiKey = req.headers.get('x-api-key');
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

        const prisma = getPrisma(env.DB);

        // Delete from D1
        const photo = await prisma.photo.delete({
            where: { uid }
        });

        // Delete from R2
        if (photo) {
            await env.BUCKET.delete(photo.uid);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete Photo Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
