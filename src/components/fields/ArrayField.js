import React, { Component } from "react";
import PropTypes from "prop-types";
import {SortableContainer, SortableElement,SortableHandle,arrayMove} from 'react-sortable-hoc';

import {
  getWidget,
  getDefaultFormState,
  getUiOptions,
  isMultiSelect,
  isFilesArray,
  isFixedItems,
  allowAdditionalItems,
  optionsList,
  retrieveSchema,
  toIdSchema,
  getDefaultRegistry,
} from "../../utils";

const DragHandle = SortableHandle(() => <span><i style = {{marginTop:"8px"}}className ="move icon"></i>
</span>);

const SortableItem = SortableElement((val) =>{
  var props = val.value;
  return(

      <div className={props.hasToolbar ? "twelve wide column" : "sixteen wide column"} key={props.index} >
        <DragHandle />
        <RemoveBtn
          type="danger"
          icon="remove"
          tabIndex="-1"
          disabled={props.disabled || props.readonly}
          onClick={props.onDropIndexClick(props.index)}
        />
        {props.children}
      </div>

    );
});

const SortableList = SortableContainer((props) => {
  return (
    <fieldset className={props.className}>

      <ArrayFieldTitle
        key={`array-field-title-${props.idSchema.$id}`}
        TitleField={props.TitleField}
        idSchema={props.idSchema}
        title={props.title}
        required={props.required}
      />

      {props.schema.description &&
        <ArrayFieldDescription
          key={`array-field-description-${props.idSchema.$id}`}
          DescriptionField={props.DescriptionField}
          idSchema={props.idSchema}
          description={props.schema.description}
        />}

      <div
        className="row array-item-list"
        key={`array-item-list-${props.idSchema.$id}`}>
        {props.items && props.items.map((value, index) => {
          return (<SortableItem key={`item-${index}`} index={index} value={value} />);
      })}
      </div>

      {props.canAdd &&
        <AddButton
          onClick={props.onAddClick}
          disabled={props.disabled || props.readonly}
          buttonText={props.addButtonText}
        />}
    </fieldset>
  );
});

function ArrayFieldTitle({ TitleField, idSchema, title, required }) {
  if (!title) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }
  const id = `${idSchema.$id}__title`;
  return <TitleField id={id} title={title} required={required} />;
}

function ArrayFieldDescription({ DescriptionField, idSchema, description }) {
  if (!description) {
    // See #312: Ensure compatibility with old versions of React.
    return <div />;
  }
  const id = `${idSchema.$id}__description`;
  return <DescriptionField id={id} description={description} />;
}

function IconBtn(props) {
  const { type = "default", icon, className, buttonText, ...otherProps } = props;
  return (
    <button
      type="button"
      className={ className }
      {...otherProps}>
      { buttonText ? buttonText :  <i className={`${icon} icon`} style={{"margin": "0px"}} />}
    </button>
  );
}
function RemoveBtn(props){
  const { type = "default", icon, className, ...otherProps } = props;
  return (
    <button
      type="button"
      style = {{fontSize:"20"}}
      className={`default-button delete-button`}
      {...otherProps}>
      <i style={{color:"red"}} className="remove icon"  style={{"margin": "0px"}} />
    </button>
  );
}
// Used in the two templates
function DefaultArrayItem(props, index) {
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: "bold",
  };

  return (

    <div key={index} className={`form-accordion ${props.itemErrorSchema && props.itemErrorSchema.__errors && props.itemErrorSchema.__errors.length > 0 ? 'protograph-error-accordion' : ''}`}>
      <div className={`${index === 0 ? 'title active' : 'title'}`}>
        <h5>{props.itemSchema.title}{` ${props.itemSchema.separator || '-'}`}{index + 1}</h5>
      </div>
      <div className={`${index === 0 ? 'content active' : 'content'}`}>
        {props.children}
      </div>
      <div className="form-buttons-container">
        {
          props.hasToolbar &&
            <div className="mini ui buttons">
              {(props.hasMoveUp || props.hasMoveDown) &&
                <IconBtn
                  icon="arrow up"
                  className="ui button"
                  tabIndex="-1"
                  style={btnStyle}
                  disabled={props.disabled || props.readonly || !props.hasMoveUp}
                  onClick={props.onReorderClick(props.index, props.index - 1)}
                />}
              {(props.hasMoveUp || props.hasMoveDown) &&
                <IconBtn
                  icon="arrow down"
                  className="ui button"
                  tabIndex="-1"
                  style={btnStyle}
                  disabled={
                    props.disabled || props.readonly || !props.hasMoveDown
                  }
                  onClick={props.onReorderClick(props.index, props.index + 1)}
                />}
              {props.hasRemove &&
                <IconBtn
                  type="danger"
                  icon="remove"
                  className="ui red button"
                  tabIndex="-1"
                  style={btnStyle}
                  disabled={props.disabled || props.readonly}
                  onClick={props.onDropIndexClick(props.index)}
                />}
            </div>
        }
      </div>
    </div>
  );
}

