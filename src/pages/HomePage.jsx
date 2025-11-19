// Landing page -> Create Pool/Join Pool actions

import { Container, Row, Col, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/BirdieBoardLogo.png";

export default function HomePage() {
  const { isLoggedIn } = useAuth();

  return (
    <Container className="text-center mt-5">
      {/* Logo */}
      <img
        src={logo}
        alt="BirdieBoard logo"
        height="160"
        className="mb-5"
      />

      {/* Title + subtitle */}
      <h1>Welcome to BirdieBoard</h1>
      <p className="lead">PGA Draft Pools, simplified.</p>

      <Row className="mt-4 d-flex justify-content-center">
        <Col xs="12" md="6" lg="4" className="d-grid gap-3">
          {!isLoggedIn ? (
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
                Create a League
              </Button>

              <Button
                as={Link}
                to="/join-league"
                variant="outline-light"
                size="lg"
              >
                Join a League
              </Button>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}
