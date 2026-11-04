import StepsCarousel from '../../components/StepsCarousel/StepsCarousel.jsx';
import step1 from '../../assets/landing/step-1.webp';
import step2 from '../../assets/landing/step-2.webp';
import step3 from '../../assets/landing/step-3.webp';
import step4 from '../../assets/landing/step-4.webp';
import { HOW_IT_WORKS_STEPS } from '../../data/content.js';
import './HowItWorks.css';

// How the designer cropped each photo: width as a share of the card, offset (x, y) as a share of the
// card width, and how much black is laid over it so the white text stays readable.
const STEP_PHOTOS = [
  { image: step1, scale: 1.036, x: -0.0022, y: -0.0211, shade: 0.126 },
  { image: step2, scale: 1, x: 0, y: 0, shade: 0.174 },
  { image: step3, scale: 1, x: 0, y: 0, shade: 0.002 },
  { image: step4, scale: 1, x: 0, y: 0, shade: 0.156 },
];
const STEPS = HOW_IT_WORKS_STEPS.map((step, index) => ({
  ...step,
  number: index + 1,
  ...STEP_PHOTOS[index],
}));

export default function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="container">
        <h2 className="how-it-works__title">How it works</h2>
        <p className="how-it-works__lead">Four simple steps to your movie match</p>
      </div>
      <div className="how-it-works__carousel">
        <StepsCarousel steps={STEPS} label="How it works" />
      </div>
    </section>
  );
}
