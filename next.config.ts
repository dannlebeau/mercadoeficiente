import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  async redirects() {
    // URLs del sitio estático anterior.
    return [
      { source: "/index.html", destination: "/", permanent: true },
      { source: "/acerca-de.html", destination: "/acerca-de", permanent: true },
      { source: "/privacidad.html", destination: "/privacidad", permanent: true },
    ];
  },
};

export default config;
