'use server';

import { cookies } from 'next/headers';
import { getCloudflareContext } from '@opennextjs/cloudflare';

export async function loginAction(prevState: { success?: boolean; message?: string } | null, formData: FormData) {
    const id = formData.get('id') as string;
    const pw = formData.get('pw') as string;

    const ctx = await getCloudflareContext();
    const env = ctx.env as { ADMIN_ID: string; ADMIN_PW: string };

    if (id === env.ADMIN_ID && pw === env.ADMIN_PW) {
        // Set session cookie
        const cookieStore = await cookies();
        cookieStore.set('admin_session', 'authenticated', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });
        return { success: true };
    }

    return { success: false, message: 'Invalid ID or Password' };
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete('admin_session');
}
