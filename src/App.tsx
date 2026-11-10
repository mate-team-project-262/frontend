import { Navigate, Route, Routes } from 'react-router';
import CreateRoomPage from './pages/CreateRoomPage/CreateRoomPage.tsx';
import LandingPage from './pages/LandingPage/LandingPage.tsx';
import InvitePage from './pages/InvitePage/InvitePage.tsx';
import JoinRoomPage from './pages/JoinRoomPage/JoinRoomPage.tsx';
import RoomPage from './pages/RoomPage/RoomPage.tsx';
import { ROUTES } from './routes.ts';

export default function App() {
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
