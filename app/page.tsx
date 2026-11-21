import Footer from "@/components/footer/Footer";
import Header from "@/components/header/Header";
import IntegrationsBanner from "@/components/IntegrationsBanner";
import LeadSection from "@/components/lead/LeadSection";
import RoiCalculator from "@/components/roi/RoiCalculator";

export default function Home() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-field focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Header />
      {/* 120px between header and first section, the same rhythm as between sections (assumptions R6). */}
      <main id="main" className="flex flex-col gap-20 pt-16 pb-20 sm:gap-30 sm:pt-30 sm:pb-30">
        <IntegrationsBanner />
        <RoiCalculator />
        <LeadSection />
      </main>
      <Footer />
    </>
  );
}
