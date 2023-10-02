import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import copy from "copy-to-clipboard"

import { Typography, Tabs, Tab, Button, TextField, Tooltip, IconButton, Icon } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { WarningRounded } from '@material-ui/icons'

import Utils from '../../Utils'
import TEXT from './Data/Text'
import API from '../../Api/API'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import { JsonEditor } from '../../3rdParty/jsoneditor-react-master/src'
import * as Icons from '../../Components/CmsIcons'
import CmsControlPermission from '../../Components/CmsControlPermission'
import CmsTable from '../../Components/CmsTable'
import CmsExcel from '../../Components/CmsExcel'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsImport from '../../Components/CmsImport'
import { DEBUG_FIELD } from '../../Components/CmsImport/ExcelParser'
import CmsTabPanel from '../../Components/CmsTabPanel'
import CmsSearch from '../../Components/CmsSearch'
import CmsDate from '../../Components/CmsDate'

const styles = theme => ({
	table: {
        flexGrow: 0,
        flexShrink: 0,
        marginTop: 0,
    },
	generalTitle: {
        marginBottom: '1rem',
    },
	jsonEditorTitle: {
        marginTop: theme.spacing(3),
    },
	inputText: {
		marginTop: 0,
	},
	divMaxHeight: {
		maxHeight: '20vh',
		overflowY: 'auto'
	},
	searchBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(2),
		marginBottom: theme.spacing(3)
	},
	cmsDate: {
		marginRight: theme.spacing(1),
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
const PAGE_SIZE_1 = 5
const TABLE_HEIGHT_1 = 500
const FULLTIME_FORMAT = 'MMM DD YYYY HH:mm'

class Cron extends React.Component
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
			errorJsonEditor: false,
			isJsonEditorMode: false,
			viewJsonMode: 'text',
			rowData: {},
			tableTab: 0,
			searchText: '',
		}

		this.tableRef = React.createRef()
		this.selectedRows = []
		this.actionsExtend = {
			createElement: (parentProps) =>
			{
				const { classes } = this.props

				const columns = this.getExcelColumns()
				const importColumns = this.getImportColumns()

				// Use "API" instead of Redux, as I don't want to refresh render
				// Use "bind" because of these functions will be pass as component property
				// to fixed: "this" keyword is undefined

				const apiAdd = API.CronAdd.bind(API)
				const apiUpdate = API.CronEdit.bind(API)
				const apiDelete = API.CronDelete.bind(API)

				return (
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<div className={clsx(classes.divRow)}>
								<CmsImport
									classes={{ button: clsx(classes.buttonLeft, classes.buttonRight) }}
									controlPermission={{
										link: '',
										attribute: ''
									}}
									fields={importColumns}
									apiAdd={apiAdd}
									apiUpdate={apiUpdate}
									apiDelete={apiDelete}
									normalizeData={this.getImportData}
									onProgress={this.handleImportDialog}
									disabledUpdate={false}
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
								/>
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
													onClick={this.handleAction('cron_restore')}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
													{ TEXT.CRON_BUTTON_RESTORE_CRON }
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
													onClick={this.handleAction('cron_delete')}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
													{ TEXT.CRON_BUTTON_DELETE_CRON }
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
												onClick={this.handleAction('cron_add', {name: '', method: '', status: '', api: '', payload: {}, cronTime: '', retryAttempt: '', farmHandler: ''})}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
												{ TEXT.CRON_BUTTON_NEW_CRON }
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

	static getDerivedStateFromProps(props, state)
	{
        if (props.needRefresh)
		{
			props.ClearRefresh()
			props.CronsLoad()
		
			return {
				isDialogOpen: false,
				isMultiSelectMode: false,
				dialogType: '',
				rowData: state.isJsonEditorMode ? state.rowData : {},
			}
		}

        return null; // No change to state
    }

    componentDidMount()
	{
		this.props.SetTitle(TEXT.CRON_MANAGEMENT_TITLE)
		this.props.CronsLoad()
	}

	componentWillUnmount() 
	{
		
	}

	componentDidUpdate(prevProps, prevState)
	{
		
	}

    render()
    {
        const { classes } = this.props

		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.state.isJsonEditorMode ? this.renderJsonEditor() : this.renderTableTabs()}
				{this.renderDialog()}
			</div>
		)
    }

	handleExportDialog = (isOpen) =>
	{
		this.setState({
			isExportOpen: isOpen
		})
	}

	formatExcelData = () =>
	{
		let result = this.props.crons
		
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
        
		// Just export cron service
        result = _.reduce(result, (result, value) => {
			let { createdAt, modifiedAt, deletedAt, payload, service, ...others} = value
			if (service === 'cron')
			{
				payload = JSON.stringify(payload)
				createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
				modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
				deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
				return [...result, {...others, service, payload, createdAt, modifiedAt, deletedAt}]
			}

			return result
        }, [])
        
        // console.log('formatExcelData:', result)
		return result
	}

	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.CRON_TABLE_HEADER_NAME, field: 'name'},
			{ title: TEXT.CRON_TABLE_HEADER_API, field: 'api' },
			{ title: TEXT.CRON_TABLE_HEADER_METHOD, field: 'method' },
			{ title: TEXT.CRON_TABLE_HEADER_SERVICE, field: 'service'},
			{ title: TEXT.CRON_TABLE_HEADER_CRON_TIME, field: 'cronTime'},
			{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.CRON_TABLE_HEADER_PAYLOAD, field: 'payload' },
			{ title: TEXT.CRON_TABLE_HEADER_RETRY_ATTEMPT, field: 'retryAttempt' },
			{ title: TEXT.CRON_TABLE_HEADER_FARM_HANDLER, field: 'farmHandler' },
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
			{ title: TEXT.CRON_TABLE_HEADER_NAME, field: 'name' },
			{ title: TEXT.CRON_TABLE_HEADER_API, field: 'api' },
			{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.CRON_TABLE_HEADER_PAYLOAD, field: 'payload' },
			{ title: TEXT.CRON_TABLE_HEADER_CRON_TIME, field: 'cronTime'},
			{ title: TEXT.CRON_TABLE_HEADER_METHOD, field: 'method' },
			{ title: TEXT.CRON_TABLE_HEADER_RETRY_ATTEMPT, field: 'retryAttempt' },
			{ title: TEXT.CRON_TABLE_HEADER_FARM_HANDLER, field: 'farmHandler' },
		]

		return columns
	}

    getImportData = (rowData, field, column) =>
	{
		let rawData = rowData[column]
		let data = rawData

		// console.log('getImportData rawData', rawData, 'field', field, 'column', column)

		switch (field)
		{ 
			case 'name':
			case 'api':		    
				data = rawData.trim()
				if (_.isEmpty(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				
				break
			case 'cronTime':    
				data = rawData.trim()
				if (_.isEmpty(data) || !(new RegExp(this.props.TIME_REGEX).test(data)))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break	
            case 'status':    
                data = rawData.trim()
				if (_.isEmpty(data) || !_.includes(this.props.STATUSES, data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break
			case 'method':    
				data = rawData.trim()
				if (_.isEmpty(data) || !_.includes(this.props.METHODS, data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break	
			case 'payload':    
				try
				{
					data = JSON.parse(rawData.trim())
				}
				catch(e)
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break	
			case 'farmHandler':    
				data = rawData.trim()
				if (_.isEmpty(data) || !_.includes(this.props.FARM_HANDLERS, data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break
			case 'retryAttempt':    
				data = rawData
				if (isNaN(data) || parseInt(data) > 5 || parseInt(data) < 0)
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
			this.props.CronsLoad()
		}
	}

	handleAction = (name, data) => (evt) =>
	{
		switch (name)
		{
			case 'close':
				this.setState({
					isJsonEditorMode: false,
					viewJsonMode: 'text',
					isDialogOpen: false,
					dialogType: '',
					rowData: this.state.dialogType === 'warrning_cronId' ? this.state.rowData : {}
				})

				break
			case 'submit':
				if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						this.state.dialogType === 'cron_delete' && this.props.CronDelete(row) ||
						this.state.dialogType === 'cron_restore' && this.props.CronRestore(row)
					})
				}
				else
				{
					this.state.dialogType === 'cron_add' && this.props.CronAdd(this.state.rowData) ||
					this.state.dialogType === 'cron_edit' && this.props.CronEdit(this.state.rowData) ||
					this.state.dialogType === 'cron_delete' && this.props.CronDelete(this.state.rowData) ||
					this.state.dialogType === 'cron_restore' && this.props.CronRestore(this.state.rowData) ||
					this.state.dialogType === 'cron_trigger' && this.props.CronTrigger(this.state.rowData) ||
					this.state.isJsonEditorMode && this.props.CronEdit(this.state.rowData) ||

					this.state.tableTab === 1 && data === '' && this.handleAction('warrning_cronId', this.state.rowData)(null) ||
					this.state.tableTab === 1 && data !== '' && this.props.CronHistoriesLoad({...this.state.rowData.search_date, cronId: data})
				}

				break
			case 'tableTab':
				(data !== this.state.tableTab) && this.setState(
					{
						tableTab: data,
						isMultiSelectMode: false,
						searchText: ''
					},
					() =>
					{
						if (this.state.tableTab === 0)
						{
							this.props.CronsLoad()
						}

						this.props.ClearProps(['cronHistories'])
					}
				)

				break	
			case 'json_editor':
				this.setState({
					isJsonEditorMode: true,
					rowData: data
				})
				
				break	
			case 'cron_add':
			case 'cron_edit':
			case 'cron_delete':
			case 'cron_restore':
			case 'warrning_cronId':	
			case 'cron_trigger':		
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})

				break
			case 'viewJsonMode':	
				this.setState({
					errorJsonEditor: false,
					viewJsonMode: data,
				})

				break
			case 'payload':
				this.setState({
					errorJsonEditor: false,
					rowData: {
						...this.state.rowData, 
						[name]: data
					}
				})

				break
			case 'copy_clipboard':
				copy(data)
				this.props.ShowMessage(TEXT.MESSAGE_COPY_TO_CLIPBOARD)

				break	
			case 'retryAttempt':
				this.setState({
					rowData: {
						...this.state.rowData, 
						[name]: (data === '' ? 0 : (isNaN(data) ? this.state.rowData[name] : (parseInt(data) > 5 ? 0 : parseInt(data))))
					}
				})	

				break
            default:
                this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: _.includes(['defaultQuantity', 'quantity'], name) ? (data === '' ? 0 : (isNaN(data) ? this.state.rowData[name] : parseInt(data))) : data
					}
                })
		}		
	}

	validateSubmit = (submit_data) =>
	{
		if (this.state.dialogType === 'warrning_cronId') return false
		const { method, status, api } = submit_data
		let result = _.some(Object.keys({ method, status, api }), key => {
			return _.isEmpty(submit_data[key])
		})

		if (!result && this.state.dialogType === 'cron_edit' && submit_data.service === 'cron')
		{
			result = _.isEmpty(submit_data.farmHandler)
		}

		if (!result && this.state.dialogType === 'cron_add')
		{
			result = _.isEmpty(submit_data.farmHandler) || _.isEmpty(submit_data.name) || !(new RegExp(this.props.TIME_REGEX).test(submit_data.cronTime))
		}

		// console.log('validateSubmit', submit_data, result)
		return result
	}

	renderTableTabs = () =>
	{
		const { classes } = this.props
		return (
			<>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
					<Tabs
						value={this.state.tableTab}
						variant="scrollable"
						scrollButtons="on"
						indicatorColor="primary"
						onChange={(evt, index) => {
							this.handleAction('tableTab', index)(evt)
						}}
						classes={{
							root: clsx({[classes.tabs]: this.state.isMultiSelectMode}),
						}}
					>
						<Tab label={TEXT.CRON_CRON_TITLE} />
						<Tab label={TEXT.CRON_HISTORY_TITLE}/>
					</Tabs>
					{
						this.state.tableTab === 0 && this.actionsExtend.createElement(this.actionsExtend)
					}
				</div>
				<CmsTabPanel value={this.state.tableTab} index={0} >
				{
					this.renderCronsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={1} >
				{
					this.renderCronsHistoriesTable()
				}
				</CmsTabPanel>
			</>	
		)	
	}

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
                    this.state.dialogType === 'cron_add' && TEXT.CRON_BUTTON_NEW_CRON ||
                    this.state.dialogType === 'cron_edit' && TEXT.CRON_BUTTON_EDIT_CRON ||
                    this.state.dialogType === 'cron_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'cron_restore' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'warrning_cronId' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'cron_trigger' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={this.state.dialogType === 'warrning_cronId' ? null : TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction(this.state.dialogType === 'warrning_cronId' ? 'close' : 'submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'cron_delete' || this.state.dialogType === 'cron_restore') && this.renderDeleteRestoreCron()
			}
			{
				(this.state.dialogType === 'cron_add' || this.state.dialogType === 'cron_edit') && this.renderAddEditCron()
			}
			{
				(this.state.dialogType === 'warrning_cronId' || this.state.dialogType === 'cron_trigger') && this.renderWarning()
			}
			</ModalDialog>
		)
	}

	renderSearchBar = () =>
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.divColumn, classes.searchBar)}>
				<div className={clsx(classes.divRow, classes.divHeight, classes.alignCenter)}>
					<div className={clsx(classes.divColumn, classes.divHeight, classes.cmsDate)}>
						<CmsDate
							views={['date', 'hours', 'minutes']}
							enableFullTimeFormat={true}
							disableFuture={true} 
							raiseSubmitOnMounted={true}
							disableToolbar={false} 
							dateRange={-30}
							onDateSubmit={(data) => {
								this.handleAction('search_date', data)(null)
							}}
						/>
					</div>
					<div className={clsx(classes.divColumn, classes.divFullWidth)}>
						<CmsSearch
							searchText={this.state.searchText}
							key={'cronId'}
							onSearchClick={(searchText) => {
								this.handleAction('submit', searchText)(null)
							}}
							textFieldPlaceholder={TEXT.CRON_TABLE_HEADER_ID}
						/>
					</div>
				</div>
			</div>	
		)	
	}

	renderCronsHistoriesTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderSearchBar()}
                <CmsTable
                    columns={[
						{
                            title: TEXT.CRON_TABLE_HEADER_ID, field: 'cronId', width: 150,
							
                        },
						{
                            title: TEXT.CRON_TABLE_HEADER_DATE, field: 'date', width: 150,
							
                        },
						{
                            title: TEXT.CRON_TABLE_HEADER_RESULT, field: 'result', width: 150,
							
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

                    data={this.props.cronHistories || []}

                    options={{
						actionsColumnIndex: -1,
						fixedColumns: {
							left: 1,
							right: 0
						},
						tableStickyHeader: false,
                        showTitle: false,
                        search: true,
                        filtering: false,
						sorting: true,
                        pageSize: PAGE_SIZE_1,
						tableMaxHeight: TABLE_HEIGHT_1,
                        selection: true,
						cellStyle: { ...defaultCellStyle, textAlign: 'center' },
						headerStyle: { ...defaultHeaderStyle, textAlign: 'center', borderTop: `1px ${defaultBorderColor} solid` },
                    }}

					ignoredRender={this.state.isExportOpen}

					tableRef={this.tableRef}
                />
            </div>		
		)
	}

	renderWarning = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'warrning_cronId' && TEXT.CRON_MESSAGE_CRON_ID_UNVALID ||
						this.state.dialogType === 'cron_trigger' && TEXT.CRON_MESSAGE_TRIGGER_CRON || ''
					}
					</Typography>
				</div>
			</div>
		)
	}

	renderDeleteRestoreCron = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'cron_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.CRON_MESSAGE_DELETE_CRONS, this.state.rowData.length) : TEXT.CRON_MESSAGE_DELETE_CRON) ||
						this.state.dialogType === 'cron_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.CRON_MESSAGE_RESTORE_CRONS, this.state.rowData.length) : TEXT.CRON_MESSAGE_RESTORE_CRON) ||
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
									{`${data.name} - ${data.status}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.status}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderAddEditCron = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CRON_TABLE_HEADER_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'cron_edit'}
					/>
				</div>
				{
					this.state.dialogType === 'cron_edit' &&
					<div className={clsx(classes.divColumn)}>
						<Typography>{TEXT.CRON_TABLE_HEADER_SERVICE}</Typography>
						<TextField
							className={clsx(classes.inputTextField, classes.inputText)}
							value={this.state.rowData.service}
							margin="normal"
							fullWidth
							variant={'outlined'}
							disabled={true}
						/>
					</div>
				}
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CRON_TABLE_HEADER_API}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.api}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('api', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'cron_edit' && this.state.rowData.service !== 'cron'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CRON_TABLE_HEADER_METHOD}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.method}
						options={this.props.METHODS}
						onChange={(evt, value) => {
							this.handleAction('method', value)(evt)
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
						disabled={this.state.dialogType === 'cron_edit' && this.state.rowData.service !== 'cron'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.TABLE_HEADER_STATUS}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.status}
						options={this.props.STATUSES}
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
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CRON_TABLE_HEADER_CRON_TIME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.cronTime}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('cronTime', evt.target.value)(evt) }}
						helperText={TEXT.CRON_TOOLTIP_CRON_TIME}
						error={!(new RegExp(this.props.TIME_REGEX).test(this.state.rowData.cronTime))}
						disabled={this.state.dialogType === 'cron_edit' && this.state.rowData.service !== 'cron'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CRON_TABLE_HEADER_FARM_HANDLER}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.farmHandler}
						options={this.props.FARM_HANDLERS}
						onChange={(evt, value) => {
							this.handleAction('farmHandler', value)(evt)
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
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CRON_TABLE_HEADER_RETRY_ATTEMPT}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.retryAttempt || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('retryAttempt', evt.target.value)(evt) }}
						helperText={TEXT.CRON_TOOLTIP_RETRY_ATTEMPT}
					/>
				</div>
			</div>
		)
	}	

	renderGeneralTableTitle = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter, classes.generalTitle)}>
					<Typography className={clsx(classes.title)}>{TEXT.CRON_GENERAL_TITLE}</Typography>
					<div className={clsx(classes.divRow)}>
						<Button
							variant={'contained'}
							color={'primary'}
							onClick={this.handleAction('close')}
							className={clsx(classes.buttonLeft)}
						>
							{ TEXT.MODAL_BACK }
						</Button>
					</div>
				</div>
			</div>
		)
	}

	renderGeneralTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderGeneralTableTitle()}
                <CmsTable
                    columns={[
                        {
                            title: TEXT.CRON_TABLE_HEADER_NAME, field: 'name', width: 150,
                        },
						{
                            title: TEXT.CRON_TABLE_HEADER_API, field: 'api', width: 350,
							render: rowData =>
                            {
								return (
									<div style={{ marginLeft: 10, marginRight: 10, wordWrap: 'break-word' }}>
										{rowData.api}
									</div>
								)
							}	
                        },
						{
                            title: TEXT.CRON_TABLE_HEADER_METHOD, field: 'method', width: 101,
							
                        },
						{
                            title: TEXT.CRON_TABLE_HEADER_SERVICE, field: 'service', width: 101,
                        },
						{
                            title: TEXT.CRON_TABLE_HEADER_CRON_TIME, field: 'cronTime', width: 101,
                        },
						{
                            title: TEXT.CRON_TABLE_HEADER_RETRY_ATTEMPT, field: 'retryAttempt', width: 101,
                        },
						{
                            title: TEXT.CRON_TABLE_HEADER_FARM_HANDLER, field: 'farmHandler', width: 101,
                        },
						{
                            title: TEXT.TABLE_HEADER_STATUS, field: 'status', width: 101,
                        },
                    ]}

                    data={[this.state.rowData] || []}

                    options={{
                        showTitle: false,
                        search: false,
                        filtering: false,
						sorting: false,
                        selection: false,
						paging: false,
						cellStyle: { ...defaultCellStyle, textAlign: 'center', height: 40 },
						headerStyle: { ...defaultHeaderStyle, textAlign: 'center', height: 40, borderTop: `1px ${defaultBorderColor} solid` },
                    }}

					ignoredRender={this.state.isDialogOpen || this.state.isImportOpen || this.state.isExportOpen}

					tableRef={this.tableRef}
                />
            </div>		
		)
	}

	renderJsonEditorTitle = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter, classes.jsonEditorTitle)}>
					<Typography className={clsx(classes.title)}>{TEXT.CRON_TABLE_HEADER_PAYLOAD}</Typography>
					<div className={clsx(classes.divRow)} >
						<Autocomplete
							fullWidth
							autoComplete
							autoSelect
							filterSelectedOptions
							value={this.state.viewJsonMode}
							options={['text', 'tree']}
							getOptionLabel={option => option === 'tree' ? TEXT.OBJECT_MODE_TITLE : TEXT.PLAIN_MODE_TITLE}
							onChange={(evt, value) => {
								this.handleAction('viewJsonMode', value)(evt)
							}}
							disableClearable={true}
							renderInput={(params) => (
								<TextField {...params}
									variant="outlined"
									label={TEXT.VIEW_MODE_TITLE}
								/>
							)}
							classes={{
								root: classes.autoComplete,
								input: classes.autoCompleteInput,
								inputRoot: classes.autoCompleteInputRoot
							}}
						/>
						<CmsControlPermission
							control={
								<Button
									variant={'contained'}
									color={'primary'}
									onClick={this.handleAction('submit')}
									className={clsx(classes.buttonLeft)}
									disabled={this.state.errorJsonEditor}
								>
									{ TEXT.MODAL_SAVE }
								</Button>
							}
							link={''}
							attribute={''}
						/>
					</div>
				</div>
			</div>
		)
	}

	renderJsonEditor = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderGeneralTable()}
				{this.renderJsonEditorTitle()}
				<JsonEditor
					key={this.state.viewJsonMode}
					value={this.state.rowData.payload}
					onChange={(value) => this.handleAction('payload', value)(null)}
					onError={(errorJsonEditor) =>
					{
						errorJsonEditor = errorJsonEditor !== null
						this.setState({errorJsonEditor})
					}}
					mode={this.state.viewJsonMode}
				/>
			</div>
		)
	}

	renderCronsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.CRON_TABLE_HEADER_NAME, field: 'name', width: 150,
							
                        },
						{
                            title: TEXT.CRON_TABLE_HEADER_API, field: 'api', width: 500,
							render: rowData =>
                            {
								return (
									<div style={{ marginLeft: 10, marginRight: 10, wordWrap: 'break-word' }}>
										{rowData.api}
									</div>
								)
							}	
                        },
						{
                            title: TEXT.CRON_TABLE_HEADER_METHOD, field: 'method', width: 150,
							
                        },
						{
                            title: TEXT.CRON_TABLE_HEADER_SERVICE, field: 'service', width: 150,
                        },
						{
                            title: TEXT.CRON_TABLE_HEADER_CRON_TIME, field: 'cronTime', width: 150,
                        },
						{
                            title: TEXT.CRON_TABLE_HEADER_RETRY_ATTEMPT, field: 'retryAttempt', width: 150,
                        },
						{
                            title: TEXT.CRON_TABLE_HEADER_FARM_HANDLER, field: 'farmHandler', width: 150,
                        },
						{
                            title: () => (
                                <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
                                    <span>{TEXT.TABLE_HEADER_STATUS}</span>
                                    <Tooltip 
                                        title={TEXT.CRON_TOOLTIP_STATUS}
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
                            title: TEXT.CRON_TABLE_HEADER_PAYLOAD, field: 'payload', nofilter: true, sorting: false, width: 101,
							render: rowData =>
                            {
								return (
									<CmsControlPermission
										control={
											<Tooltip 
												title={
													TEXT.CRON_TOOLTIP_EDIT_PAYLOAD.split('&').map((line, index) =>
													{
														return (
															<div key={index}>{line}</div>
														)
													})
												}
												classes={{
													tooltip: classes.toolTip,
												}}
												placement={'top'}
											>
												<IconButton
													onClick={(event) => {
														this.handleAction('json_editor', rowData)(event)
													}}
												>
													<Icons.IconEdit />
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
							icon: (props) => <Icons.IconCopy {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('copy_clipboard', rowData.id)(event)
							},
							tooltip: TEXT.CRON_TOOLTIP_COPY_TO_CLIPBOARD,
							disabled: false,
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
								this.handleAction('cron_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0 || (rowData.service !== 'cron' && rowData.status === this.props.STATUSES[1])) ? '' : TEXT.CRON_TOOLTIP_EDIT_CRON),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0 || (rowData.service !== 'cron' && rowData.status === this.props.STATUSES[1])),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
						{
							icon: (props) => <Icons.UpgradeIcon {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('cron_trigger', rowData)(event)
							},
							tooltip: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0 || rowData.service !== 'cron' || rowData.status === this.props.STATUSES[1] ? '' : TEXT.CRON_TOOLTIP_TRIGGER_CRON),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0 || rowData.service !== 'cron' || rowData.status === this.props.STATUSES[1]),
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
								this.handleAction('cron_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0 || rowData.status === this.props.STATUSES[0]) ? '' : TEXT.CRON_TOOLTIP_DELETE_CRON),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0 || rowData.status === this.props.STATUSES[0]),
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
								this.handleAction('cron_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.CRON_TOOLTIP_RESTORE_CRON),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.crons || []}

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

					ignoredRender={this.state.isDialogOpen || this.state.isImportOpen || this.state.isExportOpen}

					tableRef={this.tableRef}
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

Cron.propTypes =
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
	ClearProps: (keys) =>
	{
		dispatch(ActionCMS.ClearProps(keys))
	},
	CronsLoad: () =>
	{
		dispatch(ActionCMS.CronsLoad())
	},
	CronAdd: (cron_data) =>
	{
		dispatch(ActionCMS.CronAdd(cron_data))
	},
	CronEdit: (cron_data) =>
	{
		dispatch(ActionCMS.CronEdit(cron_data))
	},
	CronDelete: (cron_data) =>
	{
		dispatch(ActionCMS.CronDelete(cron_data))
	},
	CronRestore: (cron_data) =>
	{
		dispatch(ActionCMS.CronRestore(cron_data))
	},
	CronTrigger: (cron_data) =>
	{
		dispatch(ActionCMS.CronTrigger(cron_data))
	},
	CronHistoriesLoad: (cron_data) =>
	{
		dispatch(ActionCMS.CronHistoriesLoad(cron_data))
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
)(Cron);

