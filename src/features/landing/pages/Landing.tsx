import HeroSection from '../components/HeroSection';
import {
  DashboardFinalCTA,
  MyanmarCheckout,
  SellEverywhere,
  StopSellingThroughChat,
  ThemeShowcase,
  ThreeStepStoreCreation,
} from '../components/HomeSections';
import './landing.css';

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
        <DashboardFinalCTA />
        <footer className="landing-footer">
          <strong>MiniShop</strong>
          <span>Myanmar Online Business ကို ပိုလွယ်ကူအောင် ♡</span>
        </footer>
      </div>
    </main>
  );
}
