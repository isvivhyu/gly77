import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import Breadcrumbs from "@/components/Breadcrumbs";
import React from "react";

const TermsOfServices = () => {
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
            (Terms of Use)
          </h3>
          <p className="text-lg text-[#0E1C29] font-bold mt-4">
            Aralya Terms of Use (MVP)
          </p>
          <p className="text-lg text-[#0E1C29] font-medium mt-4">
            Last updated: 23 Oct 2025
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">1. About Aralya</p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            Aralya provides preschool listings and information for parents. We
            are not a school and do not guarantee availability, pricing, or
            admissions outcomes. Always confirm details directly with schools.
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">2. Acceptable use</p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            Don&apos;t attempt to damage, disrupt, or misuse the site.
            Don&apos;t submit unlawful, abusive, or misleading information.
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">
            3. No scraping / automated copying
          </p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            You may not use bots, scrapers, or other automated tools to copy,
            extract, or redistribute Aralya content or data without our written
            permission.
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">
            4. Intellectual property
          </p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            Text, layout, and design are owned by Aralya or our licensors. You
            may view for personal use. Commercial reuse requires prior written
            consent.
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">
            5. Links & third parties
          </p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            We link to third-party sites (e.g., Facebook/Messenger, school
            websites). We&apos;re not responsible for their content or policies.
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">
            6. Disclaimer & limitation of liability
          </p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            Information may change and may contain errors. Aralya is provided
            &quot;as is&quot;. To the extent allowed by law, we are not liable
            for indirect, incidental, or consequential damages.
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">7. Changes</p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            We may update these Terms and will change the Last updated date
            above. Continued use means you accept the updated Terms.
          </p>

          <div className="w-full h-0.25 bg-[#d3d3d3] mt-4 mb-4"></div>

          <p className="text-[#0E1C29] font-semibold mb-6">8. Contact</p>
          <p className="text-[#0E1C29] font-semibold mb-6">
            Questions about these Terms: hello@aralya.ph
          </p>
        </div>
      </section>
      <Footer />
    </>
  );
};

export default TermsOfServices;
