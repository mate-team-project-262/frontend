import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { RoomApiError, getDeck, leaveRoom, voteForMovie } from '../../api/roomsApi.js';
import BrandButton from '../../components/BrandButton/BrandButton.jsx';
import BrandHeader from '../../components/BrandHeader/BrandHeader.jsx';
import BrandProgress from '../../components/BrandProgress/BrandProgress.jsx';
import BrandSpinner from '../../components/BrandSpinner/BrandSpinner.jsx';
import MovieCard from '../../components/MovieCard/MovieCard.jsx';
import MovieDetails from '../../components/MovieDetails/MovieDetails.jsx';
import VoteButton from '../../components/VoteButton/VoteButton.jsx';
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

/** "You're done!" - shown after the 20th vote. */
function DoneView() {
  return (
    <section className="swipe-done" aria-labelledby="swipe-done-title">
      <h1 className="swipe-done__title" id="swipe-done-title">
        You’re done!
      </h1>
      <p className="swipe-done__text">Results will unlock when everyone finishes</p>
      <p className="swipe-done__hint">No need to do anything else — we’ll move on automatically</p>
      <div className="swipe-done__status" role="status">
        <BrandSpinner />
        Waiting for others
      </div>
    </section>
  );
}

/**
 * 06 - Swipe session: the room's 20 movies one by one. Like / skip with the buttons, by dragging
 * the card or with the arrow keys; "More details" opens the whole card. Votes are saved on the
 * backend, so after a reload the person continues where they stopped.
 */
export default function SwipePage({ code }) {
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', cards: [], error: '' });
  const [index, setIndex] = useState(0);
  const [drag, setDrag] = useState({ dx: 0, active: false });
  const [leaving, setLeaving] = useState(null); // 'left' | 'right' while the card flies away
  const [isSaving, setIsSaving] = useState(false);
  const [voteError, setVoteError] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
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
    if (!card || detailsOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.target.closest?.('input, textarea, select')) return;
      if (event.key === 'ArrowLeft') vote(false);
      if (event.key === 'ArrowRight') vote(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [card, detailsOpen, vote]);

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

  const handleLeave = async () => {
    try {
      await leaveRoom(code);
    } catch {
      // Even if the request fails the person wants to leave this page.
    }
    navigate(ROUTES.home);
  };

  const cardStyle = leaving
    ? undefined
    : { transform: `translateX(${drag.dx}px) rotate(${drag.dx / 22}deg)` };

  return (
    <div className={cx('swipe-page landing', isDone && 'cinema-page cinema-page--audience')}>
      {!isDone && <PosterBackdrop url={card?.posterUrl} />}
      <BrandHeader action="leave" onBack={handleLeave} />

      <main className="swipe" aria-hidden={detailsOpen || undefined}>
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

        {isDone && <DoneView />}

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
    </div>
  );
}
