import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { LoadingSpinner } from "@/components/LoadingSpinner";

/**
 * A generic full-page loading component for simpler pages
 * Shows a centered spinner with the page layout
 */
interface FullPageLoadingProps {
  showNavbar?: boolean;
  showFooter?: boolean;
  message?: string;
}

export const FullPageLoading = ({
  showNavbar = true,
  showFooter = true,
  message = "Loading...",
}: FullPageLoadingProps) => {
  return (
    <>
      <section className="w-full bg-cover bg-center min-h-screen flex flex-col items-center px-5 bg-[#F9FAFB]">
        {showNavbar && (
          <div className="w-full flex items-center justify-center md:px-10 pt-5 md:pt-0">
            <Navbar textColor="black" />
          </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            {/* Multi-layered spinner */}
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
            {/* Loading text */}
            <p className="text-[#774BE5] font-medium text-lg animate-pulse">
              {message}
            </p>
          </div>
        </div>
      </section>
      {showFooter && <Footer />}
    </>
  );
};

export default FullPageLoading;
