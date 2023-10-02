import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography, Button, TextField, Chip, Stepper, Step, StepLabel } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import {  WarningRounded } from '@material-ui/icons'

import Utils from '../../Utils'
import TEXT from './Data/Text'
import { withMultipleStyles, customStyle } from '../../Styles'

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

class Group extends React.Component
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
		this.steps = [TEXT.GROUP_CREATE_GROUP_TITLE, TEXT.GROUP_BUTTON_ASSIGN_ROLES]
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
												onClick={this.handleAction('restore_group')}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.RefreshIcon/>}
											>
												{TEXT.GROUP_BUTTON_RESTORE_GROUP}	
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
												onClick={this.handleAction('delete_group')}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconRemove/>}
											>
												{TEXT.GROUP_BUTTON_DELETE_GROUP}	
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
											onClick={this.handleAction('add_group', { name: '', type: '' })}
											className={clsx(classes.buttonLeft)}
											startIcon={<Icons.IconAdd/>}
										>
											{TEXT.GROUP_BUTTON_NEW_GROUP}	
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
			props.GroupsRolesLoad()

			const isDialogOpen = state.dialogType === 'add_group' && state.activeStep === 0
			
			return {
				isDialogOpen,
				isMultiSelectMode: false,
				dialogType: isDialogOpen ? state.dialogType : '',
				rowData: isDialogOpen ? {...state.rowData, ...props.group} : {},
				activeStep: isDialogOpen ? state.activeStep + 1 : 0,
			}
		}

        return null; // No change to state
    }

	componentDidMount()
	{
		this.props.SetTitle(TEXT.GROUP_TITLE)
		this.props.UserConfigsLoad()
		this.props.GroupsRolesLoad()	
		this.props.RolesLoad()	
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
                return this.renderCreateGroup()
            case 1:
                return this.renderAssignRoles()
            default:
                return {}
        }
    }

	renderCreateGroup = () =>
	{
		const { classes } = this.props
		return (
			<>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.GROUP_TABLE_HEADER_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
						//helperText={!_.isEmpty(this.state.rowData.name)}						
					/>
				</div>								
			</>
		)
	}

	renderAssignRoles = () =>
	{
		const { classes } = this.props
		
		return (
			<>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.GROUP_TABLE_HEADER_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						disabled={true}
					/>
				</div>
				
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.GROUP_TABLE_HEADER_ROLES}</Typography>
					<CmsTransferList
						name={'roles'}
						left={_.map(this.props.roles, value => ({id: value.id, name: value.name})) || []}
						right={this.state.rowData.roles || []}
						getOptionLabel={(option) => (option.name)}
						callbackUpdateData={(name, data) => (this.handleAction(name, data)(null))}
					/>
				</div>
			</>
		)
	}

	renderAddGroup = () =>
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

	renderEditGroup = () =>
	{
		const { classes } = this.props
		
		return (
			<>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.GROUP_TABLE_HEADER_NAME}</Typography>
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

	renderDeleteRestoreGroup = () =>
	{
		const { classes } = this.props
		
		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						(this.state.dialogType === 'delete_group' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.GROUP_MESSAGE_DELETE_GROUPS, this.state.rowData.length) : TEXT.GROUP_MESSAGE_DELETE_GROUP)) ||
						(this.state.dialogType === 'restore_group' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.GROUP_MESSAGE_RESTORE_GROUPS, this.state.rowData.length) : TEXT.GROUP_MESSAGE_RESTORE_GROUP)) ||						
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
                    (this.state.dialogType === 'add_group' && TEXT.GROUP_BUTTON_NEW_GROUP) ||
                    (this.state.dialogType === 'edit_group' && TEXT.GROUP_BUTTON_EDIT_GROUP) ||
					(this.state.dialogType === 'assign_roles' && TEXT.GROUP_BUTTON_ASSIGN_ROLES) ||
                    ((this.state.dialogType === 'delete_group' || this.state.dialogType === 'restore_group') && TEXT.OVERVIEW_REMIND_TITLE) ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(this.state.dialogType === 'delete_group' || this.state.dialogType === 'restore_group') ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'delete_group' || this.state.dialogType === 'restore_group') && this.renderDeleteRestoreGroup()
			}
			{
				(this.state.dialogType === 'edit_group') && this.renderEditGroup()
			}
			{
				(this.state.dialogType === 'add_group') && this.renderAddGroup()
			}
			{
				(this.state.dialogType === 'assign_roles') && this.renderAssignRoles()
			}
			</ModalDialog>
		)
	}

	render()
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderGroupsTable()}	
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
						(this.state.dialogType === 'delete_group' && this.props.GroupDelete(row)) ||
						(this.state.dialogType === 'restore_group' && this.props.GroupRestore(row))
					})
				}
				else
				{
					(this.state.dialogType === 'add_group' && this.state.activeStep === 0 && this.props.GroupAdd(this.state.rowData)) ||
					(this.state.dialogType === 'add_group' && this.state.activeStep === 1 && this.props.GroupRolesAdd(this.state.rowData)) ||					
					(this.state.dialogType === 'assign_roles' && this.props.GroupRolesAdd(this.state.rowData, 'batchUpdate')) ||
					(this.state.dialogType === 'edit_group' && this.props.GroupEdit(this.state.rowData)) ||
					(this.state.dialogType === 'delete_group' && this.props.GroupDelete(this.state.rowData)) ||
					(this.state.dialogType === 'restore_group' && this.props.GroupRestore(this.state.rowData))
							
				}

				break
            case 'add_group':
			case 'edit_group':
			case 'delete_group':
			case 'restore_group':
			case 'assign_roles':				
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (name === 'delete_group' ? row.deletedAt === 0 : row.deletedAt > 0)) : data
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
		if (this.state.dialogType === 'add_group')
		{
			if (this.state.activeStep === 0)
			{
				let result = _.some(['name'], key => {
					
					return _.isEmpty(submit_data[key])
				})

				return result
			}

			return _.isEmpty(submit_data['roles'])
		}
		

		return false
	}

	renderGroupsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.GROUP_TABLE_HEADER_NAME, field: 'name', width: 200,
                        },
						{
                            title: TEXT.GROUP_TABLE_HEADER_ROLES, field: 'roles', width: 300,
							render: rowData => this.renderChipsColumn(rowData, 'roles', 1)
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

					actions={[						
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('edit_group', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.GROUP_TOOLTIP_EDIT_GROUP),
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
								this.handleAction('assign_roles', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.GROUP_TOOLTIP_ASSIGN_ROLES),
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
								this.handleAction('delete_group', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.GROUP_TOOLTIP_DELETE_GROUP),
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
								this.handleAction('restore_group', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.GROUP_TOOLTIP_RESTORE_GROUP),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.groupsRoles || []}

                    options={{
						actionsColumnIndex: -1,
						fixedColumns: {
							left: 1,
							right: -100
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

Group.propTypes =
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
	GroupRolesAdd: (group_data, batch) =>
	{
		dispatch(ActionCMS.GroupRolesAdd(group_data, batch))
	},
	RolesLoad: () =>
	{
		dispatch(ActionCMS.RolesLoad())
	},
	GroupsRolesLoad: () =>
	{
		dispatch(ActionCMS.GroupsRolesLoad())
	},
	GroupAdd: (group_data) =>
	{
		dispatch(ActionCMS.GroupAdd(group_data))
	},
	GroupEdit: (group_data) =>
	{		
		dispatch(ActionCMS.GroupEdit(group_data))
	},
	GroupDelete: (group_data) =>
	{
		dispatch(ActionCMS.GroupDelete(group_data))
	},
	GroupRestore: (group_data) =>
	{
		dispatch(ActionCMS.GroupRestore(group_data))
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
)(Group);

