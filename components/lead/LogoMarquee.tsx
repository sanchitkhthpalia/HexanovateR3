import Image from "next/image";

// Client logo strip, Figma 3009:10082. Pure CSS: the list is rendered twice and the track slides
// by exactly -50% (one copy), so the loop point is seamless. Each copy ends with the same 40px
// gap used between logos, which is what makes -50% land on an identical frame.
// The design's sequence (with its repeats) is used so one copy (~970px) is wider than the
// marquee viewport at every breakpoint; a copy narrower than the viewport would show a gap.
const LOGOS = [
  { src: "/images/logos/landmark-group.webp", alt: "Landmark Group", width: 103, height: 28 },
  { src: "/images/logos/network-international.webp", alt: "Network International", width: 101, height: 17 },
  { src: "/images/logos/elevation-10k.webp", alt: "Elevation 10K", width: 102, height: 28 },
  { src: "/images/logos/landmark-group.webp", alt: "Landmark Group", width: 103, height: 28 },
  { src: "/images/logos/network-international.webp", alt: "Network International", width: 100, height: 17 },
  { src: "/images/logos/elevation-10k.webp", alt: "Elevation 10K", width: 102, height: 28 },
  { src: "/images/logos/konica-minolta.webp", alt: "Konica Minolta", width: 77, height: 46 },
];

function LogoList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul
      aria-hidden={hidden || undefined}
      className={`flex shrink-0 items-center gap-10 pr-10 ${hidden ? "motion-reduce:hidden" : ""}`}
    >
      {LOGOS.map((logo, i) => (
        <li key={i} className="shrink-0">
          {/* Pre-sized 2× WebP (scripts/assets), so no runtime optimisation; lazy by default. */}
          <Image
            src={logo.src}
            alt={hidden ? "" : logo.alt}
            width={logo.width}
            height={logo.height}
            unoptimized
          />
        </li>
      ))}
    </ul>
  );
}

export default function LogoMarquee() {
  return (
    // Mobile: label above so the logos get the full width; side by side from 640px as in the design.
    <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-10">
      <p className="shrink-0 text-[0.9375rem] leading-[1.488] text-black sm:w-[106px]">Used by Many, Loved by All!</p>

      {/* Fixed 46px height (tallest logo) so the strip never shifts layout while images load. */}
      <div className="group relative h-[46px] w-full min-w-0 flex-none overflow-hidden motion-reduce:overflow-x-auto sm:flex-1">
        {/* mix-blend-multiply sits on the track, not the logos: the animated track is its own stacking
            context, so per-logo blending would multiply against transparency and keep the logos' white boxes. */}
        <div
          className="flex h-full w-max animate-marquee mix-blend-multiply group-hover:[animation-play-state:paused] motion-reduce:animate-none"
          style={{ ["--marquee-duration" as string]: "30s" }}
        >
          <LogoList />
          <LogoList hidden />
        </div>
        {/* Right-edge fade from the design (65px, to #D9EAFF). */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-[65px] bg-gradient-to-r from-[rgb(217_234_255/0)] to-[#d9eaff]"
        />
      </div>
    </div>
  );
}
