import React from "react";
import PropTypes from "prop-types";

import {
  isMultiSelect,
  retrieveSchema,
  getDefaultRegistry,
  getUiOptions,
  isFilesArray,
  deepEquals,
  retrieveFromURL
} from "../../utils";
import UnsupportedField from "./UnsupportedField";

const REQUIRED_FIELD_SYMBOL = "*";
const COMPONENT_TYPES = {
  array: "ArrayField",
  boolean: "BooleanField",
  color: "ColorField",
  integer: "NumberField",
  number: "NumberField",
  object: "ObjectField",
  string: "StringField",
  image: "ImageField",
  textarea: "TextareaField"
};

function getFieldComponent(schema, uiSchema, fields) {
  const field = uiSchema["ui:field"];
  if (typeof field === "function") {
    return field;
  }
  if (typeof field === "string" && field in fields) {
    return fields[field];
  }
  const componentName = COMPONENT_TYPES[schema.type];
  return componentName in fields ? fields[componentName] : UnsupportedField;
}

function Label(props) {
  const { label, required, id } = props;
  if (!label) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }
  return (
    <label className="form-label" htmlFor={id}>
      {required ? label + REQUIRED_FIELD_SYMBOL : label}
    </label>
  );
}

function Help(props) {
  const { help } = props;
  if (!help) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }
  if (typeof help === "string") {
    return <p className="form-hint">{help}</p>;
  }
  return <div className="form-hint">{help}</div>;
}

function ErrorList(props) {
  const { errors = [] } = props;
  if (errors.length === 0) {
    return <div />;
  }
  return (
    <div>
      <p />
      <div className="error-detail bs-callout bs-callout-info">
        {errors.map((error, index) => {
          return <p className="form-error-message" key={index}>{error}</p>;
        })}
      </div>
    </div>
  );
}

function DefaultTemplate(props) {
  const {
    id,
    classNames,
    label,
    children,
    errors,
    help,
    description,
    hidden,
    required,
    displayLabel,
  } = props;
  if (hidden) {
    return children;
  }
  return (
    <div className={classNames}>
      {displayLabel && <Label label={label} required={required} id={id} />}
      {children}
      {errors}
      {description}
      {help}
    </div>
  );
}

if (process.env.NODE_ENV !== "production") {
  DefaultTemplate.propTypes = {
    id: PropTypes.string,
    classNames: PropTypes.string,
    label: PropTypes.string,
    children: PropTypes.node.isRequired,
    errors: PropTypes.element,
    rawErrors: PropTypes.arrayOf(PropTypes.string),
    help: PropTypes.element,
    rawHelp: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    description: PropTypes.element,
    rawDescription: PropTypes.oneOfType([PropTypes.string, PropTypes.element]),
    hidden: PropTypes.bool,
    required: PropTypes.bool,
    readonly: PropTypes.bool,
    displayLabel: PropTypes.bool,
    fields: PropTypes.object,
    formContext: PropTypes.object,
  };
}

DefaultTemplate.defaultProps = {
  hidden: false,
  readonly: false,
  required: false,
  displayLabel: true,
};

function customSchemaObjectValidation(condition, referenceFormData) {
  let current_value = condition.element.split("/").reduce((obj, key) => {
      return obj[key];
    }, referenceFormData);

  return condition.value === current_value
}

function customSchemaArrayValidation(conditions, referenceFormData) {
  let isValid = -1;
  conditions.forEach((e) => {
    let isValidSchema = customSchemaObjectValidation(e, referenceFormData);
    switch(e.conjunction) {
      case 'and':
        isValid = isValid === -1 ? isValidSchema : isValid && isValidSchema;
        break;
      case 'or':
        isValid = isValid === -1 ? isValidSchema : isValid || isValidSchema;
        break;
    }
  });
  return isValid;
}

