import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { linkRoomToAccount } from '../api/roomsApi.ts';
import { ROUTES, roomPath } from '../routes.ts';
import { forgetRoomToSave, getRoomToSave } from '../utils/pendingRoomLink.ts';

/**
 * What happens right after a successful sign up / sign in.
 *
 * Came from "Save and build my profile" on the results page: the room just played is linked to
 * the account first (cookie + fresh CSRF + the guest's X-Participant-Token), the history and the
 * movie identity are reloaded, and then the dashboard opens with the session in it. If linking
 * fails, the person goes back to the room: the room page links the game itself and tries again.
 * Otherwise: straight to the dashboard.
 */
export function useFinishSignIn(): () => Promise<void> {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return async () => {
    const code = getRoomToSave();
    if (!code) {
      navigate(ROUTES.dashboard);
      return;
    }
    try {
      await linkRoomToAccount(code);
      forgetRoomToSave();
      await queryClient.invalidateQueries({ queryKey: ['account'] });
      navigate(ROUTES.dashboard);
    } catch {
      forgetRoomToSave();
      navigate(roomPath(code));
    }
  };
}
