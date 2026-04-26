import { MetadataRoute } from "next";
import { cache } from "react";
import { supabaseServer } from "@/lib/supabase-server";
import { School } from "@/lib/supabase";
import { cityToSlug } from "@/lib/cityUtils";

// Helper function to create URL-friendly slugs (same as used in the app)
function createSlug(schoolName: string): string {
  return schoolName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .trim();
}

// Helper function to ensure URLs have trailing slashes (matching next.config.ts trailingSlash: true)
function ensureTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

// Cache the school data fetching to reduce database load
// Use server-side Supabase client directly since sitemap runs server-side
const getCachedSchools = cache(async (): Promise<School[]> => {
  try {
    const { data, error } = await supabaseServer
      .from("schools")
      .select("*")
      .order("school");

    if (error) {
      console.error("Error fetching schools for sitemap:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error fetching schools for sitemap:", error);
    return [];
  }
});

// Cache cities data fetching - extract unique cities from schools table
const getCachedCities = cache(
  async (): Promise<
    { city: string; schoolCount: number; updated_at?: string }[]
  > => {
    try {
      // First, try to get cities from the cities table if it exists
      const { data: citiesData, error: citiesError } = await supabaseServer
        .from("cities")
        .select("city, updated_at")
        .order("city", { ascending: true });

      let citiesList: string[] = [];

      if (!citiesError && citiesData && citiesData.length > 0) {
        // Use cities from cities table
        citiesList = citiesData
          .map((c) => c.city)
          .filter((c): c is string => !!c);
      } else {
        // Fallback: Extract unique cities from schools table
        const { data: schools, error: schoolsError } = await supabaseServer
          .from("schools")
          .select("city");

        if (schoolsError) {
          console.error(
            "Error fetching schools for city extraction:",
            schoolsError,
          );
          return [];
        }

        // Extract unique cities from schools
        const citySet = new Set<string>();
        (schools || []).forEach((school) => {
          if (school.city) {
            // Handle comma-separated cities
            school.city
              .split(",")
              .map((c: string) => c.trim())
              .filter((c: string) => c.length > 0)
              .forEach((city: string) => citySet.add(city));
          }
        });

        citiesList = Array.from(citySet).sort();
      }

      if (citiesList.length === 0) {
        return [];
      }

      // Get school counts and latest update time for each city
      const citiesWithCounts = await Promise.all(
        citiesList.map(async (cityName) => {
          // Count schools in this city and get latest update
          const { data: schools, error: schoolsError } = await supabaseServer
            .from("schools")
            .select("updated_at")
            .ilike("city", `%${cityName}%`);

          if (schoolsError) {
            console.error(
              `Error fetching schools for city ${cityName}:`,
              schoolsError,
            );
            return {
              city: cityName,
              schoolCount: 0,
              updated_at: undefined,
            };
          }

          // Find the latest updated_at from schools in this city
          const latestUpdate =
            schools && schools.length > 0
              ? schools
                  .map((s) => s.updated_at)
                  .filter((date): date is string => !!date)
                  .sort()
                  .reverse()[0]
              : undefined;

          return {
            city: cityName,
            schoolCount: schools?.length || 0,
            updated_at: latestUpdate,
          };
        }),
      );

      // Filter out cities with no schools and return sorted by city name
      return citiesWithCounts
        .filter((c) => c.schoolCount > 0)
        .sort((a, b) => a.city.localeCompare(b.city));
    } catch (error) {
      console.error("Error fetching cities for sitemap:", error);
      return [];
    }
  },
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://aralya.ph";

  // Static pages - all URLs with trailing slashes to match next.config.ts
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: ensureTrailingSlash(baseUrl),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: ensureTrailingSlash(`${baseUrl}/directory`),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: ensureTrailingSlash(`${baseUrl}/contact`),
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: ensureTrailingSlash(`${baseUrl}/privacy-policy`),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
    {
      url: ensureTrailingSlash(`${baseUrl}/terms-of-services`),
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.5,
    },
  ];

  // Dynamic school pages - cached to reduce database queries
  const schools = await getCachedSchools();
  const schoolPages: MetadataRoute.Sitemap = schools.map((school) => ({
    url: ensureTrailingSlash(
      `${baseUrl}/directory/${createSlug(school.school)}`,
    ),
    lastModified: school.updated_at ? new Date(school.updated_at) : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // City pages - use SEO city landing URLs
  const cities = await getCachedCities();
  const cityPages: MetadataRoute.Sitemap = cities.map((cityData) => ({
    url: ensureTrailingSlash(`${baseUrl}/preschools-in-${cityToSlug(cityData.city)}`),
    lastModified: cityData.updated_at
      ? new Date(cityData.updated_at)
      : new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...schoolPages, ...cityPages];
}
