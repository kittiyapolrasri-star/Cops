'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { Shield, MapPin, Radio, FileText } from 'lucide-react';

export default function Home() {
    const router = useRouter();
    const { isAuthenticated, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
        if (isAuthenticated) {
            router.push('/dashboard');
        } else {
            router.push('/login');
        }
    }, [isAuthenticated, router, checkAuth]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
            <div className="text-center text-white">
                <div className="animate-pulse">
                    <Shield className="w-20 h-20 mx-auto mb-4" />
                    <h1 className="text-3xl font-bold">C.O.P.S.</h1>
                    <p className="text-blue-200 mt-2">กำลังโหลด...</p>
                </div>
            </div>
        </div>
    );
}
