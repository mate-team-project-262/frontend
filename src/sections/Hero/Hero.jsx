import { useNavigate } from 'react-router';
import Button from '../../components/Button/Button.jsx';
import { ROUTES } from '../../routes.js';
import './Hero.css';

export default function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__content">
          <h1 className="title title--xl hero__title">Stop arguing about what to watch</h1>
          <p className="hero__lead">
            Create a room, invite your friends and find the movie your group agrees on — no account
            required
          </p>
          <div className="hero__actions">
            <Button onClick={() => navigate(ROUTES.createRoom)}>Create a room</Button>
            <Button variant="ghost" onClick={() => navigate(ROUTES.join)}>
              Join a room
            </Button>
          </div>
          <p className="hero__note">Guests can start immediately. Registration stays optional.</p>
        </div>

        <div className="room-preview">
          <b className="room-preview__title">ROOM PREVIEW</b>
          <span className="room-preview__meta">20 movies • group session</span>
        </div>
      </div>
    </section>
  );
}
