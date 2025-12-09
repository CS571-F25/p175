import { Navbar, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home } from 'lucide-react';
import logo from '../assets/BirdieBoardLogo.png';

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
        {/* Left: Home icon */}
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

        {/* Right side: Username or Login/Signup */}
        {user ? (
          <NavDropdown
            title={<span className="text-white">{user.username}</span>}
            id="user-nav-dropdown"
            align="end"
            menuVariant="dark"
          >
            <NavDropdown.Item as={Link} to="/my-team">
              My Team
            </NavDropdown.Item>

            <NavDropdown.Divider />

            <NavDropdown.Item onClick={handleLogout}>
              Log Out
            </NavDropdown.Item>
          </NavDropdown>
        ) : (
          <Button as={Link} to="/login" variant="primary">
            Log In / Sign Up
          </Button>
        )}
      </Container>
    </Navbar>
  );
}
