import { Link, useParams } from 'react-router';
import type { SessionCard, SessionDetails, SessionParticipant } from '../../api/roomsApi.ts';
import { errorCode } from '../../api/roomsApi.ts';
import AccountLayout from '../../components/AccountLayout/AccountLayout.tsx';
import { BackIcon, CalendarIcon, HeartIcon } from '../../components/AccountLayout/icons.tsx';
import AccountStats from '../../components/AccountStats/AccountStats.tsx';
import { StarIcon } from '../../components/MovieCard/MovieCard.tsx';
import { CrownIcon } from '../../components/WinnerCard/WinnerCard.tsx';
import { useSessionDetails } from '../../hooks/useAccountData.ts';
import { usePageMeta } from '../../hooks/usePageMeta.ts';
import { ROUTES } from '../../routes.ts';
import { formatRating, formatRuntime } from '../../utils/movieFormat.ts';
import { formatSessionDate, getInitial } from '../../utils/sessionFormat.ts';
import './SessionDetailsPage.css';

/** Avatar colours in the order of the list (mockup: lilac, yellow, blue). */
const AVATAR_COLORS = ['#b18aff', '#fdec8d', '#9ddcff', '#a8e0c0', '#f5b8cb'];

/** The dark card with the movie the group picked (or "No match"). */
function Winner({ winners }: { winners: SessionCard[] }) {
  const winner = winners[0];
  if (!winner) {
    return (
      <section className="session-winner session-winner--none">
        <h3 className="session-winner__title">No match</h3>
        <p className="session-winner__meta">Nobody liked the same movie in this session.</p>
      </section>
    );
  }
  const { title } = winner;
  const meta = [title.year ? String(title.year) : null, formatRuntime(title.runtimeMin)].filter(
    Boolean,
  );
  const rating = formatRating(title.rating);
  return (
    <section className="session-winner">
      <div className="session-winner__poster">
        {title.posterUrl && <img src={title.posterUrl} alt="" />}
      </div>
      <div className="session-winner__body">
        <p className="session-winner__label">
          <CrownIcon />
          Winner
        </p>
        <h3 className="session-winner__title">{title.title}</h3>
        {meta.length > 0 && <p className="session-winner__meta">{meta.join(' • ')}</p>}
        {rating && (
          <p className="session-winner__rating">
            <StarIcon size={20} />
            {rating} / 10
          </p>
        )}
        {winners.length > 1 && (
          <p className="session-winner__tie">
            Tied with{' '}
            {winners
              .slice(1)
              .map((card) => card.title.title)
              .join(', ')}
          </p>
        )}
      </div>
    </section>
  );
}

function Participant({ person, index }: { person: SessionParticipant; index: number }) {
  return (
    <li className="session-person">
      <span
        className="session-person__avatar"
        style={{ background: AVATAR_COLORS[index % AVATAR_COLORS.length] }}
        aria-hidden="true"
      >
        {getInitial(person.name)}
        {person.isHost && <span className="session-person__host">Host</span>}
      </span>
      <span className="session-person__name">
        {person.name}
        {person.isMe && ' (you)'}
        {person.isHost && <span className="visually-hidden">, host</span>}
      </span>
    </li>
  );
}

/** One movie of the deck: the poster, the title and how many people liked it. */
function Movie({ card, people }: { card: SessionCard; people: number }) {
  const liked = card.myVote === true;
  return (
    <li className="session-movie">
      <div className="session-movie__poster">
        {card.title.posterUrl && <img src={card.title.posterUrl} alt="" loading="lazy" />}
      </div>
      <p className="session-movie__title" title={card.title.title}>
        {card.title.title}
      </p>
      <p className="session-movie__likes">
        <HeartIcon filled={liked} />
        <span className="visually-hidden">{liked ? 'You liked it. ' : ''}Likes: </span>
        {card.likes} / {people}
      </p>
    </li>
  );
}

function Details({ details }: { details: SessionDetails }) {
  const { session, participants, cards } = details;
  const people = participants.length || session.participantCount;
  const winners = cards.filter((card) => card.isWinner);

  return (
    <>
      <header className="session-head">
        <h2 className="session-head__title">Session details</h2>
        <p className="session-head__date">
          <CalendarIcon size={28} />
          {formatSessionDate(session.finishedAt)}
        </p>
      </header>

      <div className="session-summary">
        <Winner winners={winners} />
        <div className="session-summary__side">
          <AccountStats
            items={[
              { value: people, label: people === 1 ? 'participant' : 'participants' },
              { value: session.ratedCount, label: 'movies rated' },
              { value: winners[0]?.likes ?? 0, label: 'likes for winner' },
            ]}
          />
          <h3 className="session-summary__title">Participants</h3>
          <ul className="session-people">
            {participants.map((person, index) => (
              <Participant key={`${person.name}-${index}`} person={person} index={index} />
            ))}
          </ul>
        </div>
      </div>

      <section aria-labelledby="session-movies-title">
        <h3 className="session-movies__title" id="session-movies-title">
          All {cards.length} movies in this session
        </h3>
        <ul className="session-movies">
          {cards.map((card) => (
            <Movie key={card.title.id} card={card} people={people} />
          ))}
        </ul>
      </section>
    </>
  );
}

/**
 * /home/sessions/:sessionId - one finished session: the winner, the counters, who played and
 * every movie of the deck with its likes. A filled heart marks the movies this person liked.
 */
export default function SessionDetailsPage() {
  usePageMeta();
  const { sessionId } = useParams();
  const id = /^\d+$/.test(sessionId ?? '') ? Number(sessionId) : null;
  const details = useSessionDetails(id);
  const isMissing = id === null || errorCode(details.error) === 'HISTORY_NOT_FOUND';

  return (
    <AccountLayout>
      <Link className="session-back" to={ROUTES.sessions}>
        <BackIcon />
        Back to Sessions
      </Link>

      {isMissing ? (
        <>
          <h2 className="session-head__title">Session not found</h2>
          <p className="account-message">
            This session is not in your history. It may belong to another account.
          </p>
        </>
      ) : (
        <>
          {details.isPending && <p className="account-message">Loading the session…</p>}
          {details.isError && (
            <p className="account-message" role="alert">
              Could not load this session.{' '}
              <button type="button" onClick={() => details.refetch()}>
                Try again
              </button>
            </p>
          )}
          {details.data && <Details details={details.data} />}
        </>
      )}
    </AccountLayout>
  );
}
