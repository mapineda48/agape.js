import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "agape.js",
  description: "Simple ERP built with TypeScript",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
