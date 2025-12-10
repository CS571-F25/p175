import PropTypes from "prop-types";
import { ListGroup } from "react-bootstrap";

export default function StepList({ steps }) {
  return (
    <ListGroup as="ol" numbered className="shadow-sm">
      {steps.map((step, index) => (
        <ListGroup.Item as="li" key={index} className="py-3">
          <div className="fw-semibold">{step.title}</div>
          <div className="text-secondary small mb-0">{step.description}</div>
        </ListGroup.Item>
      ))}
    </ListGroup>
  );
}

StepList.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      title: PropTypes.string.isRequired,
      description: PropTypes.string.isRequired,
    })
  ).isRequired,
};
