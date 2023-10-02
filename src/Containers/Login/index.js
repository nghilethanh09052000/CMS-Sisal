import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { compose } from '@shakacode/recompose'
import copy from "copy-to-clipboard"
import clsx from 'clsx'
import * as _ from 'lodash'

import { RadioGroup, Radio, FormControl, Button, Typography, TextField, IconButton, FormControlLabel, Checkbox, Accordion, AccordionSummary, AccordionDetails } from '@material-ui/core'
import { WarningRounded, Visibility, VisibilityOff } from '@material-ui/icons'

import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'
import * as ActionCMS from '../../Redux/Actions/ActionCMS'

import { env } from '../../env'
import API from '../../Api/API'
import TEXT from './Data/Text'
import Utils from '../../Utils'
import { SisalLogo, PROJECT_ADMINISTRATOR, PROJECT_MAIN, PROVIDER_AD } from '../../Defines'
import { withMultipleStyles, customStyle, breakpointsStyle } from '../../Styles';

import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsTable from '../../Components/CmsTable'
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

const styles = theme => ({
    container: {
        backgroundColor: theme.palette.background.default,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        alignItems: 'center',
        paddingTop: '2rem',
        '@media (orientation:landscape) and (max-height : 767px)': {
            paddingTop: 0
        }
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
    },
    logo: {
        ...breakpointsStyle(
            theme,
            {
                key: ['width', 'height'],
                value: [160, 160],
                variant: [20, 10],
                unit: 'px'
            }
        ),
        '&:hover': {
            cursor: 'pointer'
        },
    },
    cmsTitle: {
        ...breakpointsStyle(
            theme,
            {
                key: ['font-size'],
                value: [2],
                variant: [0.2],
                unit: 'rem'
            }
        ),
        fontWeight: 'bold'
    },
    inputTextField: {
        paddingBottom: 10,
        ...breakpointsStyle(
            theme,
            {
                key: ['width'],
                value: [360],
                variant: [20],
                unit: 'px'
            }
        ),
    },
    divCopyright: {
        ...breakpointsStyle(
            theme,
            {
                key: ['bottom'],
                value: [32],
                variant: [6],
                unit: ['px']
            }
        ),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        maxWidth: '100%',
        position: 'fixed',

        // every devices smaller than iPad: 1024x768
        '@media (orientation:landscape) and (max-height : 767px)': {
            position: 'relative',
            paddingTop: 50,
            paddingBottom: 20
        }
    },
    copyright: {
        ...breakpointsStyle(
            theme,
            {
                key: ['width', 'fontSize'],
                value: [55, 0.8],
                variant: [-10, 0.1],
                unit: ['%', 'rem']
            }
        ),
        color: '#525252',
        whiteSpace: 'pre-line',
    },
    buttonForgotPassword: {
        textTransform: 'none',
        alignSelf: 'end',
		marginTop: 5,
		'&:hover': {
            backgroundColor: theme.palette.background.default,
            cursor: 'pointer'
        },
    },
    buttonSSO: {
        marginTop: '1rem',
        backgroundColor: '#4AB866',
        '&:hover': {
            backgroundColor: '#4AB866',
            color: '#FFFFFF'
        },
    },
    accordionRoot: {
        border: `1px ${defaultBorderColor} solid`,
        boxShadow: 'none',
        backgroundColor: '#f5f5f5',
        borderRadius: 15
    },
    panelTitle: {
        flexGrow: 1,
        ...breakpointsStyle(
            theme,
            {
                key: ['font-size'],
                value: [1.2],
                variant: [0.15],
                unit: 'rem'
            }
        ),
        fontWeight: 400
    },
    accordion: {
        marginTop: theme.spacing(4)
    },
    marginLeft: {
		marginLeft: theme.spacing(2),
	}
});

class Login extends React.Component
{
    constructor(props)
    {
        super(props)

        this.state = {
            password: '',
            email: '',
            group: '',
            dialogType: 'login',
            isDialogOpen: false,
            showPassword: false,
            initialized: false,
            isExportOpen: false,
            remember: (Utils.getItem(Utils.REMEMBER_ME) === true),
            expanded: env.REACT_APP_SUPPORT_NON_AD_USERS === 'true' ? 'adminPanel' : 'userPanel'
        }
    }

    static getDerivedStateFromProps(nextProps, prevState)
    {
        if (nextProps.error && nextProps.error.code === 401)
        {
            // fixed: remember checkbox does't correct when session expired but user press F5
            return {
                remember: false
            }
        }

        return null
    }

