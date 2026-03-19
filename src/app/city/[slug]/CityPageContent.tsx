"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SchoolCard from "@/components/SchoolCard";
import { SchoolCardSkeleton } from "@/components/SchoolCardSkeleton";
import { SchoolService } from "@/lib/schoolService";
import { School } from "@/lib/supabase";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { optimizeImageUrl } from "@/lib/cloudinary";
import { cityToSlug } from "@/lib/cityUtils";
import Breadcrumbs from "@/components/Breadcrumbs";

interface CityPageContentProps {
  citySlug: string;
  cityName: string;
}

const createSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
};

export default function CityPageContent({
  citySlug,
  cityName,
}: CityPageContentProps) {
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [displayedSchools, setDisplayedSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Filter state
  const [curriculumFilter, setCurriculumFilter] = useState("");
  const [priceRange, setPriceRange] = useState({ min: 0, max: 600000 });
  const [maxSchoolPrice, setMaxSchoolPrice] = useState(600000);
  const [showCurriculumDropdown, setShowCurriculumDropdown] = useState(false);
  const [curriculumSearch, setCurriculumSearch] = useState("");

  const [availableCurriculums, setAvailableCurriculums] = useState<
    { label: string; count: number }[]
  >([]);
  const [priceBuckets, setPriceBuckets] = useState<number[]>([]);
  const [otherCities, setOtherCities] = useState<
    { city: string; slug: string; count: number }[]
  >([]);

  const observerRef = useRef<HTMLDivElement>(null);
  const curriculumDropdownRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<"min" | "max" | null>(null);
  const priceRangeRef = useRef(priceRange);
  const maxSchoolPriceRef = useRef(maxSchoolPrice);
  const schoolsPerPage = 12;

  const filteredCurriculums = availableCurriculums.filter((curr) =>
    curr.label.toLowerCase().includes(curriculumSearch.toLowerCase()),
  );

  // Keep refs in sync with latest state (avoids stale closures in drag handler)
  useEffect(() => { priceRangeRef.current = priceRange; }, [priceRange]);
  useEffect(() => { maxSchoolPriceRef.current = maxSchoolPrice; }, [maxSchoolPrice]);

  // Global drag handler for the price slider
  useEffect(() => {
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!draggingRef.current || !sliderRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const rect = sliderRef.current.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const value = Math.round((pct * maxSchoolPriceRef.current) / 10000) * 10000;
      if (draggingRef.current === "min") {
        setPriceRange((prev) => ({ ...prev, min: Math.min(value, prev.max - 10000) }));
      } else {
        setPriceRange((prev) => ({ ...prev, max: Math.max(value, prev.min + 10000) }));
      }
    };
    const handleUp = () => { draggingRef.current = null; };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
    document.addEventListener("touchmove", handleMove, { passive: true });
    document.addEventListener("touchend", handleUp);
    return () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", handleUp);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleUp);
    };
  }, []);

  const handleSliderMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (!sliderRef.current) return;
    e.preventDefault();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const rect = sliderRef.current.getBoundingClientRect();
    const clickPct = (clientX - rect.left) / rect.width;
    const { min, max } = priceRangeRef.current;
    const maxPrice = maxSchoolPriceRef.current;
    const distToMin = Math.abs(clickPct - min / maxPrice);
    const distToMax = Math.abs(clickPct - max / maxPrice);
    draggingRef.current = distToMin <= distToMax ? "min" : "max";
  };

  // Close curriculum dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        curriculumDropdownRef.current &&
        !curriculumDropdownRef.current.contains(event.target as Node)
      ) {
        setShowCurriculumDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Apply filters
  const applyFilters = useCallback(() => {
    let filtered = [...schools];

    // Price filter
    const isPriceFiltered =
      priceRange.min > 0 || priceRange.max < maxSchoolPrice;
    if (isPriceFiltered) {
      filtered = filtered.filter((school) => {
        const minPrice = parseFloat(
          school.min_tuition?.replace(/[^\d.]/g, "") || "0",
        );
        const maxPrice = parseFloat(
          school.max_tuition?.replace(/[^\d.]/g, "") || "0",
        );
        const schoolMin = minPrice;
        const schoolMax = maxPrice || minPrice;
        return schoolMin <= priceRange.max && schoolMax >= priceRange.min;
      });
    }

    // Curriculum filter
    if (curriculumFilter) {
      filtered = filtered.filter((school) =>
        school.curriculum_tags
          ?.toLowerCase()
          .includes(curriculumFilter.toLowerCase()),
      );
    }

    setFilteredSchools(filtered);
    setDisplayedSchools(filtered.slice(0, schoolsPerPage));
    setHasMore(filtered.length > schoolsPerPage);
    setCurrentPage(1);
  }, [schools, priceRange, curriculumFilter, maxSchoolPrice]);

  // Load schools for this city
  useEffect(() => {
    const loadSchools = async () => {
      setLoading(true);
      try {
        const citySchools = await SchoolService.getSchoolsByCity(cityName);
        setSchools(citySchools);
        setFilteredSchools(citySchools);
        setDisplayedSchools(citySchools.slice(0, schoolsPerPage));
        setHasMore(citySchools.length > schoolsPerPage);

        // Calculate max price from schools data
        let maxPrice = 0;
        citySchools.forEach((school) => {
          const max = parseFloat(
            school.max_tuition?.replace(/[^\d.]/g, "") || "0",
          );
          const min = parseFloat(
            school.min_tuition?.replace(/[^\d.]/g, "") || "0",
          );
          if (max > maxPrice) maxPrice = max;
          if (min > maxPrice) maxPrice = min;
        });
        const rounded = Math.max(600000, Math.ceil(maxPrice / 100000) * 100000);
        setMaxSchoolPrice(rounded);
        setPriceRange({ min: 0, max: rounded });

        // Build price histogram buckets (30 bars)
        const NUM_BUCKETS = 30;
        const bucketSize = rounded / NUM_BUCKETS;
        const buckets = Array(NUM_BUCKETS).fill(0);
        citySchools.forEach((school) => {
          const min = parseFloat(school.min_tuition?.replace(/[^\d.]/g, "") || "0");
          const max = parseFloat(school.max_tuition?.replace(/[^\d.]/g, "") || "0") || min;
          // Mark every bucket the school's price range touches
          const startBucket = Math.floor(min / bucketSize);
          const endBucket = Math.min(Math.floor(max / bucketSize), NUM_BUCKETS - 1);
          for (let i = startBucket; i <= endBucket; i++) {
            buckets[i]++;
          }
        });
        setPriceBuckets(buckets);

        // Extract curriculums from schools
        const curriculumCounts: Record<string, number> = {};
        citySchools.forEach((school) => {
          if (school.curriculum_tags) {
            const tags = school.curriculum_tags.split(",").map((t) => t.trim());
            tags.forEach((tag) => {
              if (tag) {
                curriculumCounts[tag] = (curriculumCounts[tag] || 0) + 1;
              }
            });
          }
        });
        setAvailableCurriculums(
          Object.entries(curriculumCounts)
            .map(([label, count]) => ({ label, count }))
            .sort((a, b) => b.count - a.count),
        );

        // Load other cities for internal linking
        const allCities = await SchoolService.searchCities("");
        const otherCityData = allCities
          .filter(
            (c) =>
              c.city.toLowerCase() !== cityName.toLowerCase() &&
              c.schoolCount > 0,
          )
          .slice(0, 12)
          .map((c) => ({
            city: c.city,
            slug: cityToSlug(c.city),
            count: c.schoolCount,
          }));
        setOtherCities(otherCityData);
      } catch (error) {
        console.error("Error loading schools:", error);
      } finally {
        setLoading(false);
      }
    };

    loadSchools();
  }, [cityName]);

  // Apply filters when they change
  useEffect(() => {
    if (!loading) {
      setIsFiltering(true);
      applyFilters();
      setIsFiltering(false);
    }
  }, [priceRange, curriculumFilter, applyFilters, loading]);

  // Load more schools
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    const currentLength = displayedSchools.length;
    const nextSchools = filteredSchools.slice(
      currentLength,
      currentLength + schoolsPerPage,
    );

    setTimeout(() => {
      setDisplayedSchools((prev) => [...prev, ...nextSchools]);
      setHasMore(currentLength + nextSchools.length < filteredSchools.length);
      setIsLoadingMore(false);
      setCurrentPage((prev) => prev + 1);
    }, 300);
  }, [displayedSchools.length, filteredSchools, hasMore, isLoadingMore]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !isLoadingMore &&
          !loading
        ) {
          loadMore();
        }
      },
      { threshold: 0.1 },
    );

    if (observerRef.current) {
      observer.observe(observerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, isLoadingMore, loading, loadMore]);

  const isPriceFiltered =
    priceRange.min > 0 || priceRange.max < maxSchoolPrice;
  const hasActiveFilters = !!(curriculumFilter || isPriceFiltered);

  return (
    <>
      {/* Hero Section */}
      <section
        className="w-full h-fit bg-cover bg-center flex flex-col items-center pb-40 px-5 relative"
        style={{ backgroundImage: "url('/images/Hero.jpg')" }}
      >
        <div className="w-full h-full absolute top-0 left-0 bg-black/20 z-0"></div>
        <div className="w-full flex items-center justify-center md:px-10 pt-5 md:pt-0">
          <Navbar />
        </div>
        <div className="pt-13 flex flex-col items-center md:w-[930px] w-full px-0 md:px-0 mt-20 relative">
          <h1 className="md:text-7xl text-[32px] font-semibold text-white text-center leading-[120%]">
            Preschools in {cityName}
          </h1>
          <p className="text-white/90 text-[16px] text-center mt-4 max-w-2xl leading-relaxed">
            Discover quality preschools and early childhood education centers in{" "}
            {cityName}. Compare tuition fees, curriculum options, class sizes,
            and facilities to find the perfect fit for your child.
          </p>
        </div>
      </section>

      {/* Schools Section */}
      <section className="w-full md:px-10 px-5 pb-25 pt-10 bg-white">
        <div className="mb-6">
          <Breadcrumbs />
        </div>

        {/* Filter Bar */}
        <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <span className="text-[12px] font-semibold text-gray-400 uppercase tracking-widest">
              Filters
            </span>

            {/* Curriculum Filter */}
            <div className="relative" ref={curriculumDropdownRef}>
              <button
                onClick={() =>
                  setShowCurriculumDropdown(!showCurriculumDropdown)
                }
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-[14px] font-medium transition-all ${
                  curriculumFilter
                    ? "bg-[#774BE5] text-white border-[#774BE5]"
                    : "bg-white text-[#0E1C29] border-gray-200 hover:border-[#774BE5] hover:text-[#774BE5]"
                }`}
              >
                <i className="ri-book-open-line text-[15px]"></i>
                <span>{curriculumFilter || "Curriculum"}</span>
                {curriculumFilter ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurriculumFilter("");
                    }}
                    className="ml-1 hover:opacity-70 transition-opacity"
                  >
                    <i className="ri-close-line text-[13px]"></i>
                  </button>
                ) : (
                  <i
                    className={`ri-arrow-down-s-line text-[15px] transition-transform duration-200 ${
                      showCurriculumDropdown ? "rotate-180" : ""
                    }`}
                  ></i>
                )}
              </button>

              {showCurriculumDropdown && (
                <div className="absolute top-full left-0 mt-2 w-60 bg-white rounded-xl shadow-lg border border-gray-200 z-50 overflow-hidden">
                  <div className="p-2 border-b border-gray-100">
                    <input
                      type="text"
                      value={curriculumSearch}
                      onChange={(e) => setCurriculumSearch(e.target.value)}
                      placeholder="Search curriculum..."
                      className="w-full px-3 py-1.5 text-[13px] bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-[#774BE5] placeholder-gray-400"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto py-1">
                    {filteredCurriculums.length > 0 ? (
                      filteredCurriculums.map((curr) => (
                        <button
                          key={curr.label}
                          onClick={() => {
                            setCurriculumFilter(curr.label);
                            setShowCurriculumDropdown(false);
                            setCurriculumSearch("");
                          }}
                          className={`w-full px-4 py-2.5 text-left text-[13px] flex items-center justify-between hover:bg-[#774BE5]/5 transition-colors ${
                            curriculumFilter === curr.label
                              ? "text-[#774BE5] font-semibold bg-[#774BE5]/5"
                              : "text-[#0E1C29]"
                          }`}
                        >
                          <span>{curr.label}</span>
                          <span className="text-gray-400 text-xs bg-gray-100 px-1.5 py-0.5 rounded-full">
                            {curr.count}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-[13px] text-gray-400 text-center">
                        No results found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="hidden md:block w-px h-8 bg-gray-200" />

            {/* Price Range Slider */}
            <div className="flex flex-col gap-2 min-w-60 flex-1 max-w-[340px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <i className="ri-money-dollar-circle-line text-[15px] text-gray-400"></i>
                  <span className="text-[14px] font-medium text-[#0E1C29]">
                    Price
                  </span>
                </div>
                <span className="text-[13px] font-semibold text-[#774BE5]">
                  ₱{priceRange.min.toLocaleString()} –{" "}
                  ₱{priceRange.max.toLocaleString()}
                </span>
              </div>

              {/* Histogram bars */}
              {priceBuckets.length > 0 && (
                <div className="flex items-end gap-px h-10 w-full mb-1">
                  {priceBuckets.map((count, i) => {
                    const bucketStart = (i / priceBuckets.length) * maxSchoolPrice;
                    const bucketEnd = ((i + 1) / priceBuckets.length) * maxSchoolPrice;
                    const isInRange =
                      bucketEnd >= priceRange.min && bucketStart <= priceRange.max;
                    const maxCount = Math.max(...priceBuckets, 1);
                    const heightPct = count === 0 ? 8 : Math.max(12, (count / maxCount) * 100);
                    return (
                      <div
                        key={i}
                        className="flex-1 rounded-sm transition-colors duration-150"
                        style={{
                          height: `${heightPct}%`,
                          backgroundColor: isInRange
                            ? "#774BE5"
                            : "#D1D5DB",
                          opacity: count === 0 ? 0.3 : 1,
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {/* Dual range slider — fully custom drag, no overlapping inputs */}
              <div
                ref={sliderRef}
                className="relative flex items-center h-5 cursor-pointer select-none"
                onMouseDown={handleSliderMouseDown}
                onTouchStart={handleSliderMouseDown}
              >
                {/* Track background */}
                <div className="absolute w-full h-1.5 bg-gray-200 rounded-full" />
                {/* Track fill */}
                <div
                  className="absolute h-1.5 bg-[#774BE5] rounded-full pointer-events-none"
                  style={{
                    left: `${(priceRange.min / maxSchoolPrice) * 100}%`,
                    right: `${100 - (priceRange.max / maxSchoolPrice) * 100}%`,
                  }}
                />
                {/* Min thumb */}
                <div
                  className="absolute w-4 h-4 bg-white border-2 border-[#774BE5] rounded-full shadow-sm pointer-events-none"
                  style={{ left: `calc(${(priceRange.min / maxSchoolPrice) * 100}% - 8px)`, zIndex: 10 }}
                />
                {/* Max thumb */}
                <div
                  className="absolute w-4 h-4 bg-white border-2 border-[#774BE5] rounded-full shadow-sm pointer-events-none"
                  style={{ left: `calc(${(priceRange.max / maxSchoolPrice) * 100}% - 8px)`, zIndex: 10 }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-gray-400">
                <span>₱0</span>
                <span>₱{(maxSchoolPrice / 1000).toFixed(0)}k+</span>
              </div>
            </div>

            {/* Clear all */}
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setCurriculumFilter("");
                  setPriceRange({ min: 0, max: maxSchoolPrice });
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors ml-auto"
              >
                <i className="ri-close-line"></i>
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Results Summary */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {loading || isFiltering ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <h3 className="text-[18px] font-semibold text-[#0E1C29]">
                    {loading ? "Loading schools..." : "Filtering schools..."}
                  </h3>
                </div>
              ) : (
                <>
                  <h3 className="text-[18px] font-semibold text-[#0E1C29]">
                    {filteredSchools.length > 0
                      ? `${filteredSchools.length} School${filteredSchools.length !== 1 ? "s" : ""} Found`
                      : "No schools found yet. We are adding more schools weekly."}
                  </h3>
                  {filteredSchools.length > 0 && (
                    <div className="w-2 h-2 bg-[#774BE5] rounded-full animate-pulse"></div>
                  )}
                </>
              )}
            </div>
            {!loading && !isFiltering && (
              <div className="text-[14px] text-gray-500">
                Showing {displayedSchools.length} of {filteredSchools.length}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-[#774BE5]/20 border-t-[#774BE5] animate-spin" />
              <div
                className="absolute inset-0 w-16 h-16 rounded-full border-4 border-transparent border-b-[#9B6EF3]/50 animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "0.8s",
                }}
              />
            </div>
            <p className="text-[#774BE5] font-medium text-[18px] mt-4 animate-pulse">
              Loading schools...
            </p>
          </div>
        ) : isFiltering ? (
          <div className="w-full grid md:grid-cols-3 grid-cols-1 gap-5 z-0">
            {Array.from({ length: 6 }).map((_, index) => (
              <SchoolCardSkeleton key={index} />
            ))}
          </div>
        ) : filteredSchools.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-[#774BE5]/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <i className="ri-search-line text-[#774BE5] text-3xl"></i>
            </div>
            <h3 className="text-[18px] font-semibold text-[#0E1C29] mb-2">
              No schools found
            </h3>
            <p className="text-[15px] text-gray-600 mb-6 max-w-md mx-auto">
              {hasActiveFilters
                ? "Try adjusting your filters to see more results."
                : `We're still adding preschools in ${cityName}. Check back soon!`}
            </p>
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setCurriculumFilter("");
                  setPriceRange({ min: 0, max: maxSchoolPrice });
                }}
                className="bg-[#774BE5] text-white px-6 py-3 rounded-lg text-[15px] font-medium hover:bg-[#774BE5]/90 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="w-full grid md:grid-cols-3 grid-cols-1 gap-5 z-0">
            {displayedSchools.map((school, index) => (
              <div key={`${school.school}-${index}`}>
                <SchoolCard
                  imageSrc={optimizeImageUrl(school.logo_banner)}
                  imageAlt={school.school}
                  schoolName={school.school}
                  location={school.city}
                  tags={
                    school.curriculum_tags?.split(", ").map((t) => t.trim()) ||
                    []
                  }
                  priceRange={`${school.min_tuition} - ${school.max_tuition}${
                    school.min_tuition?.toLowerCase().includes("/month") ||
                    school.max_tuition?.toLowerCase().includes("/month")
                      ? ""
                      : " / year"
                  }`}
                  schoolSlug={createSlug(school.school)}
                  priority={index < 6}
                />
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator and intersection observer */}
        <div ref={observerRef}>
          {isLoadingMore && (
            <div className="w-full grid md:grid-cols-3 grid-cols-1 gap-5 mt-5">
              {Array.from({ length: 3 }).map((_, index) => (
                <SchoolCardSkeleton key={index} />
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </>
  );
}
