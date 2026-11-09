import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { RoomApiError, getResults } from '../../api/roomsApi.js';
import cinemaPhoto from '../../assets/landing/cinema-bg.webp';
import BrandButton from '../../components/BrandButton/BrandButton.jsx';
import BrandHeader from '../../components/BrandHeader/BrandHeader.jsx';
import MovieDetails from '../../components/MovieDetails/MovieDetails.jsx';
import ResultCard from '../../components/ResultCard/ResultCard.jsx';
import WinnerCard, { ArrowRightIcon } from '../../components/WinnerCard/WinnerCard.jsx';
import { ROUTES } from '../../routes.js';
import AccountBenefits from '../../sections/AccountBenefits/AccountBenefits.jsx';
import CtaBanner from '../../sections/CtaBanner/CtaBanner.jsx';
import { cx } from '../../utils/classNames.js';
import '../../styles/landing.css';
import './ResultsPage.css';

const RETRY_MS = 3000; // results may still be counted for a moment after the last vote
const HIGHLY_RATED_COUNT = 3;
const SESSION_PICKS_PREVIEW = 3;

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** A fair random index (each winner has the same chance). */
function randomIndex(length) {
  try {
    const value = new Uint32Array(1);
    crypto.getRandomValues(value);
    return value[0] % length;
  } catch {
    return Math.floor(Math.random() * length);
  }
}

/** The host's roulette pick is kept in this tab, so it survives a reload. */
const pickKey = (code) => `roulette-pick:${String(code).toUpperCase()}`;
function readPick(code) {
  try {
    return Number(sessionStorage.getItem(pickKey(code))) || null;
  } catch {
    return null;
  }
}
function savePick(code, id) {
  try {
    sessionStorage.setItem(pickKey(code), String(id));
  } catch {
    // only kept in memory
  }
}

function DiceIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <rect x="1" y="6" width="9.5" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.3" />
      <path d="m8.5 3.6 2.2-2.2a1.6 1.6 0 0 1 2.3 0l3.6 3.6a1.6 1.6 0 0 1 0 2.3l-3.4 3.4" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="5.75" cy="10.75" r="1" fill="currentColor" />
      <circle cx="12.6" cy="5.4" r="0.9" fill="currentColor" />
    </svg>
  );
}

