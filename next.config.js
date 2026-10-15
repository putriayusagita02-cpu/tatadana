/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://qjcdgvnmuivxdyofecfy.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqY2Rndm5tdWl2eGR5b2ZlY2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIwNzI4NDEsImV4cCI6MjEwNzY0ODg0MX0.bLn7oSac9loh9q62kPGh2TtLLrzbq5wYNlOV1WjQglg',
  },
};

module.exports = nextConfig;
