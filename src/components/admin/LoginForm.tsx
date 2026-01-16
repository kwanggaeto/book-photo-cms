'use client';

import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { loginAction } from '@/app/admin/auth';
import { toast } from 'sonner';

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" className="w-full" disabled={pending}>
            {pending ? '로그인 중...' : '로그인'}
        </Button>
    );
}

export default function LoginForm() {
    const [state, setState] = useState<{ success?: boolean; message?: string } | null>(null);

    const handleSubmit = async (formData: FormData) => {
        const result = await loginAction(null, formData);
        if (!result.success) {
            toast.error(result.message);
            setState(result);
        } else {
            // Reload to let server component check cookie
            window.location.reload();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-2xl">관리자 로그인</CardTitle>
                    <CardDescription>
                        <p className='text-xs'>관리자 계정으로 로그인해주세요.</p>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="id">ID</Label>
                            <Input id="id" name="id" type="text" required placeholder="username" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="pw">Password</Label>
                            <Input id="pw" name="pw" type="password" required placeholder='••••••••' />
                        </div>
                        {state?.message && <p className="text-sm text-red-500">{state.message}</p>}
                        <SubmitButton />
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
