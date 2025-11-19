// Root component -> Weaps routes, layout, context

import { HashRouter, Routes, Route } from 'react-router-dom';
import './App.css';
import AppNavbar from './layout/AppNavbar';
import AppRoutes from './router';


function App() {
  return (
    <HashRouter>
      <AppNavbar />
      <AppRoutes />
    </HashRouter>
  );
}

export default App;