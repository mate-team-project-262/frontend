import { useNavigate } from 'react-router';
import BrandButton from '../../components/BrandButton/BrandButton.jsx';
import LandingHeader from '../../components/LandingHeader/LandingHeader.jsx';
import PosterStack from '../../components/PosterStack/PosterStack.jsx';
import { ROUTES } from '../../routes.js';
import './Hero.css';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <LandingHeader />
      <div className="container hero__inner">
        <div className="hero__content">
          <h1 className="hero__title">
            <span className="hero__title-line">Stop arguing about</span>
            <span className="hero__title-accent">What to Watch</span>
          </h1>
          <p className="hero__lead">
            Create a room, invite your friends and find the movie your group agrees on —{' '}
            <strong className="hero__lead-accent">no account required</strong>
          </p>
          <div className="hero__actions">
            <BrandButton className="hero__button" onClick={() => navigate(ROUTES.createRoom)}>
              Create a room
            </BrandButton>
            <BrandButton
              variant="ghost"
              className="hero__button hero__button--wide"
              onClick={() => navigate(ROUTES.join)}
            >
              Join a room
            </BrandButton>
          </div>
          <p className="hero__note">Guests can start immediately. Registration stays optional.</p>
        </div>
        <div className="hero__stack">
          <PosterStack />
        </div>
      </div>
    </section>
  );
}
