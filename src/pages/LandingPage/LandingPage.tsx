import { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router';
import { SEO } from '../../data/seo.ts';
import { useAccount } from '../../hooks/useAccount.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { ROUTES } from '../../routes.ts';
import { scrollToSection } from '../../utils/scrollToSection.ts';
import AccountBenefits from '../../sections/AccountBenefits/AccountBenefits.tsx';
import CtaBanner from '../../sections/CtaBanner/CtaBanner.tsx';
import Hero from '../../sections/Hero/Hero.tsx';
import HowItWorks from '../../sections/HowItWorks/HowItWorks.tsx';
import '../../styles/landing.css';

export default function LandingPage() {
  usePageMeta(SEO.home);

  // a signed-in person has their own home page
  const { status } = useAccount();

  // "How it works" / "Account benefits" pressed on another page: scroll once the page is here
  const { state } = useLocation();
  const scrollTo = (state as { scrollTo?: string } | null)?.scrollTo;
  useEffect(() => {
    if (scrollTo) scrollToSection(scrollTo);
  }, [scrollTo]);

  if (status === 'signed-in') return <Navigate to={ROUTES.dashboard} replace />;

  return (
    <main className="landing">
      <Hero />
      <HowItWorks />
      <AccountBenefits />
      <CtaBanner />
    </main>
  );
}
