"use client";

import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import Image from "next/image";
import { useEffect, useState } from "react";
import { CaretDown } from "@/components/icons";
import MegaMenuPanel, { SubLink } from "./MegaMenuPanel";
import { ACTIVE, NAV_ITEMS, preventNavigation } from "./nav-data";

// Radix handles: hover-to-open for mouse pointers only (with delayDuration as the intent delay),
// click/Enter/Space toggling, arrow-key and Tab movement, Escape (focus returns to the trigger)
// and closing on an outside pointer-down. We add close-on-scroll.
const OPEN_DELAY_MS = 120;
const SCROLL_CLOSE_THRESHOLD_PX = 8;

const itemText =
  "group/trigger relative flex items-center gap-1 rounded-field text-nav whitespace-nowrap transition-colors duration-150";
const inactiveText = "text-black hover:text-brand-700 data-[state=open]:text-brand-700";
const activeText = "font-semibold text-accent-text"; // design #D99723 darkened for contrast (assumptions Q7)
// Hover underline grows from the centre; the active item has the blue bar instead.
const hoverUnderline =
  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-center after:scale-x-0 after:bg-current " +
  "after:transition-transform after:duration-200 hover:after:scale-x-100 data-[state=open]:after:scale-x-100";
// Figma 3008:9197: 76×6 bar, top radii 28, sitting on the pill's bottom edge (12px below the item).
const activeBar =
  "after:pointer-events-none after:absolute after:top-[calc(100%+12px)] after:left-1/2 after:h-1.5 after:w-[76px] " +
  "after:-translate-x-1/2 after:rounded-t-[28px] after:bg-brand-500";

export default function DesktopNav({ className = "" }: { className?: string }) {
  const [value, setValue] = useState("");

  // Close an open menu once the page scrolls (brief: "close on scroll").
  useEffect(() => {
    if (!value) return;
    const startY = window.scrollY;
    const onScroll = () => {
      if (Math.abs(window.scrollY - startY) > SCROLL_CLOSE_THRESHOLD_PX) setValue("");
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [value]);

  return (
    <NavigationMenu.Root
      value={value}
      onValueChange={setValue}
      delayDuration={OPEN_DELAY_MS}
      skipDelayDuration={300}
      aria-label="Primary"
      className={className}
    >
      <NavigationMenu.List className="flex items-center gap-4 py-0.5">
        {NAV_ITEMS.map((item) => {
          const isActive = item.id === ACTIVE.item;
          const textClass = `${itemText} ${isActive ? activeText : `${inactiveText} ${hoverUnderline}`}`;

          if (item.kind === "link") {
            return (
              <NavigationMenu.Item key={item.id} className={`relative ${isActive ? activeBar : ""}`}>
                <NavigationMenu.Link href={item.href} onClick={preventNavigation} active={isActive} className={textClass}>
                  {item.label}
                </NavigationMenu.Link>
              </NavigationMenu.Item>
            );
          }

          return (
            <NavigationMenu.Item key={item.id} value={item.id} className={`relative ${isActive ? activeBar : ""}`}>
              <NavigationMenu.Trigger className={`peer ${textClass}`}>
                {item.label}
                {isActive && <span className="sr-only"> (current section)</span>}
                <CaretDown
                  strokeWidth={isActive ? 1.5 : 1}
                  className="size-3.5 transition-transform duration-200 group-data-[state=open]/trigger:rotate-180"
                />
              </NavigationMenu.Trigger>

              {/* Pointer triangle above the panel, centred under the trigger (Figma "Polygon 4"). */}
              <span
                aria-hidden
                className="pointer-events-none absolute top-[calc(100%+14px)] left-1/2 z-[60] -translate-x-1/2 opacity-0 transition-opacity duration-150 peer-data-[state=open]:opacity-100"
              >
                <Image src="/icons/menu-pointer.svg" alt="" width={18} height={16} />
              </span>

              {/* pt-[27px] places the panel where Figma has it and keeps the gap hoverable, so the menu doesn't close crossing it. */}
              <NavigationMenu.Content className="absolute top-full -left-1 z-50 origin-top-left pt-[27px] data-[state=closed]:animate-menu-out data-[state=open]:animate-menu-in">
                {item.kind === "mega" ? (
                  <MegaMenuPanel groups={item.groups} />
                ) : (
                  <div className="rounded-menu border border-slate-200 bg-white py-6 pr-12 pl-6 shadow-overlay">
                    <ul className="flex min-w-40 flex-col gap-4">
                      {item.links.map((link) => (
                        <li key={link.label}>
                          <SubLink link={link} />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </NavigationMenu.Content>
            </NavigationMenu.Item>
          );
        })}
      </NavigationMenu.List>
    </NavigationMenu.Root>
  );
}