function DefaultFixedArrayFieldTemplate(props) {
  return (
    <fieldset className={props.className}>

      <ArrayFieldTitle
        key={`array-field-title-${props.idSchema.$id}`}
        TitleField={props.TitleField}
        idSchema={props.idSchema}
        title={props.title}
        required={props.required}
      />

      {props.schema.description &&
        <div
          className="field-description"
          key={`field-description-${props.idSchema.$id}`}>
          {props.schema.description}
        </div>}

      <div
        className="row array-item-list"
        key={`array-item-list-${props.idSchema.$id}`}>
        {props.items && props.items.map(DefaultArrayItem)}
      </div>

      {props.canAdd &&
        <AddButton
          onClick={props.onAddClick}
          disabled={props.disabled || props.readonly}
          buttonText={props.addButtonText}
        />}
    </fieldset>
  );
}

function DefaultNormalArrayFieldTemplate(props) {
  const btnStyle = {
    flex: 1,
    paddingLeft: 6,
    paddingRight: 6,
    fontWeight: "bold",
  };
  const isParentArray = props.schema.id.indexOf('items') > -1;
  return (
    <div className={props.className}>

      <ArrayFieldTitle
        key={`array-field-title-${props.idSchema.$id}`}
        TitleField={props.TitleField}
        idSchema={props.idSchema}
        title={props.title}
        required={props.required}
      />

      {props.schema.description &&
        <ArrayFieldDescription
          key={`array-field-description-${props.idSchema.$id}`}
          DescriptionField={props.DescriptionField}
          idSchema={props.idSchema}
          description={props.schema.description}
        />}

      <div className={`${ isParentArray ? '' : 'ui' } styled fluid accordion`}>
        {
          props.items && props.items.map((p, i) => {
            return DefaultArrayItem(p, i);
          })
        }
      </div>

      {props.canAdd &&
        <AddButton
          onClick={props.onAddClick}
          disabled={props.disabled || props.readonly}
          buttonText={props.addButtonText}
        />}
    </div>
  );
}

class ArrayField extends Component {
  constructor(){
    super();
    this.onSortEnd = this.onSortEnd.bind(this);
  }

  static defaultProps = {
    uiSchema: {},
    formData: [],
    idSchema: {},
    required: false,
    disabled: false,
    readonly: false,
    autofocus: false,
  };

  onSortEnd = ({oldIndex, newIndex}) => {
    const { formData, onChange } = this.props;
    onChange(
      formData.map((item, i) => {
        if (i === newIndex) {
          return formData[oldIndex];
        } else if (i === oldIndex) {
          return formData[newIndex];
        } else {
          return item;
        }
      }),
      { validate: true }
    );
  };

  get itemTitle() {
    const { schema } = this.props;
    return schema.items.title || schema.items.description || "Item";
  }

