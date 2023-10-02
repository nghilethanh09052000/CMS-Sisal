/* eslint-disable no-unused-vars */
import TableCell from '@material-ui/core/TableCell';
import TableRow from '@material-ui/core/TableRow';
import Typography from '@material-ui/core/Typography';
import PropTypes from 'prop-types';
import * as React from 'react';
import { byString, setByString } from '../utils';
import * as CommonValues from "../utils/common-values";
/* eslint-enable no-unused-vars */


export default class MTableEditRow extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      data: props.data ? JSON.parse(JSON.stringify(props.data)) : this.createRowData()
    };
  }

  createRowData() {
    return this.props.columns.filter(column => (column.initialEditValue || column.initialEditValue === 0) && column.field).reduce((prev,column)=>{
      prev[column.field]=column.initialEditValue;
      return prev;
    },{});
  }

  renderColumns() {
    const size = CommonValues.elementSize(this.props);
    const mapArr = this.props.columns.filter(columnDef => !columnDef.hidden && !(columnDef.tableData.groupOrder > -1))
      .sort((a, b) => a.tableData.columnOrder - b.tableData.columnOrder)
      .map((columnDef, index) => {
        const value = (typeof this.state.data[columnDef.field] !== 'undefined' ? this.state.data[columnDef.field] : byString(this.state.data, columnDef.field));
        const getCellStyle = (columnDef, value) => {
          // long.toquoc style for add/update/delete row
          let cellStyle = {
            color: 'inherit',
            padding: "0 16px",
            ...this.props.options.cellStyle
          };
          if (typeof columnDef.cellStyle === 'function') {
            cellStyle = { ...cellStyle, ...columnDef.cellStyle(value, this.props.data) };
          } else {
            cellStyle = { ...cellStyle, ...columnDef.cellStyle };
          }
          if (columnDef.disableClick) {
            cellStyle.cursor = 'default';
          }

          return { ...cellStyle };
        };

        const style = {};
        if (index === 0) {
          style.paddingLeft = 24 + this.props.level * 20;
        }

        let allowEditing = false;

        if (columnDef.editable === undefined) {
          allowEditing = true;
        }
        if (columnDef.editable === 'always') {
          allowEditing = true;
        }
        if (columnDef.editable === 'onAdd' && this.props.mode === 'add') {
          allowEditing = true;
        }
        if (columnDef.editable === 'onUpdate' && this.props.mode === 'update') {
          allowEditing = true;
        }
        if (typeof columnDef.editable == 'function'){
            allowEditing = columnDef.editable(columnDef, this.props.data);
        }
        if (!columnDef.field || !allowEditing) {
          const readonlyValue = this.props.getFieldValue(this.state.data, columnDef);
          return (
            <this.props.components.Cell
              size={size}
              icons={this.props.icons}
              columnDef={columnDef}
              value={readonlyValue}
              key={columnDef.tableData.id}
              rowData={this.props.data}
              style={getCellStyle(columnDef, value)}
            />
          );
        }
        else {
          const { editComponent, ...cellProps } = columnDef;
          const EditComponent = editComponent || this.props.components.EditField;
          // long.toquoc add to validate input
          let error = { isValid: true, helperText: "" };
          if (columnDef.validate) {
            const validateResponse = columnDef.validate(this.state.data);
            switch (typeof validateResponse) {
              case "object":
                error = { ...validateResponse };
                break;
              case "boolean":
                error = { isValid: validateResponse, helperText: "" };
                break;
              case "string":
                error = { isValid: false, helperText: validateResponse };
                break;
            }
          }
          return (
            <TableCell
              size={size}
              key={columnDef.tableData.id}
              align={['numeric'].indexOf(columnDef.type) !== -1 ? "right" : "left"}
              style={getCellStyle(columnDef, value)}
            >
              <EditComponent
                key={columnDef.tableData.id}
                columnDef={cellProps}
                value={value}
                error={!error.isValid}
                helperText={error.helperText}
                locale={this.props.localization.dateTimePickerLocalization}
                rowData={this.state.data}
                onChange={value => {
                  const data = { ...this.state.data };
                  setByString(data, columnDef.field, value);
                  // data[columnDef.field] = value;
                  this.setState({ data });
                }}
                onRowDataChange={data => {
                  this.setState({ data });
                }}
              />
            </TableCell>
          );
        }
      });
    return mapArr;
  }

  renderActions() {
    const size = CommonValues.elementSize(this.props);
    const localization = { ...MTableEditRow.defaultProps.localization, ...this.props.localization };
    // long.toquoc add to validate input
    const isValid = this.props.columns.every((column) => {
      if (column.validate) {
        const response = column.validate(this.state.data);
        switch (typeof response) {
          case "object":
            return response.isValid;
          case "string":
            return response.length === 0;
          case "boolean":
            return response;
        }
      } else {
        return true;
      }
    });
    const actions = [
      {
        icon: this.props.icons.Check,
        tooltip: localization.saveTooltip,
        disabled: this.props.mode === "delete" ? false : !isValid,
        onClick: () => {
          const newData = this.state.data;
          delete newData.tableData;
          this.props.onEditingApproved(this.props.mode, this.state.data, this.props.data);
        }
      },
      {
        icon: this.props.icons.Clear,
        tooltip: localization.cancelTooltip,
        onClick: () => {
          this.props.onEditingCanceled(this.props.mode, this.props.data);
        }
      }
    ];
    return (
      // long.toquoc add justifyContent: 'center' for icons actions confirmation
      <TableCell size={size} padding="none" key="key-actions-column" style={{ width: 42 * actions.length, padding: '0px 5px', ...this.props.options.cellStyle }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <this.props.components.Actions data={this.props.data} actions={actions} components={this.props.components} size={size} />
        </div>
      </TableCell>
    );
  }

  // long.toquoc style for add/update/delete row
  getStyle() {
    const style = {
      backgroundColor: '#3883FA1F',
    };

    return style;
  }

  cancelEdit = (e) => {
    if(e.keyCode === 27) {
      this.props.onEditingCanceled(this.props.mode, this.props.data);
    }
  }

  render() {
    const size = CommonValues.elementSize(this.props);
    const localization = { ...MTableEditRow.defaultProps.localization, ...this.props.localization };
    let columns;
    if (this.props.mode === "add" || this.props.mode === "update") {
      columns = this.renderColumns();
    }
    else {
      const colSpan = this.props.columns.filter(columnDef => !columnDef.hidden && !(columnDef.tableData.groupOrder > -1)).length;
      columns = [
        <TableCell
          size={size}
          padding={this.props.options.actionsColumnIndex === 0 ? "none" : undefined}
          key="key-edit-cell"
          colSpan={colSpan}>
          <Typography align='center' variant="h6">
            {localization.deleteText}
          </Typography>
        </TableCell>
      ];
    }


    if (this.props.options.selection) {
      // long.toquoc set style for select cell in edit/add
      columns.splice(0, 0, <TableCell style={this.props.options.cellStyle} padding="none" key="key-selection-cell" />);
    }
    if (this.props.isTreeData) {
      columns.splice(0, 0, <TableCell padding="none" key="key-tree-data-cell" />);
    }

    if (this.props.options.actionsColumnIndex === -1) {
      columns.push(this.renderActions());
    } else if (this.props.options.actionsColumnIndex >= 0) {
      let endPos = 0;
      if (this.props.options.selection) {
        endPos = 1;
      }
      if (this.props.isTreeData) {
        endPos = 1;
        if (this.props.options.selection) {
          columns.splice(1, 1);
        }
      }
      columns.splice(this.props.options.actionsColumnIndex + endPos, 0, this.renderActions());
    }

    // Lastly we add detail panel icon
    if (this.props.detailPanel) {
      const aligment = this.props.options.detailPanelColumnAlignment;
      const index = aligment === "left" ? 0 : columns.length;
      columns.splice(index, 0, <TableCell padding="none" key="key-detail-panel-cell" />);
    }

    this.props.columns
      .filter(columnDef => columnDef.tableData.groupOrder > -1)
      .forEach(columnDef => {
        columns.splice(0, 0, <TableCell padding="none" key={"key-group-cell" + columnDef.tableData.id} />);
      });

    const {
      detailPanel,
      isTreeData,
      onRowClick,
      onRowSelected,
      onTreeExpandChanged,
      onToggleDetailPanel,
      onEditingApproved,
      onEditingCanceled,
      getFieldValue,
      components,
      icons,
      columns: columnsProp, // renamed to not conflict with definition above
      localization: localizationProp, // renamed to not conflict with definition above
      options,
      actions,
      ...rowProps
    } = this.props;

    return (
      <>
        <TableRow
         onKeyDown={this.cancelEdit}
          {...rowProps}
          style={this.getStyle()}
        >
          {columns}
        </TableRow>
      </>
    );
  }
}

MTableEditRow.defaultProps = {
  actions: [],
  index: 0,
  options: {},
  path: [],
  localization: {
    saveTooltip: 'Save',
    cancelTooltip: 'Cancel',
    deleteText: 'Are you sure you want to delete this row?',
  }
};

MTableEditRow.propTypes = {
  actions: PropTypes.array,
  icons: PropTypes.any.isRequired,
  index: PropTypes.number.isRequired,
  data: PropTypes.object,
  detailPanel: PropTypes.oneOfType([PropTypes.func, PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.object, PropTypes.func]))]),
  options: PropTypes.object.isRequired,
  onRowSelected: PropTypes.func,
  path: PropTypes.arrayOf(PropTypes.number),
  columns: PropTypes.array,
  onRowClick: PropTypes.func,
  onEditingApproved: PropTypes.func,
  onEditingCanceled: PropTypes.func,
  localization: PropTypes.object,
  getFieldValue: PropTypes.func
};
