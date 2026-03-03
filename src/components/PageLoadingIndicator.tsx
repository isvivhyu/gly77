"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * PageLoadingIndicator - A global loading indicator that shows during page transitions
 * Displays a progress bar at the top of the page and an overlay spinner
 */
export const PageLoadingIndicator = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // When pathname or search params change, loading is complete
    setIsLoading(false);
    setProgress(100);

    // Reset progress after animation
    const timeout = setTimeout(() => {
      setProgress(0);
    }, 300);

    return () => clearTimeout(timeout);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true);
      setProgress(20);

      // Simulate progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      return () => clearInterval(interval);
    };

    // Listen for link clicks to start loading
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");

      if (anchor) {
        const href = anchor.getAttribute("href");
        const isExternal =
          anchor.target === "_blank" || anchor.rel?.includes("external");
        const isHashLink = href?.startsWith("#");
        const isSameOrigin =
          href?.startsWith("/") || href?.startsWith(window.location.origin);

        if (href && isSameOrigin && !isExternal && !isHashLink) {
          // Check if it's a different page
          const currentPath = window.location.pathname + window.location.search;
          const newPath = href.startsWith(window.location.origin)
            ? new URL(href).pathname + new URL(href).search
            : href;

          if (currentPath !== newPath) {
            handleStart();
          }
        }
      }
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  if (!isLoading && progress === 0) return null;

  return (
    <>
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-transparent">
        <div
          className="h-full bg-gradient-to-r from-[#774BE5] via-[#9B6EF3] to-[#774BE5] transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            boxShadow:
              "0 0 10px rgba(119, 75, 229, 0.7), 0 0 5px rgba(119, 75, 229, 0.5)",
          }}
        />
      </div>

      {/* Full Page Overlay with Spinner */}
      {isLoading && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-white/60 backdrop-blur-sm transition-opacity duration-200">
          <div className="flex flex-col items-center gap-4">
            {/* Spinner */}
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
            {/* Loading text */}
            <p className="text-[#774BE5] font-medium text-sm animate-pulse">
              Loading...
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default PageLoadingIndicator;
