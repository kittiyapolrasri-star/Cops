'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { Eye, EyeOff, User, Lock, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading, error } = useAuthStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [localError, setLocalError] = useState('');

    useEffect(() => {
        if (isAuthenticated) {
            router.push('/dashboard');
        }
    }, [isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError('');

        if (!username || !password) {
            setLocalError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
            return;
        }

        const success = await login(username, password);
        if (success) {
            router.push('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
            </div>

            <div className="w-full max-w-md relative z-10">
                {/* Logo & Title */}
                <div className="text-center mb-8">
                    <div className="w-28 h-28 mx-auto mb-4 relative">
                        <Image
                            src="/Logo.jpeg"
                            alt="C.O.P.S. Logo"
                            fill
                            className="object-contain rounded-full border-4 border-gray-700 shadow-2xl"
                        />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-wide">C.O.P.S.</h1>
                    <p className="text-gray-400 mt-2 text-sm">Command Operations for Patrol Surveillance</p>
                    <p className="text-gray-500 text-xs mt-1">ระบบสายตรวจอัจฉริยะ</p>
                </div>

                {/* Login Card */}
                <div className="bg-gray-800/50 backdrop-blur-xl rounded-2xl border border-gray-700 p-8 shadow-2xl">
                    <h2 className="text-xl font-semibold text-white text-center mb-6">
                        เข้าสู่ระบบ
                    </h2>

                    {/* Error Message */}
                    {(error || localError) && (
                        <div className="mb-4 p-3 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-2 text-red-400">
                            <AlertCircle className="w-5 h-5 flex-shrink-0" />
                            <p className="text-sm">{localError || error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Username */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                ชื่อผู้ใช้
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="w-5 h-5 text-gray-500" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition text-white placeholder-gray-500"
                                    placeholder="กรอกชื่อผู้ใช้"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-1.5">
                                รหัสผ่าน
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-gray-500" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 pr-12 py-3 bg-gray-900/50 border border-gray-600 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition text-white placeholder-gray-500"
                                    placeholder="กรอกรหัสผ่าน"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-300"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 bg-white text-gray-900 font-semibold rounded-lg hover:bg-gray-200 focus:ring-4 focus:ring-gray-500/30 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
                                    <span>กำลังเข้าสู่ระบบ...</span>
                                </div>
                            ) : (
                                'เข้าสู่ระบบ'
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-6 pt-6 border-t border-gray-700">
                        <p className="text-xs text-center text-gray-500 mb-3">บัญชีทดสอบ</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <button
                                onClick={() => { setUsername('admin'); setPassword('1234'); }}
                                className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-gray-300 transition border border-gray-600"
                            >
                                👤 Admin
                            </button>
                            <button
                                onClick={() => { setUsername('commander'); setPassword('1234'); }}
                                className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-gray-300 transition border border-gray-600"
                            >
                                ⭐ Commander
                            </button>
                            <button
                                onClick={() => { setUsername('patrol1'); setPassword('1234'); }}
                                className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-gray-300 transition border border-gray-600"
                            >
                                🚔 Patrol 1
                            </button>
                            <button
                                onClick={() => { setUsername('patrol2'); setPassword('1234'); }}
                                className="px-3 py-2 bg-gray-700/50 hover:bg-gray-700 rounded-lg text-gray-300 transition border border-gray-600"
                            >
                                🚔 Patrol 2
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-xs text-gray-600 mt-6">
                    © 2024 C.O.P.S. - Command Operations for Patrol Surveillance
                </p>
            </div>
        </div>
    );
}
