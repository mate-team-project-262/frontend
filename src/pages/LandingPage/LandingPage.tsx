import { SEO } from '../../data/seo.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import AccountBenefits from '../../sections/AccountBenefits/AccountBenefits.tsx';
import CtaBanner from '../../sections/CtaBanner/CtaBanner.tsx';
import Hero from '../../sections/Hero/Hero.tsx';
import HowItWorks from '../../sections/HowItWorks/HowItWorks.tsx';
import '../../styles/landing.css';

export default function LandingPage() {
  usePageMeta(SEO.home);

  return (
    <main className="landing">
      <Hero />
      <HowItWorks />
      <AccountBenefits />
      <CtaBanner />
    </main>
  );
}
