// Central place to define all routes

import { Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AboutPage from "./pages/AboutPage";
import JoinLeaguePage from './pages/JoinLeaguePage';
import CreateLeaguePage from './pages/CreateLeaguePage';
import LeaguePage from './pages/LeaguePage';
import MyTeamPage from './pages/MyTeamPage';
import DraftPage from './pages/DraftPage';
import FieldTrackerPage from './pages/FieldTrackerPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/join-league" element={<JoinLeaguePage />} />
      <Route path="/create-league" element={<CreateLeaguePage />} />
      <Route path="/league/:leagueId" element={<LeaguePage />} />
      <Route path="/league/:leagueId/my-team" element={<MyTeamPage />} />
      <Route path="/league/:leagueId/draft" element={<DraftPage />} />
      <Route path="/league/:leagueId/field-tracker" element={<FieldTrackerPage />} />
    </Routes>
  );
}
