import { Navigate, Route, Routes } from 'react-router';
import CreateRoomPage from './pages/CreateRoomPage/CreateRoomPage.jsx';
import LandingPage from './pages/LandingPage/LandingPage.jsx';
import { ROUTES } from './routes.js';

export default function App() {
  return (
    <Routes>
      <Route path={ROUTES.home} element={<LandingPage />} />
      <Route path={ROUTES.createRoom} element={<CreateRoomPage />} />
      <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
    </Routes>
  );
}
