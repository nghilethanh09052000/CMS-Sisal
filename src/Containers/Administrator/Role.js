import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography, Button, TextField, Chip, Stepper, Step, StepLabel, Tooltip, IconButton, FormControlLabel, Checkbox, FormGroup } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import {  WarningRounded } from '@material-ui/icons'

import Utils from '../../Utils'
import TEXT from './Data/Text'
import { DEFINE_ALL } from '../../Defines'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import * as Icons from '../../Components/CmsIcons'
import CmsControlPermission from '../../Components/CmsControlPermission'
import CmsTable from '../../Components/CmsTable'
import ModalDialog from '../../Components/Dialogs/ModalDialog'

const styles = theme => ({
	inputText: {
		marginTop: 0,
	},
	divMaxHeight: {
		maxHeight: '20vh',
		overflowY: 'auto'
	},
	stepperRoot: {
		padding: 0,
		paddingBottom: 10
	},
	marginRight: {
		marginRight: 15,
	},
	marginBottom: {
		marginBottom: 15,
	}
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
const PERMISSION_PAGE_SIZE = 5
const PERMISSION_TABLE_HEIGHT = 290
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
			service: '',
			resource: {},
			actions: {}
		}

		this.actions = {}
		this.selectedRows = []
		this.steps = [TEXT.ROLE_CREATE_ROLE_TITLE, TEXT.ROLE_BUTTON_ASSIGN_ROLES]
		this.actionsExtend = {
			createElement: (parentProps) =>
			{
				const { classes } = this.props

				return (
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
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
												onClick={this.handleAction('restore_role')}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.RefreshIcon/>}
											>
												{TEXT.ROLE_BUTTON_RESTORE_ROLE}	
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
												onClick={this.handleAction('delete_role')}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconRemove/>}
											>
												{TEXT.ROLE_BUTTON_DELETE_ROLE}	
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
											onClick={this.handleAction('add_role', { name: '', permissions: [] })}
											className={clsx(classes.buttonLeft)}
											startIcon={<Icons.IconAdd/>}
										>
											{TEXT.ROLE_BUTTON_NEW_ROLE}	
										</Button>
									}
									link={''}
									attribute={''}
								/>
							}
							</div>
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
			props.RolesPermissionsLoad()

			const isDialogOpen = state.dialogType === 'add_role' && state.activeStep === 0
			
			return {
				isDialogOpen,
				isMultiSelectMode: false,
				dialogType: isDialogOpen ? state.dialogType : '',
				rowData: isDialogOpen ? {...state.rowData, ...props.role} : {},
				activeStep: isDialogOpen ? state.activeStep + 1 : 0,
			}
		}

        return null; // No change to state
    }

	componentDidMount()
	{
		this.props.SetTitle(TEXT.ROLE_TITLE)
		this.props.RolesPermissionsLoad()	
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
                return this.renderCreateRole()
            case 1:
                return this.renderAssignPermissions()
            default:
                return {}
        }
    }

	renderCreateRole = () =>
	{
		const { classes } = this.props
		return (
			<>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.ROLE_TABLE_HEADER_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}					
					/>
				</div>				
			</>
		)
	}

	renderAssignPermissions = () =>
	{
		const { classes } = this.props
		
		return (
			<>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
					<div className={clsx(classes.root, classes.divColumn, classes.marginRight)}>
						<Typography>{TEXT.ROLE_TABLE_HEADER_SERVICE}</Typography>
						<Autocomplete
							autoComplete
							autoSelect
							filterSelectedOptions
							value={this.state.service}
							options={[DEFINE_ALL, ...this.props.services]}
							getOptionLabel={option => {
								let serviceName = Utils.convertToNormalString(option, '-')
								serviceName = serviceName.replace("Cms", "CMS")
								serviceName = serviceName.replace("Dlc", "DLC")
								serviceName = serviceName.replace("Esb", "ESB")
								serviceName = serviceName.replace("Spa", "SPA")
								return serviceName
							}}
							onChange={(evt, value) => {
								this.handleAction('service', value)(evt)
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
					<div className={clsx(classes.root, classes.divColumn)}>
						<Typography>{TEXT.ROLE_TABLE_HEADER_RESOURCE}</Typography>
						<Autocomplete
							autoComplete
							autoSelect
							filterSelectedOptions
							value={this.state.resource}
							options={this.props.resources || []}
							getOptionLabel={option => (option.resource || '')}
							onChange={(evt, value) => {
								this.handleAction('resource', value)(evt)
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
							fullWidth
						/>
					</div>
				</div>
				<div className={clsx(classes.root, classes.divColumn, classes.marginBottom)}>
					<Typography>{TEXT.ROLE_TABLE_HEADER_ACTIONS}</Typography>
					<FormGroup row>
					{
						_.map(this.state.resource.actions, (action, key) => {
							return (
								<FormControlLabel
									key={key}
									control={
										<Checkbox
											name={action}
											color={'primary'}
											checked={this.state.actions[action]}
											onChange={(evt, checked) => {
												this.handleAction('actions', action)(evt)
											}}
										/>
									}
									label={action}
									labelPlacement={'end'}
								/>
							)
						})
					}
					</FormGroup>
				</div>
				<div className={clsx(classes.table, classes.divColumn)}>
					<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
						<Typography className={clsx(classes.title)}>{TEXT.ROLE_TABLE_HEADER_PERMISSIONS}</Typography>
						<Button
							variant='outlined'
							color={'default'}
							startIcon={<Icons.IconAdd />}
							onClick={this.handleAction('add_permission', '')}
							disabled={this.validatePermission()}
						>
							{TEXT.ROLE_BUTTON_ADD_PERMISSION}
						</Button>
					</div>
					<CmsTable
						columns={[
							{
								title: TEXT.ROLE_TABLE_HEADER_SERVICE, field: 'service', width: 101,
							},
							{
								title: TEXT.ROLE_TABLE_HEADER_RESOURCE, field: 'resource', width: 101,
							},
							{
								title: TEXT.ROLE_TABLE_HEADER_ACTIONS, field: 'actions', width: 101,
								render: rowData =>
								{
									return `${rowData.actions}`
								}
							},
							{
								title: TEXT.TABLE_HEADER_BLANK, field: 'blank', sorting: false, nofilter: true, width: 50,
								render: rowData =>
								{
									return (
										<CmsControlPermission
											control={
												<Tooltip 
													title={TEXT.ROLE_TOOLTIP_DELETE_PERMISSION}
													classes={{
														tooltip: classes.toolTip,
													}}
													placement={'top'}
												>
													<IconButton
														onClick={(event) => {
															this.handleAction('delete_permission', rowData)(event)
														}}
													>
														<Icons.IconRemove />
													</IconButton>
												</Tooltip>
											}
											link={''}
											attribute={''}
										/>
									)
								}
							},
						]}

						data={this.state.rowData.permissions}

						options={{
							actionsColumnIndex: -1,
							showTitle: false,
							search: true,
							filtering: false,
							sorting: true,
							pageSize: PERMISSION_PAGE_SIZE,
							tableMaxHeight: PERMISSION_TABLE_HEIGHT,
							selection: false,
							cellStyle: { ...defaultCellStyle, textAlign: 'center', height: 40 },
							headerStyle: { ...defaultHeaderStyle, textAlign: 'center', height: 40, borderTop: `1px ${defaultBorderColor} solid` },
						}}
					/>
				</div>
			</>
		)
	}

	renderAddRole = () =>
	{
		const { classes } = this.props

		return (
			<>
				<Stepper
					activeStep={this.state.activeStep} 
					alternativeLabel
					classes={{
						root: classes.stepperRoot,
					}}
				>
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

	renderEditRole = () =>
	{
		const { classes } = this.props
		
		return (
			<>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.ROLE_TABLE_HEADER_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						defaultValue={this.state.rowData.name || ''}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
						margin="normal"
						fullWidth
						variant={'outlined'}						
					/>
				</div>
			</>
		)
	}

	renderDeleteRestoreRole = () =>
	{
		const { classes } = this.props
		
		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						(this.state.dialogType === 'delete_role' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.ROLE_MESSAGE_DELETE_ROLES, this.state.rowData.length) : TEXT.ROLE_MESSAGE_DELETE_ROLE)) ||
						(this.state.dialogType === 'restore_role' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.ROLE_MESSAGE_RESTORE_ROLES, this.state.rowData.length) : TEXT.ROLE_MESSAGE_RESTORE_ROLE)) ||						
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
									{`${data.name}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name}`}
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
                    (this.state.dialogType === 'add_role' && this.state.activeStep === 0 && TEXT.ROLE_BUTTON_NEW_ROLE) ||
					(this.state.dialogType === 'add_role' && this.state.activeStep === 1 && `${TEXT.ROLE_BUTTON_NEW_ROLE} - ${this.state.rowData.name}`) ||
                    (this.state.dialogType === 'edit_role' && TEXT.ROLE_BUTTON_EDIT_ROLE) ||
					(this.state.dialogType === 'assign_permissions' && `${TEXT.ROLE_BUTTON_ASSIGN_ROLES} - ${this.state.rowData.name}`) ||
                    ((this.state.dialogType === 'delete_role' || this.state.dialogType === 'restore_role') && TEXT.OVERVIEW_REMIND_TITLE) ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(this.state.dialogType === 'delete_role' || this.state.dialogType === 'restore_role') ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'delete_role' || this.state.dialogType === 'restore_role') && this.renderDeleteRestoreRole()
			}
			{
				(this.state.dialogType === 'edit_role') && this.renderEditRole()
			}
			{
				(this.state.dialogType === 'add_role') && this.renderAddRole()
			}
			{
				(this.state.dialogType === 'assign_permissions') && this.renderAssignPermissions()
			}
			</ModalDialog>
		)
	}

	render()
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderRolesTable()}	
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
						(this.state.dialogType === 'delete_role' && this.props.RoleDelete(row)) ||
						(this.state.dialogType === 'restore_role' && this.props.RoleRestore(row))
					})
				}
				else
				{
					(this.state.dialogType === 'add_role' && this.state.activeStep === 0 && this.props.RoleAdd(this.state.rowData)) ||
					(this.state.dialogType === 'add_role' && this.state.activeStep === 1 && this.props.RolePermissionsAdd(this.state.rowData)) ||					
					(this.state.dialogType === 'assign_permissions' && this.props.RolePermissionsAdd(this.state.rowData, 'batchUpdate')) ||
					(this.state.dialogType === 'edit_role' && this.props.RoleEdit(this.state.rowData)) ||
					(this.state.dialogType === 'delete_role' && this.props.RoleDelete(this.state.rowData)) ||
					(this.state.dialogType === 'restore_role' && this.props.RoleRestore(this.state.rowData))
							
				}

				break
            case 'add_role':
			case 'edit_role':
			case 'delete_role':
			case 'restore_role':
			case 'assign_permissions':				
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (name === 'delete_role' ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})

				break
			case 'service':
				this.setState({
						service: data,
						resource: {},
						actions: ''
					},
					() =>
					{
						this.props.ResourcesLoad(data)
					}
				)

				break
			case 'resource':
				this.actions = _.reduce(data.actions, (result, action) => {
					return {...result, [action]: false}
				}, {})

				this.setState({
					resource: data,
					actions: this.actions
				})

				break
			case 'actions':			
				let actions = this.state.actions
				if (evt.target.checked)
				{
					if (data === DEFINE_ALL)
					{
						actions = this.actions
					}
					else
					{
						actions = {...actions, [DEFINE_ALL]: false}
					}
				}
				
				this.setState({
					actions: {
						...actions,
						[data]: evt.target.checked
					}
				})

				break
			case 'add_permission':
				let permissions = [...this.state.rowData.permissions, { service: this.state.service, resource: this.state.resource.resource, actions: this.getValidActions(this.state.actions) }]
				permissions = _.map(_.groupBy(permissions, permission => permission.service + '#' + permission.resource), (value, key) =>
				{
					key = key.split('#')
					return {
						service: key[0],
						resource: key[1],
						actions: this.validatePermissionsSubmit(value)
					}
				}, [])

				this.setState({
					rowData: {
						...this.state.rowData, 
						permissions
					}
				})

				break
			case 'delete_permission':
				this.setState({
					rowData: {
						...this.state.rowData, 
						permissions: _.reject(this.state.rowData.permissions, permission => _.isEqual(permission, data))
					}
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

	getValidActions = (actions) =>
	{
		return _.reduce(Object.keys(actions), (result, action) => {
			return actions[action] ? [...result, action] : result
		}, [])
	}

	validatePermission = () =>
	{
		let result = _.some(['service', 'resource'], key => {
					
			return _.isEmpty(this.state[key])
		})

		if (!result)
		{
			const actions = this.getValidActions(this.state.actions)
			result = _.isEmpty(actions)
		}

		return result
	}

    validateSubmit = (submit_data) =>
	{
		if (this.state.dialogType === 'add_role')
		{
			if (this.state.activeStep === 0)
			{
				let result = _.some(['name'], key => {
					
					return _.isEmpty(submit_data[key])
				})

				return result
			}

			return _.isEmpty(submit_data['permissions'])
		}
		

		return false
	}

	validatePermissionsSubmit = (permissions) =>
	{
		let result = _.reduce(permissions, (result, value) => {
			return _.union(result, value.actions)
		}, [])

		return _.includes(result, DEFINE_ALL) ? [DEFINE_ALL] : result
	}	

	renderRolesTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.ROLE_TABLE_HEADER_NAME, field: 'name', width: 150,
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

					detailPanel={rowData => {
						const pageSize = rowData.permissions.length === 0 ? 1 : rowData.permissions.length
						const tableMaxHeight = (pageSize + 1)*50

						return (
							<div className={clsx(classes.table, classes.divColumn, classes.detailPanelTable)}>
								<Typography className={clsx(classes.title)}>{TEXT.ROLE_TABLE_HEADER_PERMISSIONS}</Typography>
								<CmsTable
									columns={[
										{
											title: TEXT.ROLE_TABLE_HEADER_SERVICE, field: 'service', width: 200,
										},
										{
											title: TEXT.ROLE_TABLE_HEADER_RESOURCE, field: 'resource', width: 200,
										},
										{
											title: TEXT.ROLE_TABLE_HEADER_ACTIONS, field: 'actions', width: 200,
											render: rowData =>
											{
												return `${rowData.actions}`
											}
										},
										
									]}

									data={rowData.permissions || []}

									options={{
										showTitle: false,
										search: false,
										filtering: false,
										sorting: false,
										pageSize: pageSize,
										tableMaxHeight: tableMaxHeight,
										selection: false,
										cellStyle: { ...defaultCellStyle, textAlign: 'center', height: 40 },
										headerStyle: { ...defaultHeaderStyle, textAlign: 'center', height: 40, borderTop: `1px ${defaultBorderColor} solid` },
									}}
								/>
							</div>
						)
					}}

					actions={[						
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('edit_role', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.ROLE_TOOLTIP_EDIT_ROLE),
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
								this.handleAction('assign_permissions', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.ROLE_TOOLTIP_ASSIGN_ROLES),
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
								this.handleAction('delete_role', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.ROLE_TOOLTIP_DELETE_ROLE),
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
								this.handleAction('restore_role', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.ROLE_TOOLTIP_RESTORE_ROLE),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.rolesPermissions || []}

                    options={{
						actionsColumnIndex: -1,
						// fixedColumns: {
						// 	left: 1,
						// 	right: -100
						// },
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
	RolesPermissionsLoad: () =>
	{
		dispatch(ActionCMS.RolesPermissionsLoad())
	},
	RoleAdd: (role_data) =>
	{
		dispatch(ActionCMS.RoleAdd(role_data))
	},
	RoleEdit: (role_data) =>
	{		
		dispatch(ActionCMS.RoleEdit(role_data))
	},
	RoleDelete: (role_data) =>
	{
		dispatch(ActionCMS.RoleDelete(role_data))
	},
	RoleRestore: (role_data) =>
	{
		dispatch(ActionCMS.RoleRestore(role_data))
	},
	RolePermissionsAdd: (role_data, batch) =>
	{
		dispatch(ActionCMS.RolePermissionsAdd(role_data, batch))
	},
	ResourcesLoad: (service) =>
	{
		dispatch(ActionCMS.ResourcesLoad(service))
	},
})

export default compose(
	connect(mapStateToProps, mapDispatchToProps),
	withMultipleStyles(customStyle, styles),
	withRouter
)(Overview);

