/**
 * Get school by slug (URL-friendly name)
 */

import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { rateLimit, getClientIP, RATE_LIMITS } from "@/lib/rateLimit";

// Helper function to create slug from school name
function createSlug(schoolName: string): string {
  return schoolName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// GET /api/schools/[slug] - Get school by slug
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  // Apply rate limiting
  const ip = getClientIP(request);
  const result = rateLimit({
    ...RATE_LIMITS.api,
    identifier: `api-school-slug:${ip}`,
  });

  if (!result.success) {
    return NextResponse.json(
      {
        error: "Too many requests",
        message: "Rate limit exceeded. Please try again later.",
        retryAfter: Math.ceil((result.reset - Date.now()) / 1000),
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.ceil((result.reset - Date.now()) / 1000)),
          "X-RateLimit-Limit": String(RATE_LIMITS.api.limit),
          "X-RateLimit-Remaining": String(result.remaining),
          "X-RateLimit-Reset": String(result.reset),
        },
      },
    );
  }

  try {
    const { slug } = await params;

    // Get all schools and find by slug
    const { data: schools, error } = await supabaseServer
      .from("schools")
      .select("*")
      .order("school");

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch schools", details: error.message },
        { status: 500 },
      );
    }

    const school = schools?.find((s) => {
      const schoolSlug = createSlug(s.school);
      return schoolSlug === slug;
    });

    if (!school) {
      return NextResponse.json({ error: "School not found" }, { status: 404 });
    }

    if (school.id) {
      const { data: quickInfo } = await supabaseServer
        .from("quick_info")
        .select("*")
        .eq("school_id", school.id)
        .maybeSingle();
      school.quick_info = quickInfo || null;
    }

    const response = NextResponse.json({ school });
    response.headers.set("X-RateLimit-Limit", String(RATE_LIMITS.api.limit));
    response.headers.set("X-RateLimit-Remaining", String(result.remaining));
    response.headers.set("X-RateLimit-Reset", String(result.reset));
    return response;
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
