import { useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import {
  DemoStoreShowcase,
  FaqSection,
  MyanmarCheckout,
  PricingSection,
} from '../components/HomeSections';
import './landing.css';
import './landing-burmese-fix.css';
import './landing-demo-mockup.css';

export default function Landing() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (typeof IntersectionObserver === 'undefined') {
      document.querySelectorAll('.fade-up').forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const elements = document.querySelectorAll('.fade-up');
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <main className="landing">
      <div className="landing-shell">
        <HeroSection />
        <MyanmarCheckout />
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
