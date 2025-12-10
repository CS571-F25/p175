import PropTypes from "prop-types";
import { Container } from "react-bootstrap";

export default function PageContainer({ children, className = "", ...props }) {
  const combinedClass = `bb-page-container ${className}`.trim();

  return (
    <Container fluid="md" className={combinedClass} {...props}>
      {children}
    </Container>
  );
}

PageContainer.propTypes = {
  children: PropTypes.node,
  className: PropTypes.string,
};
