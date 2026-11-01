import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://tyronawilds.vercel.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/privacidad", "/terminos"],
        disallow: ["/api/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
