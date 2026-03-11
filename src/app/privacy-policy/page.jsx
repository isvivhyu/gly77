"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Link from "next/link";
import React from "react";
import Breadcrumbs from "@/components/Breadcrumbs";

const PrivacyPolicy = () => {
  return (
    <>
      <section className="w-full bg-cover bg-center min-h-screen flex flex-col items-center pb-40 px-5 bg-[#F9FAFB]">
        <div className="w-full flex items-center justify-center md:px-10 pt-5 md:pt-0">
          <Navbar textColor="black" />
        </div>

        <div className="pt-13 flex flex-col md:w-[930px]  w-full px-0 md:px-0 mt-20">
          <div className="mb-6">
            <Breadcrumbs />
          </div>
          <h3 className="text-4xl text-[#0E1C29] font-semibold">
            (Privacy Policy)
          </h3>
          <p className="text-lg text-[#0E1C29] font-bold mt-4">
            Aralya Privacy Policy (MVP)
          </p>
          <p className="text-lg text-[#0E1C29] font-medium mt-4">
            Last updated: 23 Oct 2025
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">Who we are</p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            Aralya ("we", "us") helps parents compare preschools in Metro
            Manila.
          </p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            Contact: hello@aralya.ph
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">
            1. What we collect
          </p>
          <ul className="list-disc list-inside mt-4 flex flex-col gap-4 text-[#0E1C29] font-semibold">
            <li>
              Usage data (pages viewed, buttons clicked like Call / Message on
              Facebook, device info) via Google Analytics and Meta Pixel.
            </li>
            <li>
              Messages you send us (e.g., via Facebook Messenger or forms).
            </li>
            <li>School corrections/suggestions you submit.</li>
          </ul>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">
            2. Why we collect it
          </p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            To operate and improve Aralya, fix issues, understand which
            pages/filters help parents, and respond to your requests.
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">3. Sharing</p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            We use trusted service providers (hosting, analytics). We don't sell
            your personal information.
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">
            4. Cookies & analytics
          </p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            We use cookies to measure usage and improve the site. You can block
            cookies in your browser. See Google and Meta for how they use data
            from their tools.
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">5. Your choices</p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            Email hello@aralya.ph to request access, correction, or deletion of
            information you shared with us.
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">6. Data security</p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            We use reputable providers and limit access. No method is 100%
            secure, but we work to protect your data.
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">7. Children</p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            Aralya is for parents/guardians. If you believe a child provided
            personal data here, contact us.
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">8. Updates</p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            We may update this page and will change the Last updated date above.
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">9. Contact</p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            Questions or requests: hello@aralya.ph
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;
