"use client";

import * as Accordion from "@radix-ui/react-accordion";
import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import Logo from "@/components/Logo";
import ButtonLink from "@/components/ui/ButtonLink";
import { CaretDown, CloseIcon, MenuIcon } from "@/components/icons";
import { ACTIVE, NAV_ITEMS, preventNavigation, type NavLink } from "./nav-data";

// Below 1200px: slide-in drawer (Radix Dialog → focus trap, body scroll lock, Escape, focus
// returns to the menu button) with each menu as an accordion. Touch targets are ≥ 44px.
export default function MobileNav() {
  const [open, setOpen] = useState(false);

  // If the viewport grows to desktop while the drawer is open, close it.
  useEffect(() => {
    const query = window.matchMedia("(min-width: 75rem)");
    const onChange = (e: MediaQueryListEvent) => e.matches && setOpen(false);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, []);

  const followLink = (event: React.MouseEvent) => {
    preventNavigation(event);
    setOpen(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger
        aria-label="Open menu"
        className="flex size-12 items-center justify-center rounded-full bg-white text-brand-700 transition-colors hover:bg-nublue-200"
      >
        <MenuIcon />
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-slate-900/40 data-[state=closed]:animate-fade-out data-[state=open]:animate-fade-in" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-y-0 right-0 z-50 flex w-[min(100%,24rem)] flex-col bg-page shadow-overlay data-[state=closed]:animate-drawer-out data-[state=open]:animate-drawer-in"
        >
          <Dialog.Title className="sr-only">Menu</Dialog.Title>

          <div className="flex items-center justify-between px-4 pt-4 pb-2">
            <Logo size="sm" />
            <Dialog.Close
              aria-label="Close menu"
              className="flex size-11 items-center justify-center rounded-full text-slate-900 transition-colors hover:bg-nublue-200"
            >
              <CloseIcon />
            </Dialog.Close>
          </div>

          <nav aria-label="Primary" className="flex-1 overflow-y-auto overscroll-contain px-4 py-2">
            <Accordion.Root type="single" collapsible defaultValue={ACTIVE.item}>
              {NAV_ITEMS.map((item) => {
                const isActive = item.id === ACTIVE.item;
                const rowText = isActive ? "font-semibold text-accent-500" : "font-medium text-black";

                if (item.kind === "link") {
                  return (
                    <a
                      key={item.id}
                      href={item.href}
                      onClick={followLink}
                      className={`flex min-h-12 items-center border-b border-slate-200 px-2 text-base ${rowText}`}
                    >
                      {item.label}
                    </a>
                  );
                }

                return (
                  <Accordion.Item key={item.id} value={item.id} className="border-b border-slate-200">
                    <Accordion.Header>
                      <Accordion.Trigger
                        className={`group flex min-h-12 w-full items-center justify-between px-2 text-left text-base ${rowText}`}
                      >
                        {item.label}
                        <CaretDown
                          strokeWidth={1.5}
                          className="size-5 transition-transform duration-200 group-data-[state=open]:rotate-180"
                        />
                      </Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                      <div className="pb-3">
                        {item.kind === "mega" ? (
                          item.groups.map((group) => (
                            <div key={group.label} className="mt-2 first:mt-0">
                              <p className="px-3 pt-2 pb-1 text-xs font-semibold tracking-wide text-slate-900 uppercase">
                                {group.label}
                              </p>
                              <DrawerLinks
                                links={group.links}
                                activeLabel={group.label === ACTIVE.group ? ACTIVE.link : undefined}
                                onFollow={followLink}
                              />
                            </div>
                          ))
                        ) : (
                          <DrawerLinks links={item.links} onFollow={followLink} />
                        )}
                      </div>
                    </Accordion.Content>
                  </Accordion.Item>
                );
              })}
            </Accordion.Root>
          </nav>

          <div className="grid gap-3 border-t border-slate-200 p-4">
            <ButtonLink href="#demo" variant="outline" onClick={() => setOpen(false)}>
              Try it for Free
            </ButtonLink>
            <ButtonLink href="#demo" onClick={() => setOpen(false)}>
              Get Free Demo
            </ButtonLink>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function DrawerLinks({
  links,
  activeLabel,
  onFollow,
}: {
  links: NavLink[];
  activeLabel?: string;
  onFollow: (event: React.MouseEvent) => void;
}) {
  return (
    <ul>
      {links.map((link) => {
        const isActive = link.label === activeLabel;
        return (
          <li key={link.label}>
            <a
              href={link.href}
              onClick={onFollow}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 items-center rounded-field px-3 text-[0.9375rem] transition-colors hover:bg-nublue-200 ${
                isActive ? "font-semibold text-nublue-800" : "text-ink-menu"
              }`}
            >
              {link.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
