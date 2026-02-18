import React from "react";
import { SkeletonLoader } from "./SkeletonLoader";

interface SchoolCardSkeletonProps {
  className?: string;
}

export const SchoolCardSkeleton: React.FC<SchoolCardSkeletonProps> = ({
  className = "",
}) => {
  return (
    <div
      className={`bg-[#F6F3FA] rounded-lg border border-gray-200 overflow-hidden shadow-sm ${className}`}
    >
      {/* Image skeleton */}
      <SkeletonLoader className="h-48 w-full" />

      <div className="p-4 space-y-3">
        {/* School name skeleton */}
        <SkeletonLoader className="h-6 w-3/4" />

        {/* Location skeleton */}
        <SkeletonLoader className="h-4 w-1/2" />

        {/* Price range skeleton */}
        <SkeletonLoader className="h-4 w-2/3" />

        {/* Tags skeleton */}
        <div className="flex gap-2 flex-wrap">
          <SkeletonLoader className="h-6 w-16 rounded-full" />
          <SkeletonLoader className="h-6 w-20 rounded-full" />
          <SkeletonLoader className="h-6 w-18 rounded-full" />
        </div>
      </div>
    </div>
  );
};