function SchemaFieldRender(props) {
  const {
    uiSchema,
    errorSchema,
    idSchema,
    name,
    registry = getDefaultRegistry()
  } = props;
  const {
    definitions,
    fields,
    formContext,
    FieldTemplate = DefaultTemplate,
  } = registry;
  var schema = retrieveSchema(props.schema, definitions);
  schema = retrieveFromURL(schema,definitions);

  //Custom Schema validations.
  let customRequired;
  if (schema.condition) {
    let isValid,
      condition = schema.condition;

    if (condition.constructor === Array) {
      isValid = customSchemaArrayValidation(condition, props.referenceFormData)
    } else if (condition.constructor === Object) {
      isValid = customSchemaObjectValidation(condition, props.referenceFormData);
    } else {
      isValid = true;
    }

    if (!isValid) {
      return <div />;
    } else {
      customRequired = true;
    }
  }

  let required = customRequired ? customRequired : props.required;

  const FieldComponent = getFieldComponent(schema, uiSchema, fields);
  const { DescriptionField } = fields;
  const disabled = Boolean(props.disabled || uiSchema["ui:disabled"]);
  const readonly = Boolean(props.readonly || uiSchema["ui:readonly"]);
  const autofocus = Boolean(props.autofocus || uiSchema["ui:autofocus"]);

  if (Object.keys(schema).length === 0) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }

  const uiOptions = getUiOptions(uiSchema);
  let { label: displayLabel = true } = uiOptions;
  if (schema.type === "array") {
    displayLabel = isMultiSelect(schema) || isFilesArray(schema, uiSchema);
  }
  if (schema.type === "object") {
    displayLabel = false;
  }
  if (schema.type === "boolean" && !uiSchema["ui:widget"]) {
    displayLabel = false;
  }
  if (uiSchema["ui:field"]) {
    displayLabel = false;
  }

  const { __errors, ...fieldErrorSchema } = errorSchema;
  // See #439: uiSchema: Don't pass consumed class names to child components

  const field = (
    <FieldComponent
      {...props}
      schema={schema}
      uiSchema={{ ...uiSchema, classNames: undefined }}
      disabled={disabled}
      readonly={readonly}
      autofocus={autofocus}
      errorSchema={fieldErrorSchema}
      formContext={formContext}
      required={customRequired}
      referenceFormData={ props.referenceFormData }
    />
  );

  const { type } = schema;
  const id = idSchema.$id;
  const label =
    uiSchema["ui:title"] || props.schema.title || schema.title || name;
  const description =
    uiSchema["ui:description"] ||
    props.schema.description ||
    schema.description;
  const errors = __errors;
  const help = uiSchema["ui:help"];
  const hidden = uiSchema["ui:widget"] === "hidden";
  var classNames;
  if(schema.type !== "object" && schema.type !== "array"){
    classNames = [
      "form-group",
      "field",
      `field-${type}`,
      errors && errors.length > 0 ? "field-error has-error has-danger" : "",
      uiSchema.classNames,
    ]
      .join(" ")
      .trim();
    }else{
      classNames = [
      "field",
      `field-${type}`,
      errors && errors.length > 0 ? "field-error has-error has-danger" : "",
      uiSchema.classNames,
    ]
      .join(" ")
      .trim();
    }
  var isString;
  if(schema.type !== "object" && schema.type !== "array"){
    isString = true;
  }else{
    isString = false;
  }
  const fieldProps = {
    description: (
      <DescriptionField
        id={id + "__description"}
        description={description}
        formContext={formContext}
        isString = {isString}
      />
    ),
    rawDescription: description,
    help: <Help help={help} />,
    rawHelp: typeof help === "string" ? help : undefined,
    errors: <ErrorList errors={errors} />,
    rawErrors: errors,
    id,
    label,
    hidden,
    required,
    readonly,
    displayLabel,
    classNames,
    formContext,
    fields,
    schema,
    uiSchema,
  };

  return <FieldTemplate {...fieldProps}>{field}</FieldTemplate>;
}

class SchemaField extends React.Component {
  shouldComponentUpdate(nextProps, nextState) {
    // if schemas are equal idSchemas will be equal as well,
    // so it is not necessary to compare
    return !deepEquals(
      { ...this.props, idSchema: undefined },
      { ...nextProps, idSchema: undefined }
    );
  }

  render() {
    return SchemaFieldRender(this.props);
  }
}

SchemaField.defaultProps = {
  uiSchema: {},
  errorSchema: {},
  idSchema: {},
  disabled: false,
  readonly: false,
  autofocus: false,
};

if (process.env.NODE_ENV !== "production") {
  SchemaField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.object,
    idSchema: PropTypes.object,
    formData: PropTypes.any,
    errorSchema: PropTypes.object,
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.func, PropTypes.object])
      ).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
      definitions: PropTypes.object.isRequired,
      ArrayFieldTemplate: PropTypes.func,
      FieldTemplate: PropTypes.func,
      formContext: PropTypes.object.isRequired,
    }),
  };
}

export default SchemaField;
