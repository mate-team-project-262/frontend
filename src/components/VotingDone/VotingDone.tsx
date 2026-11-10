import { useGameProgress } from '../../hooks/useGameProgress.ts';
import BrandParticipant from '../BrandParticipant/BrandParticipant.tsx';
import BrandSpinner from '../BrandSpinner/BrandSpinner.tsx';
import './VotingDone.css';

/** "Waiting for Alex", "Waiting for Alex and Peter", "Waiting for 3 people". */
function waitingFor(people: { name: string }[]) {
  if (people.length === 0) return 'Waiting for others';
  if (people.length === 1) return `Waiting for ${people[0].name}`;
  if (people.length === 2) return `Waiting for ${people[0].name} and ${people[1].name}`;
  return `Waiting for ${people.length} people`;
}

/**
 * 07 - "You're done!" after the 20th vote: who has finished (polled every 3 seconds). When everybody
 * is done it turns into "Getting results ready".
 */
export default function VotingDone({ code }: { code: string }) {
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
              style={{
                width: `${progress.total ? (progress.finished / progress.total) * 100 : 0}%`,
              }}
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
        <p className="swipe-done__footnote">
          This usually takes a few seconds. Thanks for your patience!
        </p>
      )}
    </section>
  );
}
