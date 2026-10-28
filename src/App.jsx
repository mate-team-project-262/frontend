import { Navigate, Route, Routes } from 'react-router';
import CreateRoomPage from './pages/CreateRoomPage/CreateRoomPage.jsx';
import LandingPage from './pages/LandingPage/LandingPage.jsx';
import InvitePage from './pages/InvitePage/InvitePage.jsx';
import JoinRoomPage from './pages/JoinRoomPage/JoinRoomPage.jsx';
import RoomPage from './pages/RoomPage/RoomPage.jsx';
import { ROUTES } from './routes.js';

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
