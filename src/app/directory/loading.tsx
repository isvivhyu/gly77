import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function DirectoryLoading() {
  return (
    <>
      <section
        className="w-full h-fit bg-cover bg-center flex flex-col items-center pb-40 px-5 relative"
        style={{ backgroundImage: "url('/images/Hero.jpg')" }}
      >
        <div className="w-full h-full absolute top-0 left-0 bg-black/20 z-0"></div>
        <div className="w-full flex items-center justify-center md:px-10 pt-5 md:pt-0 relative z-[1000]">
          <Navbar />
        </div>
        <div className="pt-13 flex flex-col items-center md:w-[930px] w-full px-0 md:px-0 mt-20 relative">
          <h1 className="md:text-7xl text-[32px] font-semibold text-white text-center leading-[120%]">
            Find the Right Preschool
          </h1>

          <div className="bg-white w-full p-5 rounded-3xl mt-6 relative">
            {/* Category Tabs Skeleton */}
            <div className="w-full flex items-center justify-center gap-3 mb-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="w-24 h-10 bg-gray-200 rounded-lg animate-pulse"
                ></div>
              ))}
            </div>
            {/* Search Bar Skeleton */}
            <div className="bg-[#f5f5f5] w-full p-2 rounded-full flex items-center justify-between gap-3">
              <div className="w-full h-10 bg-gray-200 rounded-lg animate-pulse ml-4"></div>
              <div className="w-24 h-10 bg-[#774BE5]/50 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full md:px-10 px-5 pb-25 pt-10 bg-white">
        {/* Results Summary Skeleton */}
        <div className="mt-8 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full border-2 border-[#774BE5]/20 border-t-[#774BE5] animate-spin" />
            <div className="w-40 h-6 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Centered Loading Spinner */}
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
          <p className="text-[#774BE5] font-medium text-lg mt-4 animate-pulse">
            Loading schools...
          </p>
        </div>
      </section>

      <Footer />
    </>
  );
}
