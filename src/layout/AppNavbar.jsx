// Top navigation bar -> Links to home and login pages

import { Navbar, Container, Button } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home } from 'lucide-react';
import logo from '../assets/BirdieBoardLogo.png';

export default function AppNavbar() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();

  // TODO: Button for logout (must be logged in)
  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <Navbar
      bg="dark"
      variant="dark"
      expand="sm"
      fixed="top"
      className="px-3"
    >
      <Container fluid>
        {/* Left: Home icon, also acts as brand link */}
        <Navbar.Brand
          as={Link}
          to="/"
          className="d-flex align-items-center me-3"
        >
          <Home size={28} className="me-2" />
        </Navbar.Brand>

        {/* Middle: Logo */}
        <Navbar.Brand className="me-auto">
          <img
            src={logo}
            alt="Birdie Board logo"
            height="40"
            className="d-inline-block align-top"
          />
        </Navbar.Brand>

        {/* Right: Auth button */}
        {isLoggedIn ? (
          <Button variant="primary" onClick={handleLogout}>
            Logout
          </Button>
        ) : (
          <Button as={Link} to="/login" variant="primary">
            Log In / Sign Up
          </Button>
        )}
      </Container>
    </Navbar>
  );
}