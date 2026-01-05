/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        domains: ['localhost', '43.229.133.251'],
    },
    async rewrites() {
        // In Docker, use container name 'backend'. Otherwise use env var or localhost
        const backendUrl = process.env.INTERNAL_API_URL || 'http://backend:4000';
        return [
            {
                source: '/api/:path*',
                destination: `${backendUrl}/api/:path*`,
            },
            {
                source: '/uploads/:path*',
                destination: `${backendUrl}/uploads/:path*`,
            },
        ];
    },
};

module.exports = nextConfig;

