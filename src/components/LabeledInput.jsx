import PropTypes from "prop-types";
import { Form } from "react-bootstrap";

export default function LabeledInput({ id, label, srOnly = false, children, ...props }) {
  return (
    <Form.Group className="mb-3 text-start" controlId={id}>
      <Form.Label className={srOnly ? "visually-hidden" : "fw-semibold"}>
        {label}
      </Form.Label>
      <Form.Control {...props} />
      {children}
    </Form.Group>
  );
}

LabeledInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  srOnly: PropTypes.bool,
  children: PropTypes.node,
};
