// Central place to define all routes

import { Routes, Route } from 'react-router-dom';

import HomePage from './pages/HomePage';
// we'll add these later:
// import LoginPage from './pages/LoginPage';
// import RegisterPage from './pages/RegisterPage';
// import JoinLeaguePage from './pages/JoinLeaguePage';
// import CreateLeaguePage from './pages/CreateLeaguePage';
// import LeaguePage from './pages/LeaguePage';
// import DraftPage from './pages/DraftPage';
// import MyTeamPage from './pages/MyTeamPage';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      {/* <Route path="/login" element={<LoginPage />} /> */}
      {/* add more routes here as you build pages */}
    </Routes>
  );
}
