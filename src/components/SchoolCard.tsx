import Image from "next/image";
import Link from "next/link";

interface SchoolCardProps {
  imageSrc: string;
  imageAlt: string;
  schoolName: string;
  location: string;
  tags: string[];
  priceRange: string;
  schoolSlug?: string;
  priority?: boolean;
}

const SchoolCard = ({
  imageSrc,
  imageAlt,
  schoolName,
  location,
  tags,
  priceRange,
  schoolSlug,
  priority = false,
}: SchoolCardProps) => {
  return (
    <div className="bg-[#F6F3FA] rounded-[16px] p-4 h-full flex flex-col shadow-sm">
      <div className="relative w-full h-48 rounded-[10px] overflow-hidden mb-3 flex items-center justify-center bg-white p-2">
        <Image
          src={imageSrc}
          alt={imageAlt}
          width={400}
          height={400}
          className="w-full h-full object-contain"
          loading={priority ? "eager" : "lazy"}
          priority={priority}
          quality={90}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
        />
        <span className="absolute bottom-2 right-2 group inline-flex">
          <i className="ri-verified-badge-fill text-[#774BE5] text-xl cursor-pointer drop-shadow-sm"></i>
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-[#774BE5] text-white text-[14px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            Verified by Aralya
            <div className="absolute top-full right-4 -mt-1">
              <div className="border-4 border-transparent border-t-[#774BE5]"></div>
            </div>
          </div>
        </span>
      </div>
      <h4 className="text-black text-[24px] font-bold">{schoolName}</h4>
      <div className="flex items-center gap-2 mt-5">
        <i className="ri-map-pin-line text-[#374151] text-[16px]"></i>
        <p className="text-[16px] font-medium text-[#374151]">{location}</p>
      </div>
      <div className="flex w-full mt-2.5 gap-2 flex-wrap">
        {tags.map((tag, index) => (
          <div
            key={index}
            className="border border-[#cecece] rounded-full py-1 px-3 font-medium flex items-center justify-center"
          >
            <p className="text-[14px] text-[#374151]">{tag}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between mt-auto pt-5">
        <p className="text-[#0E1C29] font-bold text-[16px] md:text-[20px]">
          {(() => {
            const hasPerYear = priceRange.endsWith(" / year");
            const base = hasPerYear ? priceRange.slice(0, -7) : priceRange;
            const words = base.split(" ");
            const display =
              words.length > 3 ? words.slice(0, 3).join(" ") + "..." : base;
            return hasPerYear ? display + " / year" : display;
          })()}
        </p>
        <Link
          href={schoolSlug ? `/directory/${schoolSlug}` : "/directory"}
          className="bg-[#774BE5] w-fit text-white p-4 rounded-full text-[14px] font-semibold flex items-center h-11.5"
        >
          View Info
        </Link>
      </div>
    </div>
  );
};

export default SchoolCard;
