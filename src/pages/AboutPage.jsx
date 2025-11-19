// Gives the user info on how these golf pools work

import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import logo from "../assets/BirdieBoardLogo.png";

export default function AboutPage() {
  return (
    <Container className="mt-5 mb-5">
      {/* Hero section */}
      <Row className="mb-4">
        <Col md={{ span: 8, offset: 2 }} className="text-center">
          {/* Logo */}
          <img
            src={logo}
            alt="BirdieBoard logo"
            height="140"
            className="mb-5 mt-3"
          />

          <h1 className="mb-3">What is BirdieBoard?</h1>
          <p className="lead">
            BirdieBoard is a fantasy golf web app that lets you create and manage
            your own PGA draft pools with friends.
          </p>

          {/* Log In / Sign Up button */}
          <Button
            as={Link}
            to="/login"
            variant="primary"
            size="lg"
            className="mt-2"
          >
            Log In / Sign Up
          </Button>
        </Col>
      </Row>

      {/* How draft pools work */}
      <Row className="mb-4">
        <Col md={{ span: 10, offset: 1 }}>
          <Card className="shadow-sm border-0">
            <Card.Body>
              <Card.Title>How Draft Pools Work</Card.Title>
              <Card.Text>
                In a BirdieBoard league, an admin sets up a pool for a specific PGA
                tournament and decides how many teams will participate. Each team
                drafts golfers in a snake-style draft:
              </Card.Text>
              <ol>
                <li>The admin creates a league for a specific tournament.</li>
                <li>Teams are added to the league.</li>
                <li>Teams take turns drafting golfers from a shared player pool.</li>
                <li>
                  Once the real tournament is over, each golfer’s score contributes
                  to their team’s total.
                </li>
                <li>The team with the best total score wins the pool.</li>
              </ol>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}