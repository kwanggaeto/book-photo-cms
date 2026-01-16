'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Image from 'next/image'
import { getPhotoByUid } from '@/services/photo';
import { useEffect, useState } from "react";
import getBaseUrl from "./getBaseUrl";

interface PageProps {
	searchParams: Promise<{ uid?: string }>;
}

export default function Home({ searchParams }: PageProps) {
	const [uid, setUid] = useState('');
	const [baseUrl, setBaseUrl] = useState('');
	const [photo, setPhoto] = useState<{
		id: number;
		uid: string;
		filename: string;
		createdAt: Date;
		expiresAt: Date;
		size: number;
		mimeType: string;
	} | null>(null);


	const loadPhoto = async () => {
		const param = await searchParams;
		setUid(param.uid || '');
		const photo = await getPhotoByUid(param.uid || '');
		setPhoto(photo);
		const baseUrl = await getBaseUrl();
		setBaseUrl(baseUrl);
	}
	useEffect(() => {
		loadPhoto();
	}, []);


	if (!uid) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-slate-50">
				<Card className="w-[400px] shadow-lg text-center px-5 py-10">
					<CardHeader>
						<CardTitle><p className="text-3xl">책박물관 포토부스</p></CardTitle>
						<CardDescription>
							<p className="text-muted-foreground text-xs">사진을 조회하려면 고유한 코드가 필요합니다.</p>
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-slate-500 mt-5 animate-pulse">
							촬영 후 제공되는 QR코드를 통해 접속해주세요.
						</p>
					</CardContent>
				</Card>
			</div>
		);
	}

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

	const imageUrl = `${baseUrl}/api/image/${uid}`;

	return (
		<div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-4">
			<Card className="flex flex-col w-full lg:max-w-sm md:max-w-md md:aspect-[3/6] sm:aspect-[2/5] shadow-xl overflow-hidden">
				<CardHeader className="bg-white">
					<CardTitle><p className="text-3xl">책박물관 포토부스</p></CardTitle>
					<CardDescription>
						expires on {new Date(photo.expiresAt).toLocaleString()}
					</CardDescription>
				</CardHeader>
				<CardContent className="grow p-0">
					<Image
						className="w-full h-full"
						src={imageUrl}
						alt="View"
						width={400}
						height={500}
						objectFit="contain"
						priority
					/>
				</CardContent>
				<CardFooter className="flex justify-center p-4 bg-white">
					<Button className="w-full" variant="default" size="lg">
						<a href={imageUrl} download={`photo-${uid}.jpg`}>DOWNLOAD</a>
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}