function ChevronIcon({ direction }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d={direction === 'left' ? 'M16 9H2.5M8 3.5 2.5 9 8 14.5' : 'M2 9h13.5M10 3.5 15.5 9 10 14.5'}
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Stand-in for the clapperboard illustration of the "No match" frame (needs the designer's asset). */
function ClapperIllustration() {
  return (
    <svg className="results-hero__clapper" width="132" height="132" viewBox="0 0 132 132" aria-hidden="true">
      <defs>
        <linearGradient id="clapper-body" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8f6bff" />
          <stop offset="1" stopColor="#4f2bd6" />
        </linearGradient>
      </defs>
      <rect x="10" y="50" width="112" height="72" rx="12" fill="url(#clapper-body)" />
      <g transform="rotate(-14 16 46)">
        <rect x="10" y="26" width="112" height="22" rx="6" fill="#d9ccff" />
        <path d="M24 26h14l-12 22H12Zm28 0h14L54 48H40Zm28 0h14L82 48H68Zm28 0h14l-12 22H96Z" fill="#6a45f0" />
      </g>
      <rect x="10" y="50" width="112" height="16" rx="6" fill="#e6dcff" />
      <path d="M24 50h14l-6 16H18Zm28 0h14l-6 16H46Zm28 0h14l-6 16H74Zm28 0h14l-6 16h-14Z" fill="#6a45f0" />
      <circle cx="20" cy="38" r="4" fill="#4f2bd6" transform="rotate(-14 16 46)" />
      <path d="M58 76v32l26-16Z" fill="#fff9ea" />
    </svg>
  );
}

/** Winners side by side; with more than two they scroll like a carousel (arrows, swipe, keys). */
function WinnersRow({ winners, total, highlightedId, onDetails }) {
  const trackRef = useRef(null);
  const isCarousel = winners.length > 2;

  const scrollBy = (direction) => {
    const track = trackRef.current;
    const step = track.firstElementChild?.getBoundingClientRect().width ?? track.clientWidth / 2;
    track.scrollBy({ left: direction * (step + 40), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  // keep the spinning roulette's card in view
  useEffect(() => {
    if (!isCarousel || highlightedId === null) return;
    trackRef.current
      ?.querySelector(`[data-id="${highlightedId}"]`)
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [highlightedId, isCarousel]);

  return (
    <div className={cx('results-winners', isCarousel && 'results-winners--carousel')}>
      {isCarousel && (
        <button type="button" className="results-winners__arrow results-winners__arrow--prev" aria-label="Previous winners" onClick={() => scrollBy(-1)}>
          <ChevronIcon direction="left" />
        </button>
      )}
      <ul className="results-winners__track" ref={trackRef} tabIndex={isCarousel ? 0 : undefined}>
        {winners.map((card) => (
          <li key={card.id} data-id={card.id} className="results-winners__item">
            <WinnerCard
              card={card}
              total={total}
              variant={winners.length === 1 ? 'single' : 'pair'}
              highlighted={highlightedId === card.id}
              onDetails={() => onDetails(card)}
            />
          </li>
        ))}
      </ul>
      {isCarousel && (
        <button type="button" className="results-winners__arrow results-winners__arrow--next" aria-label="Next winners" onClick={() => scrollBy(1)}>
          <ChevronIcon direction="right" />
        </button>
      )}
    </div>
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
export default function ResultsPage({ code, room }) {
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', results: null, error: '' });
  const [details, setDetails] = useState(null);
  const [pickId, setPickId] = useState(() => readPick(code));
  const [spin, setSpin] = useState(null); // { highlightedId } while the roulette turns
  const [showAll, setShowAll] = useState(false);
  const picksRef = useRef(null);

  const isHost = Boolean(room?.participants.find((person) => person.isMe)?.isHost);

  // Load the results; while they are being counted (RESULT_NOT_READY) ask again.
  useEffect(() => {
    let isActive = true;
    let timer;
    const load = async () => {
      try {
        const results = await getResults(code);
        if (isActive) setState({ status: 'ready', results, error: '' });
      } catch (error) {
        if (!isActive) return;
        if (error.code === 'RESULT_NOT_READY' || error.code === 'NETWORK_ERROR') {
          timer = setTimeout(load, RETRY_MS);
        } else {
          setState({
            status: 'error',
            results: null,
            error: error instanceof RoomApiError ? error.message : 'Could not load the results.',
          });
        }
      }
    };
    load();
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [code]);

  const results = state.results;
  const winners = useMemo(() => results?.winners ?? [], [results]);
  const noMatch = state.status === 'ready' && winners.length === 0;
  const picked = winners.find((card) => card.id === pickId) ?? null;
  const showPick = Boolean(picked) && !spin;

  // Roulette: run the highlight over the winners, slowing down, and stop on a random one.
  const startSpin = useCallback(() => {
    if (winners.length < 2) return;
    const target = randomIndex(winners.length);
    const finish = () => {
      setSpin(null);
      setPickId(winners[target].id);
      savePick(code, winners[target].id);
      window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    };
    if (prefersReducedMotion()) {
      finish();
      return;
    }
    const steps = winners.length * 3 + target;
    let step = 0;
    const tick = () => {
      setSpin({ highlightedId: winners[step % winners.length].id });
      if (step >= steps) {
        setTimeout(finish, 650);
        return;
      }
      step += 1;
      setTimeout(tick, 70 + (step / steps) ** 2 * 330);
    };
    setPickId(null);
    tick();
  }, [code, winners]);

  const closeDetails = useCallback(() => setDetails(null), []);
  const startAnotherRound = () => navigate(ROUTES.createRoom);

  const backdrop = noMatch ? cinemaPhoto : (picked ?? winners[0])?.posterUrl;
  const others = results ? results.cards.filter((card) => !card.isWinner) : [];
  const highlyRated = others.filter((card) => card.likes > 0).slice(0, HIGHLY_RATED_COUNT);
  const sessionPicks = noMatch && results ? (showAll ? results.cards : results.cards.slice(0, SESSION_PICKS_PREVIEW)) : [];

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
              onClick={() => picksRef.current?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth' })}
            >
              View session picks
            </BrandButton>
          </div>
        </div>
      );
    }
    if (showPick) {
      return (
        <div className="results-hero__center">
          <h1 className="results-hero__title">
            No more excuses — watch <span className="results-hero__accent">this one!</span>
          </h1>
          <p className="results-hero__subtitle">A random winner from top-rated movies</p>
          <div className="results-hero__pick" aria-live="polite">
            <WinnerCard card={picked} total={results.total} variant="chosen" onDetails={() => setDetails(picked)} />
          </div>
          {isHost && (
            <div className="results-hero__roulette">
              <p className="results-hero__roulette-text">Still not convinced?</p>
              <BrandButton className="results-hero__spin" onClick={startSpin}>
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
          {single ? 'The movie with the most likes from your group' : 'The movies with the most likes from your group'}
        </p>
        <WinnersRow
          winners={winners}
          total={results.total}
          highlightedId={spin?.highlightedId ?? null}
          onDetails={setDetails}
        />
        {isHost && !single && (
          <div className="results-hero__roulette">
            <p className="results-hero__roulette-text">You can randomly choose one</p>
            <BrandButton className="results-hero__spin" disabled={Boolean(spin)} onClick={startSpin}>
              {spin ? 'Spinning…' : 'Spin the roulette'}
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
        <section className="results-list" id="session-picks" ref={picksRef} aria-labelledby="results-list-title">
          <div className="container">
            <div className="results-list__head">
              <div>
                <h2 className="results-list__title" id="results-list-title">
                  Movies from this session
                </h2>
                <p className="results-list__subtitle">The movies your group voted on this round</p>
              </div>
              {results.cards.length > SESSION_PICKS_PREVIEW && (
                <button type="button" className="results-list__all" onClick={() => setShowAll((value) => !value)}>
                  <ArrowRightIcon />
                  {showAll ? 'Show less' : 'View all'}
                </button>
              )}
            </div>
            <ul className="results-list__cards">
              {sessionPicks.map((card) => (
                <ResultCard key={card.id} card={card} total={results.total} onDetails={() => setDetails(card)} />
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
                <ResultCard key={card.id} card={card} total={results.total} onDetails={() => setDetails(card)} />
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
