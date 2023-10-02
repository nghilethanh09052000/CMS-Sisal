import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography, Tooltip, Icon, Button, TextField, Chip, Stepper, Step, StepLabel } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { WarningRounded } from '@material-ui/icons'

import Utils from '../../Utils'
import TEXT from './Data/Text'
import { withMultipleStyles, customStyle } from '../../Styles'
import { env } from '../../env'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import * as Icons from '../../Components/CmsIcons'
import CmsControlPermission from '../../Components/CmsControlPermission'
import CmsTable from '../../Components/CmsTable'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsTransferList from '../../Components/CmsTransferList'

const styles = theme => ({
	inputText: {
		marginTop: 0,
	},
	divMaxHeight: {
		maxHeight: '20vh',
		overflowY: 'auto'
	},
})

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

const PAGE_SIZE = 10
const TABLE_HEIGHT = 650
const FULLTIME_FORMAT = 'MMM DD YYYY HH:mm'

class Overview extends React.Component
{
	constructor(props)
	{
		super(props)

		this.state = {
			dialogType: '',
            isDialogOpen: false,
			isMultiSelectMode: false,
			rowData: {},
			activeStep: 0,
		}

		this.selectedRows = []
		this.steps = [TEXT.OVERVIEW_CREATE_USER_TITLE, TEXT.OVERVIEW_BUTTON_ASSIGN_GROUPS]
		this.actionsExtend = {
			createElement: (parentProps) =>
			{
				const { classes } = this.props

				return (
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
						{	
							env.REACT_APP_SUPPORT_NON_AD_USERS === 'true' &&
							<div className={clsx(classes.divRow)}>
							{
								this.state.isMultiSelectMode
								?
								<>
								{
									_.filter(this.selectedRows, data => (data.deletedAt > 0)).length > 0 &&
									<CmsControlPermission
										control={
											<Button
												variant={'contained'}
												color={'primary'}
												onClick={this.handleAction('restore_user')}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.RefreshIcon/>}
											>
												{TEXT.OVERVIEW_BUTTON_RESTORE_USER}	
											</Button>
										}
										link={''}
										attribute={''}
									/>
								}	
								{
									_.filter(this.selectedRows, data => (data.deletedAt === 0)).length > 0 &&
									<CmsControlPermission
										control={
											<Button
												variant={'contained'}
												color={'primary'}
												onClick={this.handleAction('delete_user')}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconRemove/>}
											>
												{TEXT.OVERVIEW_BUTTON_DELETE_USER}	
											</Button>
										}
										link={''}
										attribute={''}
									/>
								}	
								</>
								:
								<CmsControlPermission
									control={
										<Button
											variant={'contained'}
											color={'primary'}
											onClick={this.handleAction('add_user', { email: '', confirmedEmail: '', type: '' })}
											className={clsx(classes.buttonLeft)}
											startIcon={<Icons.IconAdd/>}
										>
											{TEXT.OVERVIEW_BUTTON_NEW_USER}	
										</Button>
									}
									link={''}
									attribute={''}
								/>
							}
							</div>
						}	
						</div>
					</div>
				)
			}
		}
	}

	static getDerivedStateFromProps(props, state) {
        if (props.needRefresh)
		{
			props.ClearRefresh()
			props.UsersLoad()

			const isDialogOpen = state.dialogType === 'add_user' && state.activeStep === 0

			return {
				isDialogOpen,
				isMultiSelectMode: false,
				dialogType: isDialogOpen ? state.dialogType : '',
				rowData: isDialogOpen ? {...state.rowData, ...props.user} : {},
				activeStep: isDialogOpen ? state.activeStep + 1 : 0,
			}
		}

        return null; // No change to state
    }

	componentDidMount()
	{
		this.props.SetTitle(TEXT.OVERVIEW_TITLE)
		this.props.UserConfigsLoad()
		this.props.GroupsLoad()
		this.props.UsersLoad()
	}

	componentWillUnmount() 
	{
		
	}

	componentDidUpdate(prevProps, prevState)
	{
		
	}

	getStepContent(activeStep)
    {
        switch (activeStep)
        {
            case 0:
                return this.renderCreateUser()
            case 1:
                return this.renderAssignGroups()
            default:
                return {}
        }
    }

	renderCreateUser = () =>
	{
		const { classes } = this.props
		return (
			<>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.OVERVIEW_TABLE_HEADER_EMAIL}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.email || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('email', evt.target.value)(evt) }}
						helperText={!_.isEmpty(this.state.rowData.email) && !Utils.isEmail(this.state.rowData.email) ? TEXT.OVERVIEW_MESSAGE_INVALID_EMAIL : ' '}
						error={!_.isEmpty(this.state.rowData.email) && !Utils.isEmail(this.state.rowData.email)}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.OVERVIEW_CONFIRMED_EMAIL_TITLE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.confirmedEmail || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('confirmedEmail', evt.target.value)(evt) }}
						helperText={this.state.rowData.email === this.state.rowData.confirmedEmail ? ' ' : TEXT.OVERVIEW_MESSAGE_NOT_MATCH}
						error={this.state.rowData.email != this.state.rowData.confirmedEmail}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.OVERVIEW_TABLE_HEADER_TYPE}</Typography>
					<Autocomplete
						value={this.state.rowData.type}
						options={this.props.listProvider || []}
						onChange={(evt, value) => {
							this.handleAction('type', value)(evt)
						}}
						disableClearable={true}
						renderInput={(params) => (
							<TextField {...params}
								variant="outlined"
							/>
						)}
						classes={{
							root: classes.autoComplete,
							input: classes.autoCompleteInput,
							inputRoot: classes.autoCompleteInputRoot
						}}
					/>
				</div>
			</>
		)
	}

	renderAssignGroups = () =>
	{
		const { classes } = this.props
		
		return (
			<>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.OVERVIEW_TABLE_HEADER_USERNAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.username || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						disabled={true}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.OVERVIEW_TABLE_HEADER_EMAIL}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.email || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						disabled={true}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.OVERVIEW_TABLE_HEADER_GROUPS}</Typography>
					<CmsTransferList
						name={'groups'}
						left={_.map(this.props.groups, value => ({id: value.id, name: value.name})) || []}
						right={this.state.rowData.groups || []}
						getOptionLabel={(option) => (option.name)}
						callbackUpdateData={(name, data) => (this.handleAction(name, data)(null))}
					/>
				</div>
			</>
		)
	}

	renderAddUser = () =>
	{
		return (
			<>
				<Stepper activeStep={this.state.activeStep} alternativeLabel>
					{this.steps.map((label) => (
						<Step key={label}>
							<StepLabel>{label}</StepLabel>
						</Step>
					))}
				</Stepper>
				{
					this.getStepContent(this.state.activeStep)
				}
			</>
		)
	}

	renderEditUser = () =>
	{
		const { classes } = this.props
		
		return (
			<>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.OVERVIEW_TABLE_HEADER_USERNAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.username || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						disabled={true}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.OVERVIEW_TABLE_HEADER_EMAIL}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.email || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						disabled={true}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.TABLE_HEADER_STATUS}</Typography>
					<Autocomplete
						value={this.state.rowData.status}
						options={this.props.listStatus || []}
						onChange={(evt, value) => {
							this.handleAction('status', value)(evt)
						}}
						disableClearable={true}
						renderInput={(params) => (
							<TextField {...params}
								variant="outlined"
							/>
						)}
						classes={{
							root: classes.autoComplete,
							input: classes.autoCompleteInput,
							inputRoot: classes.autoCompleteInputRoot
						}}
					/>
				</div>
			</>
		)
	}

	renderDeleteRestoreUser = () =>
	{
		const { classes } = this.props
		
		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'delete_user' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.OVERVIEW_MESSAGE_DELETE_USERS, this.state.rowData.length) : TEXT.OVERVIEW_MESSAGE_DELETE_USER) ||
						this.state.dialogType === 'restore_user' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.OVERVIEW_MESSAGE_RESTORE_USERS, this.state.rowData.length) : TEXT.OVERVIEW_MESSAGE_RESTORE_USER) ||
						this.state.dialogType === 'revoke_password' && TEXT.OVERVIEW_MESSAGE_REVOKE_PASSWORD ||
						''
					}
					</Typography>
					<div className={clsx(classes.divColumn, classes.divMaxHeight)}>
					{
						this.state.isMultiSelectMode
						?
						_.map(this.state.rowData, data => {
							return (
								<Typography key={data.id} style={{ paddingBottom: 5 }}>
									{`${data.email}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.email}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
                    this.state.dialogType === 'add_user' && TEXT.OVERVIEW_BUTTON_NEW_USER ||
                    this.state.dialogType === 'edit_user' && TEXT.OVERVIEW_BUTTON_EDIT_USER ||
					this.state.dialogType === 'assign_groups' && TEXT.OVERVIEW_BUTTON_ASSIGN_GROUPS ||
                    (this.state.dialogType === 'delete_user' || this.state.dialogType === 'restore_user' || this.state.dialogType === 'revoke_password') && TEXT.OVERVIEW_REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(this.state.dialogType === 'delete_user' || this.state.dialogType === 'restore_user' || this.state.dialogType === 'revoke_password') ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'delete_user' || this.state.dialogType === 'restore_user' || this.state.dialogType === 'revoke_password') && this.renderDeleteRestoreUser()
			}
			{
				(this.state.dialogType === 'edit_user') && this.renderEditUser()
			}
			{
				(this.state.dialogType === 'add_user') && this.renderAddUser()
			}
			{
				(this.state.dialogType === 'assign_groups') && this.renderAssignGroups()
			}
			</ModalDialog>
		)
	}

	render()
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderUsersTable()}
				{this.renderDialog()}
			</div>
		)
	}

	handleAction = (name, data) => (evt) =>
	{
		switch (name)
		{
			case 'close':
				this.setState({
					isDialogOpen: false,
					dialogType: '',
					activeStep: 0,
					rowData: {}
				})

				break
			case 'submit':
				if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						this.state.dialogType === 'delete_user' && this.props.UserDelete(row) ||
						this.state.dialogType === 'restore_user' && this.props.UserRestore(row)
					})
				}
				else
				{
					this.state.dialogType === 'add_user' && this.state.activeStep === 0 && this.props.UserAdd(this.state.rowData) ||
					(this.state.dialogType === 'add_user' && this.state.activeStep === 1 && this.props.UserGroupsAdd(this.state.rowData) ||
					this.state.dialogType === 'assign_groups') && this.props.UserGroupsAdd(this.state.rowData, 'batchUpdate') ||
					this.state.dialogType === 'edit_user' && this.props.UserEdit(this.state.rowData) ||
					this.state.dialogType === 'delete_user' && this.props.UserDelete(this.state.rowData) ||
					this.state.dialogType === 'restore_user' && this.props.UserRestore(this.state.rowData) ||
					this.state.dialogType === 'revoke_password' && this.props.RevokePassword(this.state.rowData)
				}

				break
            case 'add_user':
			case 'edit_user':
			case 'delete_user':
			case 'restore_user':
			case 'assign_groups':
			case 'revoke_password':		
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (name === 'delete_user' ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})

				break
            default:
                this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: data
					}
                })
		}		
	}

    validateSubmit = (submit_data) =>
	{
		if (this.state.dialogType === 'add_user')
		{
			if (this.state.activeStep === 0)
			{
				let result = _.some(['email', 'confirmedEmail', 'type'], key => {
					
					return _.isEmpty(submit_data[key])
				})

				if (!result)
				{
					result = !Utils.isEmail(submit_data['email']) || !Utils.isEmail(submit_data['confirmedEmail']) || submit_data['email'] !== submit_data['confirmedEmail']
				}

				return  result
			}

			return _.isEmpty(submit_data['groups'])
		}
		

		return false
	}

	renderUsersTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.OVERVIEW_TABLE_HEADER_EMAIL, field: 'email', width: 300,
                        },
						{
                            title: TEXT.OVERVIEW_TABLE_HEADER_USERNAME, field: 'username', width: 300,
                        },
						{
                            title: TEXT.OVERVIEW_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: TEXT.OVERVIEW_TABLE_HEADER_GROUPS, field: 'groups', width: 300,
							render: rowData => this.renderChipsColumn(rowData, 'groups')
                        },
						{
                            title: () => (
                                <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
                                    <span>{TEXT.TABLE_HEADER_STATUS}</span>
                                    <Tooltip 
                                        title={TEXT.OVERVIEW_TOOLTIP_STATUS}
                                        classes={{tooltip: classes.toolTip}}
                                        placement={'top'}
                                    >
                                        <Icon style={{ color: '#AEAEAE', marginLeft: 10 }} >help</Icon>
                                    </Tooltip>
                                </div>
                            ),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData, columnDef, 'status')
                        },
						{
                            title: TEXT.OVERVIEW_TABLE_HEADER_LAST_LOGGED_IN, field: 'lastLoggedIn', width: 150,
							render: rowData => {
								return (
									<div>
									{
										`${rowData?.lastLoggedIn ? moment.utc(rowData.lastLoggedIn).format(FULLTIME_FORMAT): ''}`
									}
									</div>
								)
							},
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'lastLoggedIn'),
						},
                        {
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 250,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'createdAt'),
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'modifiedAt'),
						},
						{
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy', width: 350,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy', hidden: true,
                        },
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', width: 150,
                            render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'deletedAt'),
                        },
                    ]}

					actions={
						env.REACT_APP_SUPPORT_NON_AD_USERS === 'true' 
						? 
						[
							{
								icon: (props) => <Icons.RevokePassword {...props} />,
								onClick: (event, rowData) =>
								{
									this.handleAction('revoke_password', rowData)(event)
								},
								tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.OVERVIEW_TOOLTIP_REVOKE_PASSWORD),
								disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0),
								iconProps: { color: 'inherit' },
								position: 'row',
								controlPermission: {
									link: '',
									attribute: ''
								}
							},
							{
								icon: (props) => <Icons.IconEdit {...props} />,
								onClick: (event, rowData) =>
								{
									this.handleAction('edit_user', rowData)(event)
								},
								tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.OVERVIEW_TOOLTIP_EDIT_USER),
								disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0),
								iconProps: { color: 'inherit' },
								position: 'row',
								controlPermission: {
									link: '',
									attribute: ''
								}
							},
							{
								icon: (props) => <Icons.IconAssign {...props} />,
								onClick: (event, rowData) =>
								{
									this.handleAction('assign_groups', rowData)(event)
								},
								tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.OVERVIEW_TOOLTIP_ASSIGN_GROUPS),
								disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0),
								iconProps: { color: 'inherit' },
								position: 'row',
								controlPermission: {
									link: '',
									attribute: ''
								}
							},
							{
								icon: (props) => <Icons.IconRemove {...props} />,
								onClick: (event, rowData) =>
								{
									this.handleAction('delete_user', rowData)(event)
								},
								tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.OVERVIEW_TOOLTIP_DELETE_USER),
								disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0),
								iconProps: { color: 'inherit' },
								position: 'row',
								controlPermission: {
									link: '',
									attribute: ''
								}
							},
							{
								icon: (props) => <Icons.RefreshIcon {...props} />,
								onClick: (event, rowData) =>
								{
									this.handleAction('restore_user', rowData)(event)
								},
								tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.OVERVIEW_TOOLTIP_RESTORE_USER),
								disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
								iconProps: { color: 'inherit' },
								position: 'row',
								controlPermission: {
									link: '',
									attribute: ''
								}
							},
						]
						:
						[]
					}

                    data={this.props.users || []}

                    options={{
						actionsColumnIndex: -1,
						fixedColumns: {
							left: 1,
							right: env.REACT_APP_SUPPORT_NON_AD_USERS === 'true' ? -100 : 0
						},
						tableStickyHeader: false,
                        showTitle: false,
                        search: true,
                        filtering: false,
						sorting: true,
                        pageSize: PAGE_SIZE,
						tableMaxHeight: TABLE_HEIGHT,
                        selection: true,
						cellStyle: { ...defaultCellStyle, textAlign: 'center' },
						headerStyle: { ...defaultHeaderStyle, textAlign: 'center', borderTop: `1px ${defaultBorderColor} solid` },
                    }}

					onSelectionChange={(selectedRows, dataClicked) =>
					{
						this.selectedRows = selectedRows
						const isMultiSelectMode = selectedRows.length > 1
						isMultiSelectMode !== this.state.isMultiSelectMode && this.setState({ isMultiSelectMode })
					}}

					ignoredRender={this.state.isDialogOpen}

					actionsExtend={this.actionsExtend}
                />
            </div>		
		)
	}

	dateFilterAndSearch = (term, rowData, columnDef, field) =>
	{
		var terms = term.split(';')
		let timestamp = rowData[field] ? moment.utc(rowData[field]).format(FULLTIME_FORMAT) : ''

		return _.some(terms, value =>
		{
			if (value.length > 0)
			{
				return columnDef.searchAlgorithm === 'includes' ? _.includes(timestamp, value) : _.startsWith(timestamp, value)
			}

			return false
		})
	}

	customFilterAndSearch = (term, rowData, columnDef, field) =>
	{
		var terms = term.split(';')
		let strData = rowData[field]

		return _.some(terms, value =>
		{
			if (value.length > 0)
			{
				return columnDef.searchAlgorithm === 'includes' ? _.includes(strData, value) : _.startsWith(strData, value)
			}

			return false
		})
	}

	renderDateColumn = (rowData) =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divRow, classes.justifyStart)}>
				<div className={clsx(classes.divColumn, classes.alignStart)}>
					<div className={classes.divRow}>
						<div style={{ fontWeight: 'bold', marginRight: 10 }}>
						{
							`${TEXT.TABLE_HEADER_CREATED_DATE}:`
						}
						</div>
						<div>
						{
							`${rowData?.createdAt !== 1
								? moment.utc(rowData.createdAt).format(FULLTIME_FORMAT)
								: ''
							}`
						}
						</div>
					</div>
					<div className={classes.divRow}>
						<div style={{ fontWeight: 'bold', marginRight: 5 }}>
						{
							`${TEXT.TABLE_HEADER_MODIFIED_DATE}:`
						}
						</div>
						<div>
						{
							`${rowData?.modifiedAt !== 1
								? moment.utc(rowData.modifiedAt).format(FULLTIME_FORMAT)
								: ''
							}`
						}
						</div>
					</div>
				</div>
			</div>
		)
	}

	renderOwnersColumn = (rowData) =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divRow, classes.justifyStart)}>
				<div className={clsx(classes.divColumn, classes.alignStart)}>
					<div className={classes.divRow}>
						<div style={{ fontWeight: 'bold', marginRight: 10 }}>
						{
							`${TEXT.TABLE_HEADER_CREATED_BY}:`
						}
						</div>
						<div>
						{
							`${rowData?.createdBy || ''}`
						}
						</div>
					</div>
					<div className={classes.divRow}>
						<div style={{ fontWeight: 'bold', marginRight: 5 }}>
						{
							`${TEXT.TABLE_HEADER_MODIFIED_BY}:`
						}
						</div>
						<div>
						{
							`${rowData?.modifiedBy || ''}`
						}
						</div>
					</div>
				</div>
			</div>
		)
	}	

	renderDeletedAtColumn = (rowData) =>
	{
		return (
			<div>
			{
				`${rowData?.deletedAt > 0
					? moment.utc(rowData.deletedAt).format(FULLTIME_FORMAT)
					: ''
				}`
			}
			</div>
		)
	}

	renderChipsColumn = (rowData, field, NUMBER_CHIPS = 2) =>
	{
		const { classes } = this.props
		
		const fieldData = rowData[field]
		const chips = fieldData.slice(0, NUMBER_CHIPS)
		const hidden = (fieldData.length - chips.length > 0)
		let isOpen = false

		return (
			<Autocomplete
				key={rowData.id}
				fullWidth
				multiple
				disableClearable
				filterSelectedOptions
				limitTags={NUMBER_CHIPS}
				size={'small'}
				value={chips}
				options={fieldData}
				getOptionLabel={(option) => (option.name)}
				inputValue={''}
				onOpen={(evt) => {
					isOpen = !isOpen
				}}
				onClose={(evt) => {
					isOpen = !isOpen
				}}
				renderInput={(params) => (
					<TextField style={{width: 'auto'}} {...params}/>
				)}
				renderTags={(value, getTagProps) =>
					value.map((option, index) => (
						<div key={index} className={clsx(classes.divRow, classes.justifyStart)}>
							<Chip
								variant={'outlined'}
								style={{marginRight: 5}}
								size={'small'} 
								label={option.name}
							/>
							{
								hidden && (index === NUMBER_CHIPS - 1) &&
								(
									!isOpen
									?
									<Chip 
										color="primary"
										size={'small'} 
										label={`+${fieldData.length - chips.length}`}
									/>
									:
									<div style={{ minWidth: 30}}/>
								)
							}
						</div>
				))}
				classes={{
					noOptions: classes.autoCompleteNoOptionsTable,
					root: classes.autoCompleteTable,
					input: classes.autoCompleteInputTable,
					inputRoot: classes.autoCompleteInputRootTable
				}}
				forcePopupIcon={hidden}
			/>
		)
	}
}

Overview.propTypes =
{
	classes: PropTypes.object.isRequired,
}

const mapStateToProps = (state) => ({
	...state.global,
	...state.cms
})

const mapDispatchToProps = (dispatch) => ({
	SetTitle: (title) =>
	{
		dispatch(ActionGlobal.SetTitle(title))
	},
	ClearRefresh: () =>
	{
		dispatch(ActionCMS.ClearRefresh())
	},
	ClearProps: (keys) =>
	{
		dispatch(ActionCMS.ClearProps(keys))
	},
	GroupsLoad: () =>
	{
		dispatch(ActionCMS.GroupsLoad())
	},
	UserGroupsAdd: (user_data, batch) =>
	{
		dispatch(ActionCMS.UserGroupsAdd(user_data, batch))
	},
	UsersLoad: () =>
	{
		dispatch(ActionCMS.UsersLoad())
	},
	UserAdd: (user_data) =>
	{
		dispatch(ActionCMS.UserAdd(user_data))
	},
	UserEdit: (user_data) =>
	{
		dispatch(ActionCMS.UserEdit(user_data))
	},
	UserDelete: (user_data) =>
	{
		dispatch(ActionCMS.UserDelete(user_data))
	},
	UserRestore: (user_data) =>
	{
		dispatch(ActionCMS.UserRestore(user_data))
	},
	RevokePassword: (user_data) =>
	{
		dispatch(ActionCMS.RevokePassword(user_data))
	},
	UserConfigsLoad: () =>
	{
		dispatch(ActionCMS.UserConfigsLoad())
	},
})

export default compose(
	connect(mapStateToProps, mapDispatchToProps),
	withMultipleStyles(customStyle, styles),
	withRouter
)(Overview);

