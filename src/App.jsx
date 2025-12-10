// Root component -> Weaps routes, layout, context

import { HashRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import AppNavbar from './components/AppNavbar';
import AppRoutes from './router';
import { AuthProvider } from './context/AuthContext';


function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <AppNavbar />
        <AppRoutes />
      </HashRouter>
    </AuthProvider>
  );
}

export default App;