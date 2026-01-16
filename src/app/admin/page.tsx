import { cookies } from 'next/headers';
import LoginForm from '@/components/admin/LoginForm';
import AdminDashboard from '@/components/admin/AdminDashboard';

export default async function AdminPage() {
    const cookieStore = await cookies();
    const session = cookieStore.get('admin_session');

    const isAuthenticated = session?.value === 'authenticated';

    if (!isAuthenticated) {
        return <LoginForm />;
    }

    return <AdminDashboard />;
}
