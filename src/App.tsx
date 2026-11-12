import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router';
import { toReportedPath, track } from './analytics/analytics.ts';
import CreateRoomPage from './pages/CreateRoomPage/CreateRoomPage.tsx';
import LandingPage from './pages/LandingPage/LandingPage.tsx';
import InvitePage from './pages/InvitePage/InvitePage.tsx';
import JoinRoomPage from './pages/JoinRoomPage/JoinRoomPage.tsx';
import RoomPage from './pages/RoomPage/RoomPage.tsx';
import { ROUTES } from './routes.ts';

export default function App() {
  const { pathname } = useLocation();

  // analytics: one page view per page, with the room code cut out of the address.
  // (Runs after the page's own effects, so the title is already the new one.)
  useEffect(() => {
    const path = toReportedPath(pathname);
    track('page_view', {
      page_path: path,
      page_location: `${window.location.origin}${path}`,
      page_title: document.title,
    });
  }, [pathname]);

  return (
    <Routes>
      <Route path={ROUTES.home} element={<LandingPage />} />
      <Route path={ROUTES.createRoom} element={<CreateRoomPage />} />
      <Route path={ROUTES.join} element={<JoinRoomPage />} />
      <Route path={ROUTES.invite} element={<InvitePage />} />
      <Route path={ROUTES.room} element={<RoomPage />} />
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  );
}
