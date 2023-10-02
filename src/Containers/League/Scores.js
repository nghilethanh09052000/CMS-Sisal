import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography, Button, TextField, Tooltip, IconButton } from '@material-ui/core'
import { WarningRounded } from '@material-ui/icons'
import TEXT from './Data/Text'
import Utils from '../../Utils'
import API from '../../Api/API'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import * as Icons from '../../Components/CmsIcons'
import CmsControlPermission from '../../Components/CmsControlPermission'
import CmsTable from '../../Components/CmsTable'
/* import CmsExcel from '../../Components/CmsExcel'
import CmsImport from '../../Components/CmsImport'
import { DEBUG_FIELD } from '../../Components/CmsImport/ExcelParser' */
import { JsonEditor } from '../../3rdParty/jsoneditor-react-master/src'
import ModalDialog from '../../Components/Dialogs/ModalDialog'

const styles = theme => ({
	buttonLeft: {
		marginLeft: 10,
	},
	inputTextField: {
		marginBottom: 15,
		marginRight: 15,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	searchBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(2),
		marginBottom: theme.spacing(3),
	},
	justifyEnd: {
        justifyContent: 'flex-end',
    },
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
const TABLE_HEIGHT = 650
const FULLTIME_FORMAT = 'MMM DD YYYY HH:mm'
const USER_DATA = { userId: '' }

class Scores extends React.Component
{
	constructor(props)
	{
		super(props)

		this.state = {
			dialogType: '',
            isDialogOpen: false,
			isImportOpen: false,
			isExportOpen: false,
			isMultiSelectMode: false,
			rowData: {},
			tableTab: 0,
			pageSize: PAGE_SIZE,
		}

		this.leaderboard_id = ''
		this.title = ''
		this.name = decodeURIComponent(props.match.params.name)
		this.tableRef = React.createRef()
		this.selectedRows = []
		this.actionsExtend = {
			createElement: (parentProps) =>
			{
				const { classes } = this.props

				/* const columns = this.getExcelColumns()
				const importColumns = this.getImportColumns()

				// Use "API" instead of Redux, as I don't want to refresh render
				// Use "bind" because of these functions will be pass as component property
				// to fixed: "this" keyword is undefined

				let apiUpdate
				apiUpdate = API.LeaderboardScoreEdit.bind(API) */

				this.refreshTitle = parentProps.refreshTitle

				return (
					<div className={clsx(classes.divColumn, classes.searchBar)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<Typography className={clsx(classes.title)}>{this.name}</Typography>
							<div className={clsx(classes.divRow)}>
								<CmsControlPermission
									control={
										<>
											<Button
												variant={'contained'}
												color={'primary'}
												onClick={()=>this.props.history.goBack()}
												className={classes.buttonLeft}
											>
												{TEXT.MODAL_BACK}
											</Button>
										</>
									}
									link={``}
									attribute=''
								/>
								{/* <CmsImport
									classes={{ button: clsx(classes.buttonLeft, classes.buttonRight) }}
									controlPermission={{
										link: '',
										attribute: ''
									}}
									fields={importColumns}
									apiUpdate={apiUpdate}
									normalizeData={this.getImportData}
									onProgress={this.handleImportDialog}
									disabledUpdate={false}
									disableDelete={true}
									disabledUpdateBeforeDelete={true}
									disabledUpdateAfterAdd={true}
								/>
								<CmsExcel
									multiSheetData={this.formatExcelData}
									columns={columns}
									controlPermission={{
										link: '',
										attribute: ''
									}}
									onProgress={this.handleExportDialog}
									fileNameExtend={`/${TEXT.LEADERBOARD_SCORE_FILE_NAME}`}
								/> */}
								<CmsControlPermission
									control={
										<>
											<Button
												variant={'contained'}
												color={'primary'}
												onClick={
													this.handleAction('leaderboard_score_recover')
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.RefreshIcon/>}
											>
												{TEXT.LEADERBOARD_BUTTON_RECOVER_DATA}
											</Button>
										</>
									}
									link={``}
									attribute=''
								/>
							</div>
						</div>
					</div>
				)
			}
		}
	}

	componentDidUpdate(prevProps, prevState)
	{
		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()
			_.includes(prevState.dialogType, 'leaderboard_score_') && this.tableRef.current && this.tableRef.current.onQueryChange(prevState.query, null)
		}
	}

	static getDerivedStateFromProps(props, state)
	{
        if (props.needRefresh)
		{
			return {
				isDialogOpen: false,
				isMultiSelectMode: false,
				dialogType: '',
				rowData: {},
			}
		}

        return null;
    }

	componentDidMount()
	{
		this.leaderboard_id = this.props.match.params.leaderboard_id;
		this.title = `${TEXT.LEADERBOARD_MANAGEMENT_SCORE_TITLE}`
		this.props.SetTitle(this.title)
		// this.props.LeaderboardScoreLoad(this.leaderboard_id)	
	}

	render()
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderLeaderboardScoreTable()}
				{this.renderDialog()}
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

	/* handleExportDialog = (isOpen) =>
	{
		this.setState({
			isExportOpen: isOpen
		})
	}

	formatExcelData = () =>
	{
		let result = []
		
		result = this.props.leaderboardScoreItems;

		if (this.tableRef.current)
		{
			if (this.tableRef.current.dataManager.searchText.length > 0)
			{
				result = this.tableRef.current.dataManager.searchedData
			}
			else
			{
				result = this.tableRef.current.dataManager.data
			}
		}
        
        result = _.map(result, value => {
            let {  userInfo , createdAt, modifiedAt, deletedAt, ...others} = value
			userInfo = JSON.stringify(userInfo)
            createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
			modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
			deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
            return {...others, userInfo,createdAt, modifiedAt, deletedAt}
        })
        
        console.log('formatExcelData:', result)
		return result
	}

	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.TABLE_HEADER_PROFILE_ID, field: 'profileId' },
			{ title: TEXT.TABLE_HEADER_LEADERBOARD_ID, field: 'leaderboardId' },
			{ title: TEXT.TABLE_HEADER_SCORE, field: 'score' },
			{ title: TEXT.TABLE_HEADER_RANK, field: 'rank' },
			{ title: TEXT.TABLE_HEADER_USER_INFO, field: 'userInfo' },
			{ title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt' },
			{ title: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt' },
			{ title: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy' },
			{ title: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy' },
			{ title: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt' },
		]

		return columns
	}

	getImportColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.TABLE_HEADER_SCORE, field: 'score' }
		]
		return columns
	}

    getImportData = (rowData, field, column) =>
	{
		let rawData = rowData[column]
		let data = rawData

		console.log('getImportData rawData', rawData, 'field', field, 'column', column)
		switch (field)
		{ 
			case 'id':
				data = rawData.trim()
				if (_.isEmpty(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}	
				break
			case 'score':    
				data = rawData
				if (isNaN(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break
			default:
				data = rawData
				break
		}

		return data
	}


	handleImportDialog = (isOpen, step) =>
	{
		this.setState({
			isImportOpen: isOpen
		})

		if (!isOpen && step === 4)
		{
			this.props.LeaderboardScoreLoad(this.props.match.params.leaderboard_id)
		}
	} */

	handleAction = (name, data) => (evt) =>
	{
		switch (name)
		{
			case 'close':
				this.setState({
					isDialogOpen: false,
					dialogType: '',
					rowData: {}
				})

				break
			case 'submit':
				this.state.dialogType === 'leaderboard_score_edit' && this.props.LeaderboardScoreEdit(this.state.rowData) ||
				this.state.dialogType === 'leaderboard_score_delete' && this.props.LeaderboardScoreDelete(this.state.rowData) ||
				this.state.dialogType === 'leaderboard_score_restore' && this.props.LeaderboardScoreRestore(this.state.rowData) ||
				this.state.dialogType === 'leaderboard_score_recover' && this.props.LeaderboardScoreRecover(this.leaderboard_id)
				break
			case 'leaderboard_score_edit':
			case 'leaderboard_score_delete':
			case 'leaderboard_score_restore':
			case 'leaderboard_score_recover':	
			case 'json_editor':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData:  data
				})
				break
			case 'pageSize':
				this.setState({
					pageSize: data
				})
				
				break			
			/* case 'column_filter':
				this.setState(
					{
						[`default_filter_${data.filterValue.columnField}`]: data.filterValue.filterText,
						query: data.query
					},
					() =>
					{
						let filterElement = document.querySelector(`[aria-label="filter data by ${data.filterValue.columnTitle}"]`)
						if (filterElement)
						{
							filterElement.focus()
						}
					}
				)

				break */	
            default:
                this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: data
					}
                })
		}		
	}


	renderLeaderboardScoreTable = () =>
	{
		const { classes } = this.props;
		return (
			<div className={clsx(classes.table, classes.divColumn)}>
				{this.actionsExtend.createElement(this.actionsExtend)}
				<CmsTable
					columns={[
						{
							title: TEXT.TABLE_HEADER_USER_ID, field: 'userId', width: 250,
							// defaultFilter: this.state[`default_filter_userId`] || '',
							render: rowData =>
							{
								return (
									<div style={{ width: 230, marginLeft: 10, wordWrap: 'break-word' }}>
										{rowData.userId}
									</div>
								)
							}	
						},
						{
							title: TEXT.TABLE_HEADER_SCORE, 
							filtering: false,
							field: 'score', 
							width: 101,
						},
						{
							title: TEXT.TABLE_HEADER_RANK, 
							filtering: false,
							field: 'rank',
							width: 101,
						},
						{
							title: TEXT.TABLE_HEADER_USER_INFO, field: 'userInfo', nofilter: true, sorting: false, width: 101,
							filtering: false,
							render: rowData =>
							{
								return (
									<CmsControlPermission
										control={
											<Tooltip 
												title={rowData.status === 'Ended' ? '' : TEXT.LEADERBOARD_TOOLTIP_VIEW_USER_INFO}
												classes={{
													tooltip: classes.toolTip,
												}}
												placement={'top'}
											>
												<IconButton
													onClick={(event) => {
														this.handleAction('json_editor', rowData)(event)
													}}
													disabled={rowData.status === 'Ended'}
												>
													<Icons.IconEyeShow />
												</IconButton>
											</Tooltip>
										}
										link={''}
										attribute={''}
									/>
								)
							}
						},
						{
							title: TEXT.TABLE_HEADER_DATE, 
							filtering: false,
							placeholder: TEXT.TABLE_HEADER_CREATED_DATE, 
							field: 'createdAt',
							width: 250,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'createdAt'),
						},
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							filtering: false,
							placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							field: 'modifiedAt', 
							hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'modifiedAt'),
						},
						{
							title: TEXT.TABLE_HEADER_OWNER, 
							filtering: false,
							placeholder: TEXT.TABLE_HEADER_CREATED_BY, 
							field: 'createdAt', 
							width: 350,
							render: rowData => this.renderOwnersColumn(rowData)
						},
						{
							title: TEXT.TABLE_HEADER_OWNER, 
							filtering: false,
							placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, 
							field: 'modifiedBy', 
							hidden: true,
						},
						{
							title: TEXT.TABLE_HEADER_DELETED_AT, 
							filtering: false,
							field: 'deletedAt', 
							width: 150,
							render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'deletedAt'),
						},
					]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('leaderboard_score_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.isHidden) ? '' : TEXT.LEADERBOARD_TOOLTIP_EDIT_SCORE),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.isHidden),
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
								this.handleAction('leaderboard_score_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.isHidden) ? '' : TEXT.LEADERBOARD_TOOLTIP_HIDE_USER),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.isHidden),
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
								this.handleAction('leaderboard_score_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0 || !rowData.isHidden) ? '' : TEXT.LEADERBOARD_TOOLTIP_UNHIDE_USER),
							disabled: (rowData) => (this.state.isMultiSelectMode || !rowData.isHidden),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
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
							leaderboard_id: this.leaderboard_id, 
							page: page + 1, 
							pageSize
						}

						return new Promise((resolve) =>
						{
							this.props.SetLoading('')
							API.LeaderboardScoreLoad(user_data)
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

					/* onFilterChange={(query) =>
					{
						let filterValue = _.reduce(query.filters, (value, element) =>
						{
							if (element.editing)
							{
								let tableData = element.column.tableData
								value.filterText = element.value
								value.index = tableData.id
								value.columnTitle = element.column.title
								value.columnField = element.column.field
							}
							return value
						}, { filterText: '', index: -1, columnTitle: '', columnField: '' })
						
						if (filterValue.filterText === this.tableRef.current.dataManager.columns[filterValue.index].tableData.filterValue)
						{
							this.handleAction('column_filter', { filterValue, query })(null)
						}
					}} */

					onRowsPerPageChange={(pageSize) =>
					{
						this.handleAction('pageSize', pageSize)(null)
					}}

					options={{
						actionsColumnIndex: -1,
						fixedColumns: {
							left: 1,
							right: -100
						},
						tableStickyHeader: false,
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

					// onSelectionChange={(selectedRows, dataClicked) =>
					// {
					// 	this.selectedRows = selectedRows
					// 	const isMultiSelectMode = selectedRows.length > 1
					// 	isMultiSelectMode !== this.state.isMultiSelectMode && this.setState({ isMultiSelectMode })
					// }}

					ignoredRender={this.state.isDialogOpen || this.state.isImportOpen || this.state.isExportOpen}
					tableRef={this.tableRef}
					// actionsExtend={this.actionsExtend}
				/>
			</div>	
		)
	}

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
                    this.state.dialogType === 'leaderboard_score_edit' && TEXT.LEADERBOARD_TOOLTIP_EDIT_SCORE ||
					this.state.dialogType === 'leaderboard_score_recover' && TEXT.LEADERBOARD_BUTTON_RECOVER_DATA ||
					this.state.dialogType === 'leaderboard_score_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'leaderboard_score_restore' && TEXT.REMIND_TITLE ||

					this.state.dialogType === 'json_editor' && TEXT.TABLE_HEADER_USER_INFO ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={this.state.dialogType === 'json_editor' ? null : TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction(this.state.dialogType === 'json_editor' ? 'close' : 'submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={ (_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore') || this.state.dialogType === 'leaderboard_score_recover' || this.state.dialogType === 'json_editor') ? false : isNaN(+this.state.rowData.score) }
			>
			
			{
				(this.state.dialogType === 'leaderboard_score_edit') && this.renderEditScores() ||
				(this.state.dialogType === 'leaderboard_score_recover') && this.renderRecoverScores() ||
				(this.state.dialogType === 'leaderboard_score_delete' || this.state.dialogType === 'leaderboard_score_restore') && this.renderDeleteRestoreUser() ||
				(this.state.dialogType === 'json_editor') && this.renderUserInfo()
			}
			</ModalDialog>
		)
	}
	
	renderEditScores = () =>
	{
		const { classes } = this.props;

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.TABLE_HEADER_SCORE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={+this.state.rowData.score}
						margin="normal"
						type={"number"}
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('score', evt.target.value)(evt) }}
					/>
					
				</div>
			</div>
		)
	}	

	renderRecoverScores = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						TEXT.LEADERBOARD_MESSAGE_RECOVER_DATA
					}
					</Typography>
				</div>
			</div>
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
						this.state.dialogType === 'leaderboard_score_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.LEADERBOARD_MESSAGE_DELETE_USERS, this.state.rowData.length) : TEXT.LEADERBOARD_MESSAGE_DELETE_USER) ||
						this.state.dialogType === 'leaderboard_score_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.LEADERBOARD_MESSAGE_RESTORE_USERS, this.state.rowData.length) : TEXT.LEADERBOARD_MESSAGE_RESTORE_USER) ||
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
									{`${data.userId}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.userId}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}
	
	renderUserInfo = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				<JsonEditor
					key={'text'}
					value={this.state.rowData.userInfo}
					mode={'text'}
				/>
			</div>
		)
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

Scores.propTypes =
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
	ClearProps: (keys) =>
	{
		dispatch(ActionCMS.ClearProps(keys))
	},
	LeaderboardScoreLoad: (leaderboard_id) =>
	{
		dispatch(ActionCMS.LeaderboardScoreLoad(leaderboard_id))
	},
	LeaderboardScoreEdit: (leaderboard_score_data) =>
	{
		dispatch(ActionCMS.LeaderboardScoreEdit(leaderboard_score_data))
	},
	LeaderboardScoreDelete: (leaderboard_score_data) =>
	{
		dispatch(ActionCMS.LeaderboardScoreDelete(leaderboard_score_data))
	},
	LeaderboardScoreRestore: (leaderboard_score_data) =>
	{
		dispatch(ActionCMS.LeaderboardScoreRestore(leaderboard_score_data))
	},
	LeaderboardScoreRecover: (leaderboard_score_data) =>
	{
		dispatch(ActionCMS.LeaderboardScoreRecover(leaderboard_score_data))
	},
})

export default compose(
	connect(mapStateToProps, mapDispatchToProps),
	withMultipleStyles(customStyle, styles),
	withRouter
)(Scores);

