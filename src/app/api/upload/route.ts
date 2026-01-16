import { NextRequest, NextResponse } from 'next/server';
import { getPrisma } from '@/lib/prisma';
import { getCloudflareContext } from '@opennextjs/cloudflare';
// function to generate random id (replaces nanoid)
function generateId(length: number = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    const values = new Uint32Array(length);
    crypto.getRandomValues(values);
    return Array.from(values).map((v) => chars[v % chars.length]).join('');
}

// ... inside POST
// Generate 10-character UID (custom)
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
