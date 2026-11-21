"use client";

import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight } from "@/components/icons";
import { ACTIVE, preventNavigation, type MegaGroup, type NavLink } from "./nav-data";

// Solutions mega menu, Figma 3008:9976 ("Platform"): a left "Sub nav list" of groups and a
// right "Third child list" showing the selected group's links. Hovering or focusing a group
// selects it. Opens on the page's active group (Capabilities).
export default function MegaMenuPanel({ groups }: { groups: MegaGroup[] }) {
  const initial = Math.max(
    0,
    groups.findIndex((g) => g.label === ACTIVE.group),
  );
  const [selected, setSelected] = useState(initial);
  const current = groups[selected];

  return (
    <div className="flex rounded-menu shadow-overlay">
      <ul className="flex flex-col gap-3 rounded-l-menu border border-slate-200 bg-slate-50 p-6">
        {groups.map((group, index) => {
          const isSelected = index === selected;
          return (
            <li key={group.label}>
              <NavigationMenu.Link
                href="#"
                onClick={preventNavigation}
                onPointerEnter={() => setSelected(index)}
                onFocus={() => setSelected(index)}
                data-selected={isSelected || undefined}
                className="flex w-50 items-center gap-3 rounded-2xl py-1 pr-4 pl-1 transition-colors duration-150 data-[selected]:rounded-menu-item data-[selected]:bg-nublue-200"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-field bg-white">
                  {isSelected ? (
                    <Image src="/icons/seal-check-active.svg" alt="" width={24} height={24} />
                  ) : (
                    <Image src="/icons/seal-check.svg" alt="" width={20} height={20} />
                  )}
                </span>
                <span
                  className={`text-[0.9375rem] leading-6 ${isSelected ? "font-semibold text-nublue-800" : "font-medium text-slate-900"}`}
                >
                  {group.label}
                </span>
              </NavigationMenu.Link>
            </li>
          );
        })}
      </ul>

      <div className="rounded-r-menu border-y border-r border-slate-200 bg-white py-6 pr-12 pl-6">
        <ul key={current.label} aria-label={current.label} className="flex animate-fade-in flex-col gap-4">
          {current.links.map((link) => (
            <li key={link.label}>
              <SubLink link={link} active={current.label === ACTIVE.group && link.label === ACTIVE.link} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// Right-column / dropdown link: Inter 14/22 #48586A; hover, focus and active go semibold #0053B5
// with a 16px arrow (Figma "Data Processing →"). bold-stable stops the weight change shifting layout.
export function SubLink({ link, active = false }: { link: NavLink; active?: boolean }) {
  return (
    <NavigationMenu.Link
      href={link.href}
      onClick={preventNavigation}
      active={active}
      className="group/sub flex items-center rounded-field py-1.5 pr-4 text-menu whitespace-nowrap text-ink-menu transition-colors duration-150 hover:font-semibold hover:text-nublue-800 focus-visible:font-semibold focus-visible:text-nublue-800 data-[active]:font-semibold data-[active]:text-nublue-800"
    >
      <span className="bold-stable relative" data-label={link.label}>
        {link.label}
        {/* Absolutely placed 6px after the label so it doesn't widen the column (Figma sizes the list to the text). */}
        <ArrowRight className="absolute top-1/2 left-[calc(100%+6px)] size-4 -translate-x-1 -translate-y-1/2 text-nublue-800 opacity-0 transition duration-150 group-hover/sub:translate-x-0 group-hover/sub:opacity-100 group-focus-visible/sub:translate-x-0 group-focus-visible/sub:opacity-100 group-data-[active]/sub:translate-x-0 group-data-[active]/sub:opacity-100" />
      </span>
    </NavigationMenu.Link>
  );
}
