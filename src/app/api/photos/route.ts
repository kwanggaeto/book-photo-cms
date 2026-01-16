import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { photos } from '@/db/schema';
import { count, desc, eq, and, gte, lt } from 'drizzle-orm';
import { getCloudflareContext } from '@opennextjs/cloudflare';



export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const date = searchParams.get('date'); // YYYY-MM-DD
        const limit = 20;
        const offset = (page - 1) * limit;

        const db = await getDb();

        // Build filter
        let whereClause = undefined;
        if (date) {
            // Filter by createdAt date range
            const startDate = new Date(date);
            const endDate = new Date(date);
            endDate.setDate(endDate.getDate() + 1);

            if (!isNaN(startDate.getTime())) {
                whereClause = and(
                    gte(photos.createdAt, startDate),
                    lt(photos.createdAt, endDate)
                );
            }
        }

        const [totalResult, photosResult] = await Promise.all([
            db.select({ count: count() }).from(photos).where(whereClause),
            db.select()
                .from(photos)
                .where(whereClause)
                .limit(limit)
                .offset(offset)
                .orderBy(desc(photos.createdAt))
        ]);

        const total = totalResult[0]?.count || 0;

        return NextResponse.json({
            data: photosResult,
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

        const db = await getDb();

        // Delete from D1
        const deleted = await db.delete(photos)
            .where(eq(photos.uid, uid))
            .returning();

        // Delete from R2
        if (deleted.length > 0) {
            await env.BUCKET.delete(deleted[0].uid);
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Delete Photo Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
