import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import { Typography, TextField, IconButton, Link, Popover } from '@material-ui/core'
import { Visibility, VisibilityOff } from '@material-ui/icons'
import ErrorIcon from '@material-ui/icons/Error';
import { WarningRounded } from '@material-ui/icons'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import TEXT from './Data/Text'
import Utils from '../../Utils'
import { PROVIDER_AD } from '../../Defines'
import { withMultipleStyles, customStyle, breakpointsStyle } from '../../Styles'

import ModalDialog from '../../Components/Dialogs/ModalDialog'

const styles = theme => ({
	inputText: {
		marginTop: 0,
	},
	title: {
		...breakpointsStyle(theme, {
			key: 'font-size',
			value: 1.4,
			variant: 0.1,
			unit: 'rem'
		}),
		fontWeight: '600',
		paddingBottom: 4,
		paddingTop: 4,
	},
	description: {
		...breakpointsStyle(theme, {
			key: 'font-size',
			value: 1,
			variant: 0.05,
			unit: 'rem'
		}),
		paddingBottom: 4,

	},
	tipsDialog: {
		borderRadius: 25,
		backgroundColor: '#1891D5',
		paddingBottom: 15,
	},
	tipsHeader: {
		margin: 15
	},
	tips: {
		...breakpointsStyle(theme, {
			key: 'font-size',
			value: 0.8,
			variant: 0.1,
			unit: 'rem'
		}),
		color: 'white'
	},
	link: {
		...breakpointsStyle(theme, {
			key: 'font-size',
			value: 0.9,
			variant: 0.05,
			unit: 'rem'
		}),
		paddingBottom: 10,
		'&:hover': {
			cursor: 'pointer'
		}
	},
	warning: {
		...breakpointsStyle(theme, {
			key: 'font-size',
			value: 1,
			variant: 0.05,
			unit: 'rem',
		}),
		paddingBottom: 30,
	},
	verticalSpacing: {
		...breakpointsStyle(theme, {
			key: ['height'],
			value: [30],
			variant: [5],
			unit: ['px']
		}),
	}
});

class Profile extends React.Component
{
	constructor(props)
	{
		super(props)
		const { status, expire_warning } = props
		this.state = {
			isUserDialogOpen: false,
			isPasswordDialogOpen: (status === 'active' && (expire_warning >= 0 && expire_warning <= 3)) || (status === 'initial'),
			isLogoutDialogOpen: false
		}
	}

	componentDidMount()
	{
		const {
			username,
			SetTitle
		} = this.props

		this.setState({
			username,
			pwdcurrent: '',
			pwdnew: '',
			pwdconfirm: ''
		})

		SetTitle(TEXT.PROFILE_TITLE)
	}

