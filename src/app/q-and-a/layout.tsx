import type { Metadata } from "next";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aralya.ph";

export const metadata: Metadata = {
  title: "Q&A | Frequently Asked Questions | Aralya",
  description:
    "Find quick answers to the most common questions about Aralya and how to find the right preschool in Metro Manila.",
  alternates: {
    canonical: `${baseUrl}/q-and-a/`,
  },
};

export default function QAndALayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
