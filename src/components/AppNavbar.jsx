import { Navbar, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home } from 'lucide-react';
import logo from '../assets/BirdieBoardLogo.png';

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function getUserLeagueId(userId) {
    const res = await fetch(
      `YOUR_BUCKET_URL/collections/bb-teams`,
      { headers: { "Content-Type": "application/json" } }
    );
    const data = await res.json();

    const team = Object.values(data.results).find(
      (t) => t.userId === userId
    );

    return team?.leagueId || null;
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
            <NavDropdown.Item
              onClick={async () => {
                const id = await getUserLeagueId(user.id);
                if (id) navigate(`/league/${id}`);
              }}
            >
              Leaderboard
            </NavDropdown.Item>

            <NavDropdown.Item
              onClick={async () => {
                const id = await getUserLeagueId(user.id);
                if (id) navigate(`/league/${id}/team`);
              }}
            >
              My Team
            </NavDropdown.Item>

            <NavDropdown.Item
              onClick={async () => {
                const id = await getUserLeagueId(user.id);
                if (id) navigate(`/league/${id}/draft`);
              }}
            >
              Draftboard
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
