import { oncePerRoom, secondsSinceSwipeStarted, track } from '../../analytics/analytics.ts';
import type { ResultCard as ResultCardData, Room } from '../../api/roomsApi.ts';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import cinemaPhoto from '../../assets/landing/cinema-bg.webp';
import BrandButton from '../../components/BrandButton/BrandButton.tsx';
import BrandHeader from '../../components/BrandHeader/BrandHeader.tsx';
import MovieDetails from '../../components/MovieDetails/MovieDetails.tsx';
import ResultCard from '../../components/ResultCard/ResultCard.tsx';
import WinnerCard, { ArrowRightIcon } from '../../components/WinnerCard/WinnerCard.tsx';
import WinnersCarousel from '../../components/WinnersCarousel/WinnersCarousel.tsx';
import ClapperIllustration from '../../components/ClapperIllustration/ClapperIllustration.tsx';
import { useRoulette } from '../../hooks/useRoulette.ts';
import { useRoundResults } from '../../hooks/useRoundResults.ts';
import { ROUTES } from '../../routes.ts';
import AccountBenefits from '../../sections/AccountBenefits/AccountBenefits.tsx';
import CtaBanner from '../../sections/CtaBanner/CtaBanner.tsx';
import { cx } from '../../utils/classNames.ts';
import '../../styles/landing.css';
import './ResultsPage.css';

const HIGHLY_RATED_COUNT = 3;
const SESSION_PICKS_PREVIEW = 3;

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

function DiceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="6" width="9.5" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="m8.5 3.6 2.2-2.2a1.6 1.6 0 0 1 2.3 0l3.6 3.6a1.6 1.6 0 0 1 0 2.3l-3.4 3.4"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <circle cx="5.75" cy="10.75" r="1" fill="currentColor" />
      <circle cx="12.6" cy="5.4" r="0.9" fill="currentColor" />
    </svg>
  );
}

/**
 * 08 - Results of the round (room status FINISHED), for everyone in the room:
 *  - one winner: "Tonight's winner";
 *  - several winners (tied for the most likes): "Tonight's winners", a carousel from three on,
 *    and for the HOST "Spin the roulette" - the frontend picks one of them at random (each has the
 *    same chance) and shows "No more excuses - watch this one!";
 *  - nobody liked anything: "No match this round" with all the movies of the session.
 * Then "Also highly rated", the account section and "Not the one?".
 */
