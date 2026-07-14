// Landing page -> Create Pool/Join Pool actions

import { useEffect, useState } from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Trophy, Users, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getLeaguesForUser } from "../utils/leagueAndTeamStorage";
import logo from "../assets/BirdieBoardLogo.png";
import PageHeader from "../components/PageHeader";
import FeatureGrid from "../components/FeatureGrid";
import PageContainer from "../components/PageContainer";

const features = [
  {
    title: "Run leagues effortlessly",
    description: "Create or join PGA pools in seconds with guided set up and smart defaults.",
    icon: <Trophy size={18} aria-hidden="true" />,
  },
  {
    title: "Draft together in real time",
    description: "Host live drafts with clear turn indicators and organized pick tracking.",
    icon: <Users size={18} aria-hidden="true" />,
  },
  {
    title: "Follow every shot",
    description: "View standings, team rosters, and draft history in one consistent dashboard.",
    icon: <Sparkles size={18} aria-hidden="true" />,
  },
];

export default function HomePage() {
  const { user } = useAuth();
  const [userLeagues, setUserLeagues] = useState([]);

  useEffect(() => {
    if (!user) return;
    getLeaguesForUser(user.id)
      .then((leagues) =>
        setUserLeagues([...leagues].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)))
      )
      .catch(() => {});
  }, [user]);

  return (
    <PageContainer className="text-center mt-5 mb-5">
      <Container>
        <img
          src={logo}
          alt="BirdieBoard logo"
          style={{ maxHeight: "160px", maxWidth: "100%", width: "auto" }}
          className="mb-4"
        />

        <PageHeader
          title="Welcome to BirdieBoard"
          subtitle="PGA Draft Pools, simplified."
          align="center"
        />

        <Row className="mt-4 d-flex justify-content-center">
          <Col xs="12" md="6" lg="4" className="d-grid gap-3">
            {!user ? (
              <>
                <Button
                  as={Link}
                  to="/login"
                  variant="primary"
                  size="lg"
                >
                  Log In / Sign Up
                </Button>

                <Button
                  size="lg"
                  as={Link}
                  to="/about"
                  variant="outline-primary"
                >
                  Learn More
                </Button>
              </>
            ) : (
              <>
                {userLeagues.length > 0 && (
                  <div className="bb-home-pool-list">
                    <p className="bb-home-pool-label">Your Pools</p>
                    {userLeagues.map((league) => (
                      <Link
                        key={league.leagueId}
                        to={`/league/${league.leagueId}`}
                        className="bb-home-pool-item"
                      >
                        <span>{league.leagueName}</span>
                        <span className="bb-home-pool-arrow">›</span>
                      </Link>
                    ))}
                  </div>
                )}

                <div className="bb-home-pool-actions">
                  <Button
                    as={Link}
                    to="/create-league"
                    variant="outline-primary"
                    size="sm"
                  >
                    + Create a Pool
                  </Button>
                  <Button
                    as={Link}
                    to="/join-league"
                    size="sm"
                    variant="outline-secondary"
                  >
                    Join a Pool
                  </Button>
                </div>
              </>
            )}
          </Col>
        </Row>

        <FeatureGrid features={features} />

        <Row className="mt-4 d-flex justify-content-center">
          <Col xs="12" md="8" lg="6">
            <div className="p-3 rounded-4 border bg-light text-start">
              <h5 className="mb-2">How scoring works</h5>
              <p className="mb-0 text-muted">
                Each team drafts six golfers, but only your best four scores count
                toward your total. The two worst scores are drops and won&apos;t be
                included in your team&apos;s leaderboard number.
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    </PageContainer>
  );
}
