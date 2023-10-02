/* eslint-disable no-unused-vars */
import * as React from 'react';
import { TableCell } from '@material-ui/core';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core';
import clsx from 'clsx';

/* eslint-disable no-useless-escape */
const isoDateRegex = /^\d{4}-(0[1-9]|1[0-2])-([12]\d|0[1-9]|3[01])([T\s](([01]\d|2[0-3])\:[0-5]\d|24\:00)(\:[0-5]\d([\.,]\d+)?)?([zZ]|([\+-])([01]\d|2[0-3])\:?([0-5]\d)?)?)?$/;
/* eslint-enable no-useless-escape */

export class MTableCell extends React.Component {

  getRenderValue() {
    const dateLocale = this.props.columnDef.dateSetting && this.props.columnDef.dateSetting.locale
        ? this.props.columnDef.dateSetting.locale
        : undefined;
    if (this.props.columnDef.emptyValue !== undefined && (this.props.value === undefined || this.props.value === null)) {
      return this.getEmptyValue(this.props.columnDef.emptyValue);
    }
    if (this.props.columnDef.render) {
      if (this.props.rowData) {
        return this.props.columnDef.render(this.props.rowData, 'row');
      }
      else {
        return this.props.columnDef.render(this.props.value, 'group');
      }

    } else if (this.props.columnDef.type === 'boolean') {
      const style = { textAlign: 'left', verticalAlign: 'middle', width: 48 };
      if (this.props.value) {
        return <this.props.icons.Check style={style} />;
      } else {
        return <this.props.icons.ThirdStateCheck style={style} />;
      }
    } else if (this.props.columnDef.type === 'date') {
      if (this.props.value instanceof Date) {
        return this.props.value.toLocaleDateString();
      } else if(isoDateRegex.exec(this.props.value)) {
        return new Date(this.props.value).toLocaleDateString(dateLocale);
      } else {
        return this.props.value;
      }
    } else if (this.props.columnDef.type === 'time') {
      if (this.props.value instanceof Date) {
        return this.props.value.toLocaleTimeString();
      } else if(isoDateRegex.exec(this.props.value)) {
        return new Date(this.props.value).toLocaleTimeString(dateLocale);
      } else {
        return this.props.value;
      }
    } else if (this.props.columnDef.type === 'datetime') {
      if (this.props.value instanceof Date) {
        return this.props.value.toLocaleString();
      } else if(isoDateRegex.exec(this.props.value)) {
        return new Date(this.props.value).toLocaleString(dateLocale);
      } else {
        return this.props.value;
      }
    } else if (this.props.columnDef.type === 'currency') {
      return this.getCurrencyValue(this.props.columnDef.currencySetting, this.props.value);
    }
    else if(typeof this.props.value === "boolean") {
      // To avoid forwardref boolean children.
      return this.props.value.toString();
    }

    return this.props.value;
  }

  getEmptyValue(emptyValue) {
    if (typeof emptyValue === 'function') {
      return this.props.columnDef.emptyValue(this.props.rowData);
    } else {
      return emptyValue;
    }
  }

  getCurrencyValue(currencySetting, value) {
    if (currencySetting !== undefined) {
      return new Intl.NumberFormat((currencySetting.locale !== undefined) ? currencySetting.locale : 'en-US',
        {
          style: 'currency',
          currency: (currencySetting.currencyCode !== undefined) ? currencySetting.currencyCode : 'USD',
          minimumFractionDigits: (currencySetting.minimumFractionDigits !== undefined) ? currencySetting.minimumFractionDigits : 2,
          maximumFractionDigits: (currencySetting.maximumFractionDigits !== undefined) ? currencySetting.maximumFractionDigits : 2
        }).format((value !== undefined) ? value : 0);
    } else {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((value !== undefined) ? value : 0);
    }
  }

  getStyle = () => {
    let cellStyle = {
      color: 'inherit',
      width: this.props.columnDef.tableData.width,
      boxSizing: 'border-box',
      fontSize: "inherit",
      fontFamily: "inherit",
      fontWeight: "inherit",
      padding: "0 16px",
    };

    if (typeof this.props.columnDef.cellStyle === 'function') {
      cellStyle = { ...cellStyle, ...this.props.columnDef.cellStyle(this.props.value, this.props.rowData) };
    } else {
      cellStyle = { ...cellStyle, ...this.props.columnDef.cellStyle };
    }

    if (this.props.columnDef.disableClick) {
      cellStyle.cursor = 'default';
    }

    return { ...this.props.style, ...cellStyle };
  }

  render() {
    const {
      icons,
      columnDef,
      rowData,
      errorState,
      cellEditable,
      onCellEditStarted,
      localization,
      hasAnyEditingRow,
      onClickCell,
      ...cellProps
    } = this.props;
    const cellAlignment =
      columnDef.align !== undefined
        ? columnDef.align
        : ["numeric", "currency"].indexOf(this.props.columnDef.type) !== -1
        ? "right"
        : "left";

    let renderValue = this.getRenderValue();

    if (columnDef.cellTooltip)
    {
      renderValue = (
        <div title={columnDef.cellTooltip}>
          {renderValue}
        </div>
      )
    }

    if (cellEditable) {
      renderValue = (
        <div
          style={{
            cursor: "pointer",
          }}
          onClick={(e) => {
            e.stopPropagation();
            onCellEditStarted(this.props.rowData, this.props.columnDef);
          }}
        >
          {renderValue}
        </div>
      );
    }

    return (
      <TableCell
        size={this.props.size}
        {...cellProps}
        style={this.getStyle()}
        // long.toquoc added
        classes={{
          root: clsx({[this.props.classes.cellStyle]: this.props.columnDef.disableClick !== undefined && !this.props.columnDef.disableClick}),
        }}
        align={cellAlignment}
        onClick={(e) => {
          e.stopPropagation();
          this.props.columnDef.disableClick !== undefined && !this.props.columnDef.disableClick && onClickCell(e, this.props.rowData, this.props.columnDef);
        }}
      >
        {this.props.children}
        {renderValue}
      </TableCell>
    );
  }
}

MTableCell.defaultProps = {
  columnDef: {},
  value: undefined
};

MTableCell.propTypes = {
  columnDef: PropTypes.object.isRequired,
  value: PropTypes.any,
  rowData: PropTypes.object
};

// long.toquoc added
const DEFAULT_SELECTED_COLOR = '#66a5b5'
export const styles = theme => ({
  cellStyle: {
    cursor: "pointer",
    '&:hover': {
      backgroundColor: DEFAULT_SELECTED_COLOR,
    }
  }
});

export default withStyles(styles)(MTableCell);
