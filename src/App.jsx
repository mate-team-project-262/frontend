import Header from './components/Header/Header.jsx';
import AccountBenefits from './sections/AccountBenefits/AccountBenefits.jsx';
import CtaBanner from './sections/CtaBanner/CtaBanner.jsx';
import Hero from './sections/Hero/Hero.jsx';
import HowItWorks from './sections/HowItWorks/HowItWorks.jsx';

export default function App() {
  return (
    <>
      <Header />
      <main className="page">
        <Hero />
        <HowItWorks />
        <AccountBenefits />
        <CtaBanner />
      </main>
    </>
  );
}
