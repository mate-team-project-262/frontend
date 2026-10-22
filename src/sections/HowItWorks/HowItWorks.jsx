import { HOW_IT_WORKS_STEPS } from '../../data/content.js';
import './HowItWorks.css';

export default function HowItWorks() {
  return (
    <section className="how-it-works" id="how-it-works">
      <div className="container">
        <h2 className="title title--l">How it works</h2>
        <p className="how-it-works__intro">The core flow is intentionally simple:</p>
        <ol className="how-it-works__steps">
          {HOW_IT_WORKS_STEPS.map(({ title, text }, index) => (
            <li key={title} className="step-card">
              <span className="step-card__number">{index + 1}</span>
              <h3 className="step-card__title">{title}</h3>
              <p className="step-card__text">{text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
