import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Super Administration",
    template: "%s · TUMA Super Admin",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-navy-950 text-white min-h-screen">
        <children />
      </body>
    </html>
  );
}