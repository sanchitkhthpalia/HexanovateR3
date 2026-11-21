import Image from "next/image";
import Logo from "@/components/Logo";
import LogoMarquee from "./LogoMarquee";

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

        {/* Right panel — form arrives in the next step. */}
        <div className="flex flex-1 flex-col items-end gap-7 border-panel-border bg-panel px-6 py-7 sm:px-[31px] lg:rounded-r-card lg:border-y lg:border-r">
          <p className="w-full text-right font-display text-tagline font-medium text-black">
            Bring your messiest documents.
            <br />
            We&apos;ll process them live.
          </p>
        </div>
      </div>
    </section>
  );
}
