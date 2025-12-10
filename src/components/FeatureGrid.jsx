import PropTypes from "prop-types";
import { Card, Col, Row } from "react-bootstrap";

export default function FeatureGrid({ features }) {
  return (
    <Row className="g-4 mt-4">
      {features.map((feature) => (
        <Col key={feature.title} xs={12} md={4}>
          <Card className="h-100 shadow-sm border-0">
            <Card.Body>
              <Card.Title as="h3" className="h5 d-flex align-items-center gap-2">
                {feature.icon}
                <span>{feature.title}</span>
              </Card.Title>
              <Card.Text className="text-secondary mb-0">
                {feature.description}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      ))}
    </Row>
  );
}

FeatureGrid.propTypes = {
  features: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
      icon: PropTypes.node,
    })
  ).isRequired,
};
