/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://savemyself-api-503878915776.us-central1.run.app';
        return [
          {
            source: '/api/:path*',
            destination: `${apiUrl}/:path*` // 代理到后端
          }
        ]
      }
};

export default nextConfig;
