import ButtonLink from "@/components/ui/ButtonLink";

// "Already using SAP, Tally or QuickBooks?" banner, Figma 3008:9632: 1008×292, radius 20, 1px brand
// border, sky gradient, px48 py44. Copy kept exactly as designed, including "We Integrates"; the
// design applies text-transform: capitalize ("Or", "With").
export default function IntegrationsBanner() {
  return (
    <section aria-labelledby="integrations-title" className="container-content">
      <div className="flex flex-col items-center gap-8 overflow-hidden rounded-card border border-brand-500 bg-banner px-6 py-10 sm:gap-10 sm:px-12 sm:py-11">
        <h2
          id="integrations-title"
          className="text-center font-display text-[1.75rem] leading-[2.375rem] font-semibold text-black capitalize sm:text-[2.25rem] sm:leading-[3rem] lg:text-display-xl lg:leading-[3.75rem]"
        >
          Already Using SAP, Tally or QuickBooks? <span className="block text-accent-large">We Integrates with All!</span>
        </h2>
        <ButtonLink href="#demo" className="h-11 px-8">
          Get A Free Demo
        </ButtonLink>
      </div>
    </section>
  );
}
