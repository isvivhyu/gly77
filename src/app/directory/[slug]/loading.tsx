import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Loading state for individual school detail pages
 * Shows skeleton placeholders while the school data is being fetched
 */
export default function SchoolDetailLoading() {
  return (
    <>
      <section
        className="w-full h-fit bg-cover bg-center flex flex-col items-center pb-20 px-5 relative"
        style={{ backgroundImage: "url('/images/Hero.jpg')" }}
      >
        <div className="w-full h-full absolute top-0 left-0 bg-black/20 z-0"></div>
        <div className="w-full flex items-center justify-center md:px-10 pt-5 md:pt-0 relative z-[1000]">
          <Navbar />
        </div>

        <div className="pt-13 flex flex-col items-center md:w-[930px] w-full px-0 md:px-0 mt-20 relative">
          {/* School Name Skeleton */}
          <div className="w-3/4 h-10 bg-white/30 rounded-lg animate-pulse mb-4"></div>
          {/* School Location Skeleton */}
          <div className="w-1/2 h-6 bg-white/30 rounded-lg animate-pulse"></div>
        </div>
      </section>

      <section className="w-full md:px-10 px-5 pb-25 pt-10 bg-white">
        <div className="max-w-4xl mx-auto">
          {/* School Image Skeleton */}
          <div className="w-full h-80 bg-gray-200 rounded-2xl animate-pulse mb-8"></div>

          {/* Info Cards Skeleton */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="bg-gray-100 rounded-xl p-6 animate-pulse"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="w-24 h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="w-32 h-5 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Description Skeleton */}
          <div className="space-y-3 mb-8">
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-full h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse"></div>
          </div>

          {/* Action Button Skeleton */}
          <div className="w-48 h-12 bg-gray-200 rounded-full animate-pulse mx-auto"></div>
        </div>
      </section>

      <Footer />
    </>
  );
}
