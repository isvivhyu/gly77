import { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import HeroSearchBar from "@/components/HeroSearchBar";
import { getCityContent } from "@/lib/cityContent";

export const metadata: Metadata = {
  title: "Preschools in Makati & Taguig | Compare Schools | Aralya",
  description:
    "Compare preschools in Makati and Taguig by tuition, curriculum, and key details. Find the right preschool for your child with Aralya.",
  alternates: {
    canonical: "https://aralya.ph",
  },
};

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section
        className="relative w-full min-h-[600px] bg-cover bg-center flex flex-col items-center px-5 pb-48"
        style={{ backgroundImage: "url('/images/Hero.jpg')" }}
      >
        <div className="w-full flex items-center justify-center md:px-10 pt-5 md:pt-0 z-[1000]">
          <Navbar />
        </div>
        <div className="absolute inset-0 bg-black/30 z-0" />
        <div className="relative z-10 flex flex-col items-center md:w-[860px] w-full mt-40 text-center">
          <h1 className="md:text-6xl text-[32px] font-semibold text-white leading-[120%]">
            Find and Compare Preschools in Makati and Taguig
          </h1>
          <p className="mt-6 text-white/90 md:text-lg text-base md:w-[700px]">
            Aralya helps parents compare preschools in Makati and Taguig by
            tuition, curriculum, and key details, so you don&apos;t have to
            message schools one by one.
          </p>
          <div className="w-full md:w-[600px] mt-6">
            <HeroSearchBar />
          </div>
        </div>
      </section>

      {/* Explore by City */}
      <section className="w-full bg-white px-5 md:px-10 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[#0E1C29] md:text-5xl text-3xl font-semibold">
            Explore Preschools by City
          </h2>
          <p className="mt-4 text-[#4A5568] md:text-base text-sm">
            Browse preschool options in Makati and Taguig, compare tuition and
            curriculum, and explore school profiles in one place.
          </p>
        </div>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-5 max-w-3xl mx-auto">
          <Link
            href="/preschools-in-makati"
            className="group relative w-full sm:w-1/2 h-64 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <img
              src={getCityContent("makati").imageUrl}
              alt="Preschools in Makati"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
              <div>
                <h3 className="text-white font-semibold text-2xl leading-tight">
                  Preschools in Makati
                </h3>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shrink-0 group-hover:bg-[#774BE5] transition-colors">
                <i className="ri-arrow-right-line text-white text-lg"></i>
              </div>
            </div>
          </Link>
          <Link
            href="/preschools-in-taguig"
            className="group relative w-full sm:w-1/2 h-64 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
          >
            <img
              src={getCityContent("taguig").imageUrl}
              alt="Preschools in Taguig"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 flex items-end justify-between">
              <div>
                <h3 className="text-white font-semibold text-2xl leading-tight">
                  Preschools in Taguig
                </h3>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-full w-10 h-10 flex items-center justify-center shrink-0 group-hover:bg-[#774BE5] transition-colors">
                <i className="ri-arrow-right-line text-white text-lg"></i>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Why Parents Use Aralya */}
      <section className="w-full bg-white px-5 md:px-10 py-20">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[#0E1C29] md:text-5xl text-3xl font-semibold">
            Why Parents Use Aralya
          </h2>
        </div>
        <ul className="mt-10 max-w-sm mx-auto flex flex-col gap-5">
          {[
            "Compare preschool tuition more easily",
            "See curriculum and key school details in one place",
            "Save time narrowing down options",
          ].map((point) => (
            <li key={point} className="flex items-center gap-4">
              <span className="shrink-0 w-6 h-6 rounded-full bg-[#774BE5] flex items-center justify-center">
                <i className="ri-check-line text-white text-sm" />
              </span>
              <p className="text-[#0E1C29] md:text-base text-sm">{point}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Content / SEO section */}
      <section className="w-full bg-white px-5 md:px-10 py-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-[#0E1C29] md:text-4xl text-2xl font-semibold text-center">
            Finding the Right Preschool in Makati and Taguig
          </h2>
          <p className="mt-6 text-[#4A5568] md:text-base text-sm leading-relaxed text-center">
            Choosing a preschool can be difficult when information is scattered
            across websites and parents have to contact schools one by one just
            to compare options. Aralya is built to make that easier by helping
            parents compare{" "}
            <Link href="/preschools-in-makati" className="text-[#774BE5] hover:underline font-semibold">
              preschools in Makati
            </Link>{" "}
            and{" "}
            <Link href="/preschools-in-taguig" className="text-[#774BE5] hover:underline font-semibold">
              preschools in Taguig
            </Link>{" "}
            based on tuition, curriculum, and key details. As Aralya grows, the goal is to make
            preschool research simpler, clearer, and more useful for families.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full bg-white px-5 md:px-10 py-20 pb-24">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-[#0E1C29] md:text-4xl text-2xl font-semibold">
            Start with a City
          </h2>
          <p className="mt-4 text-[#4A5568] md:text-base text-sm">
            Explore preschool options in Makati or Taguig and compare schools
            based on what matters most to your family.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/preschools-in-makati"
              className="bg-[#774BE5] hover:bg-[#6B3FD6] transition-colors text-white font-medium px-7 py-3 rounded-full"
            >
              View Preschools in Makati
            </Link>
            <Link
              href="/preschools-in-taguig"
              className="border border-[#774BE5] text-[#774BE5] hover:bg-[#774BE5] hover:text-white transition-colors font-medium px-7 py-3 rounded-full"
            >
              View Preschools in Taguig
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