export default function ResultsPage({ code, room }: { code: string; room: Room }) {
  const navigate = useNavigate();
  const state = useRoundResults(code);
  const [details, setDetails] = useState<ResultCardData | null>(null);
  const [showAll, setShowAll] = useState(false);
  const picksRef = useRef<HTMLElement>(null);

  const isHost = Boolean(room.participants.find((person) => person.isMe)?.isHost);
  const results = state.results;
  const winners = useMemo(() => results?.winners ?? [], [results]);
  const noMatch = state.status === 'ready' && winners.length === 0;
  const roulette = useRoulette(code, winners);
  const picked = roulette.picked;
  const showPick = Boolean(picked) && !roulette.isSpinning;

  // show the pick from the top of the page once the roulette has stopped
  useEffect(() => {
    if (picked) window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [picked]);

  // analytics: the round is over; with at least one winner the group has its movie
  const participantCount = room.participants.length;
  useEffect(() => {
    if (winners.length === 0) return;
    oncePerRoom(code, 'selection', () => {
      track('movie_matched', {
        participant_count: participantCount,
        match_count: winners.length,
        movie_title: winners[0].title,
      });
      track('selection_completed', {
        participant_count: participantCount,
        match_count: winners.length,
        selection_duration_sec: secondsSinceSwipeStarted(code),
      });
    });
  }, [code, participantCount, winners]);

  const closeDetails = useCallback(() => setDetails(null), []);
  const startAnotherRound = () => navigate(ROUTES.createRoom);

  const backdrop = noMatch ? cinemaPhoto : (picked ?? winners[0])?.posterUrl;
  const total = results?.total ?? 0;
  const allCards = results?.cards ?? [];
  const others = allCards.filter((card) => !card.isWinner);
  const highlyRated = others.filter((card) => card.likes > 0).slice(0, HIGHLY_RATED_COUNT);
  const sessionPicks = !noMatch
    ? []
    : showAll
      ? allCards
      : allCards.slice(0, SESSION_PICKS_PREVIEW);

  const renderHero = () => {
    if (state.status === 'loading') {
      return (
        <p className="results-hero__message" role="status">
          Getting the results…
        </p>
      );
    }
    if (state.status === 'error') {
      return (
        <p className="results-hero__message" role="alert">
          {state.error}
        </p>
      );
    }
    if (noMatch) {
      return (
        <div className="results-hero__center">
          <h1 className="results-hero__title">
            No match <span className="results-hero__accent">this round</span>
          </h1>
          <p className="results-hero__subtitle">No movies got the likes from the group this time</p>
          <ClapperIllustration />
          <div className="results-hero__buttons">
            <BrandButton className="results-hero__button" onClick={startAnotherRound}>
              Start another round
              <ArrowRightIcon />
            </BrandButton>
            <BrandButton
              variant="ghost"
              className="results-hero__button"
              onClick={() =>
                picksRef.current?.scrollIntoView({
                  behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                })
              }
            >
              View session picks
            </BrandButton>
          </div>
        </div>
      );
    }
    if (showPick && picked) {
      return (
        <div className="results-hero__center">
          <h1 className="results-hero__title">
            No more excuses — watch <span className="results-hero__accent">this one!</span>
          </h1>
          <p className="results-hero__subtitle">A random winner from top-rated movies</p>
          <div className="results-hero__pick" aria-live="polite">
            <WinnerCard
              card={picked}
              total={total}
              variant="chosen"
              onDetails={() => setDetails(picked)}
            />
          </div>
          {isHost && (
            <div className="results-hero__roulette">
              <p className="results-hero__roulette-text">Still not convinced?</p>
              <BrandButton className="results-hero__spin" onClick={roulette.spin}>
                Spin again
                <DiceIcon />
              </BrandButton>
            </div>
          )}
        </div>
      );
    }
    const single = winners.length === 1;
    return (
      <>
        <h1 className="results-hero__title">
          Tonight’s <span className="results-hero__accent">{single ? 'winner' : 'winners'}</span>
        </h1>
        <p className="results-hero__subtitle">
          {single
            ? 'The movie with the most likes from your group'
            : 'The movies with the most likes from your group'}
        </p>
        <WinnersCarousel
          winners={winners}
          total={total}
          highlightedId={roulette.highlightedId}
          onDetails={setDetails}
        />
        {isHost && !single && (
          <div className="results-hero__roulette">
            <p className="results-hero__roulette-text">You can randomly choose one</p>
            <BrandButton
              className="results-hero__spin"
              disabled={roulette.isSpinning}
              onClick={roulette.spin}
            >
              {roulette.isSpinning ? 'Spinning…' : 'Spin the roulette'}
              <DiceIcon />
            </BrandButton>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="results-page landing">
      <section
        className={cx(
          'results-hero',
          noMatch && 'results-hero--no-match',
          winners.length === 1 && 'results-hero--single',
        )}
      >
        {backdrop && (
          <div
            key={backdrop}
            className="results-hero__backdrop"
            style={{ backgroundImage: `url("${backdrop}")` }}
            aria-hidden="true"
          />
        )}
        <BrandHeader />
        <div className="container results-hero__inner">{renderHero()}</div>
      </section>

      {noMatch && (
        <section
          className="results-list"
          id="session-picks"
          ref={picksRef}
          aria-labelledby="results-list-title"
        >
          <div className="container">
            <div className="results-list__head">
              <div>
                <h2 className="results-list__title" id="results-list-title">
                  Movies from this session
                </h2>
                <p className="results-list__subtitle">The movies your group voted on this round</p>
              </div>
              {allCards.length > SESSION_PICKS_PREVIEW && (
                <button
                  type="button"
                  className="results-list__all"
                  onClick={() => setShowAll((value) => !value)}
                >
                  <ArrowRightIcon />
                  {showAll ? 'Show less' : 'View all'}
                </button>
              )}
            </div>
            <ul className="results-list__cards">
              {sessionPicks.map((card) => (
                <ResultCard
                  key={card.id}
                  card={card}
                  total={total}
                  onDetails={() => setDetails(card)}
                />
              ))}
            </ul>
          </div>
        </section>
      )}

      {!noMatch && highlyRated.length > 0 && (
        <section className="results-list" aria-labelledby="results-list-title">
          <div className="container">
            <h2 className="results-list__title" id="results-list-title">
              Also highly rated
            </h2>
            <p className="results-list__subtitle">More great options from this session</p>
            <ul className="results-list__cards">
              {highlyRated.map((card) => (
                <ResultCard
                  key={card.id}
                  card={card}
                  total={total}
                  onDetails={() => setDetails(card)}
                />
              ))}
            </ul>
          </div>
        </section>
      )}

      {state.status === 'ready' && (
        <>
          <AccountBenefits
            id="results-account"
            variant="stacked"
            title={
              <>
                Want us to learn <span className="account__title-accent">your taste</span> better?
              </>
            }
            lead="Create an account to save this session, avoid repeats, and build a movie identity from the choices you make."
            buttonLabel="Save and build my profile"
            signInText="Already have an account?"
          />
          {!noMatch && (
            <CtaBanner
              title="Not the one?"
              text="Start another round and find a better match"
              buttonLabel="Start another round"
              onAction={startAnotherRound}
            />
          )}
        </>
      )}

      {details && <MovieDetails card={details} onClose={closeDetails} />}
    </div>
  );
}
