"use client";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import SchoolCard from "@/components/SchoolCard";
import { SchoolCardSkeleton } from "@/components/SchoolCardSkeleton";
import { SchoolService } from "@/lib/schoolService";
import { School } from "@/lib/supabase";
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { LoadingSpinner, ButtonWithLoading } from "@/components/LoadingSpinner";
import { optimizeImageUrl } from "@/lib/cloudinary";
import { cityToSlug } from "@/lib/cityUtils";

// Helper function to check if a school is in a specific city
// Uses the same matching logic as SchoolService for consistency
const isSchoolInCity = (school: School, targetCity: string): boolean => {
  if (!school.city || !targetCity) return false;

  const normalizedTargetCity = targetCity.trim().toLowerCase();

  // Split by comma and check each city using the same matching logic
  const cities = school.city
    .split(",")
    .map((city: string) => city.trim().toLowerCase());

  return cities.some((city: string) =>
    SchoolService.citiesMatch(normalizedTargetCity, city),
  );
};

// Component that uses useSearchParams - needs to be wrapped in Suspense
const SchoolDirectoryContent = () => {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") || "";
  const cityQuery = searchParams.get("city") || "";
  const budgetQuery = searchParams.get("budget") || "";
  const curriculumQuery = searchParams.get("curriculum") || "";

  const [displayedSchools, setDisplayedSchools] = useState<School[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);
  const [activeFilter, setActiveFilter] = useState("all");
  const [budgetFilter, setBudgetFilter] = useState(budgetQuery);
  const [cityFilter, setCityFilter] = useState(cityQuery);
  const [curriculumFilter, setCurriculumFilter] = useState(curriculumQuery);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [availableCities, setAvailableCities] = useState<
    { city: string; schoolCount: number }[]
  >([]);
  const [availableCurriculums, setAvailableCurriculums] = useState<
    { label: string; count: number }[]
  >([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);
  const [activeCategory, setActiveCategory] = useState<
    "all" | "city" | "budget" | "curriculum"
  >("all");
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<HTMLDivElement>(null);

  const schoolsPerPage = 12; // Load 12 schools at a time

  // Get placeholder text based on active category
  const getPlaceholder = () => {
    switch (activeCategory) {
      case "city":
        return "Select or search for a city";
      case "budget":
        return "Select your budget range";
      case "curriculum":
        return "Select or search for a curriculum";
      default:
        return "Search by school name, city, or curriculum…";
    }
  };

  // Budget range options
  const [budgetOptions, setBudgetOptions] = useState([
    { key: "under-100k", label: "Under ₱100k", value: "under-100k", count: 0 },
    { key: "100k-200k", label: "₱100k - ₱200k", value: "100k-200k", count: 0 },
    { key: "200k-300k", label: "₱200k - ₱300k", value: "200k-300k", count: 0 },
    { key: "300k-500k", label: "₱300k - ₱500k", value: "300k-500k", count: 0 },
    { key: "over-500k", label: "Over ₱500k", value: "over-500k", count: 0 },
  ]);

  // Handle option selection from dropdown
  const handleOptionSelect = (value: string) => {
    if (activeCategory === "city") {
      // Navigate to city page
      window.location.href = `/preschools-in-${cityToSlug(value)}/`;
      return;
    } else if (activeCategory === "budget") {
      setBudgetFilter(value);
      const selectedBudget = budgetOptions.find((b) => b.value === value);
      setLocalSearchQuery(selectedBudget?.label || "");
    } else if (activeCategory === "curriculum") {
      setCurriculumFilter(value);
      setLocalSearchQuery(value);
    }
    setShowDropdown(false);
    setInputFocused(false);
  };

  const categories = [
    { id: "all" as const, label: "All Schools", icon: "ri-grid-line" },
    { id: "city" as const, label: "By City", icon: "ri-map-pin-line" },
    {
      id: "budget" as const,
      label: "By Budget",
      icon: "ri-money-dollar-circle-line",
    },
    {
      id: "curriculum" as const,
      label: "By Curriculum",
      icon: "ri-book-open-line",
    },
  ];

  // Helper function to create URL-friendly slugs
  const createSlug = (schoolName: string) => {
    return schoolName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
      .replace(/\s+/g, "-") // Replace spaces with hyphens
      .replace(/-+/g, "-") // Replace multiple hyphens with single
      .trim();
  };

  // Helper function to check if a string is a number (budget amount)
  const isNumericQuery = (query: string): boolean => {
    // Remove common currency symbols and whitespace
    const cleaned = query.trim().replace(/[₱$,]/g, "");
    // Check if it's a valid number
    return /^\d+(\.\d+)?$/.test(cleaned) && parseFloat(cleaned) > 0;
  };

  // Helper function to parse budget amount from query
  const parseBudgetAmount = (query: string): number => {
    const cleaned = query.trim().replace(/[₱$,]/g, "");
    return parseFloat(cleaned) || 0;
  };

  // Helper function to filter schools by budget amount
  const filterByBudgetAmount = (
    schools: School[],
    budgetAmount: number,
  ): School[] => {
    return schools.filter((school) => {
      try {
        // Skip schools with non-numeric tuition values (e.g., "Fees Disclosed upon visitation")
        if (
          isNaN(parseFloat(school.min_tuition.replace(/[^\d.]/g, ""))) ||
          isNaN(parseFloat(school.max_tuition.replace(/[^\d.]/g, "")))
        ) {
          return false;
        }

        // Parse min and max tuition, removing currency symbols and commas
        const minPrice = parseFloat(school.min_tuition.replace(/[^\d.]/g, ""));
        const maxPrice = parseFloat(school.max_tuition.replace(/[^\d.]/g, ""));

        // Check if the entered budget amount falls within the school's tuition range
        // This means the user's budget can afford this school
        return budgetAmount >= minPrice && budgetAmount <= maxPrice;
      } catch (error) {
        // If parsing fails, exclude the school
        return false;
      }
    });
  };

  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalSearchQuery(value);

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
    return city.city.toLowerCase().includes(localSearchQuery.toLowerCase());
  });

  const filteredCurriculums = availableCurriculums.filter((item) => {
    // If a curriculum filter is already selected, only show that curriculum
    if (curriculumFilter) {
      return item.label === curriculumFilter;
    }
    // Otherwise, filter by search query
    return item.label.toLowerCase().includes(localSearchQuery.toLowerCase());
  });

  // Filter budget options based on selected filter
  const filteredBudgetOptions = budgetFilter
    ? budgetOptions.filter((option) => option.value === budgetFilter)
    : budgetOptions;

  // Handle form submission - state only, no URL updates
  const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSearching(true);
    // Just reset the loading state after a brief delay
    setTimeout(() => setIsSearching(false), 300);
  };

  // Sync initial state from URL params on mount (for sharing/bookmarking)
  // But don't update URL after that - everything is state-controlled
  useEffect(() => {
    // Only sync on initial mount if URL params exist
    if (searchQuery) {
      setLocalSearchQuery(searchQuery);
    }
    if (budgetQuery) {
      setBudgetFilter(budgetQuery);
    }
    if (cityQuery) {
      setCityFilter(cityQuery);
    }
    if (curriculumQuery) {
      setCurriculumFilter(curriculumQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Debug activeFilter changes
  useEffect(() => {
    console.log("activeFilter changed to:", activeFilter);
    console.log(
      "Rendering mobile filters, activeFilter:",
      activeFilter,
      "isMobile:",
      isMobile,
    );
  }, [activeFilter, isMobile]);

  // Load available data (cities, curriculums, school counts)
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

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);

    return () => window.removeEventListener("resize", checkMobile);
  }, [isMobile, activeFilter]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile) {
        // On mobile, only close search results, never close filter panels
        console.log("Mobile detected - not closing filter panels");
        return;
      }

      // Desktop behavior - close filter dropdowns when clicking outside
      const target = event.target as Element;
      if (!target.closest(".filter-dropdown")) {
        console.log(
          "Desktop - closing filter, activeFilter was:",
          activeFilter,
        );
        setActiveFilter("all");
      }
    };

    // Use click instead of mousedown so filter option onClick handlers fire first
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [activeFilter, isMobile]);

  // Apply filters to schools
  const applyFilters = useCallback(
    (schools: School[]) => {
      let filtered = schools;

      // Apply budget filter
      if (budgetFilter) {
        const budgetRanges = {
          "under-100k": { min: 0, max: 100000 },
          "100k-200k": { min: 100000, max: 200000 },
          "200k-300k": { min: 200000, max: 300000 },
          "300k-500k": { min: 300000, max: 500000 },
          "over-500k": { min: 500000, max: Infinity },
        };

        const range = budgetRanges[budgetFilter as keyof typeof budgetRanges];
        if (range) {
          filtered = filtered.filter((school) => {
            const minPrice = parseFloat(
              school.min_tuition.replace(/[^\d.]/g, ""),
            );
            const maxPrice = parseFloat(
              school.max_tuition.replace(/[^\d.]/g, ""),
            );
            return (
              (minPrice >= range.min && minPrice <= range.max) ||
              (maxPrice >= range.min && maxPrice <= range.max)
            );
          });
        }
      }

      // Apply city filter
      if (cityFilter) {
        filtered = filtered.filter((school) =>
          isSchoolInCity(school, cityFilter),
        );
      }

      // Apply curriculum filter
      if (curriculumFilter) {
        filtered = filtered.filter((school) => {
          const curriculumTags = school.curriculum_tags.toLowerCase();
          return curriculumTags.includes(curriculumFilter.toLowerCase());
        });
      }

      return filtered;
    },
    [budgetFilter, cityFilter, curriculumFilter],
  );

  // Filter schools based on search query and filters
  useEffect(() => {
    const loadFilteredSchools = async () => {
      // Only show filtering spinner if not initial load
      if (!initialLoading) {
        setIsFiltering(true);
      }
      try {
        let searchFiltered: School[];

        if (searchQuery.trim().length > 0) {
          // Check if the query is a numeric budget amount
          if (isNumericQuery(searchQuery)) {
            // If it's a number, get all schools and filter by budget
            const allSchools = await SchoolService.getAllSchools();
            const budgetAmount = parseBudgetAmount(searchQuery);
            searchFiltered = filterByBudgetAmount(allSchools, budgetAmount);
          } else {
            // If it's text, search across school name, curriculum, and city
            searchFiltered = await SchoolService.searchSchools(searchQuery);
          }
        } else {
          // Otherwise, get all schools
          searchFiltered = await SchoolService.getAllSchools();
        }
        const finalFiltered = applyFilters(searchFiltered);
        setFilteredSchools(finalFiltered);
      } catch (error) {
        console.error("Error loading filtered schools:", error);
        setFilteredSchools([]);
      } finally {
        setInitialLoading(false);
        setIsFiltering(false);
      }
    };

    loadFilteredSchools();
  }, [searchQuery, budgetFilter, cityFilter, curriculumFilter, applyFilters]);

  // Load all schools at once (no pagination needed)
  useEffect(() => {
    setDisplayedSchools(filteredSchools);
    setCurrentPage(1);
    setHasMore(false);
  }, [filteredSchools]);

  // Load more schools function
  const loadMoreSchools = useCallback(() => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);

    // Simulate API delay
    setTimeout(() => {
      const startIndex = currentPage * schoolsPerPage;
      const endIndex = startIndex + schoolsPerPage;
      const newSchools = filteredSchools.slice(startIndex, endIndex);

      if (newSchools.length === 0) {
        setHasMore(false);
      } else {
        setDisplayedSchools((prev) => [...prev, ...newSchools]);
        setCurrentPage((prev) => prev + 1);
      }

      setIsLoading(false);
    }, 500);
  }, [isLoading, hasMore, currentPage, filteredSchools, schoolsPerPage]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMoreSchools();
        }
      },
      { threshold: 0.1 },
    );

    const currentObserverRef = observerRef.current;
    if (currentObserverRef) {
      observer.observe(currentObserverRef);
    }

    return () => {
      if (currentObserverRef) {
        observer.unobserve(currentObserverRef);
      }
    };
  }, [currentPage, hasMore, isLoading, loadMoreSchools]);

  return (
    <>
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
            Find the Right Preschool
          </h1>

          <form
            className="bg-white w-full p-5 rounded-3xl mt-6 relative"
            onSubmit={handleSearchSubmit}
          >
            {/* Category Tabs Section */}
            <div className="w-full relative z-[999]">
              <div className="grid grid-cols-2 md:flex md:items-center md:justify-center gap-2 md:gap-3 md:flex-wrap">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(category.id);
                      setLocalSearchQuery("");
                      // Clear the filter for the category being switched to
                      if (category.id === "city") {
                        setCityFilter("");
                      } else if (category.id === "budget") {
                        setBudgetFilter("");
                      } else if (category.id === "curriculum") {
                        setCurriculumFilter("");
                      } else if (category.id === "all") {
                        // Clear all filters when switching to "All Schools"
                        setCityFilter("");
                        setBudgetFilter("");
                        setCurriculumFilter("");
                      }
                      // Show dropdown immediately for budget, hide for others
                      if (category.id === "budget") {
                        setShowDropdown(true);
                      } else {
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
                    activeCategory === "city"
                      ? cityFilter || localSearchQuery
                      : activeCategory === "budget"
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
                      if (activeCategory !== "all") {
                        setShowDropdown(true);
                      }
                    }
                  }}
                  onBlur={() => {
                    // Delay to allow dropdown click to register
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
                    (activeCategory === "city" && cityFilter) ||
                    (activeCategory === "budget" && budgetFilter) ||
                    (activeCategory === "curriculum" && curriculumFilter)) && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocalSearchQuery("");
                        if (activeCategory === "city") setCityFilter("");
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
                    {activeCategory === "city" && (
                      <div className="py-2">
                        {filteredCities.length > 0 ? (
                          filteredCities.map((cityOption) => (
                            <button
                              key={cityOption.city}
                              type="button"
                              onClick={() =>
                                handleOptionSelect(cityOption.city)
                              }
                              className="w-full px-4 py-3 text-left hover:bg-[#f5f5f5] transition-colors flex items-center justify-between"
                            >
                              <span className="text-[#0E1C29] font-medium">
                                {cityOption.city}
                              </span>
                              <span className="text-sm text-gray-500">
                                {cityOption.schoolCount} school
                                {cityOption.schoolCount !== 1 ? "s" : ""}
                              </span>
                            </button>
                          ))
                        ) : filteredCities.length === 0 &&
                          availableCities.length > 0 ? (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            No cities found matching &quot;{localSearchQuery}
                            &quot;
                          </div>
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center">
                            Loading cities...
                          </div>
                        )}
                      </div>
                    )}
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

      <section className="w-full md:px-10 px-5 pb-25 pt-10 bg-white">
        {(searchQuery || cityQuery) && (
          <div className="mb-6">
            <h2 className="text-[18px] font-semibold text-[#0E1C29] mb-2">
              {cityQuery
                ? `Schools in ${cityQuery}`
                : `Search Results for "${searchQuery}"`}
            </h2>
            <p className="text-[15px] text-gray-600">
              Found {filteredSchools.length} school
              {filteredSchools.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}

        {/* Active Filter Chips */}
        {(budgetFilter || cityFilter || curriculumFilter) && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {budgetFilter && (
                <div className="flex items-center gap-2 bg-[#774BE5]/10 text-[#774BE5] px-3 py-2 rounded-full text-[14px] font-medium">
                  <i className="ri-money-dollar-circle-line"></i>
                  <span>
                    {
                      [
                        { key: "under-100k", label: "Under ₱100k" },
                        { key: "100k-200k", label: "₱100k - ₱200k" },
                        { key: "200k-300k", label: "₱200k - ₱300k" },
                        { key: "300k-500k", label: "₱300k - ₱500k" },
                        { key: "over-500k", label: "Over ₱500k" },
                      ].find((opt) => opt.key === budgetFilter)?.label
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
              {cityFilter && (
                <div className="flex items-center gap-2 bg-[#774BE5]/10 text-[#774BE5] px-3 py-2 rounded-full text-[14px] font-medium">
                  <i className="ri-map-pin-line"></i>
                  <span>{cityFilter}</span>
                  <button
                    onClick={() => setCityFilter("")}
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
                  setActiveFilter("all");
                  setBudgetFilter("");
                  setCityFilter("");
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

        {/* Desktop Info Text */}
        <div className="hidden md:block mb-6">
          <h6 className="font-medium text-black text-[15px]">
            We&apos;re still adding more preschools across Metro Manila.
          </h6>
        </div>

        {/* Mobile Info Text */}
        <div className="md:hidden mb-6">
          <h6 className="font-medium text-black text-[15px]">
            We&apos;re still adding more preschools across Metro Manila.
          </h6>
        </div>

        {/* Results Summary */}
        <div className="mt-8 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {initialLoading || isFiltering ? (
                <div className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <h3 className="text-[18px] font-semibold text-[#0E1C29]">
                    {initialLoading
                      ? "Loading schools..."
                      : "Filtering schools..."}
                  </h3>
                </div>
              ) : (
                <>
                  <h3 className="text-[18px] font-semibold text-[#0E1C29]">
                    {filteredSchools.length > 0
                      ? `${filteredSchools.length} School${
                          filteredSchools.length !== 1 ? "s" : ""
                        } Found`
                      : "This school is not in our database yet. We are adding more schools weekly."}
                  </h3>
                  {(budgetFilter ||
                    cityFilter ||
                    curriculumFilter ||
                    filteredSchools.length > 0) && (
                    <div className="w-2 h-2 bg-[#774BE5] rounded-full animate-pulse"></div>
                  )}
                </>
              )}
            </div>
            {!initialLoading && !isFiltering && (
              <div className="text-[14px] text-gray-500">
                Showing {displayedSchools.length} of {filteredSchools.length}
              </div>
            )}
          </div>
        </div>

        {initialLoading ? (
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
              {searchQuery.trim()
                ? "This school is not in our database yet. We are adding more schools weekly."
                : "This school is not in our database yet. We are adding more schools weekly.weekly."}
            </p>
            <button
              onClick={() => {
                setActiveFilter("all");
                setBudgetFilter("");
                setCityFilter("");
                setCurriculumFilter("");
                setLocalSearchQuery("");
              }}
              className="bg-[#774BE5] text-white px-6 py-3 rounded-lg text-[15px] font-medium hover:bg-[#774BE5]/90 transition-colors"
            >
              Clear all filters
            </button>
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
                  tags={school.curriculum_tags.split(", ").map((t) => t.trim())}
                  priceRange={`${school.min_tuition} - ${school.max_tuition}${school.min_tuition?.toLowerCase().includes("/month") || school.max_tuition?.toLowerCase().includes("/month") ? "" : " / year"}`}
                  schoolSlug={createSlug(school.school)}
                  priority={index < 6}
                />
              </div>
            ))}
          </div>
        )}

        {/* Loading indicator and intersection observer */}
        <div ref={observerRef}>
          {isLoading && (
            <div className="w-full grid md:grid-cols-3 grid-cols-1 gap-5">
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
};

// Loading component for Suspense fallback
const DirectoryLoading = () => (
  <>
    <Navbar />
    <section className="w-full md:px-10 px-5 pt-25 bg-white">
      <h2 className="text-[#0E1C29] md:text-[56px] text-4xl font-normal text-center">
        Explore Preschools
      </h2>
      <div className="w-full grid md:grid-cols-3 grid-cols-1 gap-5 mt-11">
        {Array.from({ length: 6 }).map((_, index) => (
          <SchoolCardSkeleton key={index} />
        ))}
      </div>
    </section>
    <Footer />
  </>
);

// Main component with Suspense boundary
const SchoolDirectory = () => {
  return (
    <Suspense fallback={<DirectoryLoading />}>
      <SchoolDirectoryContent />
    </Suspense>
  );
};

export default SchoolDirectory;
