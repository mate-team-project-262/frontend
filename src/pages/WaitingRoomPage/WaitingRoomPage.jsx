import { Fragment } from 'react';
import { useNavigate } from 'react-router';
import { leaveRoom } from '../../api/roomsApi.js';
import BrandButton from '../../components/BrandButton/BrandButton.jsx';
import BrandHeader from '../../components/BrandHeader/BrandHeader.jsx';
import BrandInfoChip from '../../components/BrandInfoChip/BrandInfoChip.jsx';
import BrandParticipant from '../../components/BrandParticipant/BrandParticipant.jsx';
import BrandSpinner from '../../components/BrandSpinner/BrandSpinner.jsx';
import { ROUTES } from '../../routes.js';
import { getPreferenceGroups } from '../../utils/preferences.js';
import '../../styles/cinema.css';
import '../../styles/landing.css';
import './WaitingRoomPage.css';

function LeaveIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 19 19" fill="none" aria-hidden="true">
      <path
        d="M7 1.5H2.5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1H7M7.5 9.5H17M13.5 5.5l4 4-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Guest view of a room that is waiting for the host to start. `room` comes from RoomPage. */
export default function WaitingRoomPage({ code, room }) {
  const navigate = useNavigate();
  const preferenceGroups = getPreferenceGroups(room.preferences);
  const hostName = room.participants.find((person) => person.isHost)?.name ?? 'the host';

  /** "Back" and "Leave room" do the same: forget the room on this device and go home. */
  const handleLeave = async () => {
    try {
      await leaveRoom(code);
    } catch {
      // Even if the request fails the guest wants to leave this page.
    }
    navigate(ROUTES.home);
  };

  return (
    <div className="waiting-room-page cinema-page cinema-page--audience landing">
      <BrandHeader onBack={handleLeave} />
      <main className="waiting-room">
        <section className="waiting-room__panel" aria-labelledby="waiting-room-title">
          <h1 className="waiting-room__title" id="waiting-room-title">
            You’re all set
          </h1>
          <p className="waiting-room__host">Waiting for {hostName} to start the session</p>
          <p className="waiting-room__auto">The movies will appear here automatically</p>
          <div className="waiting-room__status" role="status">
            <BrandSpinner />
            Waiting for host
          </div>

          <div className="waiting-room__people">
            <h2 className="waiting-room__label">People in room ({room.participants.length})</h2>
            <ul className="waiting-room__list">
              {room.participants.map((person, index) => (
                <BrandParticipant
                  key={person.id}
                  name={person.name}
                  index={index}
                  isMe={person.isMe}
                  isHost={person.isHost}
                />
              ))}
            </ul>
          </div>

          <div className="waiting-room__preferences">
            <h2 className="waiting-room__label waiting-room__label--chips">
              Preferences set by the host
            </h2>
            {preferenceGroups.length > 0 ? (
              <ul className="waiting-room__chips">
                {preferenceGroups.map((group, index) => (
                  <Fragment key={group.join()}>
                    {index > 0 && <li className="waiting-room__divider" aria-hidden="true" />}
                    {group.map((label) => (
                      <li key={label}>
                        <BrandInfoChip>{label}</BrandInfoChip>
                      </li>
                    ))}
                  </Fragment>
                ))}
              </ul>
            ) : (
              <p className="waiting-room__empty">The host did not set any preferences.</p>
            )}
          </div>

          <BrandButton variant="ghost" className="waiting-room__leave" onClick={handleLeave}>
            <LeaveIcon />
            Leave room
          </BrandButton>
        </section>
      </main>
    </div>
  );
}