  isItemRequired(itemSchema) {
    if (Array.isArray(itemSchema.type)) {
      // While we don't yet support composite/nullable jsonschema types, it's
      // future-proof to check for requirement against these.
      return !itemSchema.type.includes("null");
    }
    // All non-null array item types are inherently required by design
    return itemSchema.type !== "null";
  }

  onAddClick = event => {
    event.preventDefault();
    const { schema, formData, registry = getDefaultRegistry() } = this.props;
    const { definitions } = registry;
    let itemSchema = schema.items;
    if (isFixedItems(schema) && allowAdditionalItems(schema)) {
      itemSchema = schema.additionalItems;
    }
    this.props.onChange(
      [...formData, getDefaultFormState(itemSchema, undefined, definitions)],
      { validate: false }
    );
  };

  onDropIndexClick = index => {
    return event => {
      if (event) {
        event.preventDefault();
      }
      const { formData, onChange } = this.props;
      // refs #195: revalidate to ensure properly reindexing errors
      onChange(formData.filter((_, i) => i !== index), { validate: true });
    };
  };

  onReorderClick = (index, newIndex) => {
    return event => {
      if (event) {
        event.preventDefault();
        event.target.blur();
      }
      const { formData, onChange } = this.props;
      onChange(
        formData.map((item, i) => {
          if (i === newIndex) {
            return formData[index];
          } else if (i === index) {
            return formData[newIndex];
          } else {
            return item;
          }
        }),
        { validate: true }
      );
    };
  };

  onChangeForIndex = index => {
    return value => {
      const { formData, onChange } = this.props;
      const newFormData = formData.map((item, i) => {
        // We need to treat undefined items as nulls to have validation.
        // See https://github.com/tdegrunt/jsonschema/issues/206
        const jsonValue = typeof value === "undefined" ? null : value;
        return index === i ? jsonValue : item;
      });
      onChange(newFormData, { validate: false });
    };
  };

  onSelectChange = value => {
    this.props.onChange(value, { validate: false });
  };

  render() {
    const { schema, uiSchema } = this.props;
    if (isFilesArray(schema, uiSchema)) {
      return this.renderFiles();
    }
    if (isFixedItems(schema)) {
      return this.renderFixedArray();
    }
    if (isMultiSelect(schema)) {
      return this.renderMultiSelect();
    }

    return this.renderNormalArray(schema.drag);
  }

  componentDidMount() {
    $('.ui.accordion').accordion();
  }

  componentDidUpdate() {
    $('.ui.accordion').accordion();
  }

  renderNormalArray( isDraggable ) {
    const {
      schema,
      uiSchema,
      formData,
      errorSchema,
      idSchema,
      name,
      required,
      disabled,
      readonly,
      autofocus,
      registry = getDefaultRegistry(),
      formContext,
      onBlur,
    } = this.props;
    const title = schema.title === undefined ? name : schema.title;
    const { ArrayFieldTemplate, definitions, fields } = registry;
    const { TitleField, DescriptionField } = fields;
    const itemsSchema = retrieveSchema(schema.items, definitions);
    const { addable = true } = getUiOptions(uiSchema);
    const arrayProps = {
      canAdd: addable && (itemsSchema.maxItems ? formData.length < itemsSchema.maxItems : true),
      addButtonText: (addable && itemsSchema.addButtonText ? itemsSchema.addButtonText : undefined),
      items: formData.map((item, index) => {
        const itemErrorSchema = errorSchema ? errorSchema[index] : undefined;
        const itemIdPrefix = idSchema.$id + "_" + index;
        const itemIdSchema = toIdSchema(itemsSchema, itemIdPrefix, definitions);
        return this.renderArrayFieldItem({
          index,
          canMoveUp: index > 0,
          canMoveDown: index < formData.length - 1,
          itemSchema: itemsSchema,
          itemIdSchema,
          itemErrorSchema,
          itemData: formData[index],
          itemUiSchema: uiSchema.items,
          autofocus: autofocus && index === 0,
          onBlur,
          canRemove: itemsSchema.minItems ? formData.length > itemsSchema.minItems : true
        });
      }),
      className: `field field-array field-array-of-${itemsSchema.type}`,
      DescriptionField,
      disabled,
      idSchema,
      uiSchema,
      onAddClick: this.onAddClick,
      readonly,
      required,
      schema,
      title,
      TitleField,
      formContext,
      onSortEnd:this.onSortEnd ,
      useWindowAsScrollContainer: true
    };

    // Check if a custom render function was passed in
    const Component = ArrayFieldTemplate || DefaultNormalArrayFieldTemplate;

    if(isDraggable){
      return <SortableList {...arrayProps}/>;
    }else{
      return <Component {...arrayProps}/>;
    }
  }

