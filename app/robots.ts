import type { MetadataRoute } from "next";
import { baseUrl } from "@/lib/config";
import { PERCORSI_CHIUSI } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: PERCORSI_CHIUSI },
    sitemap: `${baseUrl()}/sitemap.xml`,
  };
}
