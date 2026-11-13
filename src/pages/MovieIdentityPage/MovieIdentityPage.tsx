import { useNavigate } from 'react-router';
import type { MovieIdentity } from '../../api/roomsApi.ts';
import AccountLayout from '../../components/AccountLayout/AccountLayout.tsx';
import { ArrowIcon, PersonIcon, ThumbDownIcon } from '../../components/AccountLayout/icons.tsx';
import BrandButton from '../../components/BrandButton/BrandButton.tsx';
import GenreDonut from '../../components/GenreDonut/GenreDonut.tsx';
import { GENRE_COLORS, toSlices } from '../../components/GenreDonut/slices.ts';
import { StarIcon } from '../../components/MovieCard/MovieCard.tsx';
import { useMovieIdentity } from '../../hooks/useAccountData.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { ROUTES } from '../../routes.ts';
import { getBarWidth, getInitials, pickDecades } from '../../utils/identityFormat.ts';
import './MovieIdentityPage.css';

const ACTORS_COUNT = 4;
const AVATAR_COLORS = ['#b18aff', '#fdec8d', '#9ddcff', '#a8e0c0'];
/** Bar lengths of the "Favorite era" card while there is nothing to show (mockup "empty"). */
const GHOST_BARS = [20, 31, 67, 55];

/** The big card: the ring of liked genres with its legend, or "No data yet". */
function GenreMix({ identity }: { identity: MovieIdentity }) {
  const navigate = useNavigate();
  const slices = toSlices(identity.genreMix);
  const hasData = slices.length > 0;

  return (
    <section className="identity-card identity-mix" aria-labelledby="identity-mix-title">
      <h3 className="identity-mix__title" id="identity-mix-title">
        Your genre mix
      </h3>
      <p className="identity-mix__lead">
        {hasData ? 'Based on the movies you’ve liked' : 'No data yet'}
      </p>
      {hasData ? (
        <div className="identity-mix__chart">
          <GenreDonut
            genres={identity.genreMix}
            total={identity.likedCount}
            totalLabel={identity.likedCount === 1 ? 'liked movie' : 'liked movies'}
            size={360}
          />
          <ul className="identity-legend">
            {slices.map((genre, index) => (
              <li key={genre.name}>
                <span
                  className="identity-legend__dot"
                  style={{ background: GENRE_COLORS[index] }}
                />
                <span className="identity-legend__name">{genre.name}</span>
                <span>{Math.round(genre.percent)}%</span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="identity-mix__empty">
          <GenreDonut genres={[]} total={0} totalLabel="No data yet" size={295} isPlaceholder />
          <p>Like a few movies to see genre distribution</p>
          <BrandButton className="identity-mix__button" onClick={() => navigate(ROUTES.createRoom)}>
            Start a session
            <ArrowIcon />
          </BrandButton>
        </div>
      )}
    </section>
  );
}

function Era({ identity }: { identity: MovieIdentity }) {
  const decades = pickDecades(identity.decadeMix);
  const hasData = decades.length > 0;
  const top = Math.max(...decades.map((item) => item.percent), 0);

  return (
    <section className="identity-card identity-era" aria-labelledby="identity-era-title">
      <h3 className="identity-card__title" id="identity-era-title">
        Favorite era
      </h3>
      <p className="identity-card__lead">
        {hasData ? 'Eras of the movies you liked' : 'We’ll show this after a few likes'}
      </p>
      {hasData ? (
        <ul className="identity-bars">
          {decades.map((item) => (
            <li key={item.decade}>
              <span className="identity-bars__label">{item.label}</span>
              <span className="identity-bars__track">
                <span
                  className={
                    item.decade === identity.favoriteDecade?.decade
                      ? 'identity-bars__fill identity-bars__fill--top'
                      : 'identity-bars__fill'
                  }
                  style={{ width: `${getBarWidth(item.percent, top)}%` }}
                />
              </span>
              <span className="identity-bars__value">{Math.round(item.percent)}%</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="identity-bars identity-bars--ghost" aria-hidden="true">
          {GHOST_BARS.map((width) => (
            <li key={width}>
              <span className="identity-bars__label" />
              <span className="identity-bars__track">
                <span className="identity-bars__fill" style={{ width: `${width}%` }} />
              </span>
              <span className="identity-bars__value" />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Faces({ identity }: { identity: MovieIdentity }) {
  const actors = identity.favoriteActors.slice(0, ACTORS_COUNT);
  const hasData = actors.length > 0;

  return (
    <section className="identity-card identity-faces" aria-labelledby="identity-faces-title">
      <h3 className="identity-card__title" id="identity-faces-title">
        Faces you like
      </h3>
      <p className="identity-card__lead">
        {hasData
          ? 'Actors who appear most often in the movies you liked'
          : 'Actors from your liked movies will appear here'}
      </p>
      {hasData ? (
        <ul className="identity-actors">
          {actors.map((actor, index) => (
            <li key={actor.name}>
              <span
                className="identity-actors__avatar"
                style={{ background: AVATAR_COLORS[index] }}
                aria-hidden="true"
              >
                {getInitials(actor.name)}
              </span>
              <span className="identity-actors__name">{actor.name}</span>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="identity-actors identity-actors--ghost" aria-hidden="true">
          {AVATAR_COLORS.map((color) => (
            <li key={color}>
              <span className="identity-actors__avatar">
                <PersonIcon />
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Identity({ identity }: { identity: MovieIdentity }) {
  return (
    <div className="identity-grid">
      <GenreMix identity={identity} />
      <div className="identity-grid__side">
        <div className="identity-facts">
          <section className="identity-card identity-fact">
            <StarIcon size={42} />
            <p>
              <span className="identity-fact__label">Favorite genre</span>
              <strong>{identity.favoriteGenre?.name ?? '-'}</strong>
            </p>
          </section>
          <section className="identity-card identity-fact">
            <ThumbDownIcon />
            <p>
              <span className="identity-fact__label">Least liked genre</span>
              <strong>{identity.leastLikedGenre?.name ?? '-'}</strong>
            </p>
          </section>
        </div>
        <Era identity={identity} />
        <Faces identity={identity} />
      </div>
    </div>
  );
}

/**
 * /home/movie-identity - the person's taste by their reactions: liked genres, the favourite and
 * the least liked genre, the decades and the actors of the liked movies. Every card has its own
 * "nothing yet" look, so the page works before the first session and after one short session.
 */
export default function MovieIdentityPage() {
  usePageMeta();
  const identity = useMovieIdentity();

  return (
    <AccountLayout>
      <h2 className="identity-head__title">Your movie identity</h2>
      <p className="identity-head__text">
        A look at the genres, eras and people you tend to like based on your reactions
      </p>
      {identity.isPending && <p className="account-message">Loading your movie identity…</p>}
      {identity.isError && (
        <p className="account-message" role="alert">
          Could not load your movie identity.{' '}
          <button type="button" onClick={() => identity.refetch()}>
            Try again
          </button>
        </p>
      )}
      {identity.data && <Identity identity={identity.data} />}
    </AccountLayout>
  );
}
