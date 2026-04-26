import { Metadata } from "next";
import { notFound } from "next/navigation";
import CityPageContent from "./CityPageContent";
import {
  findCityFromSlug,
  getAllCitySlugs,
  slugToDisplayName,
} from "@/lib/cityUtils";

interface CityPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for known cities
export async function generateStaticParams() {
  const slugs = getAllCitySlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { slug } = await params;
  const cityName = findCityFromSlug(slug) || slugToDisplayName(slug);
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aralya.ph";
  const seoBySlug: Record<string, { title: string; description: string }> = {
    makati: {
      title: "Preschools in Makati | Compare Tuition & Curriculum | Aralya",
      description:
        "Compare preschools in Makati by tuition, curriculum, and key details. Find the right preschool for your child with Aralya.",
    },
    taguig: {
      title: "Preschools in Taguig | Compare Tuition & Curriculum | Aralya",
      description:
        "Compare preschools in Taguig by tuition, curriculum, and key details. Find the right preschool for your child with Aralya.",
    },
  };
  const title = seoBySlug[slug]?.title ?? `Preschools in ${cityName} | Aralya`;
  const description =
    seoBySlug[slug]?.description ??
    `Find the best preschools in ${cityName}. Compare tuition fees, curriculum, class sizes, and more. Discover quality early childhood education options for your child.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `${baseUrl}/preschools-in-${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `${baseUrl}/preschools-in-${slug}`,
    },
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { slug } = await params;
  const cityName = findCityFromSlug(slug);

  if (!cityName) {
    notFound();
  }

  return <CityPageContent citySlug={slug} cityName={cityName} />;
}
