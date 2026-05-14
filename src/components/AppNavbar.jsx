// Main Navbar present on top of every page
// Includes Home, Logo, and tool bar

import { Navbar, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home } from 'lucide-react';
import logo from '../assets/BirdieBoardLogo.png';
import { getTeamsForUser } from '../utils/leagueAndTeamStorage';

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function goToSection(section) {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const teams = await getTeamsForUser(user.id);
      if (!teams.length) {
        // You can show a toast/alert instead if you want
        alert("You are not in any league yet.");
        return;
      }

      // For now, just use the first league this user has a team in
      const primaryLeagueId = teams[0].leagueId;

      if (section === "leaderboard") {
        navigate(`/league/${primaryLeagueId}`);
      } else if (section === "team") {
        navigate(`/league/${primaryLeagueId}/my-team`);
      } else if (section === "draft") {
        navigate(`/league/${primaryLeagueId}/draft`);
      } else if (section === "field-tracker") {
        navigate(`/league/${primaryLeagueId}/field-tracker`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to find your league. Try refreshing.");
    }
  }

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <Navbar bg="dark" variant="dark" expand="sm" fixed="top" className="px-3">
      <Container fluid>

        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center me-3">
          <Home size={28} className="me-2" />
        </Navbar.Brand>

        <Navbar.Brand className="me-auto">
          <img src={logo} alt="Birdie Board logo" height="40" />
        </Navbar.Brand>

        {user ? (
          <NavDropdown
            title={<span className="text-white">{user.username}</span>}
            id="user-nav-dropdown"
            align="end"
            menuVariant="dark"
          >
            <NavDropdown.Item onClick={() => goToSection("leaderboard")}>
              Leaderboard
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => goToSection("team")}>
              My Team
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => goToSection("draft")}>
              Draftboard
            </NavDropdown.Item>
            <NavDropdown.Item onClick={() => goToSection("field-tracker")}>
              Field Tracker
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
