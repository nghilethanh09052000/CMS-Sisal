import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { CheckCircle as CheckCircleIcon, Warning as WarningIcon, Error as ErrorIcon, Info as InfoIcon, Close as CloseIcon } from '@material-ui/icons';
import { Snackbar, IconButton } from '@material-ui/core'

const styles = theme => ({
    close: {
        padding: theme.spacing(0.5),
    },

    success: {
        backgroundColor: '#4AB866',
    },
    error: {
        backgroundColor: '#F44D4D',
    },
    info: {
        backgroundColor: '#1891D5',
    },
    warning: {
        backgroundColor: '#F9C257',
    },
    icon: {
        fontSize: '1.25rem',
        opacity: 0.9,
        marginRight: theme.spacing(1),
    },
    message: {
        display: 'flex',
        alignItems: 'center',
        padding: 0,
        whiteSpace: 'pre-line'
    },

    bottomLevitation: {
        bottom: '2vh'
    }
})

const variantIcon = {
    success: CheckCircleIcon,
    warning: WarningIcon,
    error: ErrorIcon,
    info: InfoIcon,
};

class NotifySnackbar extends React.Component
{
    render()
    {
        const { classes, message, variant, open, handleClose, autoHideDuration } = this.props;

        const Icon = variantIcon[variant];

        return (
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center',
                }}
                classes={{
                    anchorOriginBottomCenter: classes.bottomLevitation
                }}
                open={open}
                autoHideDuration={autoHideDuration}
                onClose={handleClose}
                ContentProps={{
                    className: classes[variant],
                    'aria-describedby': 'message-id'
                }}
                message={
                    <span id="message-id" className={classes.message}>
                        <Icon className={classes.icon} />
                        {message}
                    </span>
                }
                action={
                    <IconButton
                        key="close"
                        aria-label="Close"
                        color="inherit"
                        className={classes.close}
                        onClick={handleClose}
                    >
                        <CloseIcon />
                    </IconButton>
                }
            />

        )
    }

}

NotifySnackbar.propTypes = {
    classes: PropTypes.object.isRequired,
    message: PropTypes.node,
    variant: PropTypes.oneOf(['success', 'warning', 'error', 'info']).isRequired,
    open: PropTypes.bool.isRequired,
    autoHideDuration: PropTypes.number,
    handleClose: PropTypes.func
};

NotifySnackbar.defaultProps = {
    autoHideDuration: 3000,
}

export default withStyles(styles)(NotifySnackbar);