'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store/auth';
import { Loader, AlertCircle } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, isLoading, error } = useAuthStore();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
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
            setLocalError('Please enter username and password');
            return;
        }

        const success = await login(username, password);
        if (success) {
            router.push('/dashboard');
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative overflow-hidden selection:bg-amber-500/30 selection:text-amber-100">

            {/* Cinematic Background Effects - Power & Dimension */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-white/10 rounded-[100%] blur-[80px] pointer-events-none opacity-20"></div>
            <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-amber-100/10 to-transparent rounded-full blur-[100px] pointer-events-none opacity-30"></div>

            {/* Searchlight / God Ray Effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[800px] bg-gradient-to-b from-white/5 via-transparent to-transparent transform -skew-x-12 blur-3xl pointer-events-none opacity-20"></div>

            {/* Deep Shadows for Contrast */}
            <div className="absolute bottom-0 left-0 right-0 h-[400px] bg-gradient-to-t from-gray-950 to-transparent pointer-events-none"></div>

            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.05] mask-image-linear-gradient(to bottom, transparent, black) pointer-events-none"></div>

            {/* World Map Shadow Pattern */}
            <div className="absolute inset-0 bg-[url('https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg')] bg-no-repeat bg-center bg-contain opacity-[0.07] mix-blend-screen pointer-events-none filter drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]"></div>

            <div className="w-full max-w-[400px] relative z-10 animate-in fade-in zoom-in duration-1000 slide-in-from-bottom-8">

                {/* Header Section with Stronger Presence */}
                <div className="flex flex-col items-center text-center mb-12 group perspective-[1000px]">
                    <div className="relative mb-8 transform transition-transform duration-700 group-hover:rotate-y-[10deg] group-hover:rotate-x-[10deg]">
                        {/* Core Energy Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-amber-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition duration-700 animate-pulse"></div>

                        {/* Glass Container */}
                        <div className="w-36 h-36 rounded-full bg-white/[0.03] border border-white/20 flex items-center justify-center shadow-[0_0_50px_-10px_rgba(0,0,0,0.8)] relative z-10 backdrop-blur-md group-hover:scale-110 transition duration-500 hover:border-white/40 ring-1 ring-white/10">
                            <div className="w-28 h-28 relative">
                                <Image
                                    src="/Logo.jpeg"
                                    alt="Logo"
                                    fill
                                    className="object-cover rounded-full shadow-2xl grayscale-[0.2] group-hover:grayscale-0 transition duration-500"
                                />
                            </div>
                            {/* Specular Highlight */}
                            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent rounded-t-full pointer-events-none"></div>
                        </div>
                    </div>

                    <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/60 tracking-[0.2em] mb-3 uppercase drop-shadow-sm">Authenticated Access</h1>
                    <div className="h-px w-16 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent mb-3"></div>
                    <p className="text-white/40 text-[10px] uppercase tracking-[0.3em] font-medium">Restricted Area • C.O.P.S. System</p>
                </div>

                {/* Error Message */}
                {(error || localError) && (
                    <div className="mb-6 p-4 bg-rose-500/5 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-400 text-xs font-medium backdrop-blur-md animate-in slide-in-from-top-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <p>{localError || error}</p>
                    </div>
                )}

                {/* Login Form with Glassmorphism */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-5">
                        <div className="group relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition duration-500 blur-sm"></div>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-5 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/[0.07] transition-all duration-300 text-sm font-medium relative z-10 shadow-inner"
                                placeholder="Username ID"
                            />
                        </div>

                        <div className="group relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition duration-500 blur-sm"></div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 bg-white/[0.03] border border-white/10 rounded-xl text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-white/30 focus:bg-white/[0.07] transition-all duration-300 text-sm font-medium relative z-10 shadow-inner"
                                placeholder="Security Code"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 bg-white hover:bg-gray-100 text-black font-bold rounded-full transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-6 shadow-[0_0_30px_-5px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_-5px_rgba(255,255,255,0.4)] relative overflow-hidden group border border-white/50"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        {isLoading ? (
                            <div className="flex items-center justify-center gap-2">
                                <Loader className="w-4 h-4 animate-spin" />
                                <span>กำลังเชื่อมต่อ...</span>
                            </div>
                        ) : (
                            'LOGIN'
                        )}
                    </button>
                </form>

                {/* Divider */}
                <div className="relative my-10 px-4">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/5"></div>
                    </div>
                    <div className="relative flex justify-center text-[10px] uppercase tracking-widest">
                        <span className="bg-gray-900 px-3 text-white/20">System Override</span>
                    </div>
                </div>

                {/* SSO / Demo Buttons */}
                <div className="space-y-3 opacity-50 hover:opacity-100 transition-opacity duration-500">
                    <button
                        onClick={() => { setUsername('admin'); setPassword('1234'); }}
                        className="w-full py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl text-white/50 hover:text-white transition text-xs font-medium uppercase tracking-wider flex items-center justify-center gap-2 group hover:border-amber-500/30"
                    >
                        <span className="w-1.5 h-1.5 rounded-full bg-white/20 group-hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/50"></span>
                        Status: Command
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => { setUsername('commander'); setPassword('1234'); }}
                            className="w-full py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl text-white/50 hover:text-white transition text-[10px] font-medium uppercase tracking-wider hover:border-white/20"
                        >
                            HQ Operations
                        </button>
                        <button
                            onClick={() => { setUsername('patrol1'); setPassword('1234'); }}
                            className="w-full py-3 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-xl text-white/50 hover:text-white transition text-[10px] font-medium uppercase tracking-wider hover:border-white/20"
                        >
                            Field Unit
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 text-center text-[9px] text-white/10 font-mono tracking-[0.2em] uppercase">
                    <p>Secured by C.O.P.S. Protocol</p>
                    <p className="mt-2 text-white/5">v2.4.0-release</p>
                </div>

            </div>
        </div>
    );
}
