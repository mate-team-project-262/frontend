import { cx } from '../../utils/classNames.js';
import './TasteProfileCard.css';

function Stat({ label, value, note, wide = false }) {
  return (
    <div className={cx('taste-card__stat', wide && 'taste-card__stat--wide')}>
      <span className="taste-card__stat-label">{label}</span>
      <b className="taste-card__stat-value">{value}</b>
      {note && <span className="taste-card__stat-label">{note}</span>}
    </div>
  );
}

export default function TasteProfileCard({ profile }) {
  return (
    <section className="taste-card" aria-label="Taste profile example">
      <h3 className="taste-card__title">Your taste profile</h3>
      <p className="taste-card__subtitle">What the service learns from your swipes</p>

      <Stat
        wide
        label="Viewer profile"
        value={profile.viewerType}
        note={profile.viewerDescription}
      />
      <div className="taste-card__stats">
        <Stat label="Top genre" value={profile.topGenre} />
        <Stat label="Least liked" value={profile.leastLikedGenre} />
      </div>

      <div className="taste-card__mix">
        <div className="taste-card__donut" />
        <div className="taste-card__mix-legend">
          <h4 className="taste-card__mix-title">Genre mix</h4>
          <ul className="taste-card__mix-list">
            {profile.genreMix.map(([genre, percent]) => (
              <li key={genre}>
                {genre} {percent}%
              </li>
            ))}
          </ul>
        </div>
      </div>

      <h4 className="taste-card__faces-title">Faces you like</h4>
      <ul className="taste-card__faces">
        {profile.actors.map((actor) => (
          <li key={actor} className="taste-card__face">
            {actor}
          </li>
        ))}
      </ul>
    </section>
  );
}