    componentDidMount()
    {
        let project = this.parserProjectFromUrl(this.props.location.state?.from?.pathname || '')
        this.props.SelectProject(project)
        this.props.EndPointLoad()
    }

    componentDidUpdate(prevProps, prevState)
	{
        if (this.props.hasEndPoint && !this.state.initialized)
        {
            this.setState(
                {
                    initialized: true,
                },
                () =>
                {
                    const authResult = new URLSearchParams(this.props.location.search)
                    let msData = authResult.get('data')
                    if (this.state.remember && !_.isEmpty(Utils.getItem(Utils.LOGIN_TOKEN)))
                    {
                        this.props.Authen()
                    }
                    else if (!_.isEmpty(msData))
                    {            
                        try
                        { 
                            msData = JSON.parse(Utils.DecryptData(msData))
                            // console.log('msData', msData)

                            if (msData.hasOwnProperty('error'))
                            {
                                // Hide SSO login data
                                this.props.history.push(this.props.location.pathname)
                                // SSO login successful but have no group because of wrong AD configuration.
                                this.props.SetProps([{ key: 'error', value: msData.error }])
                            }
                            else
                            {
                                Utils.setItem(Utils.LOGIN_TOKEN, msData.loginToken)
                                // Hide SSO login data
                                this.props.history.push(this.props.location.pathname)
                                this.props.LoginSSO(msData)
                            }
                        }
                        catch(ex)
                        {
                            console.log('msData', ex)     
                        }
                    }
                }
            )
        }

		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()

            if (this.state.remember && !_.isEmpty(Utils.getItem(Utils.ACCESS_TOKEN)))
            {
                this.props.SetProps([{ key: 'isLoggedIn', value: true }])
            }
            else if (this.props.assignedGroups && this.props.assignedGroups.length === 1)
            {
                this.props.ChooseGroup(this.props.assignedGroups[0])
            }
            else
            {
			    this.handleAction('choose_group')(null)
            }
		}
	}

    handleAction = (name) => (evt) =>
	{
        evt && evt.preventDefault && evt.preventDefault()
		const { dialogType, email, password, group } = this.state

		switch (name)
		{
			case 'close':
                this.setState(
                    {
                        isDialogOpen: false,
                        dialogType: 'login',
                    },
                    () =>
                    {
                        if (dialogType === 'choose_group')
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
                    }
                )

				break
            case 'submit':    
				this.setState(
                    {
                        isDialogOpen: false,
                        dialogType: 'login',
                    },
                    () =>
                    {
                        dialogType === 'login' && this.props.Login(email, password) ||
                        dialogType === 'forgot_password' && this.props.ResetPassword(email) ||
                        dialogType === 'choose_group' && this.props.ChooseGroup(group)
                    }
                )

				break
            case 'forgot_password':
            case 'choose_group':
            case 'cms_error':    
                this.setState({
					isDialogOpen: true,
					dialogType: name,
				})

                break   
            default:
                this.setState(
                    {
                        [name]: evt.target.value
                    },
                    () =>
                    {
                        name === 'remember' && Utils.setItem(Utils.REMEMBER_ME, evt.target.value)
                    }
                )

                break    
        } 
    }               

    parserProjectFromUrl = (url) =>
    {
        return url && url.includes(PROJECT_ADMINISTRATOR) ? PROJECT_ADMINISTRATOR : PROJECT_MAIN
    }

    renderLogin = () =>
    {
        const { classes } = this.props
        const {
            showPassword,
            remember,
            expanded
        } = this.state

        return (
            <div className={classes.container}>
                <img
                    className={classes.logo}
                    src={Utils.getIconUrl(SisalLogo)}
                    alt={'SisalLogo'}
                    onClick={this.handleAction('cms_error')}
                />
                <Typography variant="h6" className={classes.cmsTitle} color={'textPrimary'}>
                    { TEXT.APP_BAR_TITLE }
                </Typography>
                <div className={clsx(classes.accordion)}>
                    <Accordion 
                        square 
                        expanded={expanded === 'userPanel'} 
                        onChange={() => { this.handleAction('expanded')({ target: { value: 'userPanel'} })} }
                        classes={{
							root: classes.accordionRoot
						}}
                    >
                        <AccordionSummary>
                            <Typography className={clsx(classes.panelTitle)}>{TEXT.FORM_LOGIN_SISAL_USER}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <div className={clsx(classes.root, classes.divColumn)}>
                                <Typography>{TEXT.FORM_LOGIN_SISAL_USER_TOOLTIP}</Typography>
                                <Button
                                    fullWidth={true}
                                    variant={'contained'}
                                    className={clsx(classes.buttonSSO)}
                                    onClick={() => {
                                        window.open(API.UserSSOLogin(), '_self')
                                    }}
                                >
                                    {TEXT.FORM_LOGIN_BUTTON_SSO_SUBMIT}
                                </Button>
                            </div>
                        </AccordionDetails>
                    </Accordion>
                    <Accordion 
                        square 
                        expanded={expanded === 'adminPanel'} 
                        onChange={() => { this.handleAction('expanded')({ target: { value: 'adminPanel'} })} }
                        classes={{
							root: classes.accordionRoot
						}}
                    >
                        <AccordionSummary>
                            <Typography className={clsx(classes.panelTitle)}>{TEXT.FORM_LOGIN_ADMIN}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FormControl
                                component={'form'}
                                color={'primary'}
                                className={classes.form}
                                autoComplete={'off'}
                                onSubmit={this.handleAction('submit')}
                            >
                                <div className={clsx(classes.divColumn)}>
                                    <Typography>{TEXT.FORM_LOGIN_USERNAME}</Typography>
                                    <TextField
                                        variant={'outlined'}
                                        type={'email'}
                                        autoComplete={'off'}
                                        placeholder={'user.email@example.com'}
                                        className={classes.inputTextField}
                                        onChange={this.handleAction('email')}
                                    />
                                </div>
                                <div className={clsx(classes.divColumn)}>
                                    <Typography>{TEXT.FORM_LOGIN_PASSWORD}</Typography>
                                    <TextField
                                        variant={'outlined'}
                                        type={showPassword ? 'text' : 'password'}
                                        autoComplete={'off'}
                                        className={classes.inputTextField}
                                        onChange={this.handleAction('password')}
                                        InputProps={{
                                            endAdornment: (
                                                <IconButton
                                                    size={'small'}
                                                    onClick={(evt) => {
                                                        evt = { target: { value: !showPassword } }
                                                        this.handleAction('showPassword')(evt)
                                                    }}
                                                >
                                                    { showPassword ? <VisibilityOff /> : <Visibility /> }
                                                </IconButton>
                                            )
                                        }}
                                    />
                                </div>
                                {
                                    env.REACT_APP_SUPPORT_NON_AD_USERS === 'true'
                                    ?
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                onChange={(evt, checked) => {
                                                    evt = { target: { value: checked }}
                                                    this.handleAction('remember')(evt)
                                                }}
                                                checked={remember}
                                                color={'primary'}
                                            />
                                        }
                                        label={TEXT.FORM_LOGIN_REMEMBER}
                                    />
                                    :
                                    <div className={clsx(classes.divHeight)}/>
                                }
                                <Button
                                    fullWidth={true}
                                    variant={'contained'}
                                    color={'primary'}
                                    type={'submit'}
                                >
                                    {TEXT.FORM_LOGIN_BUTTON_SUBMIT}
                                </Button>
                                {
                                    env.REACT_APP_SUPPORT_NON_AD_USERS === 'true' &&
                                    <Button 
                                        color={'primary'}
                                        variant={'text'}
                                        className={clsx(classes.buttonForgotPassword)}
                                        onClick={this.handleAction('forgot_password')}
                                    >
                                        {TEXT.FORM_LOGIN_BUTTON_FORGOT_PASSWORD}
                                    </Button>
                                }
                            </FormControl>
                        </AccordionDetails>
                    </Accordion>
                </div>
                <div className={classes.divCopyright}>
                    <Typography
                        align={'center'}
                        className={classes.copyright}
                        variant={'body2'}
                    >
                        {TEXT.COPY_RIGHT_TEXT}
                    </Typography>
                </div>
            </div>
        )
    }

    renderDialog = () =>
	{
		const { classes } = this.props
        const { isDialogOpen, dialogType, email, group } = this.state
		return (
			<ModalDialog
				open={isDialogOpen}
				titleText={
                    dialogType === 'forgot_password' && TEXT.FORM_LOGIN_RESET_PASSWORD ||
                    dialogType === 'choose_group' && TEXT.FORM_LOGIN_CHOOSE_GROUP ||
                    dialogType === 'cms_error' && `${metadata['release-date']} (${metadata['release-number']})` ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={
                    dialogType === 'forgot_password' && TEXT.MODAL_CANCEL ||
                    dialogType === 'choose_group' && TEXT.MODAL_LOGOUT ||
                    ''
                }
				confirmDisable={
                    dialogType === 'forgot_password' && !Utils.isEmail(email) ||
                    dialogType === 'choose_group' && _.isEmpty(group)
                }
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
			>
            { 
                dialogType === 'forgot_password' &&
                <div className={clsx(classes.divColumn)}>
                    <Typography>{TEXT.FORM_LOGIN_EMAIL}</Typography>
                    <TextField
                        className={clsx(classes.inputText)}
                        variant={'outlined'}
                        value={email}
                        onChange={this.handleAction('email')}
                        error={!_.isEmpty(email) && !Utils.isEmail(email)}
                        helperText={!_.isEmpty(email) && !Utils.isEmail(email) ? TEXT.CMS_INVALID_EMAIL : ' '}
                        margin="normal"
                        fullWidth
                    />
                </div>
            }
            {
                dialogType === 'choose_group' &&
                <>
                {
                    _.isEmpty(this.props.assignedGroups)
                    ?
                    <div className={clsx(classes.divRow)} >
                        <WarningRounded className={classes.warningIcon} fontSize={'large'} />
                        <Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
                            {TEXT.FORM_LOGIN_GROUP_MESSAGE}
                        </Typography>
                    </div>
                    :
                    <div className={clsx(classes.divColumn, classes.marginLeft)}>    
                        <FormControl>
                            <RadioGroup
                                value={group?.id || ''}
                                onChange={(evt, value) =>
                                {
                                    evt = { target: { value: _.find(this.props.assignedGroups || [], option => (option.id === value)) } }
                                    this.handleAction('group')(evt)
                                }}
                            >
                            {
                                _.map(this.props.assignedGroups || [], (group, index) =>
                                {
                                    return (
                                        <FormControlLabel key={index} value={group.id} control={<Radio color="primary" />} label={Utils.convertCamelcaseToNormal(group.name)} />
                                    )
                                })
                            }
                            </RadioGroup>
                        </FormControl>
                    </div>
                }
                </>
            }
            {
                dialogType === 'cms_error' &&
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
            }
			</ModalDialog>
		)
	}

    render()
    {
        const {
            isLoggedIn,
            location: {
                state
            },
            status,
            expire_warning,
            selectedProject,
            hasEndPoint
        } = this.props

        if (!hasEndPoint)
        {
            return null
        }
        else if (isLoggedIn)
        {
            if ((status === 'active' && expire_warning >= 0) || status === 'inactive' || status === 'initial')
            {
                return <Redirect to={'/profile'} />
            }
            else
            {
                if (selectedProject === '')
                {
                    return <Redirect to={'/homepage'} />
                }

                let nextPage = state && state.from
                    ? state.from.pathname
                    : '/'

                return <Redirect to={
                    {
                        pathname: nextPage
                    }
                } />
            }
        }

        return (
            <div>
                {this.renderLogin()}
                {this.renderDialog()}
            </div>
        )
    }
}

