'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store/auth';
import {
    Shield,
    Map,
    Radio,
    FileText,
    AlertTriangle,
    Bell,
    LogOut,
    Menu,
    X,
    User,
    LayoutDashboard,
    MapPin,
    Smartphone,
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'แผนที่ยุทธวิธี', href: '/dashboard/map', icon: Map },
    { name: 'พื้นที่เสี่ยง', href: '/dashboard/riskzones', icon: AlertTriangle },
    { name: 'รายงานเหตุการณ์', href: '/dashboard/incidents', icon: FileText },
    { name: 'สถิติ', href: '/dashboard/stats', icon: Radio },
];

const patrolNavigation = [
    { name: 'หน้าสายตรวจ', href: '/patrol', icon: Smartphone },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const { user, isAuthenticated, checkAuth, logout } = useAuthStore();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);

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

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'HQ': return 'bg-purple-500';
            case 'BUREAU': return 'bg-blue-500';
            case 'PROVINCE': return 'bg-green-500';
            case 'STATION': return 'bg-yellow-500';
            case 'PATROL': return 'bg-gray-500';
            default: return 'bg-gray-500';
        }
    };

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
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            {/* Mobile sidebar backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-blue-900 to-indigo-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Logo */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white">C.O.P.S.</h1>
                            <p className="text-xs text-blue-200">ระบบสายตรวจอัจฉริยะ</p>
                        </div>
                    </Link>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-white/70 hover:text-white"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    <p className="px-3 mb-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                        Control Room
                    </p>
                    {navigation.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${isActive
                                        ? 'bg-white/10 text-white'
                                        : 'text-blue-200 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}

                    {user?.role === 'PATROL' && (
                        <>
                            <div className="pt-4 mt-4 border-t border-white/10">
                                <p className="px-3 mb-2 text-xs font-semibold text-blue-300 uppercase tracking-wider">
                                    Patrol Mode
                                </p>
                            </div>
                            {patrolNavigation.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition ${isActive
                                                ? 'bg-green-500/20 text-green-300'
                                                : 'text-blue-200 hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        <item.icon className="w-5 h-5" />
                                        <span className="font-medium">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </>
                    )}
                </nav>

                {/* User section */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                                {user?.rank} {user?.firstName} {user?.lastName}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 text-xs rounded-full text-white ${getRoleBadgeColor(user?.role || '')}`}>
                                    {getRoleLabel(user?.role || '')}
                                </span>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>ออกจากระบบ</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <div className="lg:pl-72">
                {/* Top bar */}
                <header className="sticky top-0 z-30 h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between h-full px-4 lg:px-8">
                        <button
                            onClick={() => setSidebarOpen(true)}
                            className="lg:hidden text-gray-500 hover:text-gray-700"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        <div className="flex-1 lg:flex-none">
                            <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                                {navigation.find(n => n.href === pathname)?.name || 'Dashboard'}
                            </h2>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Live indicator */}
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-full">
                                <span className="w-2 h-2 rounded-full bg-green-500 pulse-live" />
                                <span className="text-sm font-medium text-green-700 dark:text-green-300">LIVE</span>
                            </div>

                            {/* Notifications */}
                            <button className="relative p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white">
                                <Bell className="w-6 h-6" />
                                {notificationCount > 0 && (
                                    <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                        {notificationCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </header>

                {/* Page content */}
                <main className="p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
