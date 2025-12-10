import PropTypes from "prop-types";
import { Card } from "react-bootstrap";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";

export default function AuthFormLayout({ title, subtitle, children, footer }) {
  return (
    <PageContainer className="d-flex flex-column align-items-center justify-content-center min-vh-100">
      <Card className="shadow-sm w-100" style={{ maxWidth: "540px" }}>
        <Card.Body className="p-4 p-md-5">
          <PageHeader title={title} subtitle={subtitle} align="center" />
          <div className="mt-4">{children}</div>
        </Card.Body>
        {footer && <Card.Footer className="text-center bg-white">{footer}</Card.Footer>}
      </Card>
    </PageContainer>
  );
}

AuthFormLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node,
  footer: PropTypes.node,
};
