/**
 * Utility functions for city slug handling
 */

// Convert city name to URL-friendly slug
export function cityToSlug(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .replace(/\s+city$/i, "") // Remove "City" suffix
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove special characters
    .replace(/-+/g, "-") // Replace multiple hyphens with single
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}

// Convert slug back to display name (title case)
export function slugToDisplayName(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Known Metro Manila cities for static generation
export const METRO_MANILA_CITIES = [
  "Makati",
  "Taguig",
  "Pasig",
  "Quezon City",
  "Manila",
  "Mandaluyong",
  "San Juan",
  "Pasay",
  "Parañaque",
  "Las Piñas",
  "Muntinlupa",
  "Marikina",
  "Caloocan",
  "Malabon",
  "Navotas",
  "Valenzuela",
  "Pateros",
];

// Get all city slugs for static generation
export function getAllCitySlugs(): string[] {
  return METRO_MANILA_CITIES.map(cityToSlug);
}

// Find the original city name from a slug
export function findCityFromSlug(slug: string): string | null {
  const normalizedSlug = slug.toLowerCase();

  for (const city of METRO_MANILA_CITIES) {
    if (cityToSlug(city) === normalizedSlug) {
      return city;
    }
  }

  // Fallback: convert slug to display name
  return slugToDisplayName(slug);
}
