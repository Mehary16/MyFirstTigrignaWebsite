const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb'
    },
    proxyClientMaxBodySize: '20mb'
  }
};

export default nextConfig;
