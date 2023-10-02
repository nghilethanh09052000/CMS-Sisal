import React from 'react';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import * as _ from 'lodash'
import clsx from 'clsx'
import copy from "copy-to-clipboard"

import { Drawer, List, ListItem, ListItemText, ListItemIcon, Tooltip, Divider, IconButton, Collapse, Fade, Button, Typography } from '@material-ui/core';
import { ArrowBack } from '@material-ui/icons';
import ExpandLess from '@material-ui/icons/ExpandLess';
import ExpandMore from '@material-ui/icons/ExpandMore';

import { env } from '../../env'
import Utils from '../../Utils'
import * as Defines from '../../Defines'
import TEXT from './Data/Text'

import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'
import * as ActionCMS from '../../Redux/Actions/ActionCMS'

import Header from '../Header';
import { withMultipleStyles, breakpointsStyle, customStyle } from '../../Styles';
import { IconMenuShow, IconMenuHide } from '../../Components/CmsIcons'
import CmsTable from '../../Components/CmsTable'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsExcel from '../../Components/CmsExcel'

const metadata = require('../../metadata.json')

const defaultBorderColor = '#D6D6D6'

const defaultBorderStyle = {
	borderLeft: `1px ${defaultBorderColor} solid`,
}

const defaultHeaderStyle = {
	height: 'auto', // auto ajustment by table
	padding: 0,
	...defaultBorderStyle
}
const defaultCellStyle = {
	height: 'auto', // auto ajustment by table
	padding: 0,
	...defaultBorderStyle,
	userSelect: 'none'
}

const TRANSITION_TIMEOUT = 500

const drawerStyle = theme => ({
    ...breakpointsStyle(theme, {
        key: 'width',
        value: theme.spacing(45),
        variant: theme.spacing(2),
        unit: 'px'
    }),
    transition: theme.transitions.create(['width'], {
        duration: TRANSITION_TIMEOUT
    }),
    '&--closed': {
        ...breakpointsStyle(theme, {
            key: 'width',
            value: theme.spacing(10),
            variant: theme.spacing(1),
            unit: 'px'
        }),
        transition: theme.transitions.create(['width'], {
            duration: TRANSITION_TIMEOUT
        })
    }
})

const styles = theme => ({
    root: {
        ...drawerStyle(theme),
        flexShrink: 0
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
    drawer: {
        ...drawerStyle(theme),
        backgroundColor: '#E5E5E5',
    },
    drawerContainer: {
        overflowY: 'auto',
        overflowX: 'hidden',
        flexGrow: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start'
    },
    drawerFooter: {
        height: theme.spacing(6),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginRight: 0,
        '&--closed': {
            justifyContent: 'center',
        },
        backgroundColor: 'white'
    },
    drawerIcon: {
        '&:hover': {
            borderRadius: 25,
            border: '1px solid #D6D6D6',
            backgroundColor: '#F2F2F2'
        }
    },
    divMenu: {
        ...breakpointsStyle(theme, {
            key: ['marginLeft', 'marginRight'],
            value: [12, 12],
            variant: [1, 1],
            unit: ['px', 'px']
        }),
        '&--closed': {
            marginLeft: 0,
            marginRight: 0
        },
        marginTop: 4
    },
    divSubMenu: {
        display: 'flex',
        justifyContent: 'center',
        '&--closed': {
            marginLeft: 0,
            marginRight: 0
        },
    },
    divSubMenuWrapper: {
        width: '100%'
    },
    menuItem: {
        borderRadius: 25,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        '&--closed': {
            width: 32,
            height: 32,
            borderRadius: '50%'
        },
        '&--submenu': {
            ...breakpointsStyle(theme, {
                key: ['paddingLeft'],
                value: [30],
                variant: [5],
                unit: ['px']
            }),
            '&--closed': {
                width: 24,
                height: 24,
                borderRadius: '50%'
            }
        },
        backgroundColor: '#E5E5E5',
    },
    menuText: {
        ...breakpointsStyle(theme, {
            key: 'font-size',
            value: 1.0,
            variant: 0.05,
            unit: 'rem'
        }),
        '&--selected': {
            color: '#F46C03'
        },
        '&--closed': {
            display: 'none'
        },
        '&--opened': {
            color: '#F46C03'
        },
        marginLeft: 10,
        fontWeight: 500
    },
    menuIcon: {
        ...breakpointsStyle(theme, {
            key: 'font-size',
            value: 1.2,
            variant: 0.1,
            unit: 'rem'
        }),
        '&--selected': {
            color: '#F46C03'
        },
        '&--opened': {
            color: '#F46C03'
        }
    },
    icon: {
        color: '#525252',
        '&:hover': {
            color: '#4A58B2'
        }
    },
    listRoot: {
        width: '100%'
    },
    listPadding: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'stretch',
        '&--closed': {
            alignItems: 'center'
        }
    },
    divButton: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 20,
    },
    logo: {
        ...breakpointsStyle(
            theme,
            {
                key: ['width', 'height'],
                value: [60, 60],
                variant: [1, 1],
                unit: 'px'
            }
        ),
        marginBottom: 15,
        '&:hover': {
            cursor: 'pointer'
        },
    },
    projectButton: {
        textTransform: 'none',
        marginLeft: 0,
        '&:hover': {
            backgroundColor: '#E5E5E5',
            cursor: 'pointer'
        },
    },
});

