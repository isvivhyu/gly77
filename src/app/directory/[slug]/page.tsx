"use client";

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { School } from "@/lib/supabase";
import { useParams } from "next/navigation";
import { SkeletonLoader } from "@/components/SkeletonLoader";
import Footer from "@/components/Footer";
import { optimizeImageUrl } from "@/lib/cloudinary";

const SchoolDetails = () => {
  const params = useParams();
  const slug = params.slug as string;

  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const contactColumnRef = useRef<HTMLDivElement>(null);
  const contactStickyRef = useRef<HTMLDivElement>(null);

  const STICKY_TOP_PX = 96; // match top-24 (navbar clearance)

  // Get current page URL for sharing
  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return window.location.href;
    }
    return "";
  };

  // Copy link to clipboard
  const handleCopyLink = async () => {
    try {
      const url = getShareUrl();
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  };

  // Native share for mobile
  const handleNativeShare = async () => {
    const url = getShareUrl();
    const text = `Check out ${school?.school || "this school"} on Aralya! ${school?.city ? `Located in ${school.city}.` : ""} ${url}`;
    const title = `${school?.school || "School"} | Aralya`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: title,
          text: text,
          url: url,
        });
      } catch (error) {
        // User cancelled or error occurred - silently fail
        if (error instanceof Error && error.name !== "AbortError") {
          console.log("Share failed:", error);
        }
      }
    } else {
      // Fallback: copy link if native share not available
      handleCopyLink();
    }
  };

  // Share functions for desktop (direct platform URLs)
  const shareToFacebook = () => {
    const url = encodeURIComponent(getShareUrl());
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      "_blank",
    );
  };

  const shareToMessenger = () => {
    const url = getShareUrl();
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert("Link copied! You can now paste it in Messenger.");
      })
      .catch(() => {
        window.open("https://www.messenger.com", "_blank");
      });
  };

  const shareToViber = () => {
    const url = encodeURIComponent(getShareUrl());
    const text = encodeURIComponent(
      `Check out ${school?.school || "this school"} on Aralya! ${getShareUrl()}`,
    );
    window.open(`viber://forward?text=${text}`, "_blank");
    setTimeout(() => {
      if (!document.hasFocus()) {
        navigator.clipboard.writeText(getShareUrl()).then(() => {
          alert("Link copied! You can now paste it in Viber.");
        });
      }
    }, 500);
  };

  // Format date to "Month Year" format
  const formatLastUpdated = (dateString?: string): string => {
    if (!dateString) {
      // Fallback to current date if no date provided
      const now = new Date();
      return now.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    } catch {
      // Fallback to current date if date parsing fails
      const now = new Date();
      return now.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
    }
  };

  // Detect desktop vs mobile
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768); // md breakpoint
    };

    checkDesktop();
    window.addEventListener("resize", checkDesktop);
    return () => window.removeEventListener("resize", checkDesktop);
  }, []);

  // Load school data from API
  useEffect(() => {
    const loadSchool = async () => {
      try {
        const { apiClient } = await import("@/lib/apiClient");
        const foundSchool = await apiClient.getSchoolBySlug(slug);
        setSchool(foundSchool || null);
      } catch (error) {
        console.error("Error loading school:", error);
        setSchool(null);
      } finally {
        setLoading(false);
      }
    };

    loadSchool();
  }, [slug]);

  // Sticky Contact card: apply styles directly to DOM so it actually sticks (desktop only)
  useEffect(() => {
    if (!school) return;

    let rafId: number;
    let scrollTarget: Window | Element = window;
    let timeoutId: ReturnType<typeof setTimeout>;

    const updateSticky = () => {
      const isMd = typeof window !== "undefined" && window.innerWidth >= 768;
      const column = contactColumnRef.current;
      const el = contactStickyRef.current;
      if (!column || !el) return;
      if (!isMd) {
        el.style.position = "";
        el.style.top = "";
        el.style.left = "";
        el.style.width = "";
        return;
      }
      const colRect = column.getBoundingClientRect();
      const cardRect = el.getBoundingClientRect();
      const cardHeight = cardRect.height;
      const stickZoneBottom = STICKY_TOP_PX + cardHeight;
      const shouldStick =
        cardRect.top <= STICKY_TOP_PX && colRect.bottom > stickZoneBottom;

      if (shouldStick) {
        el.style.position = "fixed";
        el.style.top = `${STICKY_TOP_PX}px`;
        el.style.left = `${colRect.left}px`;
        el.style.width = `${colRect.width}px`;
      } else {
        el.style.position = "";
        el.style.top = "";
        el.style.left = "";
        el.style.width = "";
      }
    };

    const onScrollOrResize = () => {
      rafId = requestAnimationFrame(updateSticky);
    };

    // Find scrollable ancestor (if any); otherwise use window
    const getScrollParent = (node: HTMLElement | null): Element | null => {
      if (!node) return null;
      let p: HTMLElement | null = node.parentElement;
      while (p) {
        const style = getComputedStyle(p);
        const oy = style.overflowY;
        const o = style.overflow;
        if (
          (oy === "auto" ||
            oy === "scroll" ||
            o === "auto" ||
            o === "scroll") &&
          p.scrollHeight > p.clientHeight
        ) {
          return p;
        }
        p = p.parentElement;
      }
      return null;
    };

    const setup = () => {
      const col = contactColumnRef.current;
      const el = contactStickyRef.current;
      if (!col || !el) return;
      scrollTarget = getScrollParent(col) || window;
      if (scrollTarget === window) {
        // Page scroll can fire on window or documentElement depending on browser
        window.addEventListener("scroll", onScrollOrResize, { passive: true });
        document.documentElement.addEventListener("scroll", onScrollOrResize, {
          passive: true,
        });
      } else {
        scrollTarget.addEventListener("scroll", onScrollOrResize, {
          passive: true,
        });
      }
      window.addEventListener("resize", onScrollOrResize);
      updateSticky();
    };

    timeoutId = setTimeout(setup, 150);

    return () => {
      clearTimeout(timeoutId);
      cancelAnimationFrame(rafId);
      if (scrollTarget === window) {
        window.removeEventListener("scroll", onScrollOrResize);
        document.documentElement.removeEventListener(
          "scroll",
          onScrollOrResize,
        );
      } else {
        scrollTarget.removeEventListener("scroll", onScrollOrResize);
      }
      window.removeEventListener("resize", onScrollOrResize);
      const el = contactStickyRef.current;
      if (el) {
        el.style.position = "";
        el.style.top = "";
        el.style.left = "";
        el.style.width = "";
      }
    };
  }, [school]);

  // Show loading state
  if (loading) {
    return (
      <section className="w-full bg-white flex flex-col items-center pb-40 px-5">
        <div className="w-full flex items-center justify-center md:px-10 pt-5 md:pt-0">
          <Navbar textColor="black" />
        </div>
        <div className="pt-13 flex flex-col items-center md:max-w-[1000px] w-full px-0 mt-28">
          {/* Header Skeleton */}
          <div className="rounded-[16px] bg-[#F6F3FA] p-4 flex md:flex-row flex-col gap-4 md:items-center w-full shadow-sm">
            <SkeletonLoader className="w-80 h-50" />
            <div className="flex flex-col gap-2">
              <SkeletonLoader className="h-8 w-64" />
              <div className="flex items-center my-1">
                <SkeletonLoader className="h-4 w-4 rounded-full mr-2" />
                <SkeletonLoader className="h-4 w-32" />
              </div>
              <SkeletonLoader className="h-8 w-32 rounded-lg" />
            </div>
          </div>

          {/* Two-column skeleton: Overview (left) + Contact (right) */}
          <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-[1fr_340px] gap-8 md:gap-10">
            <div className="flex flex-col gap-10">
              <div className="rounded-2xl p-8 w-full bg-[#F6F3FA] shadow-sm">
                <div className="flex gap-2 items-center -ml-1 mb-4">
                  <SkeletonLoader className="h-6 w-6 rounded" />
                  <SkeletonLoader className="h-6 w-24" />
                </div>
                <div className="grid md:grid-cols-2 grid-cols-1 gap-x-12 gap-y-6 mt-8">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <SkeletonLoader className="h-5 w-32" />
                      <SkeletonLoader className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="md:sticky md:top-24">
              <div className="rounded-2xl bg-[#F6F3FA] p-6 shadow-sm border border-gray-100 flex flex-col gap-4 items-center justify-center min-h-[200px]">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-[#774BE5]/20 border-t-[#774BE5] animate-spin" />
                  <div
                    className="absolute inset-0 w-12 h-12 rounded-full border-4 border-transparent border-b-[#9B6EF3]/50 animate-spin"
                    style={{
                      animationDirection: "reverse",
                      animationDuration: "0.8s",
                    }}
                  />
                </div>
                <p className="text-[#774BE5] font-medium text-[14px] animate-pulse">
                  Loading...
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Show 404 if school not found
  if (!school) {
    return (
      <section className="w-full bg-white flex flex-col items-center pb-40 px-5">
        <div className="w-full flex items-center justify-center md:px-10 pt-5 md:pt-0">
          <Navbar textColor="black" />
        </div>
        <div className="pt-13 flex flex-col items-center md:max-w-[1000px] w-full px-0 mt-28">
          <div className="rounded-[16px] bg-[#F6F3FA] p-8 text-center shadow-sm">
            <h1 className="text-[24px] font-bold text-[#0E1C29] mb-4">
              School Not Found
            </h1>
            <p className="text-[15px] text-gray-600 mb-6">
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
      </section>
    );
  }

  return (
    <>
      <section className="w-full bg-white flex flex-col items-center pb-40 px-5">
        {/* Navbar */}
        <div className="w-full flex items-center justify-center md:px-10 pt-5 md:pt-0">
          <Navbar textColor="black" />
        </div>

        {/* Main Content */}
        <div className="pt-13 flex flex-col items-center md:max-w-[1000px] w-full px-0 mt-14">
          {/* Back to Browse Button */}
          <div className="w-full mb-4 relative flex items-center min-h-10">
            <Link
              href="/directory"
              className="w-full flex items-center relative"
            >
              <div className="w-10 h-10 rounded-full bg-[#774BE5] text-white flex items-center justify-center hover:bg-[#6B3FD6] transition-colors shrink-0">
                <i className="ri-arrow-left-line text-lg"></i>
              </div>
              <span className="absolute left-1/2 -translate-x-1/2 text-[#774BE5] font-semibold text-[14px]">
                Back to Browse
              </span>
            </Link>
          </div>

          {/* Header */}
          <div className="rounded-[16px] bg-[#F6F3FA] p-4 flex md:flex-row flex-col gap-4 md:items-center w-full shadow-sm">
            <div className="w-full md:w-80 md:h-48 border border-gray-200 rounded-[10px] bg-white overflow-hidden flex items-center justify-center">
              <Image
                src={
                  optimizeImageUrl(school?.logo_banner) || "/images/Logo.png"
                }
                alt={school?.school || "School Logo"}
                width={400}
                height={200}
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[#0E1C29] text-[24px] font-semibold">
                  <span>{school?.school || "School Name"}</span>
                  <span className="relative group inline-block ml-1 -mt-1 align-middle">
                    <i className="ri-verified-badge-fill text-[#774BE5] text-xl cursor-pointer"></i>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-[#774BE5] text-white text-[14px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      Verified by Aralya
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
                        <div className="border-4 border-transparent border-t-[#774BE5]"></div>
                      </div>
                    </div>
                  </span>
                </h4>

                <div
                  className="flex items-center gap-2 cursor-pointer bg-[#774BE5] rounded-full px-2 py-1"
                  onClick={() => {
                    // On mobile, directly trigger native share
                    if (!isDesktop) {
                      handleNativeShare();
                    } else {
                      // On desktop, show modal
                      setShowShareModal(true);
                    }
                  }}
                >
                  <i className="ri-share-2-line text-white text-xl"></i>
                </div>
              </div>
              <div className="flex items-center my-1 gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <i className="ri-map-pin-line text-[#374151] text-[16px]"></i>
                  <p className="text-[16px] font-medium text-[#374151]">
                    {school?.city || "City"}
                  </p>
                </div>
                <i className="ri-checkbox-blank-circle-fill text-black text-[6px]"></i>
                <p className="text-[14px] font-medium text-[#374151]">
                  Updated: {formatLastUpdated(school?.updated_at)}
                </p>
              </div>
              {school?.website && (
                <div className="flex items-center my-1">
                  <i className="ri-global-line text-[#774BE5] text-[16px]"></i>
                  <a
                    href={school?.website || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[16px] font-medium text-[#774BE5] hover:underline"
                  >
                    Official website ↗
                  </a>
                </div>
              )}
              <p className="text-[#0E1C29] font-bold text-[20px]">
                {school?.min_tuition || "N/A"} - {school?.max_tuition || "N/A"}
                {school?.min_tuition?.toLowerCase().includes("/month") ||
                school?.max_tuition?.toLowerCase().includes("/month")
                  ? ""
                  : " / year"}
              </p>
              {school?.summary && (
                <p className="text-[15px] font-medium text-[#374151]">
                  {school.summary}
                </p>
              )}
            </div>
          </div>

          {/* Grid: row1 = Overview | Contact (sticky, spans 3 rows), row2 = Location full width, row3 = Help full width */}
          <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-[1fr_340px] gap-8 md:gap-10 items-start overflow-visible">
            {/* Row 1: Overview */}
            <div className="min-w-0 md:row-start-1 md:col-start-1">
              <div className="rounded-2xl p-8 w-full bg-[#F6F3FA] shadow-sm border border-gray-100">
                <div className="flex gap-2 items-center -ml-1">
                  <i className="ri-book-open-line text-[#0E1C29] text-[18px] mt-0.5 ml-1"></i>
                  <p className="text-[18px] text-[#0E1C29] font-semibold">
                    Overview
                  </p>
                </div>

                <div className="grid md:grid-cols-2 grid-cols-1 gap-x-12 gap-y-6 mt-8">
                  <div className="flex flex-col gap-2">
                    <p className="text-[16px] text-[#0E1C29] font-semibold">
                      Curriculum
                    </p>
                    <p className="text-[#0E1C29] font-normal text-[15px]">
                      {school?.curriculum || "Not specified"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-[16px] text-[#0E1C29] font-semibold">
                      Class Size
                    </p>
                    <p className="text-[#0E1C29] font-normal text-[15px]">
                      {school?.class_size || "Not specified"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-[16px] text-[#0E1C29] font-semibold">
                      Schedule
                    </p>
                    <p className="text-[#0E1C29] font-normal text-[15px]">
                      {school?.schedule || "Not specified"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-[16px] text-[#0E1C29] font-semibold">
                      Programs
                    </p>
                    <p className="text-[#0E1C29] font-normal text-[15px]">
                      {school?.programs || "Not specified"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-[16px] text-[#0E1C29] font-semibold">
                      After-school Care
                    </p>
                    <p className="text-[#0E1C29] font-normal text-[15px]">
                      {school?.care || "Not specified"}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-[16px] text-[#0E1C29] font-semibold">
                      Special Education Support
                    </p>
                    <p className="text-[#0E1C29] font-normal text-[15px]">
                      {school?.support || "Not specified"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact: col 2, spans rows 1–3; JS sticky keeps card fixed until column ends (no overlap with Location/Help) */}
            <div
              ref={contactColumnRef}
              className="md:col-start-2 md:row-start-1 md:row-span-3 md:self-start w-full md:min-h-0"
            >
              <div ref={contactStickyRef} className="z-10 w-full">
                <div className="rounded-2xl bg-[#F6F3FA] p-6 shadow-sm border border-gray-100 flex flex-col gap-4">
                  <h4 className="text-[#0E1C29] text-[18px] font-semibold">
                    Contact School
                  </h4>

                  <div className="grid grid-cols-2 gap-3">
                    <Link
                      href={`tel:${(school?.number || "").split(",")[0]?.trim() || ""}`}
                      className="bg-[#774BE5] hover:bg-[#6B3FD6] rounded-full px-4 py-3 transition-colors"
                    >
                      <p className="text-white text-center font-semibold text-[14px]">
                        Call
                      </p>
                    </Link>
                    <Link
                      href={`sms:${(school?.number || "").split(",")[0]?.trim() || ""}`}
                      className="bg-[#774BE5] hover:bg-[#6B3FD6] rounded-full px-4 py-3 transition-colors"
                    >
                      <p className="text-white text-center font-semibold text-[14px]">
                        Text
                      </p>
                    </Link>
                    <Link
                      href={school?.facebook || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#774BE5] hover:bg-[#6B3FD6] rounded-full px-4 py-3 transition-colors"
                    >
                      <p className="text-white text-center font-semibold text-[14px]">
                        Facebook
                      </p>
                    </Link>
                    <Link
                      href={`mailto:${school?.email || ""}`}
                      className="bg-[#774BE5] hover:bg-[#6B3FD6] rounded-full px-4 py-3 transition-colors"
                    >
                      <p className="text-white text-center font-semibold text-[14px]">
                        Email
                      </p>
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Location – full width (span both columns) */}
            <div className="w-full md:row-start-2 md:col-start-1 md:col-span-2 rounded-3xl bg-[#F6F3FA] p-6 flex flex-col gap-4 shadow-sm">
              <div className="flex gap-2 items-center -ml-1 mb-2">
                <i className="ri-map-pin-line text-[#0E1C29] text-[18px] mt-0.5 ml-1"></i>
                <p className="text-[18px] text-[#0E1C29] font-semibold">
                  Location
                </p>
              </div>
              <p className="text-[#0E1C29] font-normal text-[15px]">
                {school?.location && school.location.trim() !== ""
                  ? school.location
                  : school?.city && school.city.trim() !== ""
                    ? school.city
                    : "Philippines"}
              </p>
              <div className="mt-4 flex md:justify-start">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    school?.location && school.location.trim() !== ""
                      ? `${school.location}, Philippines`
                      : school?.city && school.city.trim() !== ""
                        ? `${school.city}, Philippines`
                        : "Philippines",
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#774BE5] rounded-full px-4 py-2 inline-flex items-center text-white font-semibold text-[14px]"
                >
                  Google Maps
                </a>
              </div>
            </div>

            {/* Row 3: Help – full width (span both columns) */}
            <div className="w-full -mb-16 md:row-start-3 md:col-start-1 md:col-span-2 rounded-3xl bg-[#F6F3FA] p-6 flex flex-col gap-4 shadow-sm border border-gray-100">
              <div className="flex gap-2 items-center -ml-1 mb-2">
                <i className="ri-lightbulb-line text-[#0E1C29] text-[18px] mt-0.5 ml-1"></i>
                <h4 className="text-[18px] text-[#0E1C29] font-semibold">
                  Help us keep this information accurate
                </h4>
              </div>
              <div className="flex flex-col gap-2">
                <p className="text-[15px] text-[#374151]">
                  If you notice outdated or incorrect details, message us on
                  Facebook and we'll review it promptly.
                </p>
                <Link
                  href="https://web.facebook.com/people/Aralya/61578164295126"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#774BE5] rounded-full px-4 py-2 w-fit mt-2 flex items-center hover:bg-[#6B3FD6] transition-colors"
                >
                  <span className="text-white text-center font-semibold text-[14px]">
                    Message on Facebook
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Share Modal */}
      {showShareModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[18px] font-semibold text-[#0E1C29]">
                Share this school
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            </div>

            {/* School Image and Details */}
            <div className="mb-6">
              <div className="w-full flex items-stretch gap-4 mb-4">
                <div className="w-2/5 h-48 flex-shrink-0 bg-gray-200 border border-gray-200 bg-white rounded-lg overflow-hidden flex items-center justify-center">
                  <Image
                    src={
                      optimizeImageUrl(school?.logo_banner) ||
                      "/images/Logo.png"
                    }
                    alt={school?.school || "School Logo"}
                    width={400}
                    height={200}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <div className="flex flex-col gap-2 w-3/5 min-w-0">
                  <h4 className="text-[24px] font-semibold text-[#0E1C29] mb-2 break-words leading-tight">
                    {school?.school || "School Name"}
                  </h4>
                  <div className="flex flex-col gap-1 text-[15px] text-[#374151]">
                    <div className="flex items-center gap-2">
                      <i className="ri-map-pin-line"></i>
                      <span>{school?.city || "City"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <i className="ri-money-dollar-circle-line"></i>
                      <span>
                        {school?.min_tuition || "N/A"} -{" "}
                        {school?.max_tuition || "N/A"}
                        {school?.min_tuition
                          ?.toLowerCase()
                          .includes("/month") ||
                        school?.max_tuition?.toLowerCase().includes("/month")
                          ? ""
                          : " / year"}
                      </span>
                    </div>
                    {school?.curriculum && (
                      <div className="flex items-center gap-2">
                        <i className="ri-book-open-line"></i>
                        <span>{school.curriculum}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Share Actions */}
            <div className="space-y-3">
              {isDesktop ? (
                /* Desktop: Show Copy Link, Messenger, Viber, Facebook in 2x2 grid */
                <div className="grid grid-cols-2 gap-3">
                  {/* 1. Copy Link */}
                  <button
                    onClick={handleCopyLink}
                    className="bg-[#774BE5] hover:bg-[#6B3FD6] text-white rounded-full px-4 py-3 flex items-center justify-center gap-2 font-semibold transition-colors"
                  >
                    {linkCopied ? (
                      <>
                        <i className="ri-check-line text-lg"></i>
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <i className="ri-link text-lg"></i>
                        <span>Copy Link</span>
                      </>
                    )}
                  </button>

                  {/* 2. Messenger */}
                  <button
                    onClick={shareToMessenger}
                    className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <i className="ri-messenger-fill text-[#0084FF] text-xl"></i>
                    <span className="font-medium text-[16px] text-[#0E1C29]">
                      Messenger
                    </span>
                  </button>

                  {/* 3. Viber */}
                  <button
                    onClick={shareToViber}
                    className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <i className="ri-message-3-fill text-[#665CAC] text-xl"></i>
                    <span className="font-medium text-[16px] text-[#0E1C29]">
                      Viber
                    </span>
                  </button>

                  {/* 4. Facebook */}
                  <button
                    onClick={shareToFacebook}
                    className="flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <i className="ri-facebook-fill text-[#1877F2] text-xl"></i>
                    <span className="font-medium text-[16px] text-[#0E1C29]">
                      Facebook
                    </span>
                  </button>
                </div>
              ) : (
                /* Mobile: Use native share */
                <>
                  {/* Native Share Button */}
                  <button
                    onClick={handleNativeShare}
                    className="w-full bg-[#774BE5] hover:bg-[#6B3FD6] text-white rounded-full px-4 py-3 flex items-center justify-center gap-2 font-semibold transition-colors"
                  >
                    <i className="ri-share-2-line text-lg"></i>
                  </button>

                  {/* Copy Link as secondary option */}
                  <button
                    onClick={handleCopyLink}
                    className="w-full flex items-center justify-center gap-2 border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    {linkCopied ? (
                      <>
                        <i className="ri-check-line text-lg"></i>
                        <span className="font-medium text-[16px] text-[#0E1C29]">
                          Link Copied!
                        </span>
                      </>
                    ) : (
                      <>
                        <i className="ri-link text-lg"></i>
                        <span className="font-medium text-[16px] text-[#0E1C29]">
                          Copy Link
                        </span>
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default SchoolDetails;
