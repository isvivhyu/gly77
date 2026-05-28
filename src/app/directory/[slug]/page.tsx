"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { School } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import Breadcrumbs from "@/components/Breadcrumbs";
import { optimizeImageUrl } from "@/lib/cloudinary";
import { cityToSlug } from "@/lib/cityUtils";

const createSchoolSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();

const SchoolDetails = () => {
  const params = useParams();
  const slug = params.slug as string;

  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isContactSheetOpen, setIsContactSheetOpen] = useState(false);
  const [similarSchools, setSimilarSchools] = useState<School[]>([]);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const primaryCity = school?.city?.split(",")[0]?.trim() || "";
  const cityBreadcrumbLabel = primaryCity
    ? `Preschools in ${primaryCity}`
    : undefined;
  const cityBreadcrumbHref = primaryCity
    ? `/preschools-in-${cityToSlug(primaryCity)}/`
    : undefined;

  const getShareUrl = () => {
    if (typeof window !== "undefined") return window.location.href;
    return "";
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  const handleNativeShare = async () => {
    const url = getShareUrl();
    const text = `Check out ${school?.school || "this school"} on Aralya! ${school?.city ? `Located in ${school.city}.` : ""} ${url}`;
    const title = `${school?.school || "School"} | Aralya`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
      } catch (error) {
        if (error instanceof Error && error.name !== "AbortError") {
          console.log("Share failed:", error);
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const shareToFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
    );
  };

  const shareToMessenger = () => {
    navigator.clipboard
      .writeText(getShareUrl())
      .then(() => alert("Link copied! You can now paste it in Messenger."))
      .catch(() => window.open("https://www.messenger.com", "_blank"));
  };

  const shareToViber = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(
      `Check out ${school?.school || "this school"} on Aralya! ${getShareUrl()}`,
    );
    window.open(`viber://forward?text=${text}`, "_blank");
    setTimeout(() => {
      if (!document.hasFocus()) {
        navigator.clipboard
          .writeText(getShareUrl())
          .then(() => alert("Link copied! You can now paste it in Viber."));
      }
    }, 500);
  };

  const formatLastUpdated = (dateString?: string): string => {
    const opts: Intl.DateTimeFormatOptions = { month: "long", year: "numeric" };
    if (!dateString) return new Date().toLocaleDateString("en-US", opts);
    try {
      return new Date(dateString).toLocaleDateString("en-US", opts);
    } catch {
      return new Date().toLocaleDateString("en-US", opts);
    }
  };

  useEffect(() => {
    const checkDesktop = () => setIsDesktop(window.innerWidth >= 768);
    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  useEffect(() => {
    const loadSchool = async () => {
      try {
        const { apiClient } = await import("@/lib/apiClient");
        const foundSchool = await apiClient.getSchoolBySlug(slug);
        setSchool(foundSchool || null);
        if (foundSchool?.city) {
          const city = foundSchool.city.split(",")[0]?.trim();
          if (city) {
            const citySchools = await apiClient.getSchools({ city });
            const filtered = citySchools
              .filter((s) => createSchoolSlug(s.school) !== slug)
              .slice(0, 8);
            setSimilarSchools(filtered);
          }
        }
      } catch (error) {
        console.error("Error loading school:", error);
        setSchool(null);
        setSimilarSchools([]);
      } finally {
        setLoading(false);
      }
    };
    loadSchool();
  }, [slug]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      const hasOverflow = el.scrollWidth > el.clientWidth + 1;
      setCanScrollLeft(hasOverflow && el.scrollLeft > 4);
      setCanScrollRight(
        hasOverflow && el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
      );
    };
    update();
    const raf = requestAnimationFrame(update);
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      ro.disconnect();
    };
  }, [similarSchools]);

  const scrollSimilar = (dir: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: "smooth" });
  };

  useEffect(() => {
    if (!isContactSheetOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isContactSheetOpen]);

  /* ── Loading state ──────────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="w-full bg-white min-h-screen">
        <div className="w-full">
          <Navbar textColor={isDesktop ? "black" : "white"} sticky={!isDesktop} />
        </div>
        <div className="max-w-[1120px] mx-auto px-5 pt-24 md:pt-0 md:mt-16 pb-40">
          <SkeletonLoader className="h-4 w-56 mb-8" />
          <SkeletonLoader className="h-9 w-3/4 mb-3" />
          <SkeletonLoader className="h-5 w-48 mb-3" />
          <SkeletonLoader className="h-6 w-40 mb-3" />
          <SkeletonLoader className="h-4 w-full mb-1" />
          <SkeletonLoader className="h-4 w-5/6 mb-10" />
          <SkeletonLoader className="w-full h-60 rounded-xl mb-10" />
          <div className="grid md:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-2">
                <SkeletonLoader className="h-3 w-20" />
                <SkeletonLoader className="h-5 w-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ── 404 state ──────────────────────────────────────────────────── */
  if (!school) {
    return (
      <div className="w-full bg-white min-h-screen">
        <div className="w-full">
          <Navbar textColor={isDesktop ? "black" : "white"} sticky={!isDesktop} />
        </div>
        <div className="max-w-[1120px] mx-auto px-5 pt-24 md:pt-0 md:mt-24 pb-40 text-center">
          <h1 className="text-[24px] font-bold text-[#0E1C29] mb-4">
            School Not Found
          </h1>
          <p className="text-[15px] text-gray-500 mb-6">
            The school you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/directory"
            className="bg-[#774BE5] text-white px-6 py-3 rounded-full text-[14px] font-semibold"
          >
            Back to Directory
          </Link>
        </div>
      </div>
    );
  }

  const phoneNumber = (school.number || "").split(",")[0]?.trim() || "";

  /* ── Main render ────────────────────────────────────────────────── */
  return (
    <>
      <div className="w-full bg-white">
        {/* Navbar */}
        <div className="w-full">
          <Navbar textColor={isDesktop ? "black" : "white"} sticky={!isDesktop} />
        </div>

        {/* Main content column */}
        <div className="max-w-[1120px] mx-auto px-5 pt-24 md:pt-0 pb-44 md:pb-36">
          {/* ── Breadcrumb ──────────────────────────────────────────── */}
          <div className="mt-2 mb-8">
            <Breadcrumbs
              items={[
                { label: "Home", href: "/" },
                ...(cityBreadcrumbLabel && cityBreadcrumbHref
                  ? [{ label: cityBreadcrumbLabel, href: cityBreadcrumbHref }]
                  : []),
                { label: school.school || "School Name" },
              ]}
            />
          </div>

          {/* ── Hero: Main info ──────────────────────────────────────── */}
          <div className="pb-10">
            {/* Name */}
            <h1 className="inline-flex items-center gap-2 text-[28px] md:text-[36px] font-bold text-[#0E1C29] leading-tight tracking-tight flex-wrap">
              <span>{school.school}</span>
              <span className="relative group inline-flex items-center">
                <i className="ri-verified-badge-fill text-[#774BE5] text-[20px] md:text-[24px] cursor-pointer" />
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#774BE5] text-white text-[13px] font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Verified by Aralya
                  <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-[#774BE5]" />
                </span>
              </span>
            </h1>

            {/* City + updated */}
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <i className="ri-map-pin-2-line text-[#774BE5] text-[14px]" />
              <span className="text-[14px] text-[#374151]">
                {school.city || "City"}
              </span>
              <span className="text-gray-200 mx-1">|</span>
              <span className="text-[13px] text-gray-400">
                Updated {formatLastUpdated(school.updated_at)}
              </span>
            </div>

            {/* Tuition */}
            <p className="text-[20px] font-semibold text-[#0E1C29] mt-4">
              {school.min_tuition || "N/A"} – {school.max_tuition || "N/A"}
              {school.min_tuition?.toLowerCase().includes("/month") ||
                school.max_tuition?.toLowerCase().includes("/month")
                ? ""
                : " / year"}
            </p>

            {/* Website + share */}
            <div className="flex items-center gap-3 mt-3">
              {school.website && (
                <a
                  href={school.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[14px] text-[#774BE5] hover:underline font-medium"
                >
                  <i className="ri-global-line text-[14px]" />
                  Official website ↗
                </a>
              )}
              <button
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full border border-gray-200 text-[#374151] hover:border-[#774BE5] hover:text-[#774BE5] transition-colors"
                onClick={() =>
                  !isDesktop ? handleNativeShare() : setShowShareModal(true)
                }
                aria-label="Share school profile"
              >
                <i className="ri-share-2-line text-[13px]" />
              </button>
            </div>
          </div>

          {/* ── School image / logo (large, fills area) ──────────────── */}
          <div className="pb-12">
            <div className="relative w-full h-72 md:h-[460px] rounded-2xl overflow-hidden bg-white border border-gray-100">
              <Image
                src={optimizeImageUrl(school.logo_banner, 1920) || "/images/Logo.png"}
                alt={school.school || "School Logo"}
                fill
                sizes="(max-width: 768px) 100vw, 960px"
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* ── Quick Info ───────────────────────────────────────────── */}
          {school.quick_info && (
            <div className="pb-16">
              <h2 className="text-[24px] md:text-[30px] font-bold text-[#0E1C29] tracking-tight mb-3">
                Quick Info
              </h2>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-16 [&>div:first-child]:pt-1 md:[&>div:nth-child(2)]:pt-1">
                {[
                  { label: "Tuition", value: school.quick_info.tuition },
                  { label: "Curriculum", value: school.quick_info.curriculum },
                  { label: "Programs", value: school.quick_info.programs },
                  { label: "Schedule", value: school.quick_info.schedule },
                  { label: "Class Size", value: school.quick_info.class_size },
                  {
                    label: "Extended Care",
                    value: school.quick_info.extended_care,
                  },
                  {
                    label: "Special Needs Support",
                    value: school.quick_info.special_needs_support,
                  },
                ]
                  .filter(({ value }) => value && value.trim() !== "")
                  .map(({ label, value }) => (
                    <div
                      key={label}
                      className="flex justify-between items-baseline gap-6 py-4 border-b border-gray-100"
                    >
                      <dt className="text-[14px] text-gray-500 font-medium shrink-0">
                        {label}
                      </dt>
                      <dd className="text-[15px] md:text-[16px] text-[#0E1C29] font-semibold text-right">
                        {value}
                      </dd>
                    </div>
                  ))}
              </dl>
            </div>
          )}

          {/* ── About [School Name] ──────────────────────────────────── */}
          {school.about && (
            <div className="pb-16">
              <h2 className="text-[24px] md:text-[30px] font-bold text-[#0E1C29] tracking-tight mb-3">
                About {school.school}
              </h2>
              <p className="text-[17px] md:text-[18px] text-[#374151] leading-[1.8] max-w-[760px]">
                {school.about}
              </p>
            </div>
          )}

          {/* ── School Overview ─────────────────────────────────────── */}
          <div className="pb-16">
            <h2 className="text-[24px] md:text-[30px] font-bold text-[#0E1C29] tracking-tight mb-3">
              Program Overview
            </h2>
            <dl className="grid md:grid-cols-2 grid-cols-1 gap-x-16 [&>div:first-child]:pt-1 md:[&>div:nth-child(2)]:pt-1">
              {[
                { label: "Curriculum", value: school.curriculum },
                { label: "Class Size", value: school.class_size },
                { label: "Schedule", value: school.schedule },
                { label: "Programs", value: school.programs },
                { label: "After-school Care", value: school.care },
                { label: "Special Education Support", value: school.support },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-col gap-1.5 py-5 border-b border-gray-100"
                >
                  <dt className="text-[13px] text-gray-500 font-medium">
                    {label}
                  </dt>
                  <dd className="text-[16px] md:text-[17px] text-[#0E1C29] leading-snug">
                    {value || "Not specified"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ── Location ────────────────────────────────────────────── */}
          <div className="pb-14">
            <h2 className="text-[24px] md:text-[30px] font-bold text-[#0E1C29] tracking-tight mb-3">
              Location
            </h2>
            <div className="flex items-start gap-2">
              <i className="ri-map-pin-line text-[#774BE5] text-[15px] mt-0.5 shrink-0" />
              <p className="text-[15px] text-[#374151] leading-relaxed">
                {school.location?.trim()
                  ? school.location
                  : school.city?.trim()
                    ? school.city
                    : "Philippines"}
              </p>
            </div>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                school.location?.trim()
                  ? `${school.location}, Philippines`
                  : school.city?.trim()
                    ? `${school.city}, Philippines`
                    : "Philippines",
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 text-[14px] font-semibold text-[#774BE5] border border-[#774BE5] rounded-full px-5 py-2 hover:bg-[#774BE5] hover:text-white transition-colors"
            >
              <i className="ri-map-pin-2-line text-[15px]" />
              View on Google Maps
            </a>
          </div>

          {/* ── Contact (desktop only) ───────────────────────────────── */}
          <div className="hidden md:block pb-14">
            <h2 className="text-[24px] md:text-[30px] font-bold text-[#0E1C29] tracking-tight mb-3">
              Contact School
            </h2>
            <p className="text-[13px] text-gray-400 mb-5">
              Confirm fees, schedules, and availability directly with the
              school.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {[
                {
                  label: "Call",
                  icon: "ri-phone-line",
                  href: `tel:${phoneNumber}`,
                },
                {
                  label: "Text",
                  icon: "ri-message-2-line",
                  href: `sms:${phoneNumber}`,
                },
                {
                  label: "Facebook",
                  icon: "ri-facebook-line",
                  href: school.facebook || "#",
                  external: true,
                },
                {
                  label: "Email",
                  icon: "ri-mail-line",
                  href: `mailto:${school.email || ""}`,
                },
                {
                  label: "Website",
                  icon: "ri-global-line",
                  href: school.website || "#",
                  external: true,
                },
              ].map(({ label, icon, href, external }) => (
                <Link
                  key={label}
                  href={href}
                  {...(external
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                  className="inline-flex items-center gap-2 border border-gray-200 hover:border-[#774BE5] hover:text-[#774BE5] text-[#0E1C29] rounded-full px-5 py-2 text-[14px] font-medium transition-colors"
                >
                  <i className={`${icon} text-[15px]`} />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Accuracy ─────────────────────────────────────────────── */}
          <div className="pb-14">
            <h2 className="text-[24px] md:text-[30px] font-bold text-[#0E1C29] tracking-tight mb-3">
              Report a Correction
            </h2>
            <p className="text-[15px] text-[#4B5563] mb-5 leading-relaxed max-w-[620px]">
              Notice outdated or incorrect information? Send us an update and
              we&apos;ll review it.
            </p>
            <Link
              href="https://web.facebook.com/people/Aralya/61578164295126"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#774BE5] border border-[#774BE5] rounded-full px-5 py-2 hover:bg-[#774BE5] hover:text-white transition-colors"
            >
              Send an Update
            </Link>
          </div>

          {/* ── Similar Schools ──────────────────────────────────────── */}
          {primaryCity && similarSchools.length >= 3 && (
            <div className="pt-2">
              <div className="flex items-end justify-between mb-6 gap-4">
                <h2 className="text-[24px] md:text-[30px] font-bold text-[#0E1C29] tracking-tight">
                  Similar Preschools in {primaryCity}
                </h2>
                <Link
                  href={`/preschools-in-${cityToSlug(primaryCity)}/`}
                  className="text-[14px] font-semibold text-[#0E1C29] underline underline-offset-4 hover:text-[#774BE5] transition-colors shrink-0 mb-1"
                >
                  See all
                </Link>
              </div>

              <div className="relative">
                <div
                  ref={scrollerRef}
                  className="flex gap-3 md:gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-5 px-5 md:mx-0 md:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
                >
                  {similarSchools.slice(0, 8).map((item) => (
                    <Link
                      key={item.school}
                      href={`/directory/${createSchoolSlug(item.school)}/`}
                      className="group shrink-0 snap-start w-[72%] sm:w-[45%] md:w-[calc((100%-36px)/4)]"
                    >
                      <div className="relative w-full aspect-4/3 rounded-xl overflow-hidden bg-white border border-gray-100 mb-3">
                        <Image
                          src={
                            optimizeImageUrl(item.logo_banner) ||
                            "/images/Logo.png"
                          }
                          alt={item.school}
                          fill
                          sizes="(max-width: 640px) 72vw, (max-width: 768px) 45vw, 220px"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <p className="text-[15px] font-semibold text-[#0E1C29] line-clamp-2 group-hover:text-[#774BE5] transition-colors">
                        {item.school}
                      </p>
                      {item.curriculum && (
                        <p className="text-[13px] text-gray-400 mt-0.5 line-clamp-1">
                          {item.curriculum}
                        </p>
                      )}
                      <p className="text-[13px] font-semibold text-[#774BE5] mt-1">
                        {item.min_tuition || "N/A"} –{" "}
                        {item.max_tuition || "N/A"}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Centered navigation arrows at the bottom */}
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => scrollSimilar(-1)}
                  disabled={!canScrollLeft}
                  aria-label="Scroll left"
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
                >
                  <i className="ri-arrow-left-s-line text-[20px] text-[#0E1C29]" />
                </button>
                <button
                  onClick={() => scrollSimilar(1)}
                  disabled={!canScrollRight}
                  aria-label="Scroll right"
                  className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center bg-white hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition shadow-sm"
                >
                  <i className="ri-arrow-right-s-line text-[20px] text-[#0E1C29]" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Share modal ───────────────────────────────────────────── */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[17px] font-semibold text-[#0E1C29]">
                Share this school
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <i className="ri-close-line text-[18px] text-[#374151]" />
              </button>
            </div>

            {/* School preview */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
              <div className="w-14 h-14 rounded-lg border border-gray-100 bg-white flex items-center justify-center shrink-0 overflow-hidden">
                <Image
                  src={
                    optimizeImageUrl(school.logo_banner, 120) || "/images/Logo.png"
                  }
                  alt={school.school || "School Logo"}
                  width={56}
                  height={56}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-[#0E1C29] truncate">
                  {school.school}
                </p>
                <p className="text-[13px] text-gray-400 mt-0.5">
                  {school.city}
                </p>
              </div>
            </div>

            {/* Share options */}
            {isDesktop ? (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleCopyLink}
                  className="bg-[#774BE5] hover:bg-[#6B3FD6] text-white rounded-full px-4 py-2.5 flex items-center justify-center gap-2 text-[14px] font-semibold transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <i className="ri-check-line" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-link" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
                <button
                  onClick={shareToMessenger}
                  className="flex items-center justify-center gap-2 border border-gray-200 rounded-full px-4 py-2.5 text-[14px] font-medium text-[#0E1C29] hover:bg-gray-50 transition-colors"
                >
                  <i className="ri-messenger-fill text-[#0084FF]" />
                  Messenger
                </button>
                <button
                  onClick={shareToViber}
                  className="flex items-center justify-center gap-2 border border-gray-200 rounded-full px-4 py-2.5 text-[14px] font-medium text-[#0E1C29] hover:bg-gray-50 transition-colors"
                >
                  <i className="ri-message-3-fill text-[#665CAC]" />
                  Viber
                </button>
                <button
                  onClick={shareToFacebook}
                  className="flex items-center justify-center gap-2 border border-gray-200 rounded-full px-4 py-2.5 text-[14px] font-medium text-[#0E1C29] hover:bg-gray-50 transition-colors"
                >
                  <i className="ri-facebook-fill text-[#1877F2]" />
                  Facebook
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleNativeShare}
                  className="w-full bg-[#774BE5] hover:bg-[#6B3FD6] text-white rounded-full px-4 py-2.5 flex items-center justify-center gap-2 text-[14px] font-semibold transition-colors"
                >
                  <i className="ri-share-2-line" />
                  Share
                </button>
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-full px-4 py-2.5 text-[14px] font-medium text-[#0E1C29] hover:bg-gray-50 transition-colors"
                >
                  {linkCopied ? (
                    <>
                      <i className="ri-check-line" />
                      <span>Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-link" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Mobile sticky CTA + bottom sheet ─────────────────────── */}
      {!loading && school && (
        <>
          {/* Sticky "Contact School" bar */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-gray-100 px-4 py-3">
            <button
              onClick={() => setIsContactSheetOpen(true)}
              className="w-full bg-[#774BE5] hover:bg-[#6B3FD6] text-white rounded-full py-3 text-[15px] font-semibold transition-colors"
            >
              Contact School
            </button>
          </div>

          {/* Bottom sheet overlay */}
          <div
            className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${isContactSheetOpen ? "pointer-events-auto" : "pointer-events-none"
              }`}
          >
            {/* Dimmed backdrop */}
            <button
              aria-label="Close contact options"
              onClick={() => setIsContactSheetOpen(false)}
              className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${isContactSheetOpen ? "opacity-100" : "opacity-0"
                }`}
            />

            {/* Sheet panel */}
            <div
              className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${isContactSheetOpen ? "translate-y-0" : "translate-y-full"
                }`}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              <div className="px-5 pt-3 pb-10">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[17px] font-semibold text-[#0E1C29]">
                    Contact School
                  </h4>
                  <button
                    onClick={() => setIsContactSheetOpen(false)}
                    className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
                    aria-label="Close"
                  >
                    <i className="ri-close-line text-[17px] text-[#374151]" />
                  </button>
                </div>

                {/* Contact list items */}
                <div className="divide-y divide-gray-100 mt-3">
                  <Link
                    href={`tel:${phoneNumber}`}
                    className="flex items-center gap-4 py-4"
                    onClick={() => setIsContactSheetOpen(false)}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                      <i className="ri-phone-line text-green-600 text-[18px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#0E1C29]">
                        Call
                      </p>
                      {phoneNumber && (
                        <p className="text-[13px] text-gray-400 truncate">
                          {phoneNumber}
                        </p>
                      )}
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-300 text-xl" />
                  </Link>

                  <Link
                    href={`sms:${phoneNumber}`}
                    className="flex items-center gap-4 py-4"
                    onClick={() => setIsContactSheetOpen(false)}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <i className="ri-message-2-line text-blue-500 text-[18px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#0E1C29]">
                        Text
                      </p>
                      {phoneNumber && (
                        <p className="text-[13px] text-gray-400 truncate">
                          {phoneNumber}
                        </p>
                      )}
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-300 text-xl" />
                  </Link>

                  <Link
                    href={school.facebook || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 py-4"
                    onClick={() => setIsContactSheetOpen(false)}
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                      <i className="ri-facebook-fill text-[#1877F2] text-[18px]" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[15px] font-semibold text-[#0E1C29]">
                        Facebook
                      </p>
                      <p className="text-[13px] text-gray-400">
                        Visit Facebook page
                      </p>
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-300 text-xl" />
                  </Link>

                  <Link
                    href={`mailto:${school.email || ""}`}
                    className="flex items-center gap-4 py-4"
                    onClick={() => setIsContactSheetOpen(false)}
                  >
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center shrink-0">
                      <i className="ri-mail-line text-orange-500 text-[18px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#0E1C29]">
                        Email
                      </p>
                      {school.email && (
                        <p className="text-[13px] text-gray-400 truncate">
                          {school.email}
                        </p>
                      )}
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-300 text-xl" />
                  </Link>

                  <Link
                    href={school.website || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 py-4"
                    onClick={() => setIsContactSheetOpen(false)}
                  >
                    <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                      <i className="ri-global-line text-[#774BE5] text-[18px]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[15px] font-semibold text-[#0E1C29]">
                        Website
                      </p>
                      {school.website && (
                        <p className="text-[13px] text-gray-400 truncate">
                          {school.website}
                        </p>
                      )}
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-300 text-xl" />
                  </Link>
                </div>

                <p className="text-[12px] text-gray-400 mt-2 leading-relaxed">
                  Confirm fees, schedules, and availability directly with the
                  school.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default SchoolDetails;