class Menu extends React.Component
{
    constructor(props)
    {
        super(props)
        this.state = {
            isDialogOpen: false,
            isExportOpen: false,
            isClosed: false,
            isMenuStateInit: false,
            menuLinks: [{url: '/homepage'}, {url: '/profile'}]
        }
    }

    static getDerivedStateFromProps(nextProps, prevState)
    {
        const { location: { pathname }, menu } = nextProps;

        if (pathname === '/login')
        {
            return null
        }

        let result = null
        if (!prevState.isMenuStateInit)
        {
            let menuState = menu
                .filter(item => pathname.includes(item.link))
                .reduce((openMenu, item) =>
                {
                    openMenu[item.text] = true
                    return openMenu
                }, {})

            let menuLinks = []
            menu.forEach(value => {
                menuLinks = [...menuLinks, {url: value.link}]
                if (value.submenu)
                {
                    value.submenu.forEach(value => {
                        menuLinks = [...menuLinks, {url: value.link}]
                    })
                }
            })    

            result = Object.assign((result || {}), {
                ...menuState,
                menuLinks,
                isMenuStateInit: true
            })
        }

        return result
    }

    componentDidMount()
    {
        setTimeout(() =>
        {
            this.setState({
                isClosed: false
            })
        }, 1000)
    }

    handleMenu = () =>
    {
        this.setState((prevState, props) => ({
            isClosed: !prevState.isClosed
        }))
    }

    handleParentMenu = (name) =>
    {
        this.setState((prevState, props) => ({
            [name]: prevState[name] === undefined ? true : !prevState[name]
        }))
    }

    handleGoBack = (link) => () =>
    {
        this.props.SelectProject('')
        this.props.history.push(link)
    }

