import HeroSection from '../components/HeroSection';
import {
  DashboardFinalCTA,
  MyanmarCheckout,
  PricingSection,
  SellEverywhere,
  StopSellingThroughChat,
  ThemeShowcase,
  ThreeStepStoreCreation,
} from '../components/HomeSections';
import './landing.css';
import './landing-burmese-fix.css';

export default function Landing() {
  return (
    <main className="landing">
      <div className="landing-shell">
        <HeroSection />
        <StopSellingThroughChat />
        <ThreeStepStoreCreation />
        <SellEverywhere />
        <MyanmarCheckout />
        <ThemeShowcase />
        <PricingSection />
        <DashboardFinalCTA />
        <footer className="landing-footer">
          <strong>MiniShop</strong>
          <span>Myanmar Online Business ကို ပိုလွယ်ကူအောင် ♡</span>
        </footer>
      </div>
    </main>
  );
}
