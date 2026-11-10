import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { type Room, RoomApiError, leaveRoom } from '../../api/roomsApi.ts';
import BrandButton from '../../components/BrandButton/BrandButton.tsx';
import BrandHeader from '../../components/BrandHeader/BrandHeader.tsx';
import BrandProgress from '../../components/BrandProgress/BrandProgress.tsx';
import BrandToast from '../../components/BrandToast/BrandToast.tsx';
import LeaveRoomModal from '../../components/LeaveRoomModal/LeaveRoomModal.tsx';
import MovieCard from '../../components/MovieCard/MovieCard.tsx';
import MovieDetails from '../../components/MovieDetails/MovieDetails.tsx';
import VoteButton from '../../components/VoteButton/VoteButton.tsx';
import VotingDone from '../../components/VotingDone/VotingDone.tsx';
import { useDeck } from '../../hooks/useDeck.ts';
import { useSwipeDrag } from '../../hooks/useSwipeDrag.ts';
import { useHostChange } from '../../hooks/useHostChange.ts';
import { ROUTES } from '../../routes.ts';
import { cx } from '../../utils/classNames.ts';
import '../../styles/cinema.css';
import '../../styles/landing.css';
import './SwipePage.css';

/** Blurred poster of the current movie behind the page; posters cross-fade when the card changes. */
function PosterBackdrop({ url }: { url?: string | null }) {
  return (
    <div className="swipe-page__backdrop" aria-hidden="true">
      {url && (
        <div
          key={url}
          className="swipe-page__backdrop-image"
          style={{ backgroundImage: `url("${url}")` }}
        />
      )}
    </div>
  );
}

/**
 * 06 - Swipe session: the room's 20 movies one by one. Like / skip with the buttons, by dragging
 * the card or with the arrow keys; "More details" opens the whole card. Votes are saved on the
 * backend, so after a reload the person continues where they stopped.
 * "Leave room" asks first (host / participant texts); when the host changes, a toast tells everyone.
 * `room` is the live room from RoomPage (polled every 3 seconds).
 */
export default function SwipePage({ code, room }: { code: string; room: Room }) {
  const navigate = useNavigate();
  const deck = useDeck(code);
  const { card, cards, isDone, votedCount, leaving, vote } = deck;
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [leaveState, setLeaveState] = useState<{ isLeaving: boolean; error: string } | null>(null);
  const [hostNotice, dismissHostNotice] = useHostChange(room);
  const cardSlot = useRef<HTMLDivElement>(null);
  const swipe = useSwipeDrag({ disabled: deck.isSaving, onSwipe: (liked) => vote(liked) });

  // the card comes back to the middle after each vote
  const resetSwipe = swipe.reset;
  useEffect(() => {
    if (!leaving) resetSwipe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  // ← skip, → like (not while the details are open or a field has focus)
  useEffect(() => {
    if (!card || detailsOpen || leaveState) return undefined;
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.target as Element | null)?.closest?.('input, textarea, select')) return;
      if (event.key === 'ArrowLeft') vote(false);
      if (event.key === 'ArrowRight') vote(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [card, detailsOpen, leaveState, vote]);

  // Load the next poster early so it is ready when the card changes.
  useEffect(() => {
    if (deck.nextCard?.posterUrl) new Image().src = deck.nextCard.posterUrl;
  }, [deck.nextCard]);

  const closeDetails = useCallback(() => {
    setDetailsOpen(false);
    requestAnimationFrame(() =>
      cardSlot.current?.querySelector<HTMLElement>('.movie-card__more')?.focus(),
    );
  }, []);

  const me = room.participants.find((person) => person.isMe);
  const openLeave = () => setLeaveState({ isLeaving: false, error: '' });

  const stayInRoom = useCallback(() => {
    setLeaveState(null);
    requestAnimationFrame(() =>
      document.querySelector<HTMLElement>('.brand-header__back')?.focus(),
    );
  }, []);

  const confirmLeave = async () => {
    setLeaveState({ isLeaving: true, error: '' });
    try {
      await leaveRoom(code);
      navigate(ROUTES.home);
    } catch (error) {
      setLeaveState({
        isLeaving: false,
        error:
          error instanceof RoomApiError
            ? error.message
            : 'Could not leave the room. Please try again.',
      });
    }
  };

  const cardStyle = leaving
    ? undefined
    : { transform: `translateX(${swipe.dx}px) rotate(${swipe.dx / 22}deg)` };

  return (
    <div className={cx('swipe-page landing', isDone && 'cinema-page cinema-page--audience')}>
      {!isDone && <PosterBackdrop url={card?.posterUrl} />}
      <BrandHeader action="leave" onBack={openLeave} />

      <main className="swipe" aria-hidden={detailsOpen || Boolean(leaveState) || undefined}>
        {deck.status === 'loading' && (
          <p className="swipe__message" role="status">
            Loading movies…
          </p>
        )}

        {deck.status === 'error' && (
          <div className="swipe__message" role="alert">
            <p>{deck.error}</p>
            <BrandButton variant="ghost" onClick={deck.reload}>
              Try again
            </BrandButton>
          </div>
        )}

        {isDone && <VotingDone code={code} />}

        {card && (
          <div className={cx('swipe__stage', detailsOpen && 'swipe__stage--hidden')}>
            <BrandProgress value={votedCount} total={cards.length} label="Movies voted" />
            <div className="swipe__card-slot" ref={cardSlot}>
              <MovieCard
                key={card.id}
                card={card}
                className={cx(
                  'swipe__card',
                  swipe.isDragging && 'swipe__card--dragging',
                  leaving && `swipe__card--leaving-${leaving}`,
                )}
                style={cardStyle}
                {...swipe.handlers}
                onMoreDetails={() => setDetailsOpen(true)}
              />
            </div>
            <div className="swipe__votes">
              <VoteButton kind="skip" onClick={() => vote(false)} />
              <p className="swipe__hint">Swipe or tap to vote</p>
              <VoteButton kind="like" onClick={() => vote(true)} />
            </div>
            {deck.voteError && (
              <p className="swipe__error" role="alert">
                {deck.voteError}
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
