import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Disclaimer | Aralya",
  description:
    "Disclaimer for Aralya - An independent information platform designed to help parents explore and compare preschools.",
};

const Disclaimer = () => {
  return (
    <>
      <section className="w-full bg-cover bg-center min-h-screen flex flex-col items-center pb-40 px-5 bg-[#F9FAFB]">
        <div className="w-full flex items-center justify-center md:px-10 pt-5 md:pt-0">
          <Navbar textColor="black" />
        </div>

        <div className="pt-13 flex flex-col md:w-[930px] w-full px-0 md:px-0 mt-20">
          <div className="mb-6">
            <Breadcrumbs />
          </div>
          <h1 className="text-4xl text-[#0E1C29] font-semibold">Disclaimer</h1>
          <p className="text-lg text-[#0E1C29] font-medium mt-4">
            Last updated: February 2026
          </p>

          <p className="text-[#0E1C29] leading-relaxed mb-6">
            <strong>Aralya</strong> is an independent information platform
            designed to help parents explore and compare preschools. School
            names, logos, and trademarks shown on this website belong to their
            respective owners and are used for identification and informational
            purposes only.
          </p>
          <p className="text-[#0E1C29] leading-relaxed mb-6">
            Aralya is not affiliated with, endorsed by, or officially connected
            to any school listed unless explicitly stated.
          </p>

          <p className="text-[#0E1C29] leading-relaxed mb-6">
            Information on Aralya is gathered from publicly available sources
            and direct communication and may change over time. While we aim to
            keep details accurate and up to date, parents are encouraged to
            confirm all information directly with the school.
          </p>

          <p className="text-[#0E1C29] leading-relaxed mb-6">
            Aralya does not accept applications, process enrollments, or act as
            an agent or representative of any school. Our role is limited to
            providing information to help parents make informed decisions.
          </p>

          <p className="text-[#0E1C29] leading-relaxed mb-6">
            Content on this site is provided for general information only and
            should not be considered professional or educational advice. We
            recommend consulting directly with schools and educational
            professionals for specific guidance regarding your child&apos;s
            education.
          </p>

          <p className="text-[#0E1C29] leading-relaxed mb-6">
            If you represent a school and would like information updated or
            removed, please contact us at{" "}
            <a
              href="mailto:hello.aralya@gmail.com"
              className="text-[#774BE5] underline hover:opacity-80"
            >
              hello.aralya@gmail.com
            </a>
            .
          </p>

          <p className="text-[#0E1C29] leading-relaxed mb-6">
            For any questions or concerns regarding this disclaimer, please
            reach out to us at{" "}
            <a
              href="mailto:hello.aralya@gmail.com"
              className="text-[#774BE5] underline hover:opacity-80"
            >
              hello.aralya@gmail.com
            </a>
            .
          </p>
        </div>
      </section>
    </>
  );
};

export default Disclaimer;
