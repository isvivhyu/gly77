"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import React from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

const Contact = () => {
  return (
    <>
      <section className="w-full bg-cover bg-center min-h-screen flex flex-col items-center justify-center pb-40 px-5 bg-[#EFE8FF]">
        <div className="w-full flex items-center justify-center md:px-10 pt-5 md:pt-0">
          <Navbar textColor="black" />
        </div>

        <div className="pt-13 flex flex-col items-center md:w-[930px]  w-full px-0 md:px-0 mt-20">
          <div className="w-full mb-6">
            <Breadcrumbs />
          </div>
          <h3 className="md:text-[56px] text-4xl text-[#0E1C29] text-center">
            Contact Aralya{" "}
          </h3>

          <div className="w-full flex flex-col items-center bg-white mt-8 p-8 rounded-2xl">
            <h6 className="text-3xl font-medium text-[#0E1C29] text-center">
              Help keep school details accurate
            </h6>
            <p className="text-sm mt-3 text-[#0E1C29] text-center">
              Message us on Facebook to report corrections or suggest a school.
            </p>

            <div className="w-full flex justify-center mt-8">
              <Link
                href="https://web.facebook.com/people/Aralya/61578164295126"
                target="_blank"
                className="bg-[#774BE5] min-w-20 text-white p-4 rounded-full text-sm font-semibold flex items-center justify-center gap-1"
              >
                Message on Facebook
              </Link>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default Contact;
