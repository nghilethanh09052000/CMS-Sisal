/* eslint-disable no-unused-vars */
import * as React from 'react';
import PropTypes from 'prop-types';
import Icon from '@material-ui/core/Icon';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
/* eslint-enable no-unused-vars */

class MTableAction extends React.Component {
  render() {
    let action = this.props.action;

    if (typeof action === 'function') {
      action = action(this.props.data);
      if (!action) {
        return null;
      }
    }

    if (action.action) {
      action = action.action(this.props.data);
      if (!action) {
        return null;
      }
    }

    if (action.hidden) {
      return null;
    }

    // LCD modified
    let actionDisabled = undefined
    if (typeof action.disabled === 'function') {
      actionDisabled = action.disabled(this.props.data)
    } else if (action.disabled) {
      actionDisabled = action.disabled
    }

    const disabled = actionDisabled || this.props.disabled;

    const handleOnClick = event => {
      if (action.onClick) {
        action.onClick(event, this.props.data);
        event.stopPropagation();
      }
    };

    const icon = typeof action.icon === "string" ? (
      <Icon {...action.iconProps}>{action.icon}</Icon>
    ) : typeof action.icon === "function" ? (
      // LCD modified: add row data for custom action icon
      action.icon({ ...action.iconProps, disabled: disabled }, this.props.data)
    ) : (
          <action.icon />
        );

    const button = (
      <IconButton
        size={this.props.size}
        color="inherit"
        disabled={disabled}
        onClick={handleOnClick}
      >
        {icon}
      </IconButton>
    );

    if (action.tooltip) {
      // LCD modified: add row data for custom action tooltip
      const tooltip = typeof action.tooltip === "string"
        ? action.tooltip
        : typeof action.tooltip === "function"
          ? action.tooltip(this.props.data)
          : ""
      // fix for issue #1049
      // https://github.com/mbrn/material-table/issues/1049
      // long.toquoc clean tooltip in add/update/delete mode
      return disabled
        ? <Tooltip placement={'top'} title={''}><span>{button}</span></Tooltip>
        : <Tooltip placement={'top'} title={tooltip}>{button}</Tooltip>;
    } else {
      return button;
    }
  }
}

MTableAction.defaultProps = {
  action: {},
  data: {}
};

MTableAction.propTypes = {
  action: PropTypes.oneOfType([PropTypes.func, PropTypes.object]).isRequired,
  data: PropTypes.oneOfType([PropTypes.object, PropTypes.arrayOf(PropTypes.object)]),
  disabled: PropTypes.bool,
  size: PropTypes.string
};

export default MTableAction;
