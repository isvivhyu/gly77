"use client";

import Navbar from "@/components/Navbar";
import HowItWorksSection from "@/components/HowItWorksSection";
import Link from "next/link";
import Footer from "@/components/Footer";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import AOS from "aos";
import "aos/dist/aos.css";
import { ButtonWithLoading } from "@/components/LoadingSpinner";
import { SchoolService } from "@/lib/schoolService";
import { cityToSlug } from "@/lib/cityUtils";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<
    "all" | "city" | "budget" | "curriculum"
  >("city");
  const [cityFilter, setCityFilter] = useState("");
  const [budgetFilter, setBudgetFilter] = useState("");
  const [curriculumFilter, setCurriculumFilter] = useState("");
  const [availableCities, setAvailableCities] = useState<
    { city: string; schoolCount: number }[]
  >([]);
  const [availableCurriculums, setAvailableCurriculums] = useState<
    { label: string; count: number }[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Budget range options
  const [budgetOptions, setBudgetOptions] = useState([
    { key: "under-100k", label: "Under ₱100k", value: "under-100k", count: 0 },
    { key: "100k-200k", label: "₱100k - ₱200k", value: "100k-200k", count: 0 },
    { key: "200k-300k", label: "₱200k - ₱300k", value: "200k-300k", count: 0 },
    { key: "300k-500k", label: "₱300k - ₱500k", value: "300k-500k", count: 0 },
    { key: "over-500k", label: "Over ₱500k", value: "over-500k", count: 0 },
  ]);

  // Load available cities and curriculums
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch all schools to calculate counts
        const schools = await SchoolService.getAllSchools();

        // 1. Process Cities
        const cities = await SchoolService.searchCities("");
        setAvailableCities(cities);

        // 2. Process Curriculums
        const curriculumCounts: Record<string, number> = {};
        schools.forEach((school) => {
          if (school.curriculum_tags) {
            const tags = school.curriculum_tags.split(",").map((t) => t.trim());
            tags.forEach((tag) => {
              if (tag) {
                curriculumCounts[tag] = (curriculumCounts[tag] || 0) + 1;
              }
            });
          }
        });

        const curriculumsWithCounts = Object.entries(curriculumCounts)
          .map(([label, count]) => ({ label, count }))
          .sort((a, b) => a.label.localeCompare(b.label));

        setAvailableCurriculums(curriculumsWithCounts);

        // 3. Process Budgets
        const budgetCounts = {
          "under-100k": 0,
          "100k-200k": 0,
          "200k-300k": 0,
          "300k-500k": 0,
          "over-500k": 0,
        };

        const budgetRanges = {
          "under-100k": { min: 0, max: 100000 },
          "100k-200k": { min: 100000, max: 200000 },
          "200k-300k": { min: 200000, max: 300000 },
          "300k-500k": { min: 300000, max: 500000 },
          "over-500k": { min: 500000, max: Infinity },
        };

        schools.forEach((school) => {
          try {
            // Skip schools with non-numeric tuition values
            if (
              !school.min_tuition ||
              !school.max_tuition ||
              isNaN(parseFloat(school.min_tuition.replace(/[^\d.]/g, ""))) ||
              isNaN(parseFloat(school.max_tuition.replace(/[^\d.]/g, "")))
            ) {
              return;
            }

            const minPrice = parseFloat(
              school.min_tuition.replace(/[^\d.]/g, ""),
            );
            const maxPrice = parseFloat(
              school.max_tuition.replace(/[^\d.]/g, ""),
            );

            // Check which ranges this school falls into
            Object.entries(budgetRanges).forEach(([key, range]) => {
              if (
                (minPrice >= range.min && minPrice <= range.max) ||
                (maxPrice >= range.min && maxPrice <= range.max)
              ) {
                if (key in budgetCounts) {
                  budgetCounts[key as keyof typeof budgetCounts]++;
                }
              }
            });
          } catch (e) {
            // ignore parsing errors
          }
        });

        // Update budget options with counts
        setBudgetOptions((prev) =>
          prev.map((opt) => ({
            ...opt,
            count: budgetCounts[opt.value as keyof typeof budgetCounts] || 0,
          })),
        );
      } catch (error) {
        console.error("Error loading data:", error);
        setAvailableCities([]);
        setAvailableCurriculums([]);
      }
    };

    loadData();
  }, []);

  // Show dropdown when input is focused and a category is selected
  useEffect(() => {
    if (inputFocused && activeCategory !== "all") {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [inputFocused, activeCategory]);

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
        setInputFocused(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Show dropdown when typing in category-specific mode
    if (activeCategory === "city" || activeCategory === "curriculum") {
      setShowDropdown(true);
      // Clear the filter when user clears the input or types something different
      if (activeCategory === "city") {
        if (!value || value !== cityFilter) {
          // Only clear if the value doesn't match the current filter
          if (value !== cityFilter) setCityFilter("");
        }
      } else if (activeCategory === "curriculum") {
        if (!value || value !== curriculumFilter) {
          // Only clear if the value doesn't match the current filter
          if (value !== curriculumFilter) setCurriculumFilter("");
        }
      }
    }
  };

  // Filter options based on search query and selected filter
  const filteredCities = availableCities.filter((city) => {
    // If a city filter is already selected, only show that city
    if (cityFilter) {
      return city.city === cityFilter;
    }
    // Otherwise, filter by search query
    return city.city.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredCurriculums = availableCurriculums.filter((item) => {
    // If a curriculum filter is already selected, only show that curriculum
    if (curriculumFilter) {
      return item.label === curriculumFilter;
    }
    // Otherwise, filter by search query
    return item.label.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Filter budget options based on selected filter
  const filteredBudgetOptions = budgetFilter
    ? budgetOptions.filter((option) => option.value === budgetFilter)
    : budgetOptions;

  // Handle option selection from dropdown
  const handleOptionSelect = (value: string) => {
    if (activeCategory === "city") {
      // Navigate to city page
      window.location.href = `/preschools-in-${cityToSlug(value)}/`;
      return;
    } else if (activeCategory === "budget") {
      setBudgetFilter(value);
      const selectedBudget = budgetOptions.find((b) => b.value === value);
      setSearchQuery(selectedBudget?.label || "");
    } else if (activeCategory === "curriculum") {
      setCurriculumFilter(value);
      setSearchQuery(value);
    }
    setShowDropdown(false);
    setInputFocused(false);
  };

  // Handle search functionality
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    try {
      const params = new URLSearchParams();

      // Add search query if not empty
      if (searchQuery.trim() && activeCategory === "all") {
        params.set("search", searchQuery.trim());
      }

      // Add filters if they exist
      if (cityFilter) {
        params.set("city", cityFilter);
      }
      if (budgetFilter) {
        params.set("budget", budgetFilter);
      }
      if (curriculumFilter) {
        params.set("curriculum", curriculumFilter);
      }

      const queryString = params.toString();
      const url = `/directory${queryString ? `?${queryString}` : ""}`;
      router.push(url);
    } catch (error) {
      console.error("Error during search:", error);
    } finally {
      // Reset loading state after a short delay to allow navigation
      setTimeout(() => setIsSearching(false), 500);
    }
  };

  // Get placeholder text based on active category
  const getPlaceholder = () => {
    return "Select a city";
  };

  // Initialize AOS
  useEffect(() => {
    AOS.init({
      duration: 500,
      easing: "ease-in-out",
      once: true,
      offset: 100,
    });
  }, []);

  return (
    <>
      <section
        className="w-full min-h-screen bg-cover bg-center flex flex-col items-center pb-40 px-5"
        style={{ backgroundImage: "url('/images/Hero.jpg')" }}
      >
        <div className="w-full flex items-center justify-center md:px-10 pt-5 md:pt-0 z-[1000]">
          <Navbar />
        </div>
        <div className="pt-13 flex flex-col items-center md:w-[930px] w-full px-0 md:px-0 mt-40 z-1">
          <h1 className="md:text-7xl text-[32px] font-semibold text-white text-center leading-[120%]">
            Find the Right Preschool
          </h1>

          <form
            id="search-form-mobile"
            onSubmit={handleSearch}
            className="w-full mt-6 relative z-1001"
          >
            <div className="bg-white rounded-2xl p-2 flex items-center gap-2 shadow-xl relative">
              {/* Map pin icon */}
              <div className="pl-3 text-[#774BE5] shrink-0">
                <i className="ri-map-pin-2-fill text-xl"></i>
              </div>

              {/* Input */}
              <input
                ref={searchInputRef}
                type="text"
                value={cityFilter || searchQuery}
                onChange={handleSearchChange}
                onFocus={() => {
                  setInputFocused(true);
                  setShowDropdown(true);
                }}
                onBlur={() => {
                  setTimeout(() => setInputFocused(false), 200);
                }}
                placeholder="Select a city"
                className="bg-transparent flex-1 text-base text-[#0E1C29] placeholder-[#999999] focus:outline-none py-3"
                style={{ fontSize: "16px" }}
              />

              {/* Clear button */}
              {(searchQuery || cityFilter) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearchQuery("");
                    setCityFilter("");
                  }}
                  className="text-[#0E1C29]/40 hover:text-[#0E1C29]/60 transition-colors shrink-0"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              )}

              {/* Search button */}
              <ButtonWithLoading
                type="submit"
                isLoading={isSearching}
                className="bg-[#774BE5] text-white px-7 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 hover:bg-[#6B3FD6] transition-colors disabled:hover:bg-[#774BE5] shrink-0"
              >
                <i className="ri-search-line text-base"></i>
                Search
              </ButtonWithLoading>

              {/* Dropdown */}
              {showDropdown && (
                <div
                  ref={dropdownRef}
                  className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-80 overflow-y-auto z-50"
                >
                  <div className="py-2">
                    {filteredCities.length > 0 ? (
                      filteredCities.map((cityOption) => (
                        <button
                          key={cityOption.city}
                          type="button"
                          onClick={() => handleOptionSelect(cityOption.city)}
                          className="w-full px-4 py-3 text-left hover:bg-[#f5f5f5] transition-colors flex items-center justify-between"
                        >
                          <div className="flex items-center gap-3">
                            <i className="ri-map-pin-line text-[#774BE5] text-base"></i>
                            <span className="text-[#0E1C29] font-medium">
                              {cityOption.city}
                            </span>
                          </div>
                          <span className="text-sm text-gray-400">
                            {cityOption.schoolCount} school
                            {cityOption.schoolCount !== 1 ? "s" : ""}
                          </span>
                        </button>
                      ))
                    ) : filteredCities.length === 0 &&
                      availableCities.length > 0 ? (
                      <div className="px-4 py-3 text-gray-500 text-center text-sm">
                        No cities found matching &quot;{searchQuery}&quot;
                      </div>
                    ) : (
                      <div className="px-4 py-3 text-gray-500 text-center text-sm">
                        Loading cities...
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
        <div className="w-full h-full absolute bg-black/20 z-0"></div>
      </section>

      <section className="w-full md:px-10 px-5 pt-25 bg-white">
        <h2 className="text-[#0E1C29] md:text-[56px] text-4xl font-normal text-center">
          Why parents use Aralya
        </h2>
        <div className="w-full md:w-[800px] mx-auto">
          <p className="mt-4 text-[#0E1C29] text-sm text-center font-normal">
            Carefully curated preschool information to help parents choose with
            confidence.
          </p>
        </div>
        <div className="mt-11 mb-25 flex items-center justify-center w-full">
          <div className="w-fit">
            <Link
              href="/directory"
              className="bg-[#774BE5] hover:bg-[#6B3FD6] transition-all duration-500 ease-in-out rounded-full text-white flex items-center gap-2 px-6 py-3"
            >
              <p className="text-base font-medium">Browse preschools</p>
              <i className="ri-arrow-right-fill text-lg"></i>
            </Link>
          </div>
        </div>
      </section>

      <div>
        <HowItWorksSection
          title="Getting started with Aralya"
          steps={[
            {
              iconClass: "ri-school-line",
              text: (
                <>
                  <strong>Start</strong> with available preschools
                </>
              ),
            },
            {
              iconClass: "ri-filter-line",
              text: (
                <>
                  <strong>Narrow</strong> down what matters to you
                </>
              ),
            },
            {
              iconClass: "ri-file-text-line",
              text: (
                <>
                  <strong>Review</strong> details and reach out when ready
                </>
              ),
            },
          ]}
        />
      </div>

      <Footer />
    </>
  );
}
