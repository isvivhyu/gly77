"use client";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";

interface NavbarProps {
  textColor?: "white" | "black";
}

const Navbar = ({ textColor = "white" }: NavbarProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  useEffect(() => {
    // Check if we're on desktop
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    // Handle scroll event
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setIsScrolling(scrollY > 40);
    };

    // Initial check
    checkDesktop();

    // Add event listeners
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", checkDesktop);

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkDesktop);
    };
  }, []);

  return (
    <div
      className={` fixed md:top-0 top-5 md:left-0 left-0 right-0 z-[50000] md:px-0 md:py-0 px-5`}
    >
      <div
        className={`transition-all duration-500 ease-in-out md:px-10 px-5 py-5 ${
          isScrolling && isDesktop
            ? "bg-[#774BE5] md:w-[780px] w-full rounded-2xl mt-5 mx-auto md:top-10 z-[50000]"
            : "w-full md:bg-white/5 md:py-5 bg-[#774BE5] rounded-lg md:rounded-none"
        }`}
      >
        <div className="flex items-center justify-between w-full">
          <Link href="/" className="hidden md:block">
            {isScrolling && isDesktop ? (
              <div className="flex items-center gap-2">
                <Image
                  src="/images/logo-icons.png"
                  alt="logo"
                  width={45}
                  height={45}
                />
                <Image
                  src="/images/logo-white.png"
                  alt="logo"
                  width={150}
                  height={150}
                />
              </div>
            ) : (
              <Image
                src="/images/Logo.png"
                alt="logo"
                width={200}
                height={200}
                style={{ height: "auto" }}
              />
            )}
          </Link>
          <Link href="/" className="flex items-center gap-2 md:hidden">
            <Image
              src="/images/logo-icons.png"
              alt="logo"
              width={45}
              height={45}
            />
            <Image
              src="/images/logo-white.png"
              alt="logo"
              width={200}
              height={200}
            />
          </Link>

          <ul
            className={`hidden md:flex items-center justify-center gap-20 font-bold text-base transition-all duration-500 ease-in-out flex-1`}
          >
            <li
              className={`transition-colors duration-500 ease-in-out delay-100 ${
                isScrolling && isDesktop
                  ? "text-white hover:text-[#0E1C29]"
                  : `text-${textColor} hover:text-[#774BE5]`
              }`}
            >
              <Link href="/">Home</Link>
            </li>
            <li
              className={`transition-colors duration-500 ease-in-out delay-100 ${
                isScrolling && isDesktop
                  ? "text-white hover:text-[#0E1C29]"
                  : `text-${textColor} hover:text-[#774BE5]`
              }`}
            >
              <Link href="/directory">Browse</Link>
            </li>
            <li
              className={`transition-colors duration-500 ease-in-out delay-100 ${
                isScrolling && isDesktop
                  ? "text-white hover:text-[#0E1C29]"
                  : `text-${textColor} hover:text-[#774BE5]`
              }`}
            >
              <Link href="/contact">Contact</Link>
            </li>
          </ul>

          <button
            onClick={toggleMenu}
            className="block md:hidden focus:outline-none"
            aria-label="Toggle menu"
          >
            <div className="w-8 h-8 flex flex-col justify-center items-center relative">
              <div
                className={`w-8 h-0.5 bg-white transition-all duration-300 ease-in-out absolute ${
                  isMenuOpen ? "rotate-45" : "rotate-0 -translate-y-2"
                }`}
              ></div>
              <div
                className={`w-8 h-0.5 bg-white transition-all duration-300 ease-in-out ${
                  isMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              ></div>
              <div
                className={`w-8 h-0.5 bg-white transition-all duration-300 ease-in-out absolute ${
                  isMenuOpen ? "-rotate-45" : "rotate-0 translate-y-2"
                }`}
              ></div>
            </div>
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out z-[999999] ${
            isMenuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          <div className="px-5 my-12">
            <ul className="flex flex-col gap-10 font-bold text-lg w-full">
              <li className="text-white hover:text-[#0E1C29] transition-colors duration-500 ease-in-out delay-100">
                <Link href="/" onClick={() => setIsMenuOpen(false)}>
                  Home
                </Link>
              </li>
              <li className="text-white hover:text-[#0E1C29] transition-colors duration-500 ease-in-out delay-100">
                <Link href="/directory" onClick={() => setIsMenuOpen(false)}>
                  Browse
                </Link>
              </li>
              <li className="text-white hover:text-[#0E1C29] transition-colors duration-500 ease-in-out delay-100">
                <Link href="/contact" onClick={() => setIsMenuOpen(false)}>
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