Login.propTypes =
{
    classes: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
    ...state.global,
    ...state.cms
})

const mapDispatchToProps = (dispatch) => ({
    Login: (email, password) =>
    {
        dispatch(ActionCMS.Login(email, password))
    },
    LoginSSO: (msData) =>
    {
        dispatch(ActionCMS.LoginSSO(msData))
    },
    Logout: () =>
	{
		dispatch(ActionCMS.Logout())
	},
    ClearRefresh: () =>
	{
		dispatch(ActionCMS.ClearRefresh())
	},
    ResetPassword: (email) =>
    {
        dispatch(ActionCMS.ResetPassword(email))
    },
    ChooseGroup: (group) =>
    {
        dispatch(ActionCMS.ChooseGroup(group))
    },
    Authen: () =>
    {
        dispatch(ActionCMS.Authen())
    },
    EndPointLoad: () =>
    {
        dispatch(ActionCMS.EndPointLoad())
    },
    SelectProject: (project) =>
    {
        dispatch(ActionGlobal.SelectProject(project))
    },
    SetProps: (prop) =>
	{
		dispatch(ActionCMS.SetProps(prop))
	},
    ShowMessage: (msg) =>
    {
        dispatch(ActionCMS.ShowMessage(msg))
    },
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(customStyle, styles),
)(Login);
