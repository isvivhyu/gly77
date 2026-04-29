"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ButtonWithLoading } from "@/components/LoadingSpinner";
import { SchoolService } from "@/lib/schoolService";
import { cityToSlug } from "@/lib/cityUtils";
import { getCityContent } from "@/lib/cityContent";

export default function HeroSearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [availableCities, setAvailableCities] = useState<
    { city: string; schoolCount: number }[]
  >([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const router = useRouter();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    SchoolService.searchCities("").then(setAvailableCities).catch(() => {});
  }, []);

  useEffect(() => {
    if (inputFocused) {
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }, [inputFocused]);

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
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    if (value !== cityFilter) setCityFilter("");
    setShowDropdown(true);
  };

  const filteredCities = availableCities.filter((c) => {
    if (cityFilter) return c.city === cityFilter;
    return c.city.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleOptionSelect = (city: string) => {
    window.location.href = `/preschools-in-${cityToSlug(city)}/`;
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cityFilter && !searchQuery.trim()) return;
    setIsSearching(true);
    try {
      if (cityFilter) {
        router.push(`/preschools-in-${cityToSlug(cityFilter)}/`);
      } else {
        const match = availableCities.find(
          (c) => c.city.toLowerCase() === searchQuery.trim().toLowerCase(),
        );
        if (match) {
          router.push(`/preschools-in-${cityToSlug(match.city)}/`);
        } else {
          router.push(`/directory?search=${encodeURIComponent(searchQuery.trim())}`);
        }
      }
    } finally {
      setTimeout(() => setIsSearching(false), 500);
    }
  };

  return (
    <form
      onSubmit={handleSearch}
      className="w-full mt-6 relative z-[1001]"
    >
      <div className="bg-white rounded-full p-2 flex items-center gap-2 shadow-xl relative">
        <div className="pl-3 text-[#774BE5] shrink-0">
          <i className="ri-map-pin-2-fill text-xl" />
        </div>

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
          className="bg-transparent flex-1 min-w-0 text-base text-[#0E1C29] placeholder-[#999999] focus:outline-none py-3"
          style={{ fontSize: "16px" }}
        />

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
            <i className="ri-close-line text-xl" />
          </button>
        )}

        <ButtonWithLoading
          type="submit"
          isLoading={isSearching}
          className="bg-[#774BE5] text-white px-4 md:px-7 py-3 rounded-full text-sm font-semibold flex items-center justify-center gap-1 md:gap-2 hover:bg-[#6B3FD6] transition-colors disabled:hover:bg-[#774BE5] shrink-0"
        >
          <i className="ri-search-line text-base" />
          <span className="hidden sm:inline">Search</span>
        </ButtonWithLoading>

        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 max-h-80 overflow-y-auto z-50"
          >
            <div className="py-2">
              {filteredCities.length > 0 ? (
                filteredCities.map((cityOption) => {
                  const citySlug = cityToSlug(cityOption.city);
                  const cityContent = getCityContent(citySlug);

                  return (
                    <button
                      key={cityOption.city}
                      type="button"
                      onClick={() => handleOptionSelect(cityOption.city)}
                      className="w-full px-4 py-3 text-left hover:bg-[#f5f5f5] transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        {cityContent?.imageUrl ? (
                          <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 shadow-sm border border-gray-100">
                            <img src={cityContent.imageUrl} alt={cityOption.city} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-[#774BE5]/10 flex items-center justify-center shrink-0">
                            <i className="ri-map-pin-line text-[#774BE5] text-base" />
                          </div>
                        )}
                        <span className="text-[#0E1C29] font-medium">
                          {cityOption.city}
                        </span>
                      </div>
                      <span className="text-sm text-gray-400">
                        {cityOption.schoolCount} school
                        {cityOption.schoolCount !== 1 ? "s" : ""}
                      </span>
                    </button>
                  );
                })
              ) : availableCities.length > 0 ? (
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
  );
}
