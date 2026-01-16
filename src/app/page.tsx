import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image'
import { getPhotoByUid } from '@/services/photo';

interface PageProps {
	searchParams: Promise<{ uid?: string }>;
}

export default async function Home({ searchParams }: PageProps) {
	const { uid } = await searchParams;

	if (!uid) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-slate-50">
				<Card className="w-[350px] shadow-lg">
					<CardHeader>
						<CardTitle>Book Photo CMS</CardTitle>
						<CardDescription>
							사진을 조회하려면 UID가 필요합니다.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-slate-500">
							관리자에게 받은 링크를 확인해주세요.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Fetch photo metadata
	const photo = await getPhotoByUid(uid);

	if (!photo) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-slate-50">
				<Card className="w-[350px] shadow-lg">
					<CardHeader>
						<CardTitle>Photo Not Found</CardTitle>
						<CardDescription>
							사진을 찾을 수 없거나 만료되었습니다.
						</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	const imageUrl = `/api/image/${uid}`;

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
			<Card className="w-full max-w-xl shadow-xl overflow-hidden">
				<CardHeader className="bg-white">
					<CardTitle>Fairytale Photobooth</CardTitle>
					<CardDescription>
						expires on {new Date(photo.expiresAt).toLocaleString()}
					</CardDescription>
				</CardHeader>
				<CardContent className="relative w-full h-[60vh] min-h-[300px] p-0">
					<Image
						src={imageUrl}
						alt="View"
						fill
						className="object-contain"
						unoptimized
						priority
					/>
				</CardContent>
				<CardFooter className="flex justify-center p-4 bg-white">
					<Button className="w-full" variant="default" size="lg">
						<a href={imageUrl} download={`photo-${uid}.jpg`}>다운로드</a>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