  renderMultiSelect() {
    const {
      schema,
      idSchema,
      uiSchema,
      disabled,
      readonly,
      autofocus,
      onBlur,
      registry = getDefaultRegistry(),
    } = this.props;
    const items = this.props.formData;
    const { widgets, definitions, formContext } = registry;
    const itemsSchema = retrieveSchema(schema.items, definitions);
    const enumOptions = optionsList(itemsSchema);
    const { widget = "select", ...options } = {
      ...getUiOptions(uiSchema),
      enumOptions,
    };
    const Widget = getWidget(schema, widget, widgets);
    return (
      <Widget
        id={idSchema && idSchema.$id}
        multiple
        onChange={this.onSelectChange}
        onBlur={onBlur}
        options={options}
        schema={schema}
        value={items}
        disabled={disabled}
        readonly={readonly}
        formContext={formContext}
        autofocus={autofocus}
      />
    );
  }

  renderFiles() {
    const {
      schema,
      uiSchema,
      idSchema,
      name,
      disabled,
      readonly,
      autofocus,
      onBlur,
      registry = getDefaultRegistry(),
    } = this.props;
    const title = schema.title || name;
    const items = this.props.formData;
    const { widgets, formContext } = registry;
    const { widget = "files", ...options } = getUiOptions(uiSchema);
    const Widget = getWidget(schema, widget, widgets);
    return (
      <Widget
        options={options}
        id={idSchema && idSchema.$id}
        multiple
        onChange={this.onSelectChange}
        onBlur={onBlur}
        schema={schema}
        title={title}
        value={items}
        disabled={disabled}
        readonly={readonly}
        formContext={formContext}
        autofocus={autofocus}
      />
    );
  }

  renderFixedArray() {
    const {
      schema,
      uiSchema,
      errorSchema,
      idSchema,
      name,
      required,
      disabled,
      readonly,
      autofocus,
      registry = getDefaultRegistry(),
      onBlur,
    } = this.props;
    const title = schema.title || name;
    let items = this.props.formData;
    const { ArrayFieldTemplate, definitions, fields } = registry;
    const { TitleField } = fields;
    const itemSchemas = schema.items.map(item =>
      retrieveSchema(item, definitions)
    );
    const additionalSchema = allowAdditionalItems(schema)
      ? retrieveSchema(schema.additionalItems, definitions)
      : null;
    const { addable = true } = getUiOptions(uiSchema);
    const canAdd = addable && additionalSchema;

    if (!items || items.length < itemSchemas.length) {
      // to make sure at least all fixed items are generated
      items = items || [];
      items = items.concat(new Array(itemSchemas.length - items.length));
    }

    // These are the props passed into the render function
    const arrayProps = {
      canAdd,
      className: "field field-array field-array-fixed-items",
      disabled,
      idSchema,
      items: items.map((item, index) => {
        const additional = index >= itemSchemas.length;
        const itemSchema = additional ? additionalSchema : itemSchemas[index];
        const itemIdPrefix = idSchema.$id + "_" + index;
        const itemIdSchema = toIdSchema(itemSchema, itemIdPrefix, definitions);
        const itemUiSchema = additional
          ? uiSchema.additionalItems || {}
          : Array.isArray(uiSchema.items)
            ? uiSchema.items[index]
            : uiSchema.items || {};
        const itemErrorSchema = errorSchema ? errorSchema[index] : undefined;

        return this.renderArrayFieldItem({
          index,
          canRemove: additional,
          canMoveUp: index >= itemSchemas.length + 1,
          canMoveDown: additional && index < items.length - 1,
          itemSchema,
          itemData: item,
          itemUiSchema,
          itemIdSchema,
          itemErrorSchema,
          autofocus: autofocus && index === 0,
          onBlur,
        });
      }),
      onAddClick: this.onAddClick,
      readonly,
      required,
      schema,
      uiSchema,
      title,
      TitleField,
    };

    // Check if a custom template template was passed in
    const Template = ArrayFieldTemplate || DefaultFixedArrayFieldTemplate;
    return <Template {...arrayProps} />;
  }

