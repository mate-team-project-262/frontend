import { Link, useNavigate } from 'react-router';
import type { SessionSummary } from '../../api/roomsApi.ts';
import clapper from '../../assets/account/clapper.webp';
import AccountLayout from '../../components/AccountLayout/AccountLayout.tsx';
import {
  CalendarIcon,
  HeartIcon,
  OpenIcon,
  PeopleIcon,
  PlusIcon,
} from '../../components/AccountLayout/icons.tsx';
import AccountStats from '../../components/AccountStats/AccountStats.tsx';
import BrandButton from '../../components/BrandButton/BrandButton.tsx';
import { StarIcon } from '../../components/MovieCard/MovieCard.tsx';
import { useMovieIdentity, useSessionList } from '../../hooks/useAccountData.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { ROUTES, sessionDetailsPath } from '../../routes.ts';
import {
  countHiddenMovies,
  formatFriends,
  formatMyLikes,
  formatWinnerLikes,
  formatSessionDate,
  getWinnerLabel,
} from '../../utils/sessionFormat.ts';
import './SessionsPage.css';

const PREVIEW_COUNT = 3;

/** The small posters of a few movies of the session and "+16" for the rest. */
function SessionPreviews({ session }: { session: SessionSummary }) {
  const previews = session.previews.filter((title) => title.posterUrl).slice(0, PREVIEW_COUNT);
  if (previews.length === 0) return null;
  const hidden = countHiddenMovies({ ...session, previews });
  return (
    <div className="session-row__previews" aria-hidden="true">
      {previews.map((title) => (
        <img key={title.id} src={title.posterUrl ?? undefined} alt="" loading="lazy" />
      ))}
      {hidden > 0 && <span className="session-row__more">+ {hidden}</span>}
    </div>
  );
}

/**
 * One finished session: the winner, the group size, the winner's likes (or the person's own when
 * the backend did not send them), the date and a few posters of the session.
 */
function SessionRow({ session }: { session: SessionSummary }) {
  const winner = session.winners[0];
  const poster = winner?.posterUrl;
  return (
    <li className="session-row">
      <div className="session-row__poster">{poster && <img src={poster} alt="" />}</div>
      <div className="session-row__body">
        <p className="session-row__title">
          <StarIcon size={24} />
          <span>{getWinnerLabel(session.winners)}</span>
        </p>
        <p className="session-row__meta">
          <span>
            <PeopleIcon />
            {formatFriends(session.participantCount)}
          </span>
          <span>
            <HeartIcon filled />
            {winner && winner.likes !== null
              ? formatWinnerLikes(winner.likes, session.participantCount)
              : formatMyLikes(session.likedCount, session.ratedCount)}
          </span>
        </p>
        <p className="session-row__meta">
          <span>
            <CalendarIcon />
            {formatSessionDate(session.finishedAt)}
          </span>
        </p>
      </div>
      <SessionPreviews session={session} />
      <Link className="session-row__link" to={sessionDetailsPath(session.id)}>
        View details
        <OpenIcon />
      </Link>
    </li>
  );
}

/** Mockup "Sessions (empty)": what the page shows before the first finished session. */
function NoSessions() {
  const navigate = useNavigate();
  return (
    <section className="sessions-empty">
      <img src={clapper} width="200" height="162" alt="" />
      <h3 className="sessions-empty__title">No sessions yet</h3>
      <p className="sessions-empty__text">
        Start your first movie room to see your history, winners and group picks here
      </p>
      <BrandButton className="sessions-empty__button" onClick={() => navigate(ROUTES.createRoom)}>
        Create a room
        <PlusIcon />
      </BrandButton>
      <p className="sessions-empty__note">Each session is saved automatically</p>
    </section>
  );
}

/**
 * /home/sessions - "Your movie history": the account's counters and every finished session,
 * newest first, ten at a time.
 */
export default function SessionsPage() {
  usePageMeta();
  const list = useSessionList();
  const identity = useMovieIdentity();

  const sessions = list.data?.pages.flatMap((page) => page.items) ?? [];
  const total = list.data?.pages[0]?.total ?? 0;
  const isEmpty = list.isSuccess && sessions.length === 0;

  return (
    <AccountLayout>
      <header className="sessions-head">
        <div>
          <h2 className="sessions-head__title">Your movie history</h2>
          <p className="sessions-head__text">See your past rooms, winners and reactions</p>
        </div>
        <AccountStats
          items={[
            { value: identity.data?.sessionsCount ?? total, label: 'sessions' },
            { value: identity.data?.ratedCount ?? 0, label: 'movies rated' },
            { value: identity.data?.likedCount ?? 0, label: 'liked' },
          ]}
        />
      </header>

      {list.isError && sessions.length === 0 && (
        <p className="account-message" role="alert">
          Could not load your sessions.{' '}
          <button type="button" onClick={() => list.refetch()}>
            Try again
          </button>
        </p>
      )}

      {isEmpty && <NoSessions />}

      {sessions.length > 0 && (
        <section aria-labelledby="sessions-list-title">
          <h3 className="sessions-list__title" id="sessions-list-title">
            Session history
          </h3>
          <ul className="sessions-list">
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </ul>
          {list.isFetchNextPageError && (
            <p className="account-message" role="alert">
              Could not load more sessions. Please try again.
            </p>
          )}
          {list.hasNextPage && (
            <BrandButton
              variant="light"
              className="sessions-list__more"
              disabled={list.isFetchingNextPage}
              onClick={() => list.fetchNextPage()}
            >
              {list.isFetchingNextPage ? 'Loading…' : 'Show more'}
            </BrandButton>
          )}
        </section>
      )}
    </AccountLayout>
  );
}
