import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aralya.ph";

export const metadata: Metadata = {
  title: "School Directory | Aralya - Compare Preschools in Metro Manila",
  description:
    "Browse and compare preschools in Metro Manila. Filter by city, curriculum, and budget to find the perfect school for your child.",
  alternates: {
    canonical: `${baseUrl}/directory/`,
  },
};

export default function DirectoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
