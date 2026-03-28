/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites() {
        return [
          {
            source: '/api/:path*',
            destination: process.env.NEXT_PUBLIC_API_URL + '/:path*' // 代理到后端
          }
        ]
      }
};

export default nextConfig;
