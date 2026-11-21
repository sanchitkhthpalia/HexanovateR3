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
      <main id="main" className="flex flex-col gap-30 pb-30">
        <IntegrationsBanner />
        <RoiCalculator />
        <LeadSection />
      </main>
      <Footer />
    </>
  );
}
