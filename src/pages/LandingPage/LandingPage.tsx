import { useEffect } from 'react';
import { useLocation } from 'react-router';
import { SEO } from '../../data/seo.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { scrollToSection } from '../../utils/scrollToSection.ts';
import AccountBenefits from '../../sections/AccountBenefits/AccountBenefits.tsx';
import CtaBanner from '../../sections/CtaBanner/CtaBanner.tsx';
import Hero from '../../sections/Hero/Hero.tsx';
import HowItWorks from '../../sections/HowItWorks/HowItWorks.tsx';
import '../../styles/landing.css';

export default function LandingPage() {
  usePageMeta(SEO.home);

  // "How it works" / "Account benefits" pressed on another page: scroll once the page is here
  const { state } = useLocation();
  const scrollTo = (state as { scrollTo?: string } | null)?.scrollTo;
  useEffect(() => {
    if (scrollTo) scrollToSection(scrollTo);
  }, [scrollTo]);

  return (
    <main className="landing">
      <Hero />
      <HowItWorks />
      <AccountBenefits />
      <CtaBanner />
    </main>
  );
}
