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

  const title = `Preschools in ${cityName} | Aralya`;
  const description = `Find the best preschools in ${cityName}. Compare tuition fees, curriculum, class sizes, and more. Discover quality early childhood education options for your child.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      url: `https://aralya.ph/preschools-in-${slug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: `https://aralya.ph/preschools-in-${slug}`,
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
