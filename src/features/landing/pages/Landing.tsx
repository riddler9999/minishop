import HeroSection from '../components/HeroSection';
import {
  DemoStoreShowcase,
  FaqSection,
  KeyFeatures,
  MyanmarCheckout,
  PricingSection,
} from '../components/HomeSections';
import './landing.css';
import './landing-burmese-fix.css';
import './landing-demo-mockup.css';

export default function Landing() {
  return (
    <main className="landing">
      <div className="landing-shell">
        <HeroSection />
        <MyanmarCheckout />
        <KeyFeatures />
        <DemoStoreShowcase />
        <PricingSection />
        <FaqSection />
        <footer className="landing-footer">
          <strong>MiniShop</strong>
          <span>Myanmar Online Business ကို ပိုလွယ်ကူအောင် ♡</span>
        </footer>
      </div>
    </main>
  );
}
