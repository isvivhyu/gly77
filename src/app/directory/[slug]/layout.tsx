import type { Metadata } from "next";
import { supabaseServer } from "@/lib/supabase-server";
import { optimizeImageUrl } from "@/lib/cloudinary";

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aralya.ph";

// Helper function to create URL-friendly slugs (same as used in the app)
function createSlug(schoolName: string): string {
  return schoolName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;

  try {
    // Fetch school data to get the actual school name for title
    const { data: schools, error } = await supabaseServer
      .from("schools")
      .select(
        "school, city, min_tuition, max_tuition, curriculum, logo_banner, summary",
      )
      .order("school");

    if (!error && schools) {
      const school = schools.find((s) => createSlug(s.school) === slug);

      if (school) {
        const pageUrl = `${baseUrl}/directory/${slug}/`;

        // Clean, concise description for sharing
        const buildDescription = () => {
          const parts: string[] = [];

          if (school.city) {
            parts.push(school.city);
          }

          if (school.curriculum) {
            parts.push(school.curriculum);
          }

          if (school.min_tuition && school.max_tuition) {
            const isPerMonth =
              school.min_tuition.toLowerCase().includes("/month") ||
              school.max_tuition.toLowerCase().includes("/month");
            parts.push(
              `₱${school.min_tuition} - ₱${school.max_tuition}${isPerMonth ? "" : "/year"}`,
            );
          }

          return parts.length > 0
            ? `${school.school} • ${parts.join(" • ")}`
            : school.school;
        };

        const ogDescription = buildDescription();
        const metaDescription =
          school.summary ||
          `View ${school.school} on Aralya. ${school.city ? `Located in ${school.city}.` : ""} Compare tuition, curriculum, and contact information.`;

        const imageUrl = school.logo_banner
          ? school.logo_banner.startsWith("http")
            ? optimizeImageUrl(school.logo_banner, 1200)
            : `${baseUrl}${school.logo_banner}`
          : `${baseUrl}/images/Logo.png`;

        return {
          title: `${school.school} | Aralya - Compare Preschools in Metro Manila`,
          description: metaDescription,
          alternates: {
            canonical: pageUrl,
          },
          openGraph: {
            title: school.school,
            description: ogDescription,
            url: pageUrl,
            siteName: "Aralya",
            images: [
              {
                url: imageUrl,
                width: 1200,
                height: 630,
                alt: school.school,
              },
            ],
            locale: "en_US",
            type: "website",
          },
          twitter: {
            card: "summary_large_image",
            title: school.school,
            description: ogDescription,
            images: [imageUrl],
          },
        };
      }
    }
  } catch (error) {
    console.error("Error generating metadata for school page:", error);
  }

  // Fallback metadata
  const pageUrl = `${baseUrl}/directory/${slug}/`;
  const fallbackImage = `${baseUrl}/images/Logo.png`;
  return {
    title: "School Details | Aralya - Compare Preschools in Metro Manila",
    description:
      "View school details, tuition, curriculum, and contact information on Aralya.",
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: "School Details",
      description: "Compare preschools in Metro Manila on Aralya",
      url: pageUrl,
      siteName: "Aralya",
      images: [
        {
          url: fallbackImage,
          width: 1200,
          height: 630,
          alt: "Aralya - Compare Preschools",
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "School Details",
      description: "Compare preschools in Metro Manila on Aralya",
      images: [fallbackImage],
    },
  };
}

export default function SchoolDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
