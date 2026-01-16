'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Trash2, RefreshCcw, LogOut, Eraser } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ButtonGroup } from "@/components/ui/button-group"
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
import Image from 'next/image';
import { fetchPhotosAction, deletePhotoAction } from '@/app/admin/actions';
import { logoutAction } from '@/app/admin/auth';

interface Photo {
    id: number;
    uid: string;
    filename: string;
    createdAt: string;
    expiresAt: string;
    size: number;
}

export default function AdminDashboard() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [date, setDate] = useState<Date | undefined>(undefined);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const loadPhotos = async () => {
        setLoading(true);
        try {
            const dateStr = date ? format(date, 'yyyy-MM-dd') : undefined;
            const result = await fetchPhotosAction(page, dateStr);
            setPhotos(result.data);
            setTotal(result.pagination?.total || 0);
        } catch {
            console.error('Failed to fetch photos');
            toast.error('사진 목록을 불러오지 못했습니다.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPhotos();
    }, [page, date]);

    const handleDelete = async (uid: string) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;

        try {
            const success = await deletePhotoAction(uid);
            if (!success) throw new Error('Delete failed');

            toast.success('삭제되었습니다.');
            loadPhotos();
        } catch {
            toast.error('삭제 실패');
        }
    };

    const handleLogout = async () => {
        await logoutAction();
        window.location.reload();
    };

    return (
        <div className='bg-slate-50 min-h-screen'>
            <div className="p-8 max-w-6xl mx-auto">
                <Card className='flex flex-col min-h-[calc(100vh-64px)]'>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle><p className='text-3xl'>Photo Files Management</p></CardTitle>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={loadPhotos}
                                disabled={loading}
                                title="새로고침"
                            >
                                <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
                            </Button>
                            <ButtonGroup>
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
                                            {date ? format(date, "PPP") : <span>Choice Date</span>}
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[240px] p-0" align="end">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            className="w-full rounded-md border shadow-sm"
                                            captionLayout="dropdown"
                                        />
                                    </PopoverContent>
                                </Popover>
                                <Button variant="outline" onClick={() => setDate(undefined)}>
                                    <Eraser className="h-4 w-4" />
                                </Button>
                            </ButtonGroup>
                            <Button variant="destructive" onClick={handleLogout}>
                                <LogOut className="h-4 w-4" />Logout
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className='flex flex-col grow'>
                        <div className="flex flex-col grow rounded-md border bg-white">
                            <Table >
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[100px]">Thumbnail</TableHead>
                                        <TableHead>File Name</TableHead>
                                        <TableHead>UID</TableHead>
                                        <TableHead>Upload Date</TableHead>
                                        <TableHead>Expire Date</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {loading && photos.length === 0 ? (
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
                                                    <Image
                                                        src={`/api/image/${photo.uid}`}
                                                        alt="thumb"
                                                        className="w-16 h-16 object-cover rounded"
                                                        width={64}
                                                        height={64}
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
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                        variant="ghost"
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
                                className="text-xs"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}
                            >
                                PREV
                            </Button>
                            <div className="text-sm font-medium">
                                Page {page} of {Math.ceil(total / 20) || 1}
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs"
                                onClick={() => setPage(page + 1)}
                                disabled={page * 20 >= total}
                            >
                                NEXT
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Toaster for notifications */}
                <div className="fixed bottom-4 right-4 z-50">
                    {/* Shadcn Toaster usually placed in layout, but putting here for MVP */}
                </div>
            </div>
        </div >
    );
}
