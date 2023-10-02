import React from 'react';
import PropTypes from 'prop-types';

import { Modal, Button, Slide, Typography } from '@material-ui/core'

import { withMultipleStyles, breakpointsStyle } from '../../Styles'

const top = 50
const left = 50

const styles = theme => ({
    paper: {
        position: 'absolute',
        ...breakpointsStyle(
            theme,
            {
                key: ['minWidth', 'width'],
                value: [theme.spacing(50), 35],
                variant: [theme.spacing(5), -15],
                unit: ['px', '%']
            }
        ),
        backgroundColor: theme.palette.background.paper,
        boxShadow: theme.shadows[5],
        outline: 'none',
        top: `${top}%`,
        left: `${left}%`,
        transform: `translate(-${top}%, -${left}%)`,
        borderRadius: 25,
        overflowY: 'auto',
        maxHeight: '100vh'
    },
    title: {
        borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
        padding: theme.spacing(3),
        paddingBottom: theme.spacing(2),
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    content: {
        padding: theme.spacing(3),

    },
    action: {
        textAlign: 'center',
        padding: theme.spacing(3),
    },
    titleTypo: {
        fontSize: '1.125rem',
        fontWeight: theme.typography.fontWeightBold,
        textTransform: 'capitalize'
    },
    button: {
        margin: theme.spacing(1),
        padding: '5px 20px',
        textTransform: 'uppercase'
    },
    transitionContainer: {
        width: '100%',
        height: '100%',
        outline: 'none'
    }
})

class ModalDialog extends React.Component
{

    render()
    {
        const { 
            classes, width,
            open, confirmDisable,
            titleText, confirmText, cancelText,
            handleCancelClick, handleConfirmClick
        } = this.props

        if (!open) return null

        return (
            <Modal
                aria-labelledby="modal-title"
                aria-describedby="modal-description"
                open={open}
                // disableBackdropClick
            >
                <Slide direction={'down'} in={open} mountOnEnter unmountOnExit>
                    <div className={classes.transitionContainer}>
                        <div className={classes.paper} style={{ width }}>
                            <div id="modal-title" className={classes.title}>
                                <Typography className={classes.titleTypo} id="modal-title">
                                    {titleText}
                                </Typography>
                            </div>
                            <div id="modal-content" className={classes.content}>
                                {this.props.children}
                            </div>
                            <div id="modal-action" className={classes.action}>
                            {
                                cancelText && (
                                    <Button
                                        id='cancel-button'
                                        variant={'outlined'}
                                        className={classes.button}
                                        onClick={handleCancelClick}
                                    >
                                        {cancelText}
                                    </Button>
                                )
                            }
                            {
                                confirmText && (
                                    <Button
                                        id='confirm-button'
                                        disabled={confirmDisable} //Button is disabled if there are still no selected style
                                        variant='contained'
                                        className={classes.button}
                                        onClick={handleConfirmClick}
                                    >
                                        {confirmText}
                                    </Button>
                                )
                            }
                            </div>
                        </div>
                    </div>
                </Slide>
            </Modal>
        )
    }
}

ModalDialog.propTypes = {
    classes: PropTypes.object.isRequired,
    width: PropTypes.string,

    open: PropTypes.bool.isRequired,
    confirmDisable: PropTypes.bool,

    titleText: PropTypes.string,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,

    handleCancelClick: PropTypes.func,
    handleConfirmClick: PropTypes.func,
}

ModalDialog.defaultProps = {
    cancelText: null,
    confirmText: null,
}

export default withMultipleStyles(styles)(ModalDialog)