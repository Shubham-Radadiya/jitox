import { defineConfig, loadEnv } from "vite";
import fs from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";

function seoFilesPlugin(siteUrl) {
  const base = siteUrl.replace(/\/$/, "");
  /** Public SPA entry points you want indexed (dashboard routes stay auth-gated / noindex in meta). */
  const indexablePaths = [
    { loc: `${base}/`, changefreq: "weekly", priority: "1.0" },
    { loc: `${base}/login`, changefreq: "monthly", priority: "0.9" },
    { loc: `${base}/register`, changefreq: "monthly", priority: "0.8" },
    { loc: `${base}/forgot-password`, changefreq: "yearly", priority: "0.5" },
  ];
  return {
    name: "jitox-seo-files",
    apply: "build",
    writeBundle(options) {
      const outDir =
        options.dir || path.resolve(process.cwd(), "dist");
      fs.writeFileSync(
        path.join(outDir, "robots.txt"),
        [
          "# https://www.robotstxt.org/robotstxt.html",
          "User-agent: *",
          "Allow: /",
          "",
          `Sitemap: ${base}/sitemap.xml`,
          "",
        ].join("\n")
      );
      const urlEntries = indexablePaths
        .map(
          (u) =>
            `  <url>\n    <loc>${u.loc}</loc>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
        )
        .join("\n");
      fs.writeFileSync(
        path.join(outDir, "sitemap.xml"),
        [
          '<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
          urlEntries,
          "</urlset>",
          "",
        ].join("\n")
      );
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const siteUrl = (env.VITE_SITE_URL || "https://jitox.com").replace(
    /\/$/,
    ""
  );

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "jitox-html-site-url",
        transformIndexHtml(html) {
          return html.replaceAll("%SITE_URL%", siteUrl);
        },
      },
      seoFilesPlugin(siteUrl),
    ],
    optimizeDeps: {
      include: ["redux-thunk"],
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            const norm = id.split("\\").join("/");
            if (!norm.includes("node_modules")) return;
            if (norm.includes("antd") || norm.includes("@ant-design")) return "antd";
            if (norm.includes("@tanstack")) return "tanstack";
            if (norm.includes("react-router")) return "react-router";
            if (norm.includes("react-dom")) return "react-dom";
            if (norm.includes("node_modules/react/")) return "react";
            if (norm.includes("leaflet")) return "leaflet";
            return "vendor";
          },
        },
      },
    },
  };
});
