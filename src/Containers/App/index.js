import React from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import { withRouter } from 'react-router-dom'

import { Toolbar, Typography } from '@material-ui/core'
import { WarningRounded } from '@material-ui/icons'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'

import Header from '../Header';
import Menu from '../Menu';
import CircularLoading from '../../Components/CircularLoading'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import NotifySnackbar from '../../Components/NotifySnackbar';
import { withMultipleStyles, breakpointsStyle } from '../../Styles'

import TEXT from './Data/Text'
import Utils from '../../Utils'

const styles = theme => ({
    root: {
        display: 'flex',
        height: '100vh',
        width: '100vw',
        maxHeight: '100vh',
        maxWidth: '100vw',
        overflow: 'hidden'
    },
    content: {
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        maxWidth: '100%',
        maxHeight: '100%',
        overflow: 'hidden'
    },
    container: {
        '&--loggedin': {
            ...breakpointsStyle(theme, {
                key: 'padding',
                value: theme.spacing(3),
                variant: theme.spacing(0.5),
                unit: 'px'
            })
        },
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1,
        overflow: 'hidden'
    },
    containerHeader: {
        ...breakpointsStyle(theme, {
            key: ['paddingBottom'],
            value: [10],
            variant: [2],
            unit: ['px']
        })
    },
    containerContent: {
        width: '100%',
        height: '100%',
        overflow: 'auto',
        '&--loggedin': {
            backgroundColor: 'white',
            border: '1px solid #D6D6D6',
            borderRadius: 5,
            flexGrow: 1,
            padding: theme.spacing(2)
        }
    },
    verticalScrollContainer: {
        '&::-webkit-scrollbar': {
            '-webkit-appearance': 'none'
        },
        '&::-webkit-scrollbar:vertical': {
            height: 16
        },
        '&::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            border: '2px solid white',
            backgroundColor: 'rgba(0, 0, 0, .3)',
            '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, .5)',
            }
        }
    },
    header: {
        ...breakpointsStyle(theme, {
            key: 'fontSize',
            value: 2.0,
            variant: 0.2,
            unit: 'rem'
        }),
        fontWeight: 500
    },
    resetPadding: {
        padding: 0
    },
    scaleContainerContent: {
        width: '30%',
        maxHeight: '70%',
    },
    divRow: {
        display: 'flex',
        flexDirection: 'row',
    },
    warningIcon: {
		color: theme.palette.warning.main,
		alignSelf: 'flex-start',
		marginRight: 20
	},
});

class App extends React.Component
{
    constructor(props)
    {
        super(props)
    }

    handleCloseDialog = (errorCode) => () =>
    {
        const {
            ClearError,
            SessionExpired
        } = this.props

        ClearError()

        if (errorCode === 'USER_LOGIN_SESSION_EXPIRED' || errorCode === 'ACCESS_TOKEN_EXPIRED')
        {
            Utils.clearAllItems()
            SessionExpired()
        }
    }

    handleCloseSnackbar = () =>
    {
        this.props.ClearNotify()
    }

    renderError()
    {
        const { classes, error } = this.props
        
        return (

            <ModalDialog
                open={true}
                titleText={error.title}
                confirmText={TEXT.MODAL_OK}
                handleConfirmClick={this.handleCloseDialog(error.message.code)}
            >
                <div className={classes.divRow}>
                    <WarningRounded className={classes.warningIcon} fontSize={'large'} />
                    <Typography>{error.message.message}</Typography>
                </div>
            </ModalDialog>
        )
    }
    
    render()
    {
        const {
            classes,
            children,
            selectedProject,
            ...others
        } = this.props;

        let classContainer = clsx(classes.container, {
            [classes.container + '--loggedin']: others.isLoggedIn
        })
        let classContainerContent = clsx(classes.containerContent, classes.verticalScrollContainer,
            {[classes.containerContent + '--loggedin']: others.isLoggedIn},
            // Cheat for new UX/UI
            {[classes.resetPadding]: this.props.location.pathname.includes(`/chat/${selectedProject}/channel`)},
            {[classes.scaleContainerContent]: this.props.location.pathname.includes(`/profile`) && !this.props.location.pathname.includes(`/registered/profile`)},
        )

        let dataMenu = Utils.getDataMenu(selectedProject, this.props.privilege)
 
        return (
            <React.Fragment>
                <div className={classes.root}>
                    {
                        others.isLoggedIn && (
                            <React.Fragment>
                                {(selectedProject !== '' || this.props.location.pathname === '/profile') ? <Menu menu={dataMenu} {...others} /> : <Header {...others} />}
                            </React.Fragment>
                        )
                    }
                    <main className={classes.content}>
                        {
                            others.isLoggedIn && <Toolbar />
                        }
                        <div className={classContainer}>
                            <div id={'main-container'} className={classContainerContent} style={{ overflowY: 'auto', position: 'relative', borderRadius: 25 }}>
                                {
                                    children
                                }
                            </div>
                        </div>
                    </main>
                </div>
                {
                    others.isLoading > 0 && <CircularLoading message={others.loadingMessage} />
                }
                {
                    others.error && this.renderError()
                }
                {
                    others.notifyMessage && (
                        <NotifySnackbar
                            message={others.notifyMessage}
                            variant={'success'}
                            open={true}
                            autoHideDuration={others.autoHideDuration}
                            handleClose={this.handleCloseSnackbar}
                        />
                    )
                }
                {
                    others.notifyErrorMessage && (
                        <NotifySnackbar
                            message={others.notifyErrorMessage.message.message}
                            variant={'error'}
                            open={true}
                            autoHideDuration={others.autoHideDuration}
                            handleClose={this.handleCloseSnackbar}
                        />
                    )
                }
            </React.Fragment>
        );
    }

    componentDidUpdate()
    {
        
    }
}

App.propTypes =
{
    classes: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
    ...state.cms,
    ...state.global
})

const mapDispatchToProps = (dispatch) => ({
    ClearError: () =>
    {
        dispatch(ActionCMS.ClearError())
    },
    ClearNotify: () =>
    {
        dispatch(ActionCMS.ClearNotify())
    },
    SessionExpired: () =>
    {
        dispatch(ActionCMS.SessionExpired())
    },
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles),
    withRouter
)(App);
