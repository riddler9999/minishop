import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import UseCases from '../components/UseCases';
import './landing.css';

export default function Landing() {
  return (
    <main className="landing">
      <div className="landing-shell">
        <HeroSection />
        <HowItWorks />
        <UseCases />
        <footer className="landing-footer">
          <strong>MiniShop</strong>
          <span>Myanmar Online Business ကို ပိုလွယ်ကူအောင် ♡</span>
        </footer>
      </div>
    </main>
  );
}
