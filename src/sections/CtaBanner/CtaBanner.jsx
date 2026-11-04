import { useNavigate } from 'react-router';
import BrandButton from '../../components/BrandButton/BrandButton.jsx';
import dune from '../../assets/landing/poster-dune.webp';
import animals from '../../assets/landing/poster-animals.webp';
import f1 from '../../assets/landing/poster-f1.webp';
import housemaid from '../../assets/landing/poster-housemaid.webp';
import interstellar from '../../assets/landing/poster-interstellar.webp';
import lotr from '../../assets/landing/poster-lotr.webp';
import spiderMan from '../../assets/landing/poster-spider-man.webp';
import { ROUTES } from '../../routes.js';
import './CtaBanner.css';

// Natural widths in the 1440px design: 211 + 5 x 200 + 229 = 1440. The strip keeps these proportions,
// stays at least 1440px wide (cropped in the middle on narrow screens) and grows on wider ones,
// so it always runs edge to edge and no extra posters show up at the sides.
const POSTERS = [
  { src: spiderMan, width: 211 },
  { src: animals, width: 200 },
  { src: f1, width: 200 },
  { src: interstellar, width: 200 },
  { src: dune, width: 200, lowered: true }, // sits 21px lower in the design
  { src: lotr, width: 200 },
  { src: housemaid, width: 229 },
];
const DESIGN_WIDTH = 1440;
const toPercent = (px) => `${(px / DESIGN_WIDTH) * 100}%`;

export default function CtaBanner() {
  const navigate = useNavigate();

  return (
    <section className="cta-banner">
      <div className="cta-banner__posters" aria-hidden="true">
        {POSTERS.map(({ src, width, lowered }) => (
          <img
            key={src}
            className="cta-banner__poster"
            src={src}
            alt=""
            draggable={false}
            style={{ width: toPercent(width), marginBottom: lowered ? toPercent(-21) : undefined }}
          />
        ))}
      </div>
      <div className="cta-banner__bowl" />

      <div className="container cta-banner__inner">
        <h2 className="cta-banner__title">Ready for movie night?</h2>
        <p className="cta-banner__text">
          Start as a guest now. You can create an account later if the extra features are useful to
          you.
        </p>
        <BrandButton className="cta-banner__button" onClick={() => navigate(ROUTES.createRoom)}>
          Start
        </BrandButton>
      </div>
    </section>
  );
}
