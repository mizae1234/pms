import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PMS — Property Management System",
  description: "ระบบบริหารธุรกิจให้เช่าอสังหาริมทรัพย์ Apartment & Hotel",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="h-full antialiased">
      <body className="h-full">{children}</body>
    </html>
  );
}
