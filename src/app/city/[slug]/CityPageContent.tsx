"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SchoolCard from "@/components/SchoolCard";
import { SchoolCardSkeleton } from "@/components/SchoolCardSkeleton";
import { SchoolService } from "@/lib/schoolService";
import { School } from "@/lib/supabase";
import { LoadingSpinner, ButtonWithLoading } from "@/components/LoadingSpinner";
import { optimizeImageUrl } from "@/lib/cloudinary";
import { cityToSlug } from "@/lib/cityUtils";

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
  const [isSearching, setIsSearching] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Search and filter state
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "all" | "budget" | "curriculum"
  >("all");
  const [budgetFilter, setBudgetFilter] = useState("");
  const [curriculumFilter, setCurriculumFilter] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);

  const [availableCurriculums, setAvailableCurriculums] = useState<
    { label: string; count: number }[]
  >([]);
  const [otherCities, setOtherCities] = useState<
    { city: string; slug: string; count: number }[]
  >([]);

  const observerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const schoolsPerPage = 12;

  // Categories (without city since we're already on a city page)
  const categories = [
    { id: "all" as const, label: "All Schools", icon: "ri-apps-line" },
    {
      id: "budget" as const,
      label: "Budget",
      icon: "ri-money-dollar-circle-line",
    },
    {
      id: "curriculum" as const,
      label: "Curriculum",
      icon: "ri-book-open-line",
    },
  ];

  const [budgetOptions, setBudgetOptions] = useState([
    { key: "under-100k", label: "Under ₱100k", value: "under-100k", count: 0 },
    { key: "100k-200k", label: "₱100k - ₱200k", value: "100k-200k", count: 0 },
    { key: "200k-300k", label: "₱200k - ₱300k", value: "200k-300k", count: 0 },
    { key: "300k-500k", label: "₱300k - ₱500k", value: "300k-500k", count: 0 },
    { key: "over-500k", label: "Over ₱500k", value: "over-500k", count: 0 },
  ]);

  // Get placeholder text based on active category
  const getPlaceholder = () => {
    switch (activeCategory) {
      case "budget":
        return "Select your budget range";
      case "curriculum":
        return "Select or search for a curriculum";
      default:
        return `Search schools in ${cityName}...`;
    }
  };

  // Handle option selection from dropdown
  const handleOptionSelect = (value: string) => {
    if (activeCategory === "budget") {
      setBudgetFilter(value);
    } else if (activeCategory === "curriculum") {
      setCurriculumFilter(value);
      setLocalSearchQuery(value);
    }
    setShowDropdown(false);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);

    if (activeCategory === "curriculum") {
      setCurriculumFilter("");
      if (value.trim()) {
        setShowDropdown(true);
      }
    }
  };

  // Handle search submit
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setShowDropdown(false);

    // Apply filters
    applyFilters();

    setIsSearching(false);
  };

  // Apply filters to schools
  const applyFilters = useCallback(() => {
    let filtered = [...schools];

    // Search filter
    if (localSearchQuery.trim() && activeCategory === "all") {
      const query = localSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (school) =>
          school.school.toLowerCase().includes(query) ||
          school.curriculum_tags?.toLowerCase().includes(query),
      );
    }

    // Budget filter
    if (budgetFilter) {
      const budgetRanges: Record<string, { min: number; max: number }> = {
        "under-100k": { min: 0, max: 100000 },
        "100k-200k": { min: 100000, max: 200000 },
        "200k-300k": { min: 200000, max: 300000 },
        "300k-500k": { min: 300000, max: 500000 },
        "over-500k": { min: 500000, max: Infinity },
      };

      const range = budgetRanges[budgetFilter];
      if (range) {
        filtered = filtered.filter((school) => {
          const minPrice = parseFloat(
            school.min_tuition?.replace(/[^\d.]/g, "") || "0",
          );
          const maxPrice = parseFloat(
            school.max_tuition?.replace(/[^\d.]/g, "") || "0",
          );
          return (
            (minPrice >= range.min && minPrice <= range.max) ||
            (maxPrice >= range.min && maxPrice <= range.max)
          );
        });
      }
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
  }, [
    schools,
    localSearchQuery,
    activeCategory,
    budgetFilter,
    curriculumFilter,
  ]);

  // Filter curriculums based on search
  const filteredCurriculums = availableCurriculums.filter((curr) =>
    curr.label.toLowerCase().includes(localSearchQuery.toLowerCase()),
  );

  // Filter budget options (show all)
  const filteredBudgetOptions = budgetOptions;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

        // Calculate budget counts
        const budgetRanges: Record<string, { min: number; max: number }> = {
          "under-100k": { min: 0, max: 100000 },
          "100k-200k": { min: 100000, max: 200000 },
          "200k-300k": { min: 200000, max: 300000 },
          "300k-500k": { min: 300000, max: 500000 },
          "over-500k": { min: 500000, max: Infinity },
        };

        const updatedBudgetOptions = budgetOptions.map((opt) => {
          const range = budgetRanges[opt.value];
          const count = citySchools.filter((school) => {
            const minPrice = parseFloat(
              school.min_tuition?.replace(/[^\d.]/g, "") || "0",
            );
            const maxPrice = parseFloat(
              school.max_tuition?.replace(/[^\d.]/g, "") || "0",
            );
            return (
              (minPrice >= range.min && minPrice <= range.max) ||
              (maxPrice >= range.min && maxPrice <= range.max)
            );
          }).length;
          return { ...opt, count };
        });
        setBudgetOptions(updatedBudgetOptions);

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
  }, [budgetFilter, curriculumFilter, applyFilters, loading]);

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

  return (
    <>
      {/* Hero Section - Same as Browse Page */}
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

          {/* Intro paragraph */}
          <p className="text-white/90 text-[16px] text-center mt-4 max-w-2xl leading-relaxed">
            Discover quality preschools and early childhood education centers in{" "}
            {cityName}. Compare tuition fees, curriculum options, class sizes,
            and facilities to find the perfect fit for your child.
          </p>

          <form
            className="bg-white w-full p-5 rounded-3xl mt-6 relative"
            onSubmit={handleSearchSubmit}
          >
            {/* Category Tabs Section */}
            <div className="w-full relative z-[999]">
              <div className="grid grid-cols-3 md:flex md:items-center md:justify-center gap-2 md:gap-3 md:flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category.id);
                      setLocalSearchQuery("");
                      if (category.id === "budget") {
                        setBudgetFilter("");
                        setShowDropdown(true);
                      } else if (category.id === "curriculum") {
                        setCurriculumFilter("");
                        setShowDropdown(false);
                      } else if (category.id === "all") {
                        setBudgetFilter("");
                        setCurriculumFilter("");
                        setShowDropdown(false);
                      }
                      setInputFocused(false);
                    }}
                    className={`px-4 md:px-6 py-2.5 md:py-3 text-[14px] font-semibold flex items-center justify-center gap-2 text-black relative ${
                      activeCategory === category.id
                        ? "border-b-2 border-black"
                        : "border-b-2 border-transparent"
                    } transition-all duration-300 ease-in-out`}
                  >
                    <i className={`${category.icon} text-[16px]`}></i>
                    <span>{category.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-col md:flex-row md:mt-6 mt-3 gap-2.5 rounded-2xl relative z-[1001]">
              <div
                className="bg-[#f5f5f5] w-full p-2 rounded-full overflow-visible flex items-center justify-between gap-3 relative shadow-sm"
                onClick={() => {
                  if (activeCategory === "budget") {
                    setShowDropdown(true);
                  }
                }}
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  value={
                    activeCategory === "budget"
                      ? budgetOptions.find((b) => b.value === budgetFilter)
                          ?.label || ""
                      : activeCategory === "curriculum"
                        ? curriculumFilter || localSearchQuery
                        : localSearchQuery
                  }
                  readOnly={activeCategory === "budget"}
                  onChange={handleSearchChange}
                  onFocus={() => {
                    if (activeCategory === "budget") {
                      setShowDropdown(true);
                    } else {
                      setInputFocused(true);
                      if (activeCategory === "curriculum") {
                        setShowDropdown(true);
                      }
                    }
                  }}
                  onBlur={() => {
                    setTimeout(() => setInputFocused(false), 200);
                  }}
                  placeholder={getPlaceholder()}
                  className="bg-transparent w-full text-base text-[#0E1C29] placeholder-[#999999] focus:outline-none cursor-pointer pl-6"
                  style={{ fontSize: "16px" }}
                  onClick={() => {
                    if (activeCategory === "budget") {
                      setShowDropdown(true);
                    }
                  }}
                />

                <div className="flex items-center gap-2">
                  {(localSearchQuery ||
                    (activeCategory === "budget" && budgetFilter) ||
                    (activeCategory === "curriculum" && curriculumFilter)) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocalSearchQuery("");
                        if (activeCategory === "budget") setBudgetFilter("");
                        if (activeCategory === "curriculum")
                          setCurriculumFilter("");
                      }}
                      className="text-[#0E1C29]/40 hover:text-[#0E1C29]/60 transition-colors mr-2"
                    >
                      <i className="ri-close-line text-xl"></i>
                    </button>
                  )}

                  <ButtonWithLoading
                    type="submit"
                    isLoading={isSearching}
                    className="bg-[#774BE5] text-white px-8 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-1 hover:bg-[#6B3FD6] transition-colors disabled:hover:bg-[#774BE5]"
                  >
                    Search
                  </ButtonWithLoading>
                </div>

                {/* Dropdown Menu */}
                {showDropdown && activeCategory !== "all" && (
                  <div
                    ref={dropdownRef}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50"
                  >
                    {activeCategory === "budget" && (
                      <div className="py-2">
                        {filteredBudgetOptions.map((budgetOption) => (
                          <button
                            key={budgetOption.key}
                            type="button"
                            onClick={() =>
                              handleOptionSelect(budgetOption.value)
                            }
                            className={`w-full px-4 py-3 text-left hover:bg-[#f5f5f5] transition-colors flex items-center justify-between ${
                              budgetFilter === budgetOption.value
                                ? "bg-[#774BE5]/10 text-[#774BE5]"
                                : "text-[#0E1C29]"
                            }`}
                          >
                            <span className="font-medium">
                              {budgetOption.label}
                            </span>
                            <span className="text-sm text-gray-500">
                              {budgetOption.count} school
                              {budgetOption.count !== 1 ? "s" : ""}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {activeCategory === "curriculum" && (
                      <div className="py-2">
                        {filteredCurriculums.length > 0 ? (
                          filteredCurriculums.map((curriculum) => (
                            <button
                              key={curriculum.label}
                              type="button"
                              onClick={() =>
                                handleOptionSelect(curriculum.label)
                              }
                              className={`w-full px-4 py-3 text-left hover:bg-[#f5f5f5] transition-colors flex items-center justify-between ${
                                curriculumFilter === curriculum.label
                                  ? "bg-[#774BE5]/10 text-[#774BE5]"
                                  : "text-[#0E1C29]"
                              }`}
                            >
                              <span className="font-medium">
                                {curriculum.label}
                              </span>
                              <span className="text-sm text-gray-500">
                                {curriculum.count} school
                                {curriculum.count !== 1 ? "s" : ""}
                              </span>
                            </button>
                          ))
                        ) : filteredCurriculums.length === 0 &&
                          availableCurriculums.length > 0 ? (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No curriculum options found matching &quot;
                            {localSearchQuery}&quot;
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            Loading curriculum options...
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Schools Section - Same as Browse Page */}
      <section className="w-full md:px-10 px-5 pb-25 pt-10 bg-white">
        {/* Active Filter Chips */}
        {(budgetFilter || curriculumFilter) && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {budgetFilter && (
                <div className="flex items-center gap-2 bg-[#774BE5]/10 text-[#774BE5] px-3 py-2 rounded-full text-[14px] font-medium">
                  <i className="ri-money-dollar-circle-line"></i>
                  <span>
                    {
                      budgetOptions.find((opt) => opt.value === budgetFilter)
                        ?.label
                    }
                  </span>
                  <button
                    onClick={() => setBudgetFilter("")}
                    className="hover:bg-[#774BE5]/20 rounded-full p-1 transition-colors"
                  >
                    <i className="ri-close-line text-xs"></i>
                  </button>
                </div>
              )}
              {curriculumFilter && (
                <div className="flex items-center gap-2 bg-[#774BE5]/10 text-[#774BE5] px-3 py-2 rounded-full text-[14px] font-medium">
                  <i className="ri-book-open-line"></i>
                  <span>{curriculumFilter}</span>
                  <button
                    onClick={() => setCurriculumFilter("")}
                    className="hover:bg-[#774BE5]/20 rounded-full p-1 transition-colors"
                  >
                    <i className="ri-close-line text-xs"></i>
                  </button>
                </div>
              )}
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setBudgetFilter("");
                  setCurriculumFilter("");
                  setLocalSearchQuery("");
                }}
                className="text-gray-500 hover:text-gray-700 text-[14px] font-medium px-3 py-2 rounded-full hover:bg-gray-100 transition-colors"
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Info Text */}
        <div className="mb-6">
          <h6 className="font-medium text-black text-[15px]">
            We&apos;re still adding more preschools in {cityName}.
          </h6>
        </div>

        {/* Results Summary */}
        <div className="mt-8 mb-4">
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
              {budgetFilter || curriculumFilter
                ? "Try adjusting your filters to see more results."
                : `We're still adding preschools in ${cityName}. Check back soon!`}
            </p>
            {(budgetFilter || curriculumFilter) && (
              <button
                onClick={() => {
                  setActiveCategory("all");
                  setBudgetFilter("");
                  setCurriculumFilter("");
                  setLocalSearchQuery("");
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
