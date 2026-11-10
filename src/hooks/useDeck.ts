import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { queryKeys } from '../api/queryClient.ts';
import {
  type Deck,
  type MovieCard,
  errorCode,
  errorMessage,
  getDeck,
  voteForMovie,
} from '../api/roomsApi.ts';

const LEAVE_MS = 320; // the card flies away
const SAVE_FAILED = 'Could not save your vote. Please try again.';
const NO_CARDS: MovieCard[] = [];

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * The room's 20 movies and this person's votes. The current movie is the first one without a
 * vote, so a reload continues where the person stopped. `vote(liked)` saves the vote while the
 * card flies away (`leaving` = 'left' | 'right') and writes it into the cached deck; a vote from
 * another tab (ALREADY_VOTED) reloads the deck.
 */
export function useDeck(code: string) {
  const queryClient = useQueryClient();
  const [leaving, setLeaving] = useState<'left' | 'right' | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [voteError, setVoteError] = useState('');

  // The deck does not change during a session: loaded once, votes are written into the cache.
  const query = useQuery({
    queryKey: queryKeys.deck(code),
    queryFn: () => getDeck(code),
    staleTime: Infinity,
  });
  const { refetch } = query;

  const saveVote = useMutation({
    mutationFn: (vote: { cardId: number; liked: boolean }) => voteForMovie(code, vote),
  });
  const { mutateAsync } = saveVote;

  const cards = query.data?.cards ?? NO_CARDS;
  const index = cards.findIndex((item) => item.myVote === null);
  const card = index === -1 ? null : cards[index];

  let status: 'loading' | 'ready' | 'error' = 'ready';
  if (query.isPending || (query.isError && query.isFetching)) status = 'loading';
  else if (query.isError) status = 'error';

  const vote = useCallback(
    async (liked: boolean) => {
      if (!card || isSaving) return;
      setIsSaving(true);
      setVoteError('');
      setLeaving(liked ? 'right' : 'left');
      const animation = wait(prefersReducedMotion() ? 0 : LEAVE_MS);
      try {
        await Promise.all([mutateAsync({ cardId: card.id, liked }), animation]);
        queryClient.setQueryData<Deck>(
          queryKeys.deck(code),
          (deck) =>
            deck && {
              ...deck,
              cards: deck.cards.map((item) =>
                item.id === card.id ? { ...item, myVote: liked } : item,
              ),
            },
        );
      } catch (error) {
        await animation;
        if (errorCode(error) === 'ALREADY_VOTED') {
          await refetch(); // voted from another tab: take the saved votes
        } else {
          setVoteError(errorMessage(error, SAVE_FAILED));
        }
      } finally {
        setLeaving(null);
        setIsSaving(false);
      }
    },
    [card, code, isSaving, mutateAsync, queryClient, refetch],
  );

  return {
    status,
    error: status === 'error' ? errorMessage(query.error, 'Could not load the movies.') : '',
    cards,
    card,
    nextCard: (index === -1 ? null : cards[index + 1]) ?? null,
    isDone: status === 'ready' && !card,
    votedCount: cards.filter((item) => item.myVote !== null).length,
    leaving,
    isSaving,
    voteError,
    vote,
    reload: () => void refetch(),
  };
}
