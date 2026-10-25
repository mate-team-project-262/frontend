import { Fragment } from 'react';
import { useNavigate } from 'react-router';
import { leaveRoom } from '../../api/roomsApi.js';
import Header from '../../components/Header/Header.jsx';
import InfoChip from '../../components/InfoChip/InfoChip.jsx';
import { ROUTES } from '../../routes.js';
import { getPreferenceGroups } from '../../utils/preferences.js';
import './WaitingRoomPage.css';

/** "You" for the person looking at the page, "(host)" next to the host. */
function getPersonLabel(person) {
  const name = person.isMe ? 'You' : person.name;
  return person.isHost ? `${name} (host)` : name;
}

/** Guest view of a room that is waiting for the host to start. `room` comes from RoomPage. */
export default function WaitingRoomPage({ code, room }) {
  const navigate = useNavigate();
  const preferenceGroups = getPreferenceGroups(room.preferences);

  const handleLeave = async () => {
    try {
      await leaveRoom(code);
    } catch {
      // Even if the request fails the guest wants to leave this page.
    }
    navigate(ROUTES.home);
  };

  return (
    <div className="waiting-room-page">
      <Header variant="leave" onLeave={handleLeave} />
      <main className="waiting-room">
        <h1 className="waiting-room__title">You’re in!</h1>
        <p className="waiting-room__subtitle">Waiting for the host to start the session</p>

        <section className="waiting-room__panel">
          <h2 className="waiting-room__session">Today’s movie session</h2>

          <h3 className="waiting-room__label">People in room ({room.participants.length})</h3>
          <ul className="waiting-room__chips">
            {room.participants.map((person) => (
              <li key={person.id}>
                <InfoChip>{getPersonLabel(person)}</InfoChip>
              </li>
            ))}
          </ul>

          <h3 className="waiting-room__label waiting-room__label--next">
            Preferences set by the host
          </h3>
          {preferenceGroups.length > 0 ? (
            <ul className="waiting-room__chips">
              {preferenceGroups.map((group, index) => (
                <Fragment key={group.join()}>
                  {index > 0 && (
                    <li className="waiting-room__separator" aria-hidden="true">
                      •
                    </li>
                  )}
                  {group.map((label) => (
                    <li key={label}>
                      <InfoChip>{label}</InfoChip>
                    </li>
                  ))}
                </Fragment>
              ))}
            </ul>
          ) : (
            <p className="waiting-room__empty">The host did not set any preferences.</p>
          )}
        </section>
      </main>
    </div>
  );
}
