/* eslint-disable no-unused-vars */
import * as React from "react";
import PropTypes from "prop-types";
import TableCell from "@material-ui/core/TableCell";
import CircularProgress from "@material-ui/core/CircularProgress";
import withTheme from "@material-ui/core/styles/withTheme";
import { setByString } from '../utils';
/* eslint-enable no-unused-vars */

class MTableEditCell extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false,
      // value: this.props.rowData[this.props.columnDef.field],
      data: this.props.rowData
    };
  }

  getStyle = () => {
    let cellStyle = {
      boxShadow: "2px 0px 15px rgba(125,147,178,.25)",
      color: "inherit",
      width: this.props.columnDef.tableData.width,
      boxSizing: "border-box",
      fontSize: "inherit",
      fontFamily: "inherit",
      fontWeight: "inherit",
      padding: "0 16px",
    };

    if (typeof this.props.columnDef.cellStyle === "function") {
      cellStyle = {
        ...cellStyle,
        ...this.props.columnDef.cellStyle(this.state.value, this.props.rowData),
      };
    } else {
      cellStyle = { ...cellStyle, ...this.props.columnDef.cellStyle };
    }

    if (typeof this.props.cellEditable.cellStyle === "function") {
      cellStyle = {
        ...cellStyle,
        ...this.props.cellEditable.cellStyle(
          this.state.value,
          this.props.rowData,
          this.props.columnDef
        ),
      };
    } else {
      cellStyle = { ...cellStyle, ...this.props.cellEditable.cellStyle };
    }

    return cellStyle;
  };

  handleKeyDown = (e) => {
    if (e.keyCode === 13) {
      this.onApprove();
    } else if (e.keyCode === 27) {
      this.onCancel();
    }
  };

  onApprove = () => {
    // long.toquoc remove handle Promise.
    // CMS should take care this.
    this.props.cellEditable
        .onCellEditApproved(
          this.state.data[this.props.columnDef.field], // newValue
          this.props.rowData[this.props.columnDef.field], // oldValue
          this.props.rowData, // rowData with old value
          this.props.columnDef // columnDef
        )
    this.props.onCellEditFinished(
      this.props.rowData,
      this.props.columnDef
    ) 
  };

  onCancel = () => {
    this.props.onCellEditFinished(this.props.rowData, this.props.columnDef);
  };

  renderActions() {
    if (this.state.isLoading) {
      return (
        <div style={{ display: "flex", justifyContent: "center", width: 60 }}>
          <CircularProgress size={20} />
        </div>
      );
    }

    // long.toquoc add to validate input
    let isValid = true
    if (this.props.columnDef.validate) {
      const response = this.props.columnDef.validate(this.state.data);
      switch (typeof response) {
        case "object":
          isValid = response.isValid;
          break;
        case "string":
          isValid = response.length === 0;
          break
        case "boolean":
          isValid = response;
          break;
        default:  
      }
    }

    const actions = [
      {
        icon: this.props.icons.Check,
        tooltip: this.props.localization.saveTooltip,
        onClick: this.onApprove,
        // disabled: this.state.isLoading,
        disabled: !isValid,
      },
      {
        icon: this.props.icons.Clear,
        tooltip: this.props.localization.cancelTooltip,
        onClick: this.onCancel,
        disabled: this.state.isLoading,
      },
    ];

    return (
      <this.props.components.Actions
        actions={actions}
        components={this.props.components}
        size="small"
      />
    );
  }

  render() {
    // long.toquoc add to validate input
    let error = { isValid: true, helperText: "" };
    if (this.props.columnDef.validate) {
      const validateResponse = this.props.columnDef.validate(this.state.data);
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
        default:  
      }
    }
    return (
      <TableCell size={this.props.size} style={this.getStyle()} padding="none">
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ flex: 1, marginRight: 4 }}>
            <this.props.components.EditField
              columnDef={this.props.columnDef}
              // value={this.state.value}
              value={this.state.data[this.props.columnDef.field]}
              error={!error.isValid}
              helperText={error.helperText}
              // onChange={(value) => this.setState({ value })}
              onChange={value => {
                const data = { ...this.state.data };
                setByString(data, this.props.columnDef.field, value);
                // data[columnDef.field] = value;
                this.setState({ data });
              }}
              onKeyDown={this.handleKeyDown}
              disabled={this.state.isLoading}
              autoFocus
            />
          </div>
          {this.renderActions()}
        </div>
      </TableCell>
    );
  }
}

MTableEditCell.defaultProps = {
  columnDef: {},
};

MTableEditCell.propTypes = {
  cellEditable: PropTypes.object.isRequired,
  columnDef: PropTypes.object.isRequired,
  components: PropTypes.object.isRequired,
  errorState: PropTypes.oneOfType([PropTypes.object, PropTypes.bool]),
  icons: PropTypes.object.isRequired,
  localization: PropTypes.object.isRequired,
  onCellEditFinished: PropTypes.func.isRequired,
  rowData: PropTypes.object.isRequired,
  size: PropTypes.string,
};

export default withTheme(MTableEditCell);
