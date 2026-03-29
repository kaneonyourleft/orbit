import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "ORBIT | Workspace OS",
  description: "노션 + 옵시디언 + 엑셀을 하나로",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ORBIT",
  },
};

export const viewport: Viewport = {
  themeColor: "#7f6df2",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon.svg" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(reg => {
                    console.log('SW registered:', reg);
                  }).catch(err => {
                    console.log('SW error:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
