import { Link, useNavigate } from 'react-router';
import type { MovieIdentity, SessionSummary } from '../../api/roomsApi.ts';
import clapper from '../../assets/account/clapper.webp';
import AccountLayout from '../../components/AccountLayout/AccountLayout.tsx';
import {
  ArrowIcon,
  CalendarIcon,
  HeadIcon,
  HistoryIcon,
  PeopleIcon,
  PlusIcon,
} from '../../components/AccountLayout/icons.tsx';
import BrandButton from '../../components/BrandButton/BrandButton.tsx';
import GenreDonut from '../../components/GenreDonut/GenreDonut.tsx';
import { GENRE_COLORS, toSlices } from '../../components/GenreDonut/slices.ts';
import { StarIcon } from '../../components/MovieCard/MovieCard.tsx';
import { useMovieIdentity, useSessionHistory } from '../../hooks/useAccountData.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { ROUTES } from '../../routes.ts';
import { formatFriends, formatSessionDate, getWinnerLabel } from '../../utils/sessionFormat.ts';
import './HomePage.css';

const RECENT_COUNT = 2;
const LEGEND_COUNT = 4;

/** One row of "Recent sessions": the winner's poster, its title, the date and the group size. */
function RecentSession({ session }: { session: SessionSummary }) {
  const poster = session.winners[0]?.posterUrl;
  return (
    <li className="recent-session">
      <div className="recent-session__poster">{poster && <img src={poster} alt="" />}</div>
      <div className="recent-session__body">
        <p className="recent-session__title">
          <StarIcon size={24} />
          {getWinnerLabel(session.winners)}
        </p>
        <p className="recent-session__meta">
          <span>
            <CalendarIcon />
            {formatSessionDate(session.finishedAt)}
          </span>
          <span>
            <PeopleIcon />
            {formatFriends(session.participantCount)}
          </span>
        </p>
      </div>
    </li>
  );
}

/** Grey bars in place of the content while there is nothing to show yet (first visit). */
function SessionsPlaceholder() {
  return (
    <div className="home-card__ghost" aria-hidden="true">
      {[0, 1].map((row) => (
        <div key={row} className="ghost-row">
          <span className="ghost-row__thumb" />
          <span className="ghost-row__lines" />
          <span className="ghost-row__pill" />
        </div>
      ))}
    </div>
  );
}

function IdentityPlaceholder() {
  return (
    <div className="home-card__ghost home-card__ghost--identity" aria-hidden="true">
      <span className="ghost-donut" />
      <div className="ghost-bars">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

function IdentityPreview({ identity }: { identity: MovieIdentity }) {
  const legend = toSlices(identity.genreMix).slice(0, LEGEND_COUNT);
  return (
    <div className="identity-preview">
      <GenreDonut
        genres={identity.genreMix}
        total={identity.likedCount}
        totalLabel="liked movies"
      />
      <ul className="identity-preview__legend">
        {legend.map((genre, index) => (
          <li key={genre.name}>
            <span className="identity-preview__dot" style={{ background: GENRE_COLORS[index] }} />
            <span className="identity-preview__name">{genre.name}</span>
            <span>{Math.round(genre.percent)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * /home - the signed-in person's dashboard: start a session, the two latest sessions and a
 * preview of the movie identity. Before the first finished session the cards explain what will
 * appear in them (mockup "dashboard (empty)").
 */
export default function HomePage() {
  usePageMeta();
  const navigate = useNavigate();
  const history = useSessionHistory(0, RECENT_COUNT);
  const identity = useMovieIdentity();

  const sessions = history.data?.items ?? [];
  const hasSessions = sessions.length > 0;
  const hasIdentity = Boolean(identity.data && identity.data.genreMix.length > 0);
  // "first visit" only when we know there is no history (not while loading or on an error)
  const isFirstVisit = history.isSuccess && !hasSessions;

  return (
    <AccountLayout greeting={isFirstVisit ? 'Welcome' : 'What to Watch'}>
      <section className="home-start" aria-labelledby="home-start-title">
        <div>
          <h2 className="home-start__title" id="home-start-title">
            {isFirstVisit ? 'Start your first movie session' : 'Start a new movie session'}
          </h2>
          <p className="home-start__text">
            Set your preferences, invite friends and find a movie you’ll all enjoy
          </p>
          <BrandButton className="home-start__button" onClick={() => navigate(ROUTES.createRoom)}>
            Create a room
            <PlusIcon />
          </BrandButton>
        </div>
        <img className="home-start__clapper" src={clapper} width="204" height="166" alt="" />
      </section>

      <div className="home-cards">
        <section className="home-card" aria-labelledby="home-sessions-title">
          <header className="home-card__head">
            <HistoryIcon />
            <h2 className="home-card__title" id="home-sessions-title">
              {hasSessions ? 'Recent sessions' : 'Sessions'}
            </h2>
            {hasSessions && (
              <Link className="home-card__link" to={ROUTES.sessions}>
                View all
                <ArrowIcon />
              </Link>
            )}
          </header>
          <p className="home-card__lead">
            {hasSessions
              ? 'Your recent movie rooms and results'
              : 'Your recent movie rooms and results will appear here after your first session'}
          </p>
          {history.isError && (
            <p className="home-card__error" role="alert">
              Could not load your sessions.{' '}
              <button type="button" onClick={() => history.refetch()}>
                Try again
              </button>
            </p>
          )}
          {hasSessions ? (
            <ul className="home-card__sessions">
              {sessions.map((session) => (
                <RecentSession key={session.id} session={session} />
              ))}
            </ul>
          ) : (
            !history.isError && <SessionsPlaceholder />
          )}
        </section>

        <section className="home-card" aria-labelledby="home-identity-title">
          <header className="home-card__head">
            <HeadIcon />
            <h2 className="home-card__title" id="home-identity-title">
              Movie identity
            </h2>
            {hasIdentity && (
              <Link className="home-card__link" to={ROUTES.movieIdentity}>
                Explore
                <ArrowIcon />
              </Link>
            )}
          </header>
          <p className="home-card__lead">
            {hasIdentity
              ? 'Your taste profile based on rated movies'
              : 'Complete a session to start building your taste profile'}
          </p>
          {identity.isError && (
            <p className="home-card__error" role="alert">
              Could not load your movie identity.{' '}
              <button type="button" onClick={() => identity.refetch()}>
                Try again
              </button>
            </p>
          )}
          {hasIdentity && identity.data ? (
            <IdentityPreview identity={identity.data} />
          ) : (
            !identity.isError && <IdentityPlaceholder />
          )}
        </section>
      </div>
    </AccountLayout>
  );
}
