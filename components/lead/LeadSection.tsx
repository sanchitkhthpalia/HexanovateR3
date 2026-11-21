import Image from "next/image";
import Logo from "@/components/Logo";
import LeadForm from "./LeadForm";
import LogoMarquee from "./LogoMarquee";

// Rating badge (Figma 3009:10127 / 3009:10147): stars over the score, 36px round logo on the right.
// Figma builds this as a 180°-rotated group, so the exported star strip is upside down; rotating it
// back puts the partial star at the end, as the design shows.
function Rating({ badge, score, stars, label }: { badge: string; score: string; stars: string; label: string }) {
  return (
    <div className="flex items-center gap-3" role="img" aria-label={label}>
      <div className="flex flex-col items-end gap-1">
        <Image src={stars} alt="" width={82} height={15} className="rotate-180" />
        <span className="text-[0.875rem] leading-5 text-black">{score}</span>
      </div>
      <Image src={badge} alt="" width={36} height={36} unoptimized className="rounded-full" />
    </div>
  );
}

// Lead generation section, Figma 3009:10045 ("Lead Generation Form 2 folds"): a 1008×656 card,
// left panel 598px (title, subtitle, trust signals, logo marquee) and the form panel on the right.
// Holds the page's h1: the product headline is the main claim of the page (assumptions Q5).

const TRUST = [
  { strong: "99%*", strongWeight: "font-semibold", rest: "World Class Accuracy" },
  { strong: "Proprietary AI", strongWeight: "font-medium", rest: "for Ultimate Security" },
  { strong: "Pilot Ready", strongWeight: "font-semibold", rest: "in Less than 7 Hours*" },
];

export default function LeadSection() {
  return (
    <section id="demo" aria-labelledby="lead-title" className="container-content">
      <div className="flex flex-col overflow-hidden rounded-card bg-lead-card lg:min-h-[656px] lg:flex-row">
        {/* Left panel */}
        <div className="flex flex-col justify-between gap-10 px-6 pt-8 pb-8 sm:px-10 sm:pt-10 lg:w-[59.33%] lg:pt-13 lg:pr-[86px] lg:pb-11 lg:pl-13">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-7">
              <Logo />
              <div className="flex flex-col gap-3">
                {/* Figma uses the retired "Be Vietnam"; Be Vietnam Pro sets "With Fraud, Compliance," at 474px vs the
                    460px box, so the heading borrows 20px of the panel's right padding to keep the design's 3-line break. */}
                <h1
                  id="lead-title"
                  className="font-display text-[1.75rem] leading-[2.375rem] font-semibold tracking-[-0.01em] text-black sm:text-[2rem] sm:leading-[2.75rem] lg:-mr-5 lg:text-display-lg"
                >
                  The Only Document AI With Fraud, Compliance, &amp; Audit Checks Built In
                </h1>
                <p className="text-body text-ink-body">
                  No templates. No setup calls. See your documents, processed live, right now.
                </p>
              </div>
            </div>

            <ul className="flex flex-col gap-2 pl-3">
              {TRUST.map((item) => (
                <li key={item.strong} className="flex items-center gap-3 text-trust">
                  <Image src="/icons/check-badge.svg" alt="" width={20} height={20} className="shrink-0" />
                  <span>
                    <span className={`${item.strongWeight} text-ink-strong`}>{item.strong}</span>{" "}
                    <span className="text-ink-body">{item.rest}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <LogoMarquee />
        </div>

        {/* Right panel (Figma 3009:10092) */}
        <div className="flex min-w-0 flex-1 flex-col items-end justify-center gap-7 border-panel-border bg-panel px-6 py-7 sm:px-[31px] lg:rounded-r-card lg:border-y lg:border-r">
          <p className="w-full text-right font-display text-tagline font-medium text-black">
            Bring your messiest documents.
            <br />
            We&apos;ll process them live.
          </p>

          <div className="flex w-full flex-col items-end gap-6">
            <LeadForm />

            <div className="flex flex-wrap items-center justify-end gap-x-8 gap-y-3">
              <Rating badge="/images/badge-g2.webp" score="4.9/5 G2" stars="/images/stars-g2.svg" label="Rated 4.9 out of 5 on G2" />
              <Rating
                badge="/images/badge-trustpilot.webp"
                score="4.7/5 Trustpilot"
                stars="/images/stars-trustpilot.svg"
                label="Rated 4.7 out of 5 on Trustpilot"
              />
            </div>

            <div className="flex w-full flex-col gap-4">
              <Image src="/images/divider-form.svg" alt="" width={349} height={1} className="h-px w-full" />
              <p className="text-right text-note font-light text-black italic">All your data is safe and secure with us!</p>
              {/* Not in the design: consent/privacy line required for collecting PII (assumptions L9). */}
              <p className="-mt-2 text-right text-xs leading-5 text-ink-muted">
                By submitting, you agree to our{" "}
                <a href="#" className="text-brand-500 underline-offset-2 hover:underline">
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
