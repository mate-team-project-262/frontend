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
  formatFriends,
  formatMyLikes,
  formatSessionDate,
  getWinnerLabel,
} from '../../utils/sessionFormat.ts';
import './SessionsPage.css';

/** One finished session: the winner, the group size, the person's own likes and the date. */
function SessionRow({ session }: { session: SessionSummary }) {
  const poster = session.winners[0]?.posterUrl;
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
            {formatMyLikes(session.likedCount, session.ratedCount)}
          </span>
        </p>
        <p className="session-row__meta">
          <span>
            <CalendarIcon />
            {formatSessionDate(session.finishedAt)}
          </span>
        </p>
      </div>
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
