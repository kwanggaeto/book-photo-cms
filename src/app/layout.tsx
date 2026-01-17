import type { Metadata } from "next";
//import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

/* const inter = Inter({
	variable: "--font-sans",
	subsets: ["latin"],
});

const interTight = Inter_Tight({
	variable: "--font-tight",
	subsets: ["latin"],
});
 */
export const metadata: Metadata = {
	title: "책박물관 동화 포토부스",
	description: "책박물관 동화 포토부스",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`Nanum Gothic antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
