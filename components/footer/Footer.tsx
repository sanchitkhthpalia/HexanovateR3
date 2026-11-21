import Image from "next/image";
import Logo from "@/components/Logo";
import DeadLink from "@/components/ui/DeadLink";
import NewsletterForm from "./NewsletterForm";

// Footer, Figma 3008:9718: full-bleed, top radii 40, sky gradient, 1008px content. Desktop layout
// is as designed (right-aligned link columns); smaller screens stack — docs/assumptions.md F5.
// Links go nowhere (single page), so they keep link semantics but don't jump.

const link = (label: string) => ({ label, href: "#" });

const QUICK_LINKS = ["How it works?", "Check All Document Types", "Pricing", "Integrations"].map(link);

const COLUMNS: { title: string; links: { label: string; href: string }[]; active?: string; width: string }[] = [
  { title: "Industries", links: ["BFSI", "Healthcare", "Telecom", "Manufacturing"].map(link), active: "BFSI", width: "lg:w-[132px]" },
  { title: "Resources", links: ["Blog", "Guides", "Newsroom", "API Documentation", "Product Documentation"].map(link), width: "lg:w-[184px]" },
  { title: "Tools", links: ["Compress PDF", "Merge PDF", "PDF to Image"].map(link), width: "lg:w-[132px]" },
  {
    title: "Capabilities",
    links: ["Document Processing", "Document Interpretation", "Document Extraction", "Straight Through Protocol (STP)"].map(link),
    width: "lg:w-[228px]",
  },
  { title: "Company", links: ["About", "Contact", "Careers"].map(link), width: "lg:w-[148px]" },
];

const SOLUTIONS = { title: "Solutions", links: ["Accounts Payable", "Supply Chain", "Consumer Loans", "ID Card"].map(link) };

const OFFICES = [
  {
    country: "India",
    name: "Lorem ipsum",
    address: ["City Tower, Sixth Floor, 17, Boat Club Road, Pune,", "India"], // line break as in Figma
    phone: { label: "+91 94220 84589", href: "tel:+919422084589" },
    email: "sales@loremispu.com",
    highlight: true,
  },
  {
    country: "USA",
    name: "Lorem ipsum",
    address: ["Lorem ipsum, Inc. 371 Hoes Lane, Suite 200, Piscataway, NJ 08854, USA"],
    phone: { label: "+1 (973) 791-8875", href: "tel:+19737918875" },
    email: "sales@loremispu.com",
    highlight: false,
  },
];

const LEGAL = ["Privacy Policy", "Terms & Conditions", "Cookie Policy", "DPA"];

// Footer links: Inter 15/23 #626262; hover goes brand blue with an underline growing from the right
// (the columns are right-aligned on desktop), press nudges.
const linkClass =
  "relative inline-block text-link text-ink-muted-strong transition-colors duration-150 hover:text-black active:translate-y-px " +
  "after:absolute after:right-0 after:-bottom-0.5 after:h-px after:w-full after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-200 hover:after:scale-x-100 " +
  "max-lg:after:origin-left max-lg:after:left-0";

