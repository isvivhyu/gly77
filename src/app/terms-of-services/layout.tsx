import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aralya.ph";

export const metadata: Metadata = {
  title: "Terms of Services | Aralya",
  description: "Terms of Use for Aralya - Compare Preschools in Metro Manila.",
  alternates: {
    canonical: `${baseUrl}/terms-of-services/`,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
