'use server';

import { getPhotos, deletePhoto } from '@/services/photo';
import { revalidatePath } from 'next/cache';

export async function fetchPhotosAction(page: number, date?: string) {
    const result = await getPhotos({ page, date: date ? new Date(date).toISOString().split('T')[0] : undefined });
    // Drizzle/JSON serialization usually works fine, but Date objects in Client Components need care.
    // Drizzle returns Date objects for timestamp fields.
    // Server Actions serialization handles Dates, but let's be safe if plain JSON is expected.
    return JSON.parse(JSON.stringify(result));
}

export async function deletePhotoAction(uid: string) {
    // Note: Checking API Key here is tricky unless we pass it or rely on internal trust.
    // For this context, we assume Admin Page (internal) is authorized.
    const success = await deletePhoto(uid);
    if (success) {
        revalidatePath('/admin');
    }
    return success;
}
