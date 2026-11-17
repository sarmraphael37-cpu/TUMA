import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Workspace",
    template: "%s · TUMA",
  },
  robots: {
    index: false,
    follow: false,
  },
};

/**
 * The workspace shell is rendered by the pages themselves (inside their own
 * Suspense boundary) so every dashboard route has exactly one dynamic
 * boundary. This layout stays static.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