export default function Footer() {
  return (
    <footer className="relative overflow-hidden rounded-t-[1.5rem] bg-footer sm:rounded-t-footer">
      {/* Blurred brand-blue glow at the top right (Figma "Ellipse 335"). */}
      <Image
        src="/images/footer-glow.svg"
        alt=""
        width={1556}
        height={1406}
        aria-hidden
        className="pointer-events-none absolute -top-[620px] right-[-640px] max-w-none rotate-180 opacity-90"
      />

      <div className="relative container-content pt-14 pb-0 sm:pt-20">
        {/* Row 1: brand + quick links + Solutions */}
        <div className="flex flex-col gap-12 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-6 lg:w-[464px]">
            <DeadLink
              aria-label="KlearStack home"
              className="flex h-12 w-[259px] items-center justify-center rounded-[26px] bg-white transition-shadow hover:shadow-[0_8px_20px_-10px_rgb(17_82_158/0.45)]"
            >
              <Logo size="sm" />
            </DeadLink>
            <div className="flex flex-col gap-3.5">
              <p className="text-[0.875rem] leading-[26px] text-ink-muted-strong">
                Shift supply chain and loan compliance from bottleneck to AI-enabled confidence and operational excellence.
              </p>
              <ul className="flex gap-2.5" aria-label="Social media">
                <SocialIcon label="KlearStack on Instagram" icon="/icons/instagram.webp" size={18} filled />
                <SocialIcon label="Email KlearStack" icon="/icons/mail.webp" width={17} height={14} />
                <SocialIcon label="KlearStack on WhatsApp" icon="/icons/whatsapp.webp" size={18} />
              </ul>
            </div>
          </div>

          <div className="flex flex-col gap-10 sm:flex-row sm:gap-[46px]">
            <nav aria-label="Quick links" className="sm:w-[212px]">
              <ul className="flex flex-col gap-5 lg:items-end">
                {QUICK_LINKS.map((item) => (
                  <li key={item.label} className="w-full">
                    <DeadLink
                      className="group flex items-center gap-2.5 text-[0.9375rem] leading-5 font-medium text-black transition-colors hover:text-brand-700 lg:justify-end"
                    >
                      <span className="max-lg:order-2">{item.label}</span>
                      {/* 2×16 yellow bar (Figma "Seperator"); stretches on hover */}
                      <span
                        aria-hidden
                        className="h-4 w-0.5 bg-accent-500 transition-transform duration-200 group-hover:scale-y-150 max-lg:order-1"
                      />
                    </DeadLink>
                  </li>
                ))}
              </ul>
            </nav>
            <LinkColumn title={SOLUTIONS.title} links={SOLUTIONS.links} width="sm:w-[148px]" />
          </div>
        </div>

        {/* Row 2: five link columns */}
        <div className="mt-12 grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:mt-[60px] lg:flex lg:justify-between">
          {COLUMNS.map((col) => (
            <LinkColumn key={col.title} title={col.title} links={col.links} active={col.active} width={col.width} />
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-16 flex flex-col gap-5 lg:mt-20 lg:flex-row lg:items-center lg:gap-[58px]">
          <h2 className="font-display text-[1.25rem] leading-8 font-normal tracking-[-0.011em] text-black sm:text-title sm:whitespace-nowrap">
            Our Newsletter on Latest Trends
          </h2>
          <NewsletterForm />
        </div>

        <Image src="/images/divider-footer.svg" alt="" width={1008} height={1} className="mt-12 h-px w-full" />

        {/* Offices */}
        <div className="mt-12 grid gap-10 md:grid-cols-2 md:gap-[60px]">
          {OFFICES.map((office) => (
            <address key={office.country} className="flex flex-col gap-[11px] not-italic">
              <div className="flex flex-col gap-1.5">
                <p className="flex items-center gap-2 text-[1.125rem] leading-6 text-black">
                  <span className="font-bold">{office.country}</span>
                  <span aria-hidden className="mx-1 h-4 w-px bg-accent-300" />
                  <span className="font-display font-medium">{office.name}</span>
                </p>
                <p className="text-[0.9375rem] leading-[22px] text-ink-muted-strong">
                  {office.address.map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </div>
              <div className="flex flex-wrap gap-x-7 gap-y-3">
                <ContactLink href={office.phone.href} icon="/icons/call.webp" iconSize={[18, 18]} filled={office.highlight}>
                  {office.phone.label}
                </ContactLink>
                <ContactLink href={`mailto:${office.email}`} icon="/icons/mail.webp" iconSize={[22, 18]}>
                  {office.email}
                </ContactLink>
              </div>
            </address>
          ))}
        </div>

        {/* Legal */}
        <div className="mt-12 flex flex-col gap-3 text-legal sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label="Legal">
            <ul className="flex flex-wrap items-center gap-x-2 gap-y-1">
              {LEGAL.map((item, i) => (
                <li key={item} className="flex items-center gap-2">
                  {i > 0 && (
                    <span aria-hidden className="text-[0.625rem] leading-6 text-brand-500">
                      |
                    </span>
                  )}
                  <DeadLink
                    className="text-brand-700 underline-offset-4 transition-colors hover:text-black hover:underline"
                  >
                    {item}
                  </DeadLink>
                </li>
              ))}
            </ul>
          </nav>
          <p className="text-brand-700">© KlearStack 2026</p>
        </div>

        {/* "Lorem Ipsu" watermark (Figma 3008:9942): 200px Inter Bold gradient text, cut off by the footer edge.
            w-max: background-clip:text only paints inside the box, so the box must be as wide as the text. */}
        <p
          aria-hidden
          className="pointer-events-none mt-6 ml-[50%] w-max -translate-x-[calc(50%-17.5px)] bg-gradient-to-b from-[#d9ebff] from-4% to-sky-300 to-[90.4%] bg-clip-text text-[clamp(4rem,16.6vw,12.5rem)] leading-[1] font-bold whitespace-nowrap text-transparent select-none"
        >
          Lorem Ipsu
        </p>
      </div>
    </footer>
  );
}

function LinkColumn({
  title,
  links,
  active,
  width = "",
}: {
  title: string;
  links: { label: string; href: string }[];
  active?: string;
  width?: string;
}) {
  return (
    <nav aria-labelledby={`footer-${title}`} className={width}>
      <h2 id={`footer-${title}`} className="font-display text-[0.9375rem] leading-5 font-semibold text-black lg:text-right">
        {title}
      </h2>
      <span aria-hidden className="mt-4 block h-px w-6 bg-accent-500 lg:ml-auto" />
      <ul className="mt-4 flex flex-col gap-5 lg:items-end">
        {links.map((item) =>
          item.label === active ? (
            <li key={item.label}>
              {/* Active item: blue pill (Figma "BFSI") */}
              <DeadLink
                aria-current="page"
                className="inline-flex rounded-[20px] bg-brand-500 px-4 py-1 text-[0.9375rem] leading-[23px] font-semibold text-white transition-[background-color,translate] hover:bg-brand-700 active:translate-y-px"
              >
                {item.label}
              </DeadLink>
            </li>
          ) : (
            <li key={item.label} className="lg:text-right">
              <DeadLink className={linkClass}>
                {item.label}
              </DeadLink>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

// Icon glyphs from Figma are white rasters; used as a CSS mask so they can take any colour:
// white on a filled circle, light brand blue on a white one (sampled from the design), white on hover.
function MaskIcon({ src, width, height }: { src: string; width: number; height: number }) {
  return (
    <span
      aria-hidden
      className="block bg-current"
      style={{ width, height, mask: `url(${src}) center / contain no-repeat`, WebkitMask: `url(${src}) center / contain no-repeat` }}
    />
  );
}

function SocialIcon({
  label,
  icon,
  size,
  width = size ?? 18,
  height = size ?? 18,
  filled = false,
}: {
  label: string;
  icon: string;
  size?: number;
  width?: number;
  height?: number;
  filled?: boolean;
}) {
  return (
    <li>
      <DeadLink
        aria-label={label}
        className={`flex size-7 items-center justify-center rounded-full transition-[background-color,color,translate,box-shadow,scale] duration-200 hover:-translate-y-0.5 hover:bg-brand-500 hover:text-white hover:shadow-[0_6px_14px_-4px_rgb(24_115_222/0.6)] active:scale-95 ${
          filled ? "bg-brand-500 text-white" : "bg-white text-brand-300"
        }`}
      >
        <MaskIcon src={icon} width={width} height={height} />
      </DeadLink>
    </li>
  );
}

function ContactLink({
  href,
  icon,
  iconSize,
  filled = false,
  children,
}: {
  href: string;
  icon: string;
  iconSize: [number, number];
  filled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <a href={href} className="group flex items-center gap-2 text-[0.875rem] leading-5">
      <span
        className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-[background-color,color,scale] duration-200 group-hover:bg-brand-700 group-hover:text-white group-active:scale-95 ${
          filled ? "bg-brand-700 text-white" : "bg-white text-brand-300"
        }`}
      >
        <MaskIcon src={icon} width={iconSize[0]} height={iconSize[1]} />
      </span>
      <span
        className={`transition-colors group-hover:text-black ${filled ? "font-medium text-brand-700" : "text-ink-muted-strong"}`}
      >
        {children}
      </span>
    </a>
  );
}
