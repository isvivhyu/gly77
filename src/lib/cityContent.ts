export interface CityFAQ {
  question: string;
  answer: string;
}

export interface CityContent {
  shortDescription?: string;
  imageUrl?: string;
  about?: string;
  faqs?: CityFAQ[];
}

const cityContentMap: Record<string, CityContent> = {
  makati: {
    shortDescription:
      "Explore preschools in Makati and compare tuition, curriculum, and key details to find the right school for your child.",
    imageUrl:
      "https://res.cloudinary.com/dqr89hfy1/image/upload/v1775722720/Makati_p0rufb.jpg",
    about:
      "Makati offers a wide range of preschool options, including Montessori, play-based, and progressive programs. Tuition fees can vary significantly, typically ranging from around ₱50,000 to over ₱300,000 per year depending on the school, curriculum, and facilities. This page helps parents compare preschools in Makati based on key factors like tuition, curriculum, and learning environment. When choosing a preschool, many parents consider location, teaching approach, and class size to find the best fit for their child.",
    faqs: [
      {
        question: "What is the average preschool tuition in Makati?",
        answer:
          "Preschool tuition in Makati typically ranges from around ₱50,000 to over ₱300,000 per year depending on the school, curriculum, and facilities.",
      },
      {
        question: "What types of preschool curriculum are available in Makati?",
        answer:
          "Preschools in Makati offer a variety of programs including Montessori, play-based, progressive, and inquiry-based approaches.",
      },
      {
        question: "What age can children start preschool in Makati?",
        answer:
          "Most preschools in Makati accept children starting from around 1.5 to 2 years old, depending on the program.",
      },
      {
        question: "How do I choose the right preschool in Makati?",
        answer:
          "Parents often compare preschools in Makati based on tuition, curriculum, location, and class environment to find the best fit for their child.",
      },
      {
        question: "Are there international or bilingual preschools in Makati?",
        answer:
          "Yes, some preschools in Makati offer international or bilingual programs, including those influenced by global education systems.",
      },
    ],
  },
  taguig: {
    shortDescription:
      "Explore preschools in Taguig and compare tuition, curriculum, and key details to find the right school for your child.",
    imageUrl:
      "https://res.cloudinary.com/dqr89hfy1/image/upload/v1775722720/BGC_ythgyv.jpg",
    about:
      "Taguig offers a growing selection of preschools, particularly in areas like BGC, with programs such as Montessori, play-based, and progressive approaches. Tuition fees typically range from around ₱80,000 to over ₱300,000 per year depending on the school, curriculum, and facilities. This page helps parents compare preschools in Taguig based on key factors like tuition, curriculum, and learning environment. When choosing a preschool, many parents consider location, teaching approach, and class size to find the best fit for their child.",
    faqs: [
      {
        question: "What is the average preschool tuition in Taguig?",
        answer:
          "Preschool tuition in Taguig typically ranges from around ₱80,000 to over ₱300,000 per year depending on the school, curriculum, and facilities.",
      },
      {
        question:
          "What types of preschool curriculum are available in Taguig?",
        answer:
          "Preschools in Taguig offer a variety of programs including Montessori, play-based, and progressive approaches, especially in BGC.",
      },
      {
        question: "What age can children start preschool in Taguig?",
        answer:
          "Most preschools in Taguig accept children starting from around 1.5 to 2 years old, depending on the program.",
      },
      {
        question: "How do I choose the right preschool in Taguig?",
        answer:
          "Parents often compare preschools in Taguig based on tuition, curriculum, location, and class environment to find the best fit for their child.",
      },
      {
        question: "Are there international or premium preschools in Taguig?",
        answer:
          "Yes, Taguig, especially BGC, has several premium preschools that offer international-style programs and modern facilities.",
      },
    ],
  },
};

export function getCityContent(citySlug: string): CityContent {
  return cityContentMap[citySlug.toLowerCase()] ?? {};
}
