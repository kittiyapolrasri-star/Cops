'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthStore } from '@/lib/store/auth';
import {
    Map,
    Radio,
    FileText,
    AlertTriangle,
    Bell,
    LogOut,
    User,
    LayoutDashboard,
    Smartphone,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

import NotificationBell from '@/components/NotificationBell';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, checkAuth, logout } = useAuthStore();
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        checkAuth();
        if (!isAuthenticated) {
            router.push('/login');
        }
    }, [isAuthenticated, router, checkAuth]);

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    if (!isAuthenticated) {
        return null;
    }

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'แผนที่ยุทธวิธี', href: '/dashboard/map', icon: Map },
        { name: 'พื้นที่เสี่ยง', href: '/dashboard/riskzones', icon: AlertTriangle },
        { name: 'รายงานเหตุการณ์', href: '/dashboard/incidents', icon: FileText },
        { name: 'ผู้ใช้งาน', href: '/dashboard/users', icon: User },
        { name: 'สถิติ', href: '/dashboard/stats', icon: Radio },
    ];

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'HQ': return 'สตช.';
            case 'BUREAU': return 'กองบัญชาการ';
            case 'PROVINCE': return 'จังหวัด';
            case 'STATION': return 'สถานี';
            case 'PATROL': return 'สายตรวจ';
            default: return role;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex">
            {/* Sidebar - Dark Gray Theme */}
            <aside className={`fixed left-0 top-0 bottom-0 bg-gray-950 border-r border-gray-800 transition-all duration-300 z-50 flex flex-col ${collapsed ? 'w-20' : 'w-64'}`}>
                {/* Logo */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-700">
                            <Image src="/Logo.jpeg" alt="C.O.P.S." width={40} height={40} className="object-cover" />
                        </div>
                        {!collapsed && (
                            <div>
                                <h1 className="text-lg font-bold text-white">C.O.P.S.</h1>
                                <p className="text-xs text-gray-500">Control Room</p>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <button
                            onClick={() => setCollapsed(!collapsed)}
                            className="p-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
                        >
                            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
                        </button>
                    </div>
                </div>

                {/* Nav items */}
                <nav className="flex-1 p-3 space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                title={item.name}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${isActive
                                    ? 'bg-gray-800 text-white border-l-2 border-white'
                                    : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'
                                    }`}
                            >
                                <item.icon className="w-5 h-5 flex-shrink-0" />
                                {!collapsed && <span className="font-medium">{item.name}</span>}
                            </Link>
                        );
                    })}

                    {user?.role === 'PATROL' && (
                        <>
                            <div className="my-3 border-t border-gray-800" />
                            <Link
                                href="/patrol"
                                title="หน้าสายตรวจ"
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 transition border border-emerald-800"
                            >
                                <Smartphone className="w-5 h-5 flex-shrink-0" />
                                {!collapsed && <span className="font-medium">หน้าสายตรวจ</span>}
                            </Link>
                        </>
                    )}
                </nav>

                {/* User & Logout */}
                <div className="p-3 border-t border-gray-800">
                    {!collapsed && (
                        <div className="flex items-center gap-3 mb-3 px-3 py-2">
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                                <User className="w-5 h-5 text-gray-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">
                                    {user?.rank} {user?.firstName}
                                </p>
                                <p className="text-xs text-gray-500">{getRoleLabel(user?.role || '')}</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={handleLogout}
                        title="ออกจากระบบ"
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition ${collapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut className="w-5 h-5" />
                        {!collapsed && <span>ออกจากระบบ</span>}
                    </button>
                </div>
            </aside>

            {/* Main content with left margin for sidebar */}
            <main className={`flex-1 transition-all duration-300 ${collapsed ? 'ml-20' : 'ml-64'}`}>
                {children}
            </main>
        </div>
    );
}
