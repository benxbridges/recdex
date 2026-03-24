import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactCompiler disabled — causes React error #300 on cook mode page
  // (1600+ lines, 30+ hooks triggers miscompilation)
  // reactCompiler: true,
  poweredByHeader: false,
};

export default nextConfig;
