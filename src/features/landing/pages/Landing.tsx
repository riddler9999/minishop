import {Link} from 'react-router-dom';
import HeroSection from '../components/HeroSection';
import HowItWorks from '../components/HowItWorks';
import UseCases from '../components/UseCases';
import './landing.css';

export default function Landing() {
  return (
    <main className="landing">
      <nav className="nav">
        <div className="brand">
          ▢ <b>MiniShop</b>
        </div>

        <div className="links">
          <a href="#how">ဘယ်လိုအလုပ်လုပ်လဲ</a>
          <a href="#use">အသုံးပြုနိုင်တာများ</a>
          <Link to="/admin/login">Login</Link>
          <Link className="btn small" to="/admin/onboarding">
            ကိုယ့်ဆိုင်ကို စဖွင့်မယ် →
          </Link>
        </div>
      </nav>

      <HeroSection />
      <HowItWorks />
      <UseCases />
    </main>
  );
}
