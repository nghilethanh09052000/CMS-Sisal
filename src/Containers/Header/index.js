import React from 'react';
import PropTypes from 'prop-types';
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import { connect } from 'react-redux'

import { AppBar, Toolbar, Typography, Button, Menu, MenuItem, Badge, Tooltip, TextField, InputAdornment, Divider } from '@material-ui/core';
import { Notifications, MoreHoriz, SearchOutlined } from '@material-ui/icons'
import Autocomplete from '@material-ui/lab/Autocomplete'

import API from '../../Api/API'
import TEXT from './Data/Text'
import Utils from '../../Utils'
import { DataProfileMenu, Avatar, PROVIDER_AD } from '../../Defines'
import { withMultipleStyles, breakpointsStyle } from '../../Styles'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'

const userInfoStyle = theme => ({
    ...breakpointsStyle(
        theme,
        {
            key: ['minWidth', 'padding'],
            value: [250, 10],
            variant: [20, 1],
            unit: ['px', 'px']
        }
    )
})

const styles = theme => ({
    appBar: {
        flexGrow: 1,
        zIndex: theme.zIndex.drawer
    },
    title: {
        flexGrow: 1,
        marginLeft: 10,
        ...breakpointsStyle(
            theme,
            {
                key: ['font-size'],
                value: [1.4],
                variant: [0.15],
                unit: 'rem'
            }
        ),
    },
    title_closed: {
        paddingLeft: theme.spacing(9)
    },
    title_open: {
        paddingLeft: theme.spacing(44)
    },
    icon: {
        color: '#4A58B2',
        ...breakpointsStyle(
            theme,
            {
                key: ['width', 'height'],
                value: [0.9, 0.9],
                variant: [0.15, 0.15],
                unit: 'em'
            }
        )
    },
    iconAvatar: {
        ...breakpointsStyle(
            theme,
            {
                key: ['width', 'height'],
                value: [2.0, 2.0],
                variant: [0.15, 0.15],
                unit: 'em'
            }
        )
    },
    divInfo: {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    },
    divNotify: {
        paddingLeft: 10,
        paddingRight: 0
    },
    buttonLogOut: {
        textTransform: 'none',
        '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            cursor: 'pointer'
        },
        ...breakpointsStyle(
            theme,
            {
                key: ['marginLeft'],
                value: [45],
                variant: [5],
                unit: 'px'
            }
        ),
        fontWeight: 300
    },
    textLogout: {
        ...breakpointsStyle(
            theme,
            {
                key: ['font-size'],
                value: [0.9],
                variant: [0.05],
                unit: 'rem'
            }
        ),
        fontWeight: 500
    },
    profileMenu: {
        ...userInfoStyle(theme),
        marginTop: 5,
        borderRadius: 25,
        border: '2px solid #D6D6D6',
        backgroundColor: 'white'
    },
    profileItem: {
        ...breakpointsStyle(
            theme,
            {
                key: ['minHeight'],
                value: [48],
                variant: [8],
                unit: 'px'
            }
        ),
        borderRadius: 25,
    },
    profileItemText: {
        ...breakpointsStyle(
            theme,
            {
                key: ['font-size'],
                value: [1.0],
                variant: [0.1],
                unit: 'rem'
            }
        ),
        fontWeight: 500
    },
    profileItemUser: {
        backgroundColor: 'white',
        '&:active': {
            border: 'none',
            outline: 'none'
        },
        '&:focus': {
            border: 'none',
            outline: 'none'
        }
    },
    autoCompleteRoot: {
        width: 300,
        minHeight: 40,
        height: '100%',
        marginRight: 20
    },
    autoCompleteInputRoot: {
        minHeight: 40,
        height: '100%',
        '&&[class*="MuiOutlinedInput-root"] input': {
            padding: 0
        }
    },
    autoCompleteInput: {
        height: '100%',
    },
});

class Header extends React.Component
{
    constructor(props)
    {
        super(props)

        this.state = {
            menuAnchor: null
        }
    }

    handleOpenProfileMenu = (evt) =>
    {
        this.setState({
            menuAnchor: evt.currentTarget
        })
    }

    handleCloseProfileMenu = () =>
    {
        this.setState({
            menuAnchor: null
        })
    }

    handleProfileMenu = (link) => () =>
    {
        if (link === '/logout')
        {
            this.handleLogOut()
            return
        }

        this.props.history.push(link)
        this.handleCloseProfileMenu()
    }

    handleLogOut = () =>
    {
        if (this.props.provider?.toLowerCase() === PROVIDER_AD)
        {
            window.open(API.SSOLogout(), '_self')
        }
        else
        {
            this.props.Logout()
        }
    }

