import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aralya.ph";

export const metadata: Metadata = {
  title: "Privacy Policy | Aralya",
  description:
    "Privacy Policy for Aralya - Compare Preschools in Metro Manila.",
  alternates: {
    canonical: `${baseUrl}/privacy-policy/`,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
