import type { NextConfig } from "next";


const nextConfig: NextConfig = {
	/* config options here */
	env: {
		NEXT_PUBLIC_APP_URL: process.env.CF_PAGES_URL || process.env.NEXT_PUBLIC_APP_URL,
	},
	images: {
		loader: 'custom',
		loaderFile: './src/lib/cf-image-loader.ts'
	}
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
