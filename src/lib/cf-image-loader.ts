// cf-image-loader.ts
import { ImageLoaderProps } from 'next/image';

export default function cloudflareLoader({ src, width, quality }: ImageLoaderProps): string {
    // Cloudflare Image Resizing 옵션들
    const params = [
        `width=${width}`,
        `quality=${quality || 75}`,
        'format=auto', // 브라우저가 지원하면 WebP/AVIF로 자동 변환
        'fit=scale-down', // 원본보다 커지지 않게 방지 (화질 저하 방지)
    ];

    const paramsString = params.join(',');

    // Case A: src가 이미 http로 시작하는 완전한 URL일 때 (외부 이미지)
    if (src.startsWith('http')) {
        return `/cdn-cgi/image/${paramsString}/${src}`;
    }

    // Case B: src가 파일 경로일 때 (/profile.jpg) -> 호스트를 붙여줌
    // 슬래시(/)가 중복되지 않도록 깔끔하게 처리
    const cleanSrc = src.startsWith('/') ? src.slice(1) : src;

    // Cloudflare Resizing URL 반환
    return `/cdn-cgi/image/${paramsString}/${cleanSrc}`;
}