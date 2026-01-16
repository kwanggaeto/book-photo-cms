'use server'

import { getDb } from '@/lib/db';
import { photos } from '@/db/schema';
import { count, desc, eq, and, gte, lt } from 'drizzle-orm';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function getPhotos({ page = 1, limit = 20, date }: { page?: number; limit?: number; date?: string }) {
    const offset = (page - 1) * limit;
    const db = await getDb();

    // Build filter
    let whereClause = undefined;
    if (date) {
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

    return {
        data: photosResult,
        pagination: {
            page,
            total,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export async function deletePhoto(uid: string) {
    const ctx = await getCloudflareContext();
    const env = ctx.env as { API_KEY: string; BUCKET: R2Bucket; DB: D1Database };
    const db = await getDb();

    // Delete from D1
    const deleted = await db.delete(photos)
        .where(eq(photos.uid, uid))
        .returning();

    // Delete from R2
    if (deleted.length > 0) {
        await env.BUCKET.delete(deleted[0].uid);
        return true;
    }

    return false;
}

export async function getPhotoByUid(uid: string) {
    const db = await getDb();
    const result = await db.select().from(photos).where(eq(photos.uid, uid)).limit(1);
    return result[0] || null;
}
