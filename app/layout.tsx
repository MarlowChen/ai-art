import type { Metadata } from "next";
import "./globals.css";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH || process.env.GITHUB_PAGES_BASE_PATH || "";
const withBasePath = (assetPath: string) => `${publicBasePath}${assetPath}`;

export const metadata: Metadata = {
  title: "Ai Art",
  description: "Ai Art interactive AI experiences.",
  applicationName: "Ai Art",
  icons: {
    icon: withBasePath("/favicon.png"),
    shortcut: withBasePath("/favicon.png"),
    apple: withBasePath("/favicon.png"),
  },
  openGraph: {
    title: "Ai Art",
    description: "Ai Art interactive AI experiences.",
    siteName: "Ai Art",
    images: [
      {
        url: withBasePath("/og-image.jpg"),
        width: 1200,
        height: 630,
        alt: "Ai Art",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ai Art",
    description: "Ai Art interactive AI experiences.",
    images: [withBasePath("/og-image.jpg")],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

  return (
    <html lang="zh-Hant" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__MOREU_API_BASE_URL__=${JSON.stringify(apiBaseUrl)};`,
          }}
        />
        {children}
      </body>
    </html>
  );
}
