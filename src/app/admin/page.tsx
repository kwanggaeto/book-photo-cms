'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Photo {
    id: number;
    uid: string;
    filename: string;
    createdAt: string;
    expiresAt: string;
    size: number;
}

export default function AdminPage() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchPhotos = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('page', page.toString());
            if (date) {
                params.set('date', format(date, 'yyyy-MM-dd'));
            }

            const res = await fetch(`/api/photos?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const json = (await res.json()) as { data: Photo[], pagination: any };
            setPhotos(json.data);
            setTotal(json.pagination?.total || 0);
        } catch (err) {
            console.error(err);
            toast.error('사진 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPhotos();
    }, [page, date]);

    const handleDelete = async (uid: string) => {
        if (!confirm('정말 삭제하시겠습니까?')) return;

        try {
            const res = await fetch(`/api/photos?uid=${uid}`, {
                method: 'DELETE',
                headers: {
                    // In a real app, you'd handle auth better (e.g. session or prompt for key)
                    // For MVP, if we running locally or via admin, we might assume auth cookie or similar.
                    // But requirement said "Auth Key for Upload". Does Admin need auth?
                    // "업로드는 오직 API를 통해서만 가능하며 API에 접근하기 위해 인증키가 필요함"
                    // Admin page requirements: "List page... delete button".
                    // It doesn't explicitly say Admin Page needs Key, but usually yes.
                    // We will send the key if we have it, or rely on a hardcoded key in query/header for now?
                    // Or maybe the user enters it in the UI?
                    // Let's assume for now we use a placeholder or prompt.
                    'x-api-key': 'test-secret-key-1234' // Hardcoded for demo/MVP locally
                }
            });

            if (!res.ok) throw new Error('Delete failed');

            toast.success('삭제되었습니다.');
            fetchPhotos();
        } catch (err) {
            toast.error('삭제 실패');
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto bg-slate-50 min-h-screen">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>사진 관리자</CardTitle>
                    <div className="flex gap-2">
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-[240px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>날짜 선택</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                        <Button variant="outline" onClick={() => setDate(undefined)}>초기화</Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border bg-white">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">미리보기</TableHead>
                                    <TableHead>파일명</TableHead>
                                    <TableHead>UID</TableHead>
                                    <TableHead>업로드 일시</TableHead>
                                    <TableHead>만료 일시</TableHead>
                                    <TableHead className="text-right">관리</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                                    </TableRow>
                                ) : photos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-24 text-center">데이터가 없습니다.</TableCell>
                                    </TableRow>
                                ) : (
                                    photos.map((photo) => (
                                        <TableRow key={photo.id}>
                                            <TableCell>
                                                <img
                                                    src={`/api/image/${photo.uid}`}
                                                    alt="thumb"
                                                    className="w-16 h-16 object-cover rounded"
                                                    loading='lazy'
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium truncate max-w-[200px]">{photo.filename}</TableCell>
                                            <TableCell className="font-mono text-xs">{photo.uid}</TableCell>
                                            <TableCell>{new Date(photo.createdAt).toLocaleString()}</TableCell>
                                            <TableCell className={cn(
                                                new Date(photo.expiresAt) < new Date() ? "text-red-500 font-bold" : ""
                                            )}>
                                                {new Date(photo.expiresAt).toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                    onClick={() => handleDelete(photo.uid)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-end space-x-2 py-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page - 1)}
                            disabled={page <= 1}
                        >
                            이전
                        </Button>
                        <div className="text-sm">
                            Page {page} of {Math.ceil(total / 20) || 1}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(page + 1)}
                            disabled={page * 20 >= total}
                        >
                            다음
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Toaster for notifications */}
            <div className="fixed bottom-4 right-4 z-50">
                {/* Shadcn Toaster usually placed in layout, but putting here for MVP */}
            </div>
        </div>
    );
}
