"use client";

import { useEffect, useState } from "react";
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

  const primaryCity = school?.city?.split(",")[0]?.trim() || "";
  const cityBreadcrumbLabel = primaryCity ? `Preschools in ${primaryCity}` : undefined;
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
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank");
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
              .slice(0, 6);
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
        <div className="w-full px-5 md:px-10">
          <Navbar textColor="black" sticky={false} />
        </div>
        <div className="max-w-[960px] mx-auto px-5 mt-10 pb-40">
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
        <div className="w-full px-5 md:px-10">
          <Navbar textColor="black" sticky={false} />
        </div>
        <div className="max-w-[960px] mx-auto px-5 mt-24 pb-40 text-center">
          <h1 className="text-[24px] font-bold text-[#0E1C29] mb-4">School Not Found</h1>
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
        {/* Navbar – not sticky on this page */}
        <div className="w-full px-5 md:px-10">
          <Navbar textColor="black" sticky={false} />
        </div>

        {/* Main content column */}
        <div className="max-w-[960px] mx-auto px-5 pb-32 md:pb-20">

          {/* ── Breadcrumb ──────────────────────────────────────────── */}
          <div className="mt-6 mb-8">
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
          <div className="pb-8 border-b border-gray-100">
            {/* Name + share */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-[26px] md:text-[34px] font-bold text-[#0E1C29] leading-tight tracking-tight">
                {school.school}
              </h1>
              <button
                className="shrink-0 mt-1 w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 text-[#374151] hover:border-[#774BE5] hover:text-[#774BE5] transition-colors"
                onClick={() => (!isDesktop ? handleNativeShare() : setShowShareModal(true))}
                aria-label="Share school profile"
              >
                <i className="ri-share-2-line text-[17px]" />
              </button>
            </div>

            {/* City + updated */}
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <i className="ri-map-pin-2-line text-[#774BE5] text-[14px]" />
              <span className="text-[14px] text-[#374151]">{school.city || "City"}</span>
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

            {/* Summary */}
            {school.summary && (
              <p className="text-[15px] text-[#4B5563] leading-relaxed mt-3">
                {school.summary}
              </p>
            )}

            {/* Website shortcut */}
            {school.website && (
              <a
                href={school.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-3 text-[14px] text-[#774BE5] hover:underline font-medium"
              >
                <i className="ri-global-line text-[14px]" />
                Official website ↗
              </a>
            )}
          </div>

          {/* ── School image / logo ──────────────────────────────────── */}
          <div className="py-8 border-b border-gray-100">
            <div className="relative w-full h-52 md:h-64 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex items-center justify-center">
              <Image
                src={optimizeImageUrl(school.logo_banner) || "/images/Logo.png"}
                alt={school.school || "School Logo"}
                width={920}
                height={300}
                className="max-w-full max-h-full object-contain"
              />
              {/* Verified badge */}
              <span className="absolute bottom-3 right-3 group inline-flex">
                <i className="ri-verified-badge-fill text-[#774BE5] text-xl cursor-pointer drop-shadow-sm" />
                <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-[#774BE5] text-white text-[13px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                  Verified by Aralya
                  <div className="absolute top-full right-4 -mt-1 border-4 border-transparent border-t-[#774BE5]" />
                </div>
              </span>
            </div>
          </div>

          {/* ── Overview ────────────────────────────────────────────── */}
          <div className="py-8 border-b border-gray-100">
            <h2 className="text-[17px] font-semibold text-[#0E1C29] mb-6">Overview</h2>
            <div className="grid md:grid-cols-2 grid-cols-1 gap-x-12 gap-y-6">
              {[
                { label: "Curriculum", value: school.curriculum },
                { label: "Class Size", value: school.class_size },
                { label: "Schedule", value: school.schedule },
                { label: "Programs", value: school.programs },
                { label: "After-school Care", value: school.care },
                { label: "Special Education Support", value: school.support },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-[11px] uppercase tracking-widest text-gray-400 font-semibold mb-1">
                    {label}
                  </p>
                  <p className="text-[15px] text-[#0E1C29]">{value || "Not specified"}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Location ────────────────────────────────────────────── */}
          <div className="py-8 border-b border-gray-100">
            <h2 className="text-[17px] font-semibold text-[#0E1C29] mb-4">Location</h2>
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
          <div className="hidden md:block py-8 border-b border-gray-100">
            <h2 className="text-[17px] font-semibold text-[#0E1C29] mb-1">Contact School</h2>
            <p className="text-[13px] text-gray-400 mb-5">
              Confirm fees, schedules, and availability directly with the school.
            </p>
            <div className="flex flex-wrap gap-2.5">
              {[
                { label: "Call", icon: "ri-phone-line", href: `tel:${phoneNumber}` },
                { label: "Text", icon: "ri-message-2-line", href: `sms:${phoneNumber}` },
                {
                  label: "Facebook",
                  icon: "ri-facebook-line",
                  href: school.facebook || "#",
                  external: true,
                },
                { label: "Email", icon: "ri-mail-line", href: `mailto:${school.email || ""}` },
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
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="inline-flex items-center gap-2 border border-gray-200 hover:border-[#774BE5] hover:text-[#774BE5] text-[#0E1C29] rounded-full px-5 py-2 text-[14px] font-medium transition-colors"
                >
                  <i className={`${icon} text-[15px]`} />
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* ── Accuracy ─────────────────────────────────────────────── */}
          <div className="py-8 border-b border-gray-100">
            <div className="flex items-start gap-3">
              <i className="ri-edit-box-line text-gray-400 text-[18px] mt-0.5 shrink-0" />
              <div>
                <p className="text-[15px] font-semibold text-[#0E1C29] mb-1">
                  Help us keep this information accurate
                </p>
                <p className="text-[14px] text-[#4B5563] mb-4 leading-relaxed">
                  If you notice outdated or incorrect details, message us on Facebook and
                  we&apos;ll review it promptly.
                </p>
                <Link
                  href="https://web.facebook.com/people/Aralya/61578164295126"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#774BE5] border border-[#774BE5] rounded-full px-5 py-2 hover:bg-[#774BE5] hover:text-white transition-colors"
                >
                  Report a Correction
                </Link>
              </div>
            </div>
          </div>

          {/* ── Similar Schools ──────────────────────────────────────── */}
          {primaryCity && similarSchools.length >= 3 && (
            <div className="pt-10">
              <h2 className="text-[17px] font-semibold text-[#0E1C29] mb-5">
                Similar Preschools in {primaryCity}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {similarSchools.slice(0, 6).map((item) => (
                  <Link
                    key={item.school}
                    href={`/directory/${createSchoolSlug(item.school)}/`}
                    className="group flex flex-col gap-1.5 p-4 rounded-xl border border-gray-100 hover:border-[#774BE5]/30 hover:bg-[#FAFAFF] transition-colors"
                  >
                    <p className="text-[15px] font-semibold text-[#0E1C29] line-clamp-2 group-hover:text-[#774BE5] transition-colors">
                      {item.school}
                    </p>
                    {item.curriculum && (
                      <p className="text-[13px] text-gray-400">{item.curriculum}</p>
                    )}
                    <p className="text-[13px] font-semibold text-[#774BE5] mt-1">
                      {item.min_tuition || "N/A"} – {item.max_tuition || "N/A"}
                    </p>
                  </Link>
                ))}
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
              <h3 className="text-[17px] font-semibold text-[#0E1C29]">Share this school</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                <i className="ri-close-line text-[18px] text-[#374151]" />
              </button>
            </div>

            {/* School preview */}
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
              <div className="w-14 h-14 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden">
                <Image
                  src={optimizeImageUrl(school.logo_banner) || "/images/Logo.png"}
                  alt={school.school || "School Logo"}
                  width={56}
                  height={56}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-[#0E1C29] truncate">{school.school}</p>
                <p className="text-[13px] text-gray-400 mt-0.5">{school.city}</p>
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
                    <><i className="ri-check-line" /><span>Copied!</span></>
                  ) : (
                    <><i className="ri-link" /><span>Copy Link</span></>
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
                    <><i className="ri-check-line" /><span>Link Copied!</span></>
                  ) : (
                    <><i className="ri-link" /><span>Copy Link</span></>
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
            className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${
              isContactSheetOpen ? "pointer-events-auto" : "pointer-events-none"
            }`}
          >
            {/* Dimmed backdrop */}
            <button
              aria-label="Close contact options"
              onClick={() => setIsContactSheetOpen(false)}
              className={`absolute inset-0 bg-black/45 transition-opacity duration-300 ${
                isContactSheetOpen ? "opacity-100" : "opacity-0"
              }`}
            />

            {/* Sheet panel */}
            <div
              className={`absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ease-out ${
                isContactSheetOpen ? "translate-y-0" : "translate-y-full"
              }`}
            >
              {/* Handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>

              <div className="px-5 pt-3 pb-10">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[17px] font-semibold text-[#0E1C29]">Contact School</h4>
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
                      <p className="text-[15px] font-semibold text-[#0E1C29]">Call</p>
                      {phoneNumber && (
                        <p className="text-[13px] text-gray-400 truncate">{phoneNumber}</p>
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
                      <p className="text-[15px] font-semibold text-[#0E1C29]">Text</p>
                      {phoneNumber && (
                        <p className="text-[13px] text-gray-400 truncate">{phoneNumber}</p>
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
                      <p className="text-[15px] font-semibold text-[#0E1C29]">Facebook</p>
                      <p className="text-[13px] text-gray-400">Visit Facebook page</p>
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
                      <p className="text-[15px] font-semibold text-[#0E1C29]">Email</p>
                      {school.email && (
                        <p className="text-[13px] text-gray-400 truncate">{school.email}</p>
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
                      <p className="text-[15px] font-semibold text-[#0E1C29]">Website</p>
                      {school.website && (
                        <p className="text-[13px] text-gray-400 truncate">{school.website}</p>
                      )}
                    </div>
                    <i className="ri-arrow-right-s-line text-gray-300 text-xl" />
                  </Link>
                </div>

                <p className="text-[12px] text-gray-400 mt-2 leading-relaxed">
                  Confirm fees, schedules, and availability directly with the school.
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
