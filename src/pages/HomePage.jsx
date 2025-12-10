// Landing page -> Create Pool/Join Pool actions

import { Container, Row, Col, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Trophy, Users, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
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

  return (
    <PageContainer className="text-center mt-5 mb-5">
      <Container>
        <img
          src={logo}
          alt="BirdieBoard logo"
          height="160"
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
                <Button
                  as={Link}
                  to="/create-league"
                  variant="primary"
                  size="lg"
                >
                  Create a Pool
                </Button>

                <Button
                  as={Link}
                  to="/join-league"
                  size="lg"
                  variant="outline-primary"
                >
                  Join a Pool
                </Button>
              </>
            )}
          </Col>
        </Row>

        <FeatureGrid features={features} />
      </Container>
    </PageContainer>
  );
}
