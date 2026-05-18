process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['bccmlqmrzvofeljofdjy.supabase.co'],
  },
}

export default nextConfig
