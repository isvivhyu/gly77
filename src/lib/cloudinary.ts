/**
 * Optimizes an image URL (specifically for Cloudinary) by adding transformation parameters.
 *
 * @param url - The original image URL
 * @param width - The desired width (default: 800)
 * @returns The optimized URL if it's a Cloudinary URL, otherwise the original URL
 */
export const optimizeImageUrl = (url?: string, width: number = 800): string => {
  if (!url) return "";

  // Only apply transformation if it's a Cloudinary URL containing /upload/
  if (url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/w_${width},f_auto,q_auto/`);
  }

  return url;
};
