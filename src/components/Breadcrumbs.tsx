"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { findCityFromSlug, slugToDisplayName } from "@/lib/cityUtils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  /** Custom breadcrumb items. When provided, pathname-based logic is ignored. */
  items?: BreadcrumbItem[];
  /** Optional: override the last item label (e.g. school name for /directory/[slug]) */
  currentLabel?: string;
  /** Optional: text color variant for light vs dark backgrounds */
  variant?: "light" | "dark";
  className?: string;
}

const PATH_LABELS: Record<string, string> = {
  directory: "Browse",
  contact: "Contact",
  "privacy-policy": "Privacy Policy",
  "terms-of-services": "Terms of Service",
  disclaimer: "Disclaimer",
  "q-and-a": "Q&A",
};

function buildBreadcrumbsFromPath(
  pathname: string,
  currentLabel?: string,
): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [{ label: "Home", href: "/" }];

  // Remove leading/trailing slashes and split
  const segments = pathname.replace(/^\/|\/$/g, "").split("/").filter(Boolean);

  if (segments.length === 0) {
    return [];
  }

  let accumulatedPath = "";

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    accumulatedPath += `/${segment}/`;

    // Last segment - use currentLabel if provided
    if (i === segments.length - 1) {
      if (currentLabel) {
        items.push({ label: currentLabel });
        break;
      }

      // /preschools-in-{slug} pattern (single segment like "preschools-in-taguig")
      if (segment.startsWith("preschools-in-")) {
        const citySlug = segment.replace("preschools-in-", "");
        const cityName =
          findCityFromSlug(citySlug) || slugToDisplayName(citySlug);
        items.push({
          label: `Preschools in ${cityName}`,
        });
        break;
      }

      // /directory/{slug} - school detail
      if (segments[0] === "directory" && segments.length > 1) {
        items.push({
          label: currentLabel || slugToDisplayName(segment),
        });
        break;
      }

      // /directory (browse) - current page, no href
      if (segment === "directory" && segments.length === 1) {
        items.push({ label: "Browse" });
        break;
      }

      // /city/{slug} - city page (internal route, user sees preschools-in-*)
      if (segments[0] === "city" && segments.length > 1) {
        const cityName =
          findCityFromSlug(segment) || slugToDisplayName(segment);
        items.push({ label: `Preschools in ${cityName}` });
        break;
      }

      // Last segment = current page, no href
      const label = PATH_LABELS[segment] || slugToDisplayName(segment);
      items.push({ label });
    } else {
      const label = PATH_LABELS[segment] || slugToDisplayName(segment);
      items.push({ label, href: accumulatedPath });
    }
  }

  return items;
}

export default function Breadcrumbs({
  items: customItems,
  currentLabel,
  variant = "dark",
  className = "",
}: BreadcrumbsProps) {
  const pathname = usePathname();
  const items =
    customItems ?? buildBreadcrumbsFromPath(pathname, currentLabel);

  if (items.length <= 1) {
    return null;
  }

  const textColor = variant === "light" ? "text-white/90" : "text-[#374151]";
  const linkColor =
    variant === "light"
      ? "text-white hover:text-white"
      : "text-[#774BE5] hover:text-[#6B3FD6]";
  const separatorColor = variant === "light" ? "text-white/60" : "text-gray-400";

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-2 text-[14px] ${textColor} ${className}`}
    >
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-2">
          {index > 0 && (
            <i
              className={`ri-arrow-right-s-line ${separatorColor} text-[16px]`}
              aria-hidden
            />
          )}
          {item.href ? (
            <Link
              href={item.href}
              className={`font-medium transition-colors ${linkColor}`}
            >
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold truncate max-w-[200px] md:max-w-none">
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
