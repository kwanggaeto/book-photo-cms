import type { NextConfig } from "next";

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
	/* config options here */
	env: {
		NEXT_PUBLIC_APP_URL: process.env.CF_PREVIEW_DOMAIN || process.env.NEXT_PUBLIC_APP_URL,
	},
	images: {
		loader: 'custom',
		loaderFile: './src/lib/cf-image-loader.ts'
	}
};

export default nextConfig;
