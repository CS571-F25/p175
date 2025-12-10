import PropTypes from "prop-types";
import { Stack } from "react-bootstrap";

export default function PageHeader({ title, subtitle, align = "start", eyebrow }) {
  const alignmentClass = align === "center" ? "text-center" : align === "end" ? "text-end" : "text-start";

  return (
    <Stack className={`bb-page-header ${alignmentClass}`} gap={2}>
      {eyebrow && (
        <span className="bb-page-eyebrow text-uppercase fw-semibold text-primary">
          {eyebrow}
        </span>
      )}
      <h1 className="mb-0">{title}</h1>
      {subtitle && (
        <p className="lead mb-0 text-secondary">
          {subtitle}
        </p>
      )}
    </Stack>
  );
}

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  align: PropTypes.oneOf(["start", "center", "end"]),
  eyebrow: PropTypes.string,
};