	componentDidUpdate(prevProps, prevState)
	{
		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()
			this.handleCloseDialog()
			if (this.state.isPasswordDialogOpen)
			{
				this.handleOpenDialog('logout')(null)
			}
		}
	}

	render()
	{
		return (
			<div>
				{this.renderChangeUsernameDialog()}
				{this.renderChangePasswordDialog()}
				{this.renderLogoutDialog()}
				{this.renderProfileContent()}
				{this.renderTips()}
			</div>
		)
	}

	handleOpenDialog = (name) => (evt) =>
	{
		if (name === 'username')
		{
			this.setState({
				isUserDialogOpen: true,
				username: this.props.username
			})
		}
		else if (name === 'password')
		{
			this.setState({
				isPasswordDialogOpen: true
			})
		}
		else if (name === 'logout')
		{
			this.setState({
				isLogoutDialogOpen: true,
			})
		}
	}

	handleCloseDialog = () =>
	{
		this.setState({
			isUserDialogOpen: false,
			isPasswordDialogOpen: false,
			pwdcurrentshow: false,
			pwdnewshow: false,
			pwdconfirmshow: false,
			pwderror: false
		})
	}

	handleChangeDialog = (name, type) => (evt) =>
	{
		if (type === 'text')
		{
			this.setState({
				[name]: evt.target.value
			})
		}
		else if (type === 'button')
		{
			this.setState((prevState, props) => ({
				[name]: !prevState[name]
			}))
		}
	}

	handleSubmit = (name) => (evt) =>
	{
		evt.preventDefault()

		if (name === 'password')
		{
			if (this.validatePassword(this.state.pwdcurrent, this.state.pwdnew, this.state.pwdconfirm))
			{
				this.props.ChangePassword(this.state.pwdcurrent, this.state.pwdnew)
			}
			else
			{
				this.setState({ pwderror: true })
			}
		}
		else if (name === 'username')
		{
			if (this.props.username !== this.state.username)
			{
				this.props.ChangeUsername(this.state.username)
				this.handleCloseDialog()
			}
		}
		else if (name === 'logout')
		{
			this.props.Logout()
			this.handleCloseDialog()
		}
	}

	handleOpenTips = (evt) =>
	{
		this.setState({ anchorEl: evt.currentTarget, pwderror: false })
	}

	handleCloseTips = () =>
	{
		this.setState({ anchorEl: null })
	}

	validatePassword = (oldvalue, newValue, confirmValue) =>
	{
		if (oldvalue !== newValue &&
			newValue === confirmValue &&
			newValue.length >= 10 &&
			Utils.hasNumber(newValue) &&
			Utils.hasUpperCase(newValue) &&
			Utils.hasLowerCase(newValue) &&
			Utils.hasSpecial(newValue))
		{
			return true
		}

		return false
	}

	renderChangeUsernameDialog = () =>
	{
		const { classes } = this.props
		const { username } = this.state
		return (
			<ModalDialog
				open={this.state.isUserDialogOpen}
				titleText={TEXT.PROFILE_DIALOG_CHANGE_NAME_TITLE}
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				confirmDisable={username ? false : true}
				handleConfirmClick={this.handleSubmit('username')}
				handleCancelClick={this.handleCloseDialog}
			>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PROFILE_DIALOG_NAME_TITLE}</Typography>
					<TextField
						variant={'outlined'}
						className={clsx(classes.inputTextField, classes.inputText)}
						value={username}
						onChange={this.handleChangeDialog('username', 'text')}
						margin="normal"
						fullWidth
					/>
				</div>
			</ModalDialog>
		)
	}

	renderChangePasswordDialog = () =>
	{
		const { classes, status, expire_warning } = this.props
		const { pwdcurrent, pwdnew, pwdconfirm, pwdcurrentshow, pwdnewshow, pwdconfirmshow, pwderror } = this.state
		return (
			<ModalDialog
				open={this.state.isPasswordDialogOpen}
				titleText={TEXT.PROFILE_DIALOG_CHANGE_PASSWORD_TITLE}
				confirmText={TEXT.MODAL_OK}
				cancelText={(status === 'initial' || status === 'inactive') ? null : TEXT.MODAL_CANCEL}
				confirmDisable={pwdcurrent && pwdnew && pwdconfirm && pwdnew === pwdconfirm ? false : true}
				handleConfirmClick={this.handleSubmit('password')}
				handleCancelClick={this.handleCloseDialog}
			>
				{
					(status === 'initial' || status === 'inactive') &&
					<div style={{ paddingBottom: 20 }} className={clsx(classes.divRow, classes.alignCenter)}>
						<WarningRounded className={classes.warningIcon} fontSize={'large'} />
						<Typography style={{ fontWeight: 500 }}>
							{ TEXT.PROFILE_DIALOG_CHANGE_PASSWORD_FIRST_LOGIN }
						</Typography>
					</div>
				}
				{
					status === 'active' && expire_warning >= 0 &&
					<div style={{ paddingBottom: 20 }} className={clsx(classes.divRow, classes.alignCenter)}>
						<WarningRounded className={classes.warningIcon} fontSize={'large'} />
						<Typography style={{ fontWeight: 500 }}>
						{Utils.parseString(TEXT.PROFILE_DIALOG_CHANGE_PASSWORD_EXPIRE, expire_warning)}
						</Typography>
					</div>
				}
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PROFILE_DIALOG_CURRENT_PASSWORD_TITLE}</Typography>
					<TextField
						variant={'outlined'}
						type={pwdcurrentshow ? 'text' : 'password'}
						autoComplete={'off'}
						className={clsx(classes.inputTextField, classes.inputText)}
						value={pwdcurrent}
						onChange={this.handleChangeDialog('pwdcurrent', 'text')}
						margin="normal"
						fullWidth
						InputProps={{
							endAdornment: (
								<IconButton onClick={this.handleChangeDialog('pwdcurrentshow', 'button')} size={'small'}>
									{
										pwdcurrentshow
											? <VisibilityOff />
											: <Visibility />
									}
								</IconButton>
							)
						}}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PROFILE_DIALOG_NEW_PASSWORD_TITLE}</Typography>
					<TextField
						variant={'outlined'}
						type={pwdnewshow ? 'text' : 'password'}
						autoComplete={'off'}
						className={clsx(classes.inputTextField, classes.inputText)}
						value={pwdnew}
						onChange={this.handleChangeDialog('pwdnew', 'text')}
						margin="normal"
						fullWidth
						InputProps={{
							endAdornment: 	<div className={clsx(classes.divRow)}>
												<IconButton onClick={this.handleOpenTips} size={'small'}>
												{
													<ErrorIcon style={{ color: '#1891D5' }} />
												}
												</IconButton>
												<IconButton onClick={this.handleChangeDialog('pwdnewshow', 'button')} size={'small'}>
												{
													pwdnewshow ? <VisibilityOff /> : <Visibility />
												}
												</IconButton>
											</div>
						}}
						helperText={pwderror ? TEXT.PROFILE_DIALOG_CHANGE_PASSWORD_INVALID : ' '}
						error={pwderror}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PROFILE_DIALOG_CONFIRM_PASSWORD_TITLE}</Typography>
					<TextField
						variant={'outlined'}
						type={pwdconfirmshow ? 'text' : 'password'}
						autoComplete={'off'}
						className={clsx(classes.inputTextField, classes.inputText)}
						value={pwdconfirm}
						onChange={this.handleChangeDialog('pwdconfirm', 'text')}
						margin="normal"
						fullWidth
						InputProps={{
							endAdornment: (
								<IconButton onClick={this.handleChangeDialog('pwdconfirmshow', 'button')} size={'small'}>
									{
										pwdconfirmshow
											? <VisibilityOff />
											: <Visibility />
									}
								</IconButton>
							)
						}}
						helperText={pwdnew === pwdconfirm ? ' ' : TEXT.PROFILE_DIALOG_CHANGE_PASSWORD_NOT_MATCH}
						error={pwdnew != pwdconfirm}
					/>
				</div>
			</ModalDialog>
		)
	}

	renderLogoutDialog = () =>
	{
		const { classes } = this.props
		return (
			<ModalDialog
				open={this.state.isLogoutDialogOpen}
				titleText={TEXT.PROFILE_LOG_OUT_TITLE}
				confirmText={TEXT.MODAL_OK}
				handleConfirmClick={this.handleSubmit('logout')}
			>
				<Typography className={classes.warning}>
					{TEXT.PROFILE_DIALOG_CHANGE_PASSWORD_LOGOUT}
				</Typography>
			</ModalDialog>
		)
	}

	renderProfileContent = () =>
	{
		const { classes, privilege, username, email } = this.props
		return (
			<div>
				<Typography className={classes.title}>
					{TEXT.PROFILE_DIALOG_NAME_TITLE}
				</Typography>
				<Typography className={classes.description}>
					{username}
				</Typography>
				<Link onClick={this.handleOpenDialog('username')} className={classes.link}>
					{TEXT.PROFILE_DIALOG_CHANGE_NAME_TITLE}
				</Link>

				<div className={classes.verticalSpacing}></div>

				<Typography className={classes.title}>
					{TEXT.PROFILE_DIALOG_EMAIL_TITLE}
				</Typography>
				<Typography className={classes.description}>
					{email}
				</Typography>

				<div className={classes.verticalSpacing}></div>

				{
					this.props.provider?.toLowerCase() !== PROVIDER_AD &&
					<>
						<Typography className={classes.title} >
							{TEXT.PROFILE_DIALOG_PASSWORD_TITLE}
						</Typography>
						<Link onClick={this.handleOpenDialog('password')} className={classes.link}>
							{TEXT.PROFILE_DIALOG_CHANGE_PASSWORD_TITLE}
						</Link>

						<div className={classes.verticalSpacing}></div>
					</>
				}

				<Typography className={classes.title}>
					{TEXT.PROFILE_DIALOG_PRIVILEGE_TITLE}
				</Typography>
				<Typography className={classes.description}>
					{ Utils.getItem(Utils.REMEMBER_ME) === true ? Utils.getItem(Utils.PRIVILEGE) : privilege }
				</Typography>
			</div>
		)
	}

	renderTips = () =>
	{
		// TODO: http://www.cssarrowplease.com/
		const { classes } = this.props
		const { anchorEl } = this.state
		return (
			<Popover
				open={Boolean(anchorEl)}
				anchorEl={anchorEl}
				onClose={this.handleCloseTips}
				anchorOrigin={{
					vertical: 'center',
					horizontal: 'right',
				}}
				transformOrigin={{
					vertical: 'center',
					horizontal: 'left',
				}}
				classes={{
					paper: classes.tipsDialog
				}}
			>
				<Typography className={clsx(classes.tips, classes.tipsHeader)}>
					{TEXT.PROFILE_DIALOG_CHANGE_PASSWORD_TIPS_TITLE}
				</Typography>
				<ul style={{ color: 'white' }}>
					{
						TEXT.PROFILE_DIALOG_CHANGE_PASSWORD_TIPS_CONTENT.split('&').map((line, index) =>
						{
							return (
								<li key={index}>
									<Typography className={classes.tips}>
										{line.trim()}
									</Typography>
								</li>
							)
						})
					}
				</ul>
			</Popover>
		)
	}
}

Profile.propTypes =
{
	classes: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
	...state.global,
	...state.cms
})

const mapDispatchToProps = (dispatch) => ({
	SetTitle: (title) =>
	{
		dispatch(ActionGlobal.SetTitle(title))
	},
	ChangePassword: (old_password, new_password) =>
	{
		dispatch(ActionCMS.ChangePassword(old_password, new_password))
	},
	ChangeUsername: (username) =>
	{
		dispatch(ActionCMS.ChangeUsername(username))
	},
	Logout: () =>
	{
		dispatch(ActionCMS.Logout())
	},
	ClearRefresh: () =>
	{
		dispatch(ActionCMS.ClearRefresh())
	}
})

export default compose(
	connect(mapStateToProps, mapDispatchToProps),
	withMultipleStyles(customStyle, styles),
)(Profile);

