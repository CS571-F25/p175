// Main Navbar present on top of every page
// Includes Home, Logo, and tool bar

import { useEffect, useState } from 'react';
import { Navbar, Container, Button, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Home } from 'lucide-react';
import logo from '../assets/BirdieBoardLogo.png';
import { getLeaguesForUser } from '../utils/leagueAndTeamStorage';

export default function AppNavbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userLeagues, setUserLeagues] = useState([]);

  useEffect(() => {
    if (!user) {
      setUserLeagues([]);
      return;
    }
    getLeaguesForUser(user.id)
      .then((leagues) =>
        setUserLeagues([...leagues].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      )
      .catch(() => {});
  }, [user]);

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
            {userLeagues.length === 0 ? (
              <NavDropdown.Item disabled>No pools yet</NavDropdown.Item>
            ) : (
              userLeagues.map((league) => (
                <NavDropdown.Item
                  key={league.leagueId}
                  onClick={() => navigate(`/league/${league.leagueId}`)}
                >
                  {league.leagueName}
                </NavDropdown.Item>
              ))
            )}

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