    renderProfileMenu()
    {
        const { menuAnchor } = this.state

        const { classes, email } = this.props

        return (
            <Menu
                classes={{
                    paper: classes.profileMenu
                }}
                elevation={0}
                getContentAnchorEl={null}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center'
                }}
                anchorEl={menuAnchor}
                keepMounted={true}
                open={Boolean(menuAnchor)}
                onClose={this.handleCloseProfileMenu}
            >
                <MenuItem key={-1} button={false} classes={{ root: clsx(classes.profileItem, classes.profileItemUser) }}>
                    <div>
                        <Typography className={classes.profileItemText} noWrap={true} style={{ color: '#1B1F43', fontWeight: 'bold' }}>
                            {
                                email
                            }
                        </Typography>
                    </div>
                </MenuItem>
                {
                    DataProfileMenu.map((menu, index) =>
                    {
                        if (menu.link === null)
                        {
                            return <Divider key={index} style={{ marginBottom: 15 }}/>
                        }

                        return (
                            <MenuItem key={index} classes={{ root: classes.profileItem }} onClick={this.handleProfileMenu(menu.link)}>
                                <Typography color={'textPrimary'} className={classes.profileItemText}>
                                    {menu.text}
                                </Typography>
                            </MenuItem>
                        )
                    })
                }
            </Menu >
        )
    }

    render()
    {
        const { classes, isLoggedIn, email, username, expire_warning, title, isClosed, menuLinks } = this.props;

        return (
            <AppBar position="fixed" className={classes.appBar}>
                <Toolbar>
                    <Typography 
                        variant="h6" 
                        className={clsx(classes.title, 
                            {[classes.title_closed]: isClosed !== undefined && isClosed}, 
                            {[classes.title_open]: isClosed !== undefined && !isClosed}
                        )} 
                        color={'textPrimary'} 
                        noWrap={true}
                    >
                    {
                        `${title}`
                    }
                    </Typography>
                    {
                        isLoggedIn && (
                            <div className={classes.divInfo}>
                                {
                                    menuLinks &&
                                    <Autocomplete
                                        freeSolo
                                        autoComplete
                                        autoHighlight
                                        autoSelect
                                        options={menuLinks}
                                        getOptionLabel={(option) => option?.url || ''}
                                        renderInput={(params) => (
                                            <TextField {...params}
                                                variant="outlined"
                                                InputProps={{
                                                    ...params.InputProps,
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <SearchOutlined />
                                                        </InputAdornment>
                                                    )
                                                }}
                                            />
                                        )}
                                        classes={{
                                            root: classes.autoCompleteRoot,
                                            input: classes.autoCompleteInput,
                                            inputRoot: classes.autoCompleteInputRoot
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                // Prevent's default 'Enter' behavior.
                                                event.defaultMuiPrevented = true
                                                let link = event.target.value
                                                if (link === '/homepage')
                                                {
                                                    this.props.SelectProject('')
                                                }
                                            
                                                this.props.history.push(link)
                                            }
                                        }}
                                    />   
                                }
                                {/* <div className={classes.divNotify} style={{ display: expire_warning !== -1 ? 'block' : 'none' }}>
                                    <Badge badgeContent={'!'} color={'error'}>
                                        <Tooltip
                                            title={Utils.parseString(TEXT.CHANGE_PASSWORD_EXPIRE_TOOLTIP, expire_warning)}
                                            placement={'bottom'}
                                        >
                                            <Notifications className={classes.icon}/>
                                        </Tooltip>
                                    </Badge>
                                </div> */}
                                <Button
                                    className={classes.buttonLogOut}
                                    startIcon={<img
                                        className={classes.iconAvatar}
                                        src={Utils.getIconUrl(Avatar)}
                                        alt={'Avatar'}
                                    />}
                                    endIcon={<MoreHoriz className={classes.icon} />}
                                    disableRipple={true}
                                    disableFocusRipple={true}
                                    disableElevation={true}
                                    onClick={this.handleOpenProfileMenu}
                                >
                                    <Typography color={'textPrimary'} noWrap={true} className={classes.textLogout}>
                                        {
                                            Utils.parseString(TEXT.APP_HEADER_TTILE, username || email.substring(0, email.indexOf('@')))
                                        }
                                    </Typography>
                                </Button>
                                {this.renderProfileMenu()}
                            </div>
                        )
                    }
                </Toolbar>
            </AppBar>
        );
    }
}

Header.propTypes =
{
    classes: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
	...state.cms
})

const mapDispatchToProps = (dispatch) => ({
	Logout: () =>
	{
		dispatch(ActionCMS.Logout())
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, { withTheme: true })
)(Header);