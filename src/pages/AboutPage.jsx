// Gives the user info on how these golf pools work

import { Container, Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { ShieldCheck, Clock3, Award } from "lucide-react";
import logo from "../assets/BirdieBoardLogo.png";
import PageContainer from "../components/PageContainer";
import PageHeader from "../components/PageHeader";
import FeatureGrid from "../components/FeatureGrid";
import StepList from "../components/StepList";

const guardrails = [
  {
    title: "Secure pools",
    description: "Password-protected leagues keep your draft private to invited friends.",
    icon: <ShieldCheck size={18} aria-hidden="true" />,
  },
  {
    title: "Draft timers",
    description: "Stay on schedule with clear pick order reminders during live drafts.",
    icon: <Clock3 size={18} aria-hidden="true" />,
  },
  {
    title: "Fair scoring",
    description: "Team totals update consistently so everyone sees the same leaderboard.",
    icon: <Award size={18} aria-hidden="true" />,
  },
];

const steps = [
  {
    title: "Create a league",
    description: "Set a tournament and password to generate your pool in seconds.",
  },
  {
    title: "Invite friends",
    description: "Share the league name and password so everyone can claim a seat.",
  },
  {
    title: "Draft your golfers",
    description: "Use the live draft board to pick players in a clear snake order.",
  },
  {
    title: "Track the results",
    description: "Follow team scores and see who takes home the trophy once the event ends.",
  },
];

export default function AboutPage() {
  return (
    <PageContainer className="mt-5 mb-5">
      <Container>
        <Row className="mb-4 justify-content-center text-center">
          <Col md={8}>
            <img
              src={logo}
              alt="BirdieBoard logo"
              height="140"
              className="mb-4 mt-3"
            />

            <PageHeader
              title="What is BirdieBoard?"
              subtitle="BirdieBoard is a fantasy golf web app that lets you create and manage your own PGA draft pools with friends."
              align="center"
            />

            <Button
              as={Link}
              to="/login"
              variant="primary"
              size="lg"
              className="mt-4"
            >
              Log In / Sign Up
            </Button>
          </Col>
        </Row>

        <Row className="mb-5 justify-content-center">
          <Col md={10} lg={8}>
            <Card className="shadow-sm border-0">
              <Card.Body>
                <Card.Title as="h2" className="h4">How Draft Pools Work</Card.Title>
                <StepList steps={steps} />
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <FeatureGrid features={guardrails} />
      </Container>
    </PageContainer>
  );
}
