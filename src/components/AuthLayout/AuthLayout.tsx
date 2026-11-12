import type { ReactNode } from 'react';
import animals from '../../assets/landing/poster-animals.webp';
import dune from '../../assets/landing/poster-dune.webp';
import f1 from '../../assets/landing/poster-f1.webp';
import housemaid from '../../assets/landing/poster-housemaid.webp';
import interstellar from '../../assets/landing/poster-interstellar.webp';
import lotr from '../../assets/landing/poster-lotr.webp';
import spiderMan from '../../assets/landing/poster-spider-man.webp';
import '../../styles/landing.css';
import LandingHeader from '../LandingHeader/LandingHeader.tsx';
import './AuthLayout.css';

// Poster strip of the 1440px frame: widths in px; the three in the middle are behind the card.
const POSTERS = [
  { src: spiderMan, width: 250 },
  { src: animals, width: 215 },
  { src: f1, width: 182 },
  { src: dune, width: 181 },
  { src: lotr, width: 182 },
  { src: housemaid, width: 215 },
  { src: interstellar, width: 215 },
];
const DESIGN_WIDTH = 1440;

interface Props {
  title: string;
  /** one or two lines under the title */
  subtitle?: ReactNode;
  /** `center` = the short confirmation cards ("Check your email", "Password updated") */
  align?: 'start' | 'center';
  children: ReactNode;
}

/**
 * Shared page of the account screens (Sign In, Sign Up, password reset): the landing header, a
 * curved strip of posters behind, and a cream card in the middle with the title and the form.
 */
export default function AuthLayout({ title, subtitle, align = 'start', children }: Props) {
  return (
    <div className="auth-page landing">
      <LandingHeader />
      <div className="auth-page__strip" aria-hidden="true">
        {POSTERS.map(({ src, width }) => (
          <img
            key={src}
            className="auth-page__poster"
            src={src}
            alt=""
            draggable={false}
            style={{ width: `${(width / DESIGN_WIDTH) * 100}%` }}
          />
        ))}
      </div>
      <main className="auth-page__main">
        <section
          className={align === 'center' ? 'auth-card auth-card--center' : 'auth-card'}
          aria-labelledby="auth-card-title"
        >
          <h1 className="auth-card__title" id="auth-card-title">
            {title}
          </h1>
          {subtitle && <p className="auth-card__subtitle">{subtitle}</p>}
          {children}
        </section>
      </main>
    </div>
  );
}
