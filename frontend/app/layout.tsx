import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'C.O.P.S. - ระบบสายตรวจอัจฉริยะ',
    description: 'Command Operations for Patrol Surveillance - ระบบติดตามและควบคุมสายตรวจแบบ Real-time',
    manifest: '/manifest.json',
    themeColor: '#1e40af',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="th">
            <head>
                <link
                    rel="stylesheet"
                    href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                    integrity="sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
                    crossOrigin=""
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body className="min-h-screen bg-gray-50 dark:bg-gray-900">
                {children}
            </body>
        </html>
    );
}
