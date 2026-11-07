import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { RoomApiError, getDeck, leaveRoom, voteForMovie } from '../../api/roomsApi.js';
import BrandButton from '../../components/BrandButton/BrandButton.jsx';
import BrandHeader from '../../components/BrandHeader/BrandHeader.jsx';
import BrandParticipant from '../../components/BrandParticipant/BrandParticipant.jsx';
import BrandProgress from '../../components/BrandProgress/BrandProgress.jsx';
import BrandSpinner from '../../components/BrandSpinner/BrandSpinner.jsx';
import BrandToast from '../../components/BrandToast/BrandToast.jsx';
import LeaveRoomModal from '../../components/LeaveRoomModal/LeaveRoomModal.jsx';
import MovieCard from '../../components/MovieCard/MovieCard.jsx';
import MovieDetails from '../../components/MovieDetails/MovieDetails.jsx';
import VoteButton from '../../components/VoteButton/VoteButton.jsx';
import { useGameProgress } from '../../hooks/useGameProgress.js';
import { useHostChange } from '../../hooks/useHostChange.js';
import { ROUTES } from '../../routes.js';
import { cx } from '../../utils/classNames.js';
import '../../styles/cinema.css';
import '../../styles/landing.css';
import './SwipePage.css';

const LEAVE_MS = 320; // the card flies away
const SWIPE_DISTANCE = 110; // px of dragging that count as a vote
const SAVE_FAILED = 'Could not save your vote. Please try again.';

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const firstUnvoted = (cards) => cards.findIndex((card) => card.myVote === null);

/** Blurred poster of the current movie behind the page; posters cross-fade when the card changes. */
function PosterBackdrop({ url }) {
  return (
    <div className="swipe-page__backdrop" aria-hidden="true">
      {url && <div key={url} className="swipe-page__backdrop-image" style={{ backgroundImage: `url("${url}")` }} />}
    </div>
  );
}

/** "Waiting for Alex", "Waiting for Alex and Peter", "Waiting for 3 people". */
function waitingFor(people) {
  if (people.length === 0) return 'Waiting for others';
  if (people.length === 1) return `Waiting for ${people[0].name}`;
  if (people.length === 2) return `Waiting for ${people[0].name} and ${people[1].name}`;
  return `Waiting for ${people.length} people`;
}

/**
 * 07 - "You're done!" after the 20th vote: who has finished (polled every 3 seconds). When everybody
 * is done it turns into "Getting results ready".
 */
function DoneView({ code }) {
  const progress = useGameProgress(code, true);
  const allDone = Boolean(progress?.allFinished);
  const stillSwiping = progress?.participants.filter((person) => !person.finished) ?? [];

  return (
    <section className="swipe-done" aria-labelledby="swipe-done-title">
      <h1 className="swipe-done__title" id="swipe-done-title">
        {allDone ? 'Getting results ready' : 'You’re done!'}
      </h1>
      {allDone ? (
        <p className="swipe-done__text">
          Everyone has finished! We’re now calculating the results of your movie session
        </p>
      ) : (
        <>
          <p className="swipe-done__text">Results will unlock when everyone finishes</p>
          <p className="swipe-done__hint">
            No need to do anything else - we’ll show winner automatically
          </p>
        </>
      )}

      {progress && (
        <div className="swipe-done__group">
          <div className="swipe-done__group-head">
            <h2 className="swipe-done__group-title">Group progress</h2>
            <span className="swipe-done__count">
              {progress.finished} / {progress.total} completed
            </span>
          </div>
          <div className="swipe-done__bar" aria-hidden="true">
            <div
              className="swipe-done__bar-fill"
              style={{ width: `${progress.total ? (progress.finished / progress.total) * 100 : 0}%` }}
            />
          </div>
          <ul className="swipe-done__list" aria-live="polite">
            {progress.participants.map((person, index) => (
              <BrandParticipant
                key={person.id}
                name={person.name}
                index={index}
                isMe={person.isMe}
                isHost={person.isHost}
                status={person.finished ? 'done' : 'swiping'}
              />
            ))}
          </ul>
        </div>
      )}

      <div className="swipe-done__status" role="status">
        <BrandSpinner />
        {allDone ? 'Waiting for results' : waitingFor(stillSwiping)}
      </div>
      {allDone && (
        <p className="swipe-done__footnote">This usually takes a few seconds. Thanks for your patience!</p>
      )}
    </section>
  );
}

