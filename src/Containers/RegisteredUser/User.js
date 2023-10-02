import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import { Typography, TextField, Chip } from '@material-ui/core'
import { WarningRounded } from '@material-ui/icons'
import Autocomplete from '@material-ui/lab/Autocomplete'
import copy from "copy-to-clipboard"

import TEXT from './Data/Text'
import Utils from '../../Utils'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import CmsTable from '../../Components/CmsTable'
import * as Icons from '../../Components/CmsIcons'
import ModalDialog from '../../Components/Dialogs/ModalDialog'

import API from '../../Api/API'

const styles = theme => ({
	table: {
        flexGrow: 0,
        flexShrink: 0,
        marginTop: 0,
    },
	marginRight: {
		marginRight: 15,
	},
	marginTop: {
		marginTop: 5,
	},
	marginBottom: {
		marginBottom: 30,
	}
})

const defaultBorderColor = '#D6D6D6'

const defaultBorderStyle = {
	borderLeft: `1px ${defaultBorderColor} solid`,
}

const defaultHeaderStyle = {
	height: 40, // auto ajustment by table
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
const TABLE_HEIGHT = 750
const FULLTIME_FORMAT = 'MMM DD YYYY HH:mm'
const USER_DATA = { id: '', phoneNumber: '', email: '', surname: '', username: '' }

class User extends React.Component
{
	constructor(props)
	{
		super(props)

		this.state = {
			dialogType: '',
            isDialogOpen: false,
			pageSize: PAGE_SIZE,
			rowData: {},
			backupData: {},
		}

		this.tableRef = React.createRef()
	}

    componentDidMount()
	{
		this.props.SetTitle(TEXT.USER_MANAGEMENT_TITLE)
	}

	componentWillUnmount() 
	{
		
	}

	componentDidUpdate(prevProps, prevState)
	{
		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()
			this.tableRef.current && this.tableRef.current.onQueryChange(prevState.query, null)
		}
	}

	static getDerivedStateFromProps(props, state)
	{
        if (props.needRefresh)
		{
			return {
				isDialogOpen: false,
				dialogType: '',
				rowData: {},
				backupData: {}
			}
		}

        return null; // No change to state
    }

    render()
    {
        const { classes } = this.props

		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderUsersAuthenticationTable()}
				{this.renderDialog()}
			</div>
		)
    }

	validateSubmit = (submit_data) =>
	{
		const { surname, username, email, phoneNumber, understood } = submit_data
		return _.isEmpty(surname) ||
				_.isEmpty(username) || 
				_.isEmpty(phoneNumber) ||
				_.isEmpty(email) || 
				!Utils.isEmail(email) ||  
				understood !== 'understood'
	}

	handleAction = (name, data) => (evt) =>
	{
		evt && evt.preventDefault && evt.preventDefault()
		switch (name)
		{
			case 'close':
				this.setState({
					isDialogOpen: false,
					dialogType: '',
					rowData: {},
					backupData: {}
				})

				break
			case 'submit':
				this.state.dialogType === 'user_delete' && this.props.UserAuthenticationDelete(this.state.rowData) ||
				this.state.dialogType === 'user_edit' && this.props.UserAuthenticationEdit(this.state.rowData)

				break	
			case 'user_delete':
			case 'user_edit':	
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data,
					backupData: data
				})

				break	
			case 'copy_clipboard':
				copy(data)
				this.props.ShowMessage(TEXT.MESSAGE_COPY_TO_CLIPBOARD)

				break	
			case 'pageSize':
				this.setState({
					[name]: data
				})
				
				break	
			default:
				this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: data
					}
                })
				
				break
		}
	}			

	renderDialog = () =>
	{
		const { classes } = this.props

		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
					this.state.dialogType === 'user_delete' && TEXT.USER_MANAGEMENT_TOOLTIP_DELETE_USER ||
                    this.state.dialogType === 'user_edit' && TEXT.USER_MANAGEMENT_TOOLTIP_EDIT_USER ||
					''
				}
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
				confirmDisable={(_.includes(this.state.dialogType, '_delete')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				this.state.dialogType === 'user_delete' && this.renderDeleteUser()
			}
			{
				this.state.dialogType === 'user_edit' && this.renderEditUser()
			}
			</ModalDialog>
		)
	}

	renderDeleteUser = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'user_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.USER_MANAGEMENT_MESSAGE_DELETE_USERS, this.state.rowData.length) : TEXT.USER_MANAGEMENT_MESSAGE_DELETE_USER) ||
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
									{`${data.email} - ${data.phoneNumber}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.email} - ${this.state.rowData.phoneNumber}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderEditUser = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.USER_MANAGEMENT_TABLE_HEADER_SURNAME}</Typography>
					<div className={clsx(classes.divRow, classes.justifyBetween, classes.marginTop)}>
						<TextField
							label={TEXT.USER_MANAGEMENT_NEW_VALUE_TITLE}
							className={clsx(classes.inputTextField, classes.inputText, classes.marginRight)}
							value={this.state.rowData.surname || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('surname', evt.target.value)(evt) }}
						/>
						<TextField
							label={TEXT.USER_MANAGEMENT_CURRENT_VALUE_TITLE}
							className={clsx(classes.inputTextField, classes.inputText)}
							value={this.state.backupData.surname || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							disabled={true}
						/>
					</div>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.USER_MANAGEMENT_TABLE_HEADER_USERNAME}</Typography>
					<div className={clsx(classes.divRow, classes.justifyBetween, classes.marginTop)}>
						<TextField
							label={TEXT.USER_MANAGEMENT_NEW_VALUE_TITLE}
							className={clsx(classes.inputTextField, classes.inputText, classes.marginRight)}
							value={this.state.rowData.username || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('username', evt.target.value)(evt) }}
						/>
						<TextField
							label={TEXT.USER_MANAGEMENT_CURRENT_VALUE_TITLE}
							className={clsx(classes.inputTextField, classes.inputText)}
							value={this.state.backupData.username || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							disabled={true}
						/>
					</div>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.USER_MANAGEMENT_TABLE_HEADER_PHONE_NUMBER}</Typography>
					<div className={clsx(classes.divRow, classes.justifyBetween, classes.marginTop)}>
						<TextField
							label={TEXT.USER_MANAGEMENT_NEW_VALUE_TITLE}
							className={clsx(classes.inputTextField, classes.inputText, classes.marginRight)}
							value={this.state.rowData.phoneNumber || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('phoneNumber', evt.target.value)(evt) }}
						/>
						<TextField
							label={TEXT.USER_MANAGEMENT_CURRENT_VALUE_TITLE}
							className={clsx(classes.inputTextField, classes.inputText)}
							value={this.state.backupData.phoneNumber || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							disabled={true}
						/>
					</div>
				</div>
				<div className={clsx(classes.divColumn, classes.marginBottom)}>
					<Typography>{TEXT.USER_MANAGEMENT_TABLE_HEADER_EMAIL}</Typography>
					<div className={clsx(classes.divRow, classes.justifyBetween, classes.marginTop)}>
						<TextField
							label={TEXT.USER_MANAGEMENT_NEW_VALUE_TITLE}
							className={clsx(classes.inputTextField, classes.inputText, classes.marginRight)}
							value={this.state.rowData.email || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('email', evt.target.value)(evt) }}
							helperText={!_.isEmpty(this.state.rowData.email) && !Utils.isEmail(this.state.rowData.email) ? TEXT.USER_MANAGEMENT_MESSAGE_INVALID_EMAIL : ' '}
							error={!_.isEmpty(this.state.rowData.email) && !Utils.isEmail(this.state.rowData.email)}
						/>
						<TextField
							label={TEXT.USER_MANAGEMENT_CURRENT_VALUE_TITLE}
							className={clsx(classes.inputTextField, classes.inputText)}
							value={this.state.backupData.email || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							helperText={' '}
							disabled={true}
						/>
					</div>
				</div>
				<div className={clsx(classes.divColumn)}>
					<div className={classes.divRow}>
						<WarningRounded className={classes.warningIcon} fontSize={'large'} />
						<Typography>
							{TEXT.USER_MANAGEMENT_MESSAGE_EDIT_USER}
						</Typography>
					</div>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.understood || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('understood', evt.target.value)(evt) }}
					/>
				</div>
			</div>
		)
	}

	renderUsersAuthenticationTable = () =>
	{
		const { classes } = this.props
	
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.USER_MANAGEMENT_TABLE_HEADER_USER_ID, field: 'id', width: 150,
							disableClick: false,
							cellTooltip: TEXT.USER_MANAGEMENT_TOOLTIP_COPY_TO_CLIPBOARD
                        },
						{
                            title: TEXT.USER_MANAGEMENT_TABLE_HEADER_EMAIL, field: 'email', width: 150,
							disableClick: false,
							cellTooltip: TEXT.USER_MANAGEMENT_TOOLTIP_COPY_TO_CLIPBOARD
                        },
						{
                            title: TEXT.USER_MANAGEMENT_TABLE_HEADER_PHONE_NUMBER, field: 'phoneNumber', width: 150,
							disableClick: false,
							cellTooltip: TEXT.USER_MANAGEMENT_TOOLTIP_COPY_TO_CLIPBOARD
                        },
						{
                            title: TEXT.USER_MANAGEMENT_TABLE_HEADER_SURNAME, field: 'surname', width: 150,
							disableClick: true
                        },
						{
                            title: TEXT.USER_MANAGEMENT_TABLE_HEADER_USERNAME, field: 'username', width: 200,
							disableClick: true
                        },
						{
                            title: TEXT.USER_MANAGEMENT_TABLE_HEADER_DATE_OF_BIRTH, field: 'dateOfBirth', width: 150,
							filtering: false,
							disableClick: true,
							render: rowData => new Date(rowData.dateOfBirth).toLocaleDateString('en-GB', { year: 'numeric', month: 'short', day: 'numeric' }),
                        },
						{
                            title: TEXT.USER_MANAGEMENT_TABLE_HEADER_LINKED_ACCOUNT, field: 'accounts', width: 200,
							filtering: false,
							disableClick: true,
							render: (rowData) => this.renderChipsColumn(_.map(rowData.accounts || [], account => (account.accountType)))
                        },
                        {
                            title: TEXT.TABLE_HEADER_CREATED_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 150,
							filtering: false,
							disableClick: true,
							render: rowData => this.renderCustomDateColumn(rowData.createdAt, FULLTIME_FORMAT),
                        },
                    ]}

                    data={query =>
					{
						const { filters, page, pageSize } = query
						let user_data = _.reduce(filters, (user_data, filter) =>
						{
							return {...user_data, [filter.column.field]: filter.value}
						}, {})

						user_data = {
							...USER_DATA, 
							...user_data, 
							page: page + 1, 
							pageSize
						}

						return new Promise((resolve) =>
						{
							this.props.SetLoading('')
							API.UsersAuthenticationLoad(user_data)
							.then(result =>
							{
								resolve({
									data: result.items,
									page: _.isEmpty(result.items) ? 0 : result.pagination.page - 1,
									totalCount: result.pagination.totalItems,
								})

								this.props.ClearLoading()
							})
							.catch(error =>
							{
								resolve({
									data: [],
									page: 0,
									totalCount: 0,
								})

								this.props.SetProps([{ key: 'error', value: error }])
								this.props.ClearLoading()
							})
						})
					}}

					actions={[
						{
							icon: (props) => <Icons.IconGameEconomy {...props} />,
							onClick: (event, rowData) =>
							{
								this.props.history.push(`${this.props.location.pathname}/0/${rowData.id}`)
							},
							tooltip: (rowData) => (TEXT.USER_MANAGEMENT_TOOLTIP_REWARD),
							disabled: (rowData) => (false),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
						{
							icon: (props) => <Icons.IconContent {...props} />,
							onClick: (event, rowData) =>
							{
								this.props.history.push(`${this.props.location.pathname}/1/${rowData.id}`)
							},
							tooltip: (rowData) => (TEXT.USER_MANAGEMENT_TOOLTIP_QUEST),
							disabled: (rowData) => (false),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
						{
							icon: (props) => <Icons.IconTycoonProperty {...props} />,
							onClick: (event, rowData) =>
							{
								this.props.history.push(`${this.props.location.pathname}/2/${rowData.id}`)
							},
							tooltip: (rowData) => (TEXT.USER_MANAGEMENT_TOOLTIP_CURRENCY),
							disabled: (rowData) => (false),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
						{
							icon: (props) => <Icons.IconLeaderboard {...props} />,
							onClick: (event, rowData) =>
							{
								this.props.history.push(`${this.props.location.pathname}/3/${rowData.id}`)
							},
							tooltip: (rowData) => (TEXT.USER_MANAGEMENT_TOOLTIP_INSTANT_WIN),
							disabled: (rowData) => (false),
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
								this.handleAction('user_edit', rowData)(event)
							},
							tooltip: (rowData) => (TEXT.USER_MANAGEMENT_TOOLTIP_EDIT_USER),
							disabled: (rowData) => (false),
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
								this.handleAction('user_delete', rowData)(event)
							},
							tooltip: (rowData) => (TEXT.USER_MANAGEMENT_TOOLTIP_DELETE_USER),
							disabled: (rowData) => (false),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

					onClickCell={(event, rowData, columnDef) =>
					{
						if (rowData.hasOwnProperty(columnDef.field))
						{
							this.handleAction('copy_clipboard', rowData[columnDef.field])(event)
						}
					}}

					onRowsPerPageChange={(pageSize) =>
					{
						this.handleAction('pageSize', pageSize)(null)
					}}

                    options={{
						actionsColumnIndex: -1,
						/* fixedColumns: {
							left: 1,
							right: -100
						}, */
                        showTitle: false,
                        search: false,
                        filtering: true,
						sorting: false,
                        pageSize: this.state.pageSize,
						tableMaxHeight: TABLE_HEIGHT,
                        selection: false,
						cellStyle: { ...defaultCellStyle, textAlign: 'center' },
						headerStyle: { ...defaultHeaderStyle, textAlign: 'center', borderTop: `1px ${defaultBorderColor} solid` },
                    }}

					ignoredRender={this.state.isDialogOpen}

					tableRef={this.tableRef}
                />
            </div>		
		)
	}

	renderCustomDateColumn = (rowData, format) =>
	{
		return (
			<div>
			{
				`${rowData > 0
					? moment.utc(rowData).format(format)
					: ''
				}`
			}
			</div>
		)
	}

	renderChipsColumn = (data,NUMBER_CHIPS = 1) =>
	{
		const { classes } = this.props
		
		const chips = data.slice(0, NUMBER_CHIPS)
		const hidden = (data.length - chips.length > 0)
		let isOpen = false

		return (
			<Autocomplete
				fullWidth
				multiple
				disableClearable
				filterSelectedOptions
				limitTags={NUMBER_CHIPS}
				size={'small'}
				value={chips}
				options={data}
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
								label={option}
							/>
							{
								hidden && (index === NUMBER_CHIPS - 1) &&
								(
									!isOpen
									?
									<Chip 
										color="primary"
										size={'small'} 
										label={`+${data.length - chips.length}`}
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

User.propTypes =
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
	ClearRefresh: () =>
	{
		dispatch(ActionCMS.ClearRefresh())
	},
	SetLoading: (msg) =>
	{
		dispatch(ActionCMS.SetLoading(msg))
	},
	ClearLoading: () =>
	{
		dispatch(ActionCMS.ClearLoading())
	},
	SetProps: (prop) =>
	{
		dispatch(ActionCMS.SetProps(prop))
	},
	UserAuthenticationDelete: (user_data) =>
	{
		dispatch(ActionCMS.UserAuthenticationDelete(user_data))
	},
	UserAuthenticationEdit: (user_data) =>
	{
		dispatch(ActionCMS.UserAuthenticationEdit(user_data))
	},
	ShowMessage: (msg) =>
    {
        dispatch(ActionCMS.ShowMessage(msg))
    },
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(User);

