import Image from "next/image";
import Link from "next/link";

interface CitySchoolCardProps {
  imageSrc: string;
  imageAlt: string;
  schoolName: string;
  location: string;
  tags: string[];
  priceRange: string;
  schoolSlug?: string;
  priority?: boolean;
}

const CitySchoolCard = ({
  imageSrc,
  imageAlt,
  schoolName,
  location,
  tags,
  priceRange,
  schoolSlug,
  priority = false,
}: CitySchoolCardProps) => {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:-translate-y-0.5 transition-all duration-200 h-full flex flex-col">
      {/* Logo / banner area */}
      <div className="relative w-full h-44 bg-[#F6F3FA] flex items-center justify-center p-5">
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
        <span className="absolute top-3 right-3 group inline-flex">
          <i className="ri-verified-badge-fill text-[#774BE5] text-[18px] cursor-pointer drop-shadow-sm"></i>
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-[#774BE5] text-white text-[12px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            Verified by Aralya
            <div className="absolute top-full right-4 -mt-1">
              <div className="border-4 border-transparent border-t-[#774BE5]"></div>
            </div>
          </div>
        </span>
      </div>

      {/* Card content */}
      <div className="p-4 flex flex-col flex-1">
        <h4 className="text-[#0E1C29] text-[16px] font-bold leading-snug line-clamp-2">
          {schoolName}
        </h4>

        <div className="flex items-center gap-1.5 mt-1.5">
          <i className="ri-map-pin-2-line text-gray-400 text-[13px]"></i>
          <p className="text-[13px] text-gray-400 font-medium">{location}</p>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="bg-[#774BE5]/10 text-[#774BE5] text-[11px] font-semibold px-2.5 py-1 rounded-full"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="text-[11px] text-gray-400 self-center">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide font-semibold mb-0.5">
              Tuition
            </p>
            <p className="text-[#0E1C29] font-bold text-[14px] leading-tight">
              {priceRange}
            </p>
          </div>
          <Link
            href={schoolSlug ? `/directory/${schoolSlug}` : "/directory"}
            className="bg-[#774BE5] text-white px-4 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-[#6B3FD6] transition-colors whitespace-nowrap"
          >
            View School
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CitySchoolCard;