    render()
    {
        const { classes, menu, selectedProject, ...others } = this.props;
        
        const { isClosed, menuLinks } = this.state

        let classRoot = clsx(classes.root, {
            [classes.root + '--closed']: isClosed
        })

        let classDrawer = clsx(classes.drawer, {
            [classes.drawer + '--closed']: isClosed
        })

        let classDrawerFooter = clsx(classes.drawerFooter, {
            [classes.drawerFooter + '--closed']: isClosed
        })

        let classListPadding = clsx(classes.listPadding, {
            [classes.listPadding + '--closed']: isClosed
        })

        return (
            <>
                <Header {...{...others, isClosed, menuLinks}}  />
                <Drawer
                    className={classRoot}
                    classes={{ paper: classDrawer }}
                    anchor='left'
                    variant='permanent'
                    open={true}
                >
                    <div className={classes.divButton}>
                        {
                            selectedProject === Defines.PROJECT_ADMINISTRATOR && 
                            <img
                                className={classes.logo}
                                src={Utils.getIconUrl(Defines.AdministratorLogo)}
                                alt={'AdministratorLogo'}
                                onClick={() => { this.setState({ isDialogOpen: true })}}
                            />
                        }
                        {
                            selectedProject === Defines.PROJECT_MAIN && 
                            <img
                                className={classes.logo}
                                src={Utils.getIconUrl(Defines.SisalLogo)}
                                alt={'SisalLogo'}
                                onClick={() => { this.setState({ isDialogOpen: true })}}
                            />
                        }
                        {
                            !isClosed &&
                            <Typography className={clsx(classes.menuText, classes.title)}>
                                {`${env.REACT_APP_ENV}`.toUpperCase()}
                            </Typography>
                        }
                        <Button
                            variant={'text'}
                            className={clsx(classes.menuText, classes.projectButton)}
                            onClick={this.handleGoBack('/homepage')}
                            startIcon={<ArrowBack />}
                        >
                        {
                            !isClosed ? TEXT.BACK_DESKTOP_TITLE : ''
                        }
                        </Button>
                    </div>
                    <div className={classDrawerFooter}>
                        {
                            !isClosed && (
                            <Typography className={classes.menuText}>
                            {
                                selectedProject === Defines.PROJECT_MAIN && `${TEXT.PROJECT_MAIN_TITLE}`
                            }
                            {
                                selectedProject === Defines.PROJECT_ADMINISTRATOR && `${TEXT.PROJECT_ADMIN_TITLE}`
                            }
                            </Typography>)
                        }
                        <IconButton className={classes.drawerIcon} size={'small'} onClick={this.handleMenu}>
                        {
                            isClosed ? <IconMenuShow className={classes.icon} /> : <IconMenuHide className={classes.icon} />
                        }
                        </IconButton>
                    </div>
                    <div className={clsx(classes.drawerContainer, classes.verticalScrollContainer)}>
                        <List component={'nav'} classes={{ root: classes.listRoot, padding: classListPadding }}>
                        {
                            menu.map((item, index) => (
                                this.renderMenuItem(item, false)
                            ))
                        }
                        </List>
                    </div>
                </Drawer>
                {this.renderCMSErrors()}
            </>
        );
    }

    renderMenuItem(item, hasParent)
    {
        if (item.link === null)
        {
            return <Divider />
        }

        const { classes, location: { pathname } } = this.props;
        const { isClosed } = this.state

        let isSubmenuOpen = this.state[item.text] === undefined ? false : this.state[item.text]

        let isSelected = isSubmenuOpen
            ? pathname === item.link
            : pathname.includes(item.link)

        let hasSubmenu = item.hasOwnProperty('submenu')

        let classDivMenu = clsx(classes.divMenu, {
            [classes.divMenu + '--closed']: isClosed
        })

        let classMenuItem = clsx(classes.menuItem, {
            [classes.menuItem + '--closed']: (isClosed && !hasSubmenu),
            [classes.menuItem + '--submenu']: (hasParent && !isClosed),
            [classes.menuItem + '--submenu--closed']: (hasParent && isClosed)
        })

        let classMenuIcon = clsx(classes.menuIcon, {
            [classes.menuIcon + '--selected']: isSelected,
            [classes.menuText + '--opened']: (isSubmenuOpen && pathname.includes(item.link))
        })

        let classMenuText = clsx(classes.menuText, {
            [classes.menuText + '--selected']: isSelected,
            [classes.menuText + '--closed']: isClosed,
            [classes.menuText + '--opened']: (isSubmenuOpen && pathname.includes(item.link))
        })

        return (
            <div key={item.link} className={classDivMenu}>
                <ListItem
                    button
                    selected={isSelected}
                    component={Link}
                    to={item.link}
                    className={classMenuItem}
                    onClick={() =>
                    {
                        if (hasSubmenu)
                        {
                            this.handleParentMenu(item.text)
                        }
                    }}
                    disableGutters={true}
                >
                    <Tooltip placement={'right'} title={isClosed ? item.text : ''}>
                        <ListItemIcon style={{ alignItems: 'center', justifyContent: 'center' }}>
                        {
                            item.icon && <item.icon className={classMenuIcon} />
                        }
                        </ListItemIcon>
                    </Tooltip>
                    <Fade in={!isClosed} timeout={TRANSITION_TIMEOUT}>
                        <ListItemText primary={item.text} classes={{ primary: classMenuText }} primaryTypographyProps={{ noWrap: true }} />
                    </Fade>
                    {
                        hasSubmenu ? (isSubmenuOpen ? <ExpandLess /> : <ExpandMore />) : null
                    }
                </ListItem>
                {
                    this.renderSubMenuItem(item)
                }
            </div>
        );
    }

