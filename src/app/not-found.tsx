import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function Custom404() {
  return (
    <>
      <section className="w-full bg-cover bg-center min-h-screen flex flex-col items-center pb-40 px-5 bg-[#F9FAFB]">
        <div className="w-full flex items-center justify-center md:px-10 pt-5 md:pt-0">
          <Navbar textColor="black" />
        </div>

        <div className="pt-26 flex flex-col items-center md:w-[930px]  w-full px-0 md:px-0 mt-20">
          <h3 className="md:text-[56px] text-4xl text-[#0E1C29] text-center">
            Whoa!
          </h3>
          <h3 className="md:text-[56px] text-4xl text-[#0E1C29] text-center">
            That didn’t work out.
          </h3>
          <p className="text-[#0E1C29] text-center">
            The page you are looking for either doesn’t exist or currently not
            available
          </p>
        </div>
        <div className="mt-11 mb-25 flex items-center justify-center w-full">
          <div className="w-fit">
            <Link
              href="/"
              className="bg-black hover:bg-[#774BE5] transition-all duration-500 ease-in-out rounded-[10px] text-white flex items-center gap-2 px-6 py-3"
            >
              <i className="ri-arrow-left-fill text-lg"></i>
              <p className="text-base font-medium">Go Back Home</p>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
