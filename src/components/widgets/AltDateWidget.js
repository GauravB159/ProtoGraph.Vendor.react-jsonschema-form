import React from "react";
import PropTypes from "prop-types";

function AltDateWidget(props) {
  const { AltYearWidget } = props.registry.widgets;
  return <AltYearWidget month day {...props} />;
}

if (process.env.NODE_ENV !== "production") {
  AltDateWidget.propTypes = {
    schema: PropTypes.object.isRequired,
    id: PropTypes.string.isRequired,
    value: PropTypes.string,
    required: PropTypes.bool,
    onChange: PropTypes.func,
  };
}

export default AltDateWidget;
