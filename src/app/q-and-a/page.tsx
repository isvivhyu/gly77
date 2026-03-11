"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import FAQSection from "@/components/FAQSection";
import Breadcrumbs from "@/components/Breadcrumbs";

const QAndA = () => {
  return (
    <>
      <section className="w-full bg-cover bg-center  flex flex-col items-center justify-center pt-10 pb-40 px-5 bg-[#EFE8FF]">
        <div className="w-full flex items-center justify-center md:px-10 pt-5 md:pt-0">
          <Navbar textColor="black" />
        </div>

        <div className="pt-13 flex flex-col items-center md:w-[930px]  w-full px-0 md:px-0 mt-20">
          <div className="w-full mb-6">
            <Breadcrumbs />
          </div>
          <h3 className="md:text-[56px] text-4xl text-[#0E1C29] text-center">
            Q&A
          </h3>
        </div>
      </section>

      <FAQSection
        title="Questions? Answers!"
        description="Find quick answers to the most common questions about our platform"
        faqs={[
          {
            question: "Is Aralya free?",
            answer: "Yes-free for parents.",
          },
          {
            question: "Do I need to sign up?",
            answer: "No. No accounts, no forms.",
          },
          {
            question: "How do I contact a school?",
            answer:
              "On the school page, tap Call, Text, Message on FB, or Email.",
          },
          {
            question: "What can I filter by?",
            answer: "City, tuition range, curriculum, and schedule.",
          },
          {
            question: "How accurate are the details?",
            answer: "We confirm with schools and refresh weekly.",
          },
          {
            question: "Which cities are available now?",
            answer: "BGC, QC, Makati, Pasig, Taguig-more coming soon.",
          },
        ]}
      />

      <Footer />
    </>
  );
};

export default QAndA;
