import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReadyToJump - Admin",
  description: "Modern, clean, and sharp admin management portal for ReadyToJump.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
