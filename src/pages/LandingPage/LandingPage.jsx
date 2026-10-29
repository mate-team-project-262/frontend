import AccountBenefits from '../../sections/AccountBenefits/AccountBenefits.jsx';
import CtaBanner from '../../sections/CtaBanner/CtaBanner.jsx';
import Hero from '../../sections/Hero/Hero.jsx';
import HowItWorks from '../../sections/HowItWorks/HowItWorks.jsx';
import '../../styles/landing.css';

export default function LandingPage() {
  return (
    <main className="landing">
      <Hero />
      <HowItWorks />
      <AccountBenefits />
      <CtaBanner />
    </main>
  );
}
