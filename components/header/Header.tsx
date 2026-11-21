"use client";

import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import ButtonLink from "@/components/ui/ButtonLink";
import DesktopNav from "./DesktopNav";
import MobileNav from "./MobileNav";
import { preventNavigation } from "./nav-data";

// Header & navigation, Figma 3008:9194. A floating translucent pill, 1134px wide on desktop
// (it overhangs the 1008px column by 63px each side), sticky with the same offset it has in the
// design (24px). It turns more opaque with a shadow once the page scrolls — docs/assumptions.md R4.
export default function Header() {
  const scrolled = useScrolled(8);

  return (
    <header className="sticky top-4 z-40 mx-auto mt-4 w-[min(100%-2rem,70.875rem)] desk:top-6 desk:mt-6">
      <div
        className={`flex h-14 items-center rounded-nav p-1 transition-[background-color,box-shadow] duration-300 ${
          scrolled ? "bg-nav-pill-scrolled" : "bg-nav-pill"
        }`}
      >
        <a
          href="#"
          onClick={preventNavigation}
          aria-label="KlearStack home"
          className="flex h-12 w-[142px] shrink-0 items-center justify-center rounded-[26px] bg-white"
        >
          <Logo size="sm" />
        </a>

        <DesktopNav className="ml-[62px] hidden desk:block" />

        <div className="ml-auto hidden items-center gap-3 desk:flex">
          <ButtonLink href="#demo" variant="outline">
            Try it for Free
          </ButtonLink>
          <ButtonLink href="#demo">Get Free Demo</ButtonLink>
        </div>

        <div className="ml-auto flex items-center gap-2 desk:hidden">
          {/* Wrapped: ButtonLink's own inline-flex would override a `hidden` class on it. */}
          <div className="hidden sm:block">
            <ButtonLink href="#demo">Get Free Demo</ButtonLink>
          </div>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}

function useScrolled(threshold: number) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const update = () => setScrolled(window.scrollY > threshold);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [threshold]);
  return scrolled;
}
