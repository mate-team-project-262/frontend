import Button from '../../components/Button/Button.jsx';
import { onCreateRoom, onJoinRoom } from '../../handlers.js';
import './Hero.css';

export default function Hero() {
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
            <Button onClick={onCreateRoom}>Create a room</Button>
            <Button variant="ghost" onClick={onJoinRoom}>
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