/**
 * 06 - Swipe session: the room's 20 movies one by one. Like / skip with the buttons, by dragging
 * the card or with the arrow keys; "More details" opens the whole card. Votes are saved on the
 * backend, so after a reload the person continues where they stopped.
 * "Leave room" asks first (host / participant texts); when the host changes, a toast tells everyone.
 * `room` is the live room from RoomPage (polled every 3 seconds).
 */
export default function SwipePage({ code, room }) {
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', cards: [], error: '' });
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState({ dx: 0, active: false });
  const [leaving, setLeaving] = useState(null); // 'left' | 'right' while the card flies away
  const [isSaving, setIsSaving] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [leaveState, setLeaveState] = useState(null); // null | { isLeaving, error }
  const [hostNotice, dismissHostNotice] = useHostChange(room);
  const dragStart = useRef(null);
  const cardSlot = useRef(null);

  const loadDeck = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: '' }));
    try {
      const deck = await getDeck(code);
      const next = firstUnvoted(deck.cards);
      setIndex(next === -1 ? deck.cards.length : next);
      setState({ status: 'ready', cards: deck.cards, error: '' });
    } catch (error) {
      setState({
        status: 'error',
        cards: [],
        error: error instanceof RoomApiError ? error.message : 'Could not load the movies.',
      });
    }
  }, [code]);

  useEffect(() => {
    // Loading the deck is the "external system" this effect syncs with.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadDeck();
  }, [loadDeck]);

  const { cards } = state;
  const card = cards[index] ?? null;
  const isDone = state.status === 'ready' && !card;
  const votedCount = cards.filter((item) => item.myVote !== null).length;

  const vote = useCallback(
    async (liked) => {
      if (!card || isSaving) return;
      setIsSaving(true);
      setVoteError('');
      setLeaving(liked ? 'right' : 'left');
      const animation = wait(prefersReducedMotion() ? 0 : LEAVE_MS);
      try {
        await Promise.all([voteForMovie(code, { cardId: card.id, liked }), animation]);
        const updated = cards.map((item) => (item.id === card.id ? { ...item, myVote: liked } : item));
        const next = firstUnvoted(updated);
        setState((current) => ({ ...current, cards: updated }));
        setIndex(next === -1 ? updated.length : next);
      } catch (error) {
        await animation;
        if (error.code === 'ALREADY_VOTED') {
          await loadDeck(); // voted from another tab: take the saved votes
        } else {
          setVoteError(error instanceof RoomApiError ? error.message : SAVE_FAILED);
        }
      } finally {
        setLeaving(null);
        setDrag({ dx: 0, active: false });
        setIsSaving(false);
      }
    },
    [card, cards, code, isSaving, loadDeck],
  );

  // ← skip, → like (not while the details are open or a field has focus)
  useEffect(() => {
    if (!card || detailsOpen || leaveState) return undefined;
    const onKeyDown = (event) => {
      if (event.target.closest?.('input, textarea, select')) return;
      if (event.key === 'ArrowLeft') vote(false);
      if (event.key === 'ArrowRight') vote(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [card, detailsOpen, leaveState, vote]);

  // Load the next poster early so it is ready when the card changes.
  useEffect(() => {
    const nextUrl = cards[index + 1]?.posterUrl;
    if (nextUrl) new Image().src = nextUrl;
  }, [cards, index]);

  const onPointerDown = (event) => {
    if (isSaving || event.button > 0 || event.target.closest('button')) return;
    dragStart.current = { x: event.clientX, id: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({ dx: 0, active: true });
  };

  const onPointerMove = (event) => {
    if (dragStart.current?.id !== event.pointerId) return;
    setDrag({ dx: event.clientX - dragStart.current.x, active: true });
  };

  const onPointerEnd = (event) => {
    if (dragStart.current?.id !== event.pointerId) return;
    dragStart.current = null;
    const { dx } = drag;
    if (Math.abs(dx) >= SWIPE_DISTANCE) vote(dx > 0);
    else setDrag({ dx: 0, active: false });
  };

  const closeDetails = useCallback(() => {
    setDetailsOpen(false);
    requestAnimationFrame(() => cardSlot.current?.querySelector('.movie-card__more')?.focus());
  }, []);

  const me = room?.participants.find((person) => person.isMe);
  const openLeave = () => setLeaveState({ isLeaving: false, error: '' });

  const stayInRoom = useCallback(() => {
    setLeaveState(null);
    requestAnimationFrame(() => document.querySelector('.brand-header__back')?.focus());
  }, []);

  const confirmLeave = async () => {
    setLeaveState({ isLeaving: true, error: '' });
    try {
      await leaveRoom(code);
      navigate(ROUTES.home);
    } catch (error) {
      setLeaveState({
        isLeaving: false,
        error: error instanceof RoomApiError ? error.message : 'Could not leave the room. Please try again.',
      });
    }
  };

  const cardStyle = leaving
    ? undefined
    : { transform: `translateX(${drag.dx}px) rotate(${drag.dx / 22}deg)` };

  return (
    <div className={cx('swipe-page landing', isDone && 'cinema-page cinema-page--audience')}>
      {!isDone && <PosterBackdrop url={card?.posterUrl} />}
      <BrandHeader action="leave" onBack={openLeave} />

      <main className="swipe" aria-hidden={detailsOpen || Boolean(leaveState) || undefined}>
        {state.status === 'loading' && (
          <p className="swipe__message" role="status">
            Loading movies…
          </p>
        )}

        {state.status === 'error' && (
          <div className="swipe__message" role="alert">
            <p>{state.error}</p>
            <BrandButton variant="ghost" onClick={loadDeck}>
              Try again
            </BrandButton>
          </div>
        )}

        {isDone && <DoneView code={code} />}

        {card && (
          <div className={cx('swipe__stage', detailsOpen && 'swipe__stage--hidden')}>
            <BrandProgress value={votedCount} total={cards.length} label="Movies voted" />
            <div className="swipe__card-slot" ref={cardSlot}>
              <MovieCard
                key={card.id}
                card={card}
                className={cx(
                  'swipe__card',
                  drag.active && 'swipe__card--dragging',
                  leaving && `swipe__card--leaving-${leaving}`,
                )}
                style={cardStyle}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerEnd}
                onPointerCancel={onPointerEnd}
                onMoreDetails={() => setDetailsOpen(true)}
              />
            </div>
            <div className="swipe__votes">
              <VoteButton kind="skip" onClick={() => vote(false)} />
              <p className="swipe__hint">Swipe or tap to vote</p>
              <VoteButton kind="like" onClick={() => vote(true)} />
            </div>
            {voteError && (
              <p className="swipe__error" role="alert">
                {voteError}
              </p>
            )}
          </div>
        )}
      </main>

      {detailsOpen && card && <MovieDetails card={card} onClose={closeDetails} />}

      {hostNotice && !leaveState && (
        <BrandToast title={hostNotice.title} text={hostNotice.text} onClose={dismissHostNotice} />
      )}

      {leaveState && (
        <LeaveRoomModal
          isHost={Boolean(me?.isHost)}
          isAlone={(room?.participants.length ?? 0) <= 1}
          isLeaving={leaveState.isLeaving}
          error={leaveState.error}
          onStay={stayInRoom}
          onLeave={confirmLeave}
        />
      )}
    </div>
  );
}
