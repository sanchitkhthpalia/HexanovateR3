import Image from "next/image";
import type { AnchorHTMLAttributes } from "react";

// "Button - 40 - Brand" from Figma: pill CTA with a trailing arrow.
// brand   = blue gradient, white 16px label, 16px arrow (header "Get Free Demo", form, banner, ROI)
// outline = white, brand border, #11529E 15px label, 20px arrow (header "Try it for Free")
type Variant = "brand" | "outline";

interface ButtonLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: Variant;
}

const base =
  "group/cta inline-flex shrink-0 items-center justify-center gap-2 rounded-pill border border-brand-500 px-6 py-[11px] font-semibold whitespace-nowrap " +
  // Tailwind v4 moves elements with the `translate`/`scale` properties, so those (not `transform`) are transitioned.
  "transition-[translate,scale,box-shadow,filter,background-color] duration-200 ease-out hover:-translate-y-px active:translate-y-0 active:scale-[0.98]";

const variants: Record<Variant, string> = {
  brand:
    "bg-cta text-button text-white hover:brightness-110 hover:shadow-[0_10px_20px_-8px_rgb(24_115_222/0.6)]",
  outline:
    "bg-white text-[0.9375rem] leading-6 tracking-[-0.011em] text-brand-700 hover:bg-nublue-200 hover:shadow-[0_8px_16px_-10px_rgb(17_82_158/0.5)]",
};

export default function ButtonLink({ variant = "brand", className = "", children, ...props }: ButtonLinkProps) {
  return (
    <a className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
      {variant === "brand" ? (
        <Image
          src="/icons/arrow-forward-white.webp"
          alt=""
          width={16}
          height={16}
          unoptimized
          className="transition-transform duration-200 group-hover/cta:translate-x-1"
        />
      ) : (
        <Image
          src="/icons/arrow-right-dark.svg"
          alt=""
          width={20}
          height={20}
          className="transition-transform duration-200 group-hover/cta:translate-x-1"
        />
      )}
    </a>
  );
}
