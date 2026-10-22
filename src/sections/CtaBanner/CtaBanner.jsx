import Button from '../../components/Button/Button.jsx';
import { onStart } from '../../handlers.js';
import './CtaBanner.css';

export default function CtaBanner() {
  return (
    <section className="cta-banner">
      <div className="container cta-banner__inner">
        <h2 className="title title--xl">Ready for movie night?</h2>
        <p className="cta-banner__text">
          Start as a guest now. You can create an account later if the extra features are useful to
          you.
        </p>
        <Button onClick={onStart}>Start</Button>
      </div>
    </section>
  );
}