  renderArrayFieldItem(props) {
    const {
      index,
      canRemove = props.canRemove,
      canMoveUp = true,
      canMoveDown = true,
      itemSchema,
      itemData,
      itemUiSchema,
      itemIdSchema,
      itemErrorSchema,
      autofocus,
      onBlur,
    } = props;
    const {
      disabled,
      readonly,
      uiSchema,
      registry = getDefaultRegistry(),
    } = this.props;
    const { fields: { SchemaField } } = registry;
    const { orderable, removable } = {
      orderable: true,
      removable: true,
      ...uiSchema["ui:options"],
    };
    const has = {
      moveUp: orderable && canMoveUp,
      moveDown: orderable && canMoveDown,
      remove: removable && canRemove,
    };
    has.toolbar = Object.keys(has).some(key => has[key]);

    return {
      children: (
        <SchemaField
          schema={itemSchema}
          uiSchema={itemUiSchema}
          formData={itemData}
          errorSchema={itemErrorSchema}
          idSchema={itemIdSchema}
          required={this.isItemRequired(itemSchema)}
          onChange={this.onChangeForIndex(index)}
          onBlur={onBlur}
          registry={this.props.registry}
          disabled={this.props.disabled}
          readonly={this.props.readonly}
          autofocus={autofocus}
          referenceFormData={this.props.referenceFormData}
        />
      ),
      itemErrorSchema: itemErrorSchema,
      className: "array-item",
      itemSchema: itemSchema,
      disabled,
      hasToolbar: has.toolbar,
      hasMoveUp: has.moveUp,
      hasMoveDown: has.moveDown,
      hasRemove: has.remove,
      index,
      onDropIndexClick: this.onDropIndexClick,
      onReorderClick: this.onReorderClick,
      readonly,
    };
  }
}

function AddButton({ onClick, disabled, buttonText }) {
  return (
    <IconBtn
      type="info"
      icon="plus"
      className="ui button plus form-dashed-buttons"
      tabIndex="0"
      buttonText={buttonText}
      onClick={onClick}
      disabled={disabled}
    />
  );
}

if (process.env.NODE_ENV !== "production") {
  ArrayField.propTypes = {
    schema: PropTypes.object.isRequired,
    uiSchema: PropTypes.shape({
      "ui:options": PropTypes.shape({
        addable: PropTypes.bool,
        orderable: PropTypes.bool,
        removable: PropTypes.bool,
      }),
    }),
    idSchema: PropTypes.object,
    errorSchema: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    onBlur: PropTypes.func,
    formData: PropTypes.array,
    required: PropTypes.bool,
    disabled: PropTypes.bool,
    readonly: PropTypes.bool,
    autofocus: PropTypes.bool,
    registry: PropTypes.shape({
      widgets: PropTypes.objectOf(
        PropTypes.oneOfType([PropTypes.func, PropTypes.object])
      ).isRequired,
      fields: PropTypes.objectOf(PropTypes.func).isRequired,
      definitions: PropTypes.object.isRequired,
      formContext: PropTypes.object.isRequired,
    }),
  };
}

export default ArrayField;
