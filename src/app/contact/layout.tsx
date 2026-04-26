import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aralya.ph";

export const metadata: Metadata = {
  title: "Contact Aralya | Compare Preschools in Metro Manila",
  description:
    "Contact Aralya to report corrections, suggest schools, or ask questions about preschools in Metro Manila.",
  alternates: {
    canonical: `${baseUrl}/contact/`,
  },
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
