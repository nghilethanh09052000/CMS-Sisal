import React from 'react'
import PropTypes from 'prop-types'
import { withMultipleStyles } from '../Styles'
import Checkbox from '@material-ui/core/Checkbox'
import { Cancel, CheckCircle, CheckBoxOutlineBlankOutlined, CheckBoxOutlined } from '@material-ui/icons'
import { Tooltip } from '@material-ui/core'

const styles = theme => ({
    checkbox: {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
    },
    checkboxDisable: {
        cursor: 'no-drop !important',
        pointerEvents: 'all !important',
        backgroundColor: 'transparent !important'
    },
    tooltip: {

    }
})

class PermissionCheckbox extends React.Component
{
    constructor(props)
    {
        super(props)
        this.state = {
            stateCheck: props.checked,
            forceEditMode: false
        }
    }

    _handleDefaultCheck = (evt) =>
    {
        const name = evt.target.name
        const checked = evt.target.checked

        this.setState(
            {
                stateCheck: checked
            },
            () =>
            {
                this.props.onChange({
                    target: {
                        name,
                        checked
                    }
                })
            }
        )
    }

    render()
    {
        const { classes, editMode, name, disabled, tooltip } = this.props
        const { stateCheck, forceEditMode } = this.state
        // console.log('PermissionCheckbox::render props', this.props, 'state', this.state)

        // use span incase checkbox is disable, but want to show tooltip
        if (editMode || forceEditMode)
        {
            return (
                <Tooltip title={tooltip} className={classes.tooltip} placement={'top'}>
                    <Checkbox
                        disabled={disabled}
                        checked={stateCheck}
                        icon={<CheckBoxOutlineBlankOutlined fontSize={'default'} style={{ color: disabled ? '#F523007F' : '#D6D6D6' }} />}
                        checkedIcon={<CheckBoxOutlined fontSize={'default'} style={{ color: disabled ? '#F523007F' : '#4A58B2' }} />}
                        classes={{
                            root: classes.checkbox,
                            disabled: classes.checkboxDisable
                        }}
                        name={name}
                        onChange={this._handleDefaultCheck}
                    />
                </Tooltip>
            )
        }

        return (
            <Checkbox
                checked={stateCheck}
                icon={<Cancel fontSize={'small'} style={{ color: '#FF4444' }} />}
                checkedIcon={<CheckCircle fontSize={'small'} style={{ color: '#4AB866' }} />}
                classes={{
                    root: classes.checkbox
                }}
                disabled={true}
            />
        )
    }
}

PermissionCheckbox.propTypes = {
    classes: PropTypes.object.isRequired,
    tooltip: PropTypes.string,
    disabled: PropTypes.bool,
    checked: PropTypes.bool,
    editMode: PropTypes.bool,
    name: PropTypes.string,
    onChange: PropTypes.func,
}

PermissionCheckbox.defaultProps = {
    tooltip: '',
    disabled: false,
    checked: false,
    editMode: false,
    name: '',
    onChange: null
}

export default withMultipleStyles(styles)(PermissionCheckbox)