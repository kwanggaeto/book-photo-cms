import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	images: {
		localPatterns: [
			{ pathname: "/api/image/**" }],
		remotePatterns: [
			{ protocol: "http", hostname: "localhost" },
			{ protocol: "https", hostname: "book-photo-cms.eternalism.workers.dev" },
			{ protocol: "https", hostname: "book-photo.wonderbinary.com" }
		]
	}
};

export default nextConfig;

// added by create cloudflare to enable calling `getCloudflareContext()` in `next dev`
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";
initOpenNextCloudflareForDev();