    renderSubMenuItem(item)
    {
        const { classes } = this.props
        const { isClosed } = this.state

        let classDivSubMenu = clsx(classes.divSubMenu, {
            [classes.divSubMenu + '--closed']: isClosed
        })

        let classListPadding = clsx(classes.listPadding, {
            [classes.listPadding + '--closed']: isClosed
        })

        if (item.hasOwnProperty('submenu'))
        {
            let isSubmenuOpen = this.state[item.text] === undefined ? false : this.state[item.text]
            return (
                <Collapse in={isSubmenuOpen} timeout={'auto'} unmountOnExit={true} classes={{ root: classDivSubMenu, wrapper: classes.divSubMenuWrapper }}>
                    <List component={'nav'} classes={{ root: classes.listRoot, padding: classListPadding }}>
                        {
                            item.submenu.map((subitem, index) => (
                                this.renderMenuItem(subitem, true)
                            ))
                        }
                    </List>
                </Collapse>
            )
        }

        return null
    }
    
    renderCMSErrors = () =>
	{
        const { classes } = this.props

        return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={`${metadata['release-date']} (${metadata['release-number']})`}
				confirmText={TEXT.MODAL_OK}
				cancelText={null}
                handleConfirmClick={() => { this.setState({ isDialogOpen: false })}}
			>
                <div className={clsx(classes.table, classes.divColumn)}>
                    <div style={{ marginBottom: '1rem', }} className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
                        <Typography className={clsx(classes.title)}>{TEXT.CMS_ERROR_TABLE_HEADER_CMS_ERRORS}</Typography>
                        <CmsExcel
                            data={Utils.getItem(Utils.TRACER) || []}
                            controlPermission={{
                                link: '',
                                attribute: ''
                            }}
                            onProgress={(isOpen) => this.setState({ isExportOpen: isOpen })}
                            fileName={Utils.parseString(TEXT.CMS_ERROR_TABLE_HEADER_EXCEL_FILENAME, `${metadata['release-date']} (${metadata['release-number']})`)}
                        />
                    </div>
                    <CmsTable
                        columns={[
                            {
                                title: TEXT.CMS_ERROR_TABLE_HEADER_TRACER_ID, field: 'tracerId', width: 300,
                                disableClick: false,
                                cellTooltip: TEXT.TOOLTIP_COPY_TO_CLIPBOARD
                            },
                            {
                                title: TEXT.CMS_ERROR_TABLE_HEADER_STATUS, field: 'status', width: 70,
                            },
                            {
                                title: TEXT.CMS_ERROR_TABLE_HEADER_TIME, field: 'time', width: 170,
                            },
                        ]}

                        data={Utils.getItem(Utils.TRACER) || []}

                        options={{
                            actionsColumnIndex: -1,
                            showTitle: false,
                            search: true,
                            filtering: false,
                            sorting: true,
                            selection: false,
                            paging: true,
                            cellStyle: { ...defaultCellStyle, textAlign: 'center', height: 40 },
                            headerStyle: { ...defaultHeaderStyle, textAlign: 'center', height: 40, borderTop: `1px ${defaultBorderColor} solid` },
                        }}

                        onClickCell={(event, rowData, columnDef) =>
                        {
                            if (rowData.hasOwnProperty(columnDef.field))
                            {
                                copy(rowData[columnDef.field])
                                this.props.ShowMessage(TEXT.MESSAGE_COPY_TO_CLIPBOARD)
                            }
                        }}

                        ignoredRender={this.state.isExportOpen}
                    />
                </div>
			</ModalDialog>
		)
	}
}

Menu.propTypes =
{
    classes: PropTypes.object.isRequired,
    location: PropTypes.object.isRequired,
    menu: PropTypes.array.isRequired
};

const mapStateToProps = (state) => ({
	...state.global,
    ...state.cms
})

const mapDispatchToProps = (dispatch) => ({
	SelectProject: (proj) =>
	{
		dispatch(ActionGlobal.SelectProject(proj))
	},
    ShowMessage: (msg) =>
    {
        dispatch(ActionCMS.ShowMessage(msg))
    },
})

export default compose(
	connect(mapStateToProps, mapDispatchToProps),
	withMultipleStyles(customStyle, styles)
)(Menu);
