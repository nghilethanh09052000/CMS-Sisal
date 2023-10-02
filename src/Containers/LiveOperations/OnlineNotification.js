import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import copy from "copy-to-clipboard"

import { Typography, Tabs, Tab, Button, TextField, Tooltip, IconButton, Icon, FormControlLabel, Checkbox } from '@material-ui/core'
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
import CmsDate from '../../Components/CmsDate'
import CmsInputFile from '../../Components/CmsInputFile'

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
		paddingBottom: theme.spacing(5),
		marginBottom: theme.spacing(3)
	},
	marginRight: {
		marginRight: 10,
	},
	marginTop: {
		marginTop: 10,
	},
	cmsDate: {
        marginBottom: theme.spacing(1)
    },
	selection: {
		marginBottom: '0 !important',
		marginRight: 10,
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
const FULLTIME_FORMAT = 'MMM DD YYYY HH:mm'
const NOTIFICATION_DATA = { type: '', template: '', schedule: '', createdBy: '' }

class OnlineNotification extends React.Component
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
				let apiAdd,apiUpdate, apiDelete
				if (this.state.tableTab === 0)
				{
					apiAdd = API.NotificationAdd.bind(API)
				}
				else if (this.state.tableTab === 1)
				{
					apiAdd = API.NotificationScheduleAdd.bind(API)
					apiUpdate = API.NotificationScheduleEdit.bind(API)
					apiDelete = API.NotificationScheduleDelete.bind(API)
				}
				else if (this.state.tableTab === 2)
				{
					apiAdd = API.NotificationTemplateAdd.bind(API)
					apiUpdate = API.NotificationTemplateEdit.bind(API)
					apiDelete = API.NotificationTemplateDelete.bind(API)
				}
			
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
									disabledUpdate={this.state.tableTab === 0}
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
									fileNameExtend={
										this.state.tableTab === 0 && `/${TEXT.NOTIFICATION_TITLE}` ||
										this.state.tableTab === 1 && `/${TEXT.NOTIFICATION_TABLE_HEADER_SCHEDULE}` ||
										this.state.tableTab === 2 && `/${TEXT.NOTIFICATION_TABLE_HEADER_TEMPLATE}` || ''
									}
								/>
								{
									this.state.isMultiSelectMode
									?
									<>
									{
										this.state.tableTab !== 0 && _.filter(this.selectedRows, data => (data.deletedAt > 0)).length > 0 &&
										<CmsControlPermission
											control={
												<Button
													variant={'contained'}
													color={'primary'}
													onClick={
														this.state.tableTab === 1 && this.handleAction('schedule_restore') ||
														this.state.tableTab === 1 && this.handleAction('template_restore')
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
												{
												 	this.state.tableTab === 1 && TEXT.NOTIFICATION_BUTTON_RESTORE_SCHEDULE ||
													this.state.tableTab === 2 && TEXT.NOTIFICATION_BUTTON_RESTORE_TEMPLATE
												}
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
													onClick={
														this.state.tableTab === 0 && this.handleAction('notification_delete') ||
														this.state.tableTab === 1 && this.handleAction('schedule_delete') ||
														this.state.tableTab === 2 && this.handleAction('template_delete')
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
												{ 
													this.state.tableTab === 0 && TEXT.NOTIFICATION_BUTTON_DELETE_NOTIFICATION ||
													this.state.tableTab === 1 && TEXT.NOTIFICATION_BUTTON_DELETE_SCHEDULE ||
													this.state.tableTab === 2 && TEXT.NOTIFICATION_BUTTON_DELETE_TEMPLATE
												}
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
												onClick={
													this.state.tableTab === 0 && this.handleAction('notification_add', { template: '', schedule: '', type: '', startDate: null, dayGap: 0, keepReminding: false }) ||
													this.state.tableTab === 1 && this.handleAction('schedule_add', { name: '', type: 'Instant', status: '', gapCount: 0, selection: '', serverBased: false }) ||
													this.state.tableTab === 2 && this.handleAction('template_add', { name: '', type: '', status: '', title: '', message: '', mediaURL: '', expiry: 0, ios: false, android: false, userIds: [], attributes: [], fromExcel: false, file: null })
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
											{ 
												this.state.tableTab === 0 && TEXT.NOTIFICATION_BUTTON_NEW_NOTIFICATION ||
												this.state.tableTab === 1 && TEXT.NOTIFICATION_BUTTON_NEW_SCHEDULE ||
												this.state.tableTab === 2 && TEXT.NOTIFICATION_BUTTON_NEW_TEMPLATE
											}
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
			return {
				isDialogOpen: false,
				isMultiSelectMode: false,
				dialogType: '',
				rowData: {},
			}
		}

        return null; // No change to state
    }

    componentDidMount()
	{
		this.props.SetTitle(TEXT.NOTIFICATION_ONLINE_TITLE)
		this.props.NotificationSchedulesLoad()
		this.props.NotificationTemplatesLoad()
	}

	componentWillUnmount() 
	{
		
	}

	componentDidUpdate(prevProps, prevState)
	{
		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()
			
			this.state.tableTab === 0 && this.tableRef.current.onQueryChange(this.state.query, null)
			this.state.tableTab === 1 && this.props.NotificationSchedulesLoad()
			this.state.tableTab === 2 && this.props.NotificationTemplatesLoad()
		}
	}

    render()
    {
        const { classes } = this.props

		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderTableTabs()}
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
		if (this.state.tableTab === 0)
		{
			return new Promise((resolve) =>
			{
				this.props.SetLoading('')
				API.NotificationsExport()
				.then(result =>
				{
					result = _.map(result, value => {
						let { retentionDetail, ...others } = value
						retentionDetail = JSON.stringify(retentionDetail)
						return { ...others, retentionDetail }
					})
					resolve(result)
					this.props.ClearLoading()
				})
				.catch(error =>
				{
					resolve([])
					this.props.ClearLoading()
				})
			})
		}
		else
		{
			let result = []
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
				let { createdAt, modifiedAt, deletedAt, ...others } = value
				createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
				modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
				deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
				return { ...others, createdAt, modifiedAt, deletedAt }
			})

			if (this.state.tableTab === 1)
			{
				result = _.map(result, value => {
					let { configs: { gapCount, selection }, ...others } = value
					return { ...others, gapCount, selection }
				})
			}
			else if (this.state.tableTab === 2)
			{
				result = _.map(result, value => {
					let { devices: { ios, android }, audience: { userIds, attributes }, ...others } = value
					return { ...others, ios, android, userIds, attributes: JSON.stringify(attributes) }
				})
			}
			
			console.log('formatExcelData:', result)
			return result
		}
	}

	getExcelColumns = () =>
	{
		return [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_NAME, field: 'name' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_TYPE, field: 'type' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_GAP_COUNT, field: 'gapCount' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_SELECTION, field: 'selection' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_TITLE, field: 'title' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_MESSAGE, field: 'message' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_MEDIA_URL, field: 'mediaURL' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_EXPIRY, field: 'expiry' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_IOS, field: 'ios' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_ANDROID, field: 'android' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_USER_ID, field: 'userIds' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_ATTRIBUTES, field: 'attributes' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_TEMPLATE, field: 'template' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_SCHEDULE, field: 'schedule' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_START_DATE, field: 'startDate' },
			{ title: TEXT.NOTIFICATION_TABLE_HEADER_RETENTION_DETAIL, field: 'retentionDetail' },
			{ title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt' },
			{ title: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt' },
			{ title: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy' },
			{ title: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy' },
			{ title: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt' },
		]
	}

	getImportColumns = () =>
	{
		if (this.state.tableTab === 0)
		{
			return [
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_TYPE, field: 'type' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_TEMPLATE, field: 'template' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_SCHEDULE, field: 'schedule' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_START_DATE, field: 'startDate' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_RETENTION_DETAIL, field: 'retentionDetail' }
			]
		}
		else if (this.state.tableTab === 1)
		{
			return [
				{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
				{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_NAME, field: 'name' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_TYPE, field: 'type' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_GAP_COUNT, field: 'gapCount' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_SELECTION, field: 'selection' },
			]
		}
		else if (this.state.tableTab === 2)
		{
			return [
				{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
				{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_NAME, field: 'name' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_TYPE, field: 'type' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_TITLE, field: 'title' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_MESSAGE, field: 'message' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_MEDIA_URL, field: 'mediaURL' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_EXPIRY, field: 'expiry' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_IOS, field: 'ios' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_ANDROID, field: 'android' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_USER_ID, field: 'userIds' },
				{ title: TEXT.NOTIFICATION_TABLE_HEADER_ATTRIBUTES, field: 'attributes' },
			]
		}

		return []
	}

    getImportData = (rowData, field, column) =>
	{
		let rawData = rowData[column]
		let data = rawData

		console.log('getImportData rawData', rawData, 'field', field, 'column', column)

		switch (field)
		{ 
			case 'id':
			case 'name':
			case 'title':
			case 'message':
			case 'mediaURL':		    
				data = rawData.trim()
				if (_.isEmpty(data))
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
			case 'template':    
				data = rawData.trim()
				if (_.isEmpty(data) || !_.find(this.props.notificationTemplates, template => (template.name === data)))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break
			case 'schedule':    
				data = rawData.trim()
				if (rowData[TEXT.NOTIFICATION_TABLE_HEADER_TYPE] === 'Schedule' && (_.isEmpty(data) || !_.find(this.props.notificationSchedules, schedule => (schedule.name === data))))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break
			case 'startDate':    
				data = rawData
				if (rowData[TEXT.NOTIFICATION_TABLE_HEADER_TYPE] !== 'Basic' && _.isNaN(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break	
			case 'retentionDetail':    
				data = rawData
				if (rowData[TEXT.NOTIFICATION_TABLE_HEADER_TYPE] === 'Retention')
				{
					try
					{
						data = JSON.parse(data)
						if (!data.hasOwnProperty('dayGap') || 
							!data.hasOwnProperty('keepReminding') || 
							isNaN(data.dayGap) || 
							!_.isBoolean(data.keepReminding)
						)
						{
							throw new Error(`Can not parse 1 ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
						}
					}
					catch(e)
					{
						throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
					}
				}
				else
				{
					data = { dayGap: 0, keepReminding: false }
				}

				break			
			case 'type':    
                data = rawData.trim()
				if (_.isEmpty(data) || this.state.tableTab === 1 && !_.includes(this.props.TYPES, data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break
			case 'selection':    
                data = rawData.trim()
				if (rowData[TEXT.NOTIFICATION_TABLE_HEADER_TYPE] === 'Weekly' && !_.includes(this.props.SELECTIONS, data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break
			case 'gapCount':   
				data = rawData
				if (rowData[TEXT.NOTIFICATION_TABLE_HEADER_TYPE] !== 'Instant' && isNaN(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break
			case 'expiry':	    
				data = rawData
				if (isNaN(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break	
			case 'ios':
			case 'android':	
				data = rawData;
				if(!_.isBoolean(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break	
			case 'attributes':    
				try
				{
					data = JSON.parse(rawData.trim())
					if (!Array.isArray(data))
					{
						throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
					}
					else
					{
						_.some(data, attribute =>
						{
							if (!attribute.hasOwnProperty('attribute') || 
								!attribute.hasOwnProperty('operator') || 
								!attribute.hasOwnProperty('value') || 
								!attribute.hasOwnProperty('isNo') ||
								_.isEmpty(attribute.attribute) || 
								_.isEmpty(attribute.value) ||
								!_.includes(this.props.ATTRIBUTES_OPERATORS, attribute.operator) ||
							 	!_.isBoolean(attribute.isNo)
							)
							{
								throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
							}
						})
					}
				}
				catch(e)
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
			this.state.tableTab === 1 && this.props.NotificationSchedulesLoad() ||
			this.state.tableTab === 2 && this.props.NotificationTemplatesLoad()
		}
	}

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
				if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						this.state.dialogType === 'notification_delete' && this.props.NotificationDelete(row) ||

						this.state.dialogType === 'schedule_delete' && this.props.NotificationScheduleDelete(row) ||
						this.state.dialogType === 'schedule_restore' && this.props.NotificationScheduleRestore(row) ||

						this.state.dialogType === 'template_delete' && this.props.NotificationTemplateDelete(row) ||
						this.state.dialogType === 'template_restore' && this.props.NotificationTemplateRestore(row)
					})
				}
				else
				{
					this.state.dialogType === 'notification_add' && this.props.NotificationAdd(this.state.rowData) ||
					this.state.dialogType === 'notification_delete' && this.props.NotificationDelete(this.state.rowData) ||

					this.state.dialogType === 'schedule_add' && this.props.NotificationScheduleAdd(this.state.rowData) ||
					this.state.dialogType === 'schedule_edit' && this.props.NotificationScheduleEdit(this.state.rowData, true) ||
					this.state.dialogType === 'schedule_delete' && this.props.NotificationScheduleDelete(this.state.rowData) ||
					this.state.dialogType === 'schedule_restore' && this.props.NotificationScheduleRestore(this.state.rowData) ||
					
					this.state.dialogType === 'template_add' && this.props.NotificationTemplateAdd(this.state.rowData, true) ||
					this.state.dialogType === 'template_edit' && this.props.NotificationTemplateEdit(this.state.rowData, true) ||
					this.state.dialogType === 'template_delete' && this.props.NotificationTemplateDelete(this.state.rowData) ||
					this.state.dialogType === 'template_restore' && this.props.NotificationTemplateRestore(this.state.rowData)
				}

				break
			case 'tableTab':
				(data !== this.state.tableTab) && this.setState(
					{
						tableTab: data,
						isMultiSelectMode: false,
					},
					() =>
					{
						if (this.state.tableTab === 1)
						{
							this.props.NotificationSchedulesLoad()
						}
						else if (this.state.tableTab === 2)
						{
							this.props.NotificationTemplatesLoad()
						}
						
					}
				)

				break	
			case 'notification_add':
			case 'notification_delete':
			case 'schedule_add':	
			case 'schedule_edit':
			case 'schedule_delete':
			case 'schedule_restore':
			case 'template_add':	
			case 'template_edit':
			case 'template_delete':
			case 'template_restore':
			case 'json_editor_view':			
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})

				break
			case 'pageSize':
				this.setState({
					pageSize: data
				})
				
				break	
			case 'attribute_add':
				this.setState({
					rowData: {
						...this.state.rowData,
						attributes: [...this.state.rowData.attributes, { attribute: '', operator: '', value: '', isNot: false }]
					}
				})
				break	
			case 'attribute_delete':
				this.setState({
					rowData: {
						...this.state.rowData,
						attributes: _.filter(this.state.rowData.attributes, (attribute, index)=> data !== index)
					}
				})
				break	
			case 'attribute':
			case 'operator':
			case 'value':
			case 'isNot':	
				this.setState({
					rowData: {
						...this.state.rowData,
						attributes: _.map(this.state.rowData.attributes, (attribute, index)=> {
							if (data.index === index)
							{
								attribute = { ...attribute, [name]: data.value }
							}
							return attribute
						})
					}
				})
				break	
			case 'copy_clipboard':
				copy(data)
				this.props.ShowMessage(TEXT.MESSAGE_COPY_TO_CLIPBOARD)

				break				
            default:
                this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: _.includes(['dayGap', 'gapCount', 'expiry'], name) ? (data === '' ? 0 : (isNaN(data) ? this.state.rowData[name] : parseInt(data))) : data
					}
                })
		}		
	}

	validateSubmit = (submit_data) =>
	{
		// console.log('validateSubmit', submit_data)
		const { template, schedule, type, dayGap, name, status, gapCount, selection, title, message, attributes } = submit_data
		if (this.state.tableTab === 0)
		{
			let result = _.isEmpty(template) || _.isEmpty(type)
			if (!result)
			{
				if (type === 'Schedule' || type === 'Retention')
				{
					result = _.isEmpty(schedule)
				}

				if (type === 'Retention')
				{
					result = dayGap === 0
				}
			}

			return result
		} 
		else if (this.state.tableTab === 1)
		{
			if (type === 'Instant')
			{
				return _.isEmpty(name) || _.isEmpty(status)
			}
			else if (type === 'Weekly')
			{
				return _.isEmpty(name) || _.isEmpty(status) || _.isEmpty(type) || _.isEmpty(selection) || gapCount === 0
			}

			return _.isEmpty(name) || _.isEmpty(status) || _.isEmpty(type) || gapCount === 0
		}
		else if (this.state.tableTab === 2)
		{
			return (_.isEmpty(name) || _.isEmpty(status) || _.isEmpty(type) || _.isEmpty(title) || _.isEmpty(message) ||
					(!_.isEmpty(attributes) && _.some(attributes, attribute => (_.isEmpty(attribute.attribute) || _.isEmpty(attribute.operator) || _.isEmpty(attribute.value)))))
		}
		
		return false
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
						<Tab label={TEXT.NOTIFICATION_TITLE}/>
						<Tab label={TEXT.NOTIFICATION_TABLE_HEADER_SCHEDULE} />
						<Tab label={TEXT.NOTIFICATION_TABLE_HEADER_TEMPLATE} />
					</Tabs>
					{
						this.actionsExtend.createElement(this.actionsExtend)
					}
				</div>
				<CmsTabPanel value={this.state.tableTab} index={0} >
				{
					this.renderNotificationsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={1} >
				{
					this.renderSchedulesNotificationTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={2} >
				{
					this.renderTemplatesNotificationTable()
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
                    this.state.dialogType === 'notification_add' && TEXT.NOTIFICATION_BUTTON_NEW_NOTIFICATION ||
                    this.state.dialogType === 'notification_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'json_editor_view' && this.state.tableTab === 0 && TEXT.NOTIFICATION_TABLE_HEADER_PAYLOAD ||
					this.state.dialogType === 'json_editor_view' && this.state.tableTab === 2 && TEXT.NOTIFICATION_TABLE_HEADER_AUDIENCE ||
					
					this.state.dialogType === 'schedule_add' && TEXT.NOTIFICATION_BUTTON_NEW_SCHEDULE ||
					this.state.dialogType === 'schedule_edit' && TEXT.NOTIFICATION_TOOLTIP_EDIT_SCHEDULE ||
					this.state.dialogType === 'schedule_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'schedule_restore' && TEXT.REMIND_TITLE ||

					this.state.dialogType === 'template_add' && TEXT.NOTIFICATION_BUTTON_NEW_TEMPLATE ||
					this.state.dialogType === 'template_edit' && TEXT.NOTIFICATION_TOOLTIP_EDIT_TEMPLATE ||
					this.state.dialogType === 'template_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'template_restore' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={this.state.dialogType === 'json_editor_view' ? null :TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction(this.state.dialogType === 'json_editor_view' ? 'close' : 'submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore') || this.state.dialogType === 'json_editor_view') ? false : this.validateSubmit(this.state.rowData)}
				width={(this.state.dialogType === 'template_add' || this.state.dialogType === 'template_edit')  ? '40%' : null}
			>
			{
				this.state.dialogType === 'notification_delete' && this.renderDeleteNotification()
			}
			{
				this.state.dialogType === 'notification_add'  && this.renderAddNotification()
			}
			{
				this.state.dialogType === 'json_editor_view' && this.renderViewNotificationPayload()
			}
			{
				(this.state.dialogType === 'schedule_add' || this.state.dialogType === 'schedule_edit')  && this.renderAddEditSchedule()
			}
			{
				(this.state.dialogType === 'schedule_delete' || this.state.dialogType === 'schedule_restore') && this.renderDeleteRestoreSchedule()
			}
			{
				(this.state.dialogType === 'template_add' || this.state.dialogType === 'template_edit')  && this.renderAddEditTemplate()
			}
			{
				(this.state.dialogType === 'template_delete' || this.state.dialogType === 'template_restore') && this.renderDeleteRestoreTemplate()
			}
			</ModalDialog>
		)
	}

	renderTemplatesNotificationTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.NOTIFICATION_TABLE_HEADER_NAME, field: 'name', width: 150,
                        },
						{
                            title: TEXT.NOTIFICATION_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: TEXT.NOTIFICATION_TABLE_HEADER_TITLE, field: 'title', width: 150,
                        },
						{
                            title: TEXT.NOTIFICATION_TABLE_HEADER_MESSAGE, field: 'message', width: 150,
                        },
						{
                            title: TEXT.NOTIFICATION_TABLE_HEADER_MEDIA_URL, field: 'mediaURL', width: 150,
                        },
						{
                            title: TEXT.NOTIFICATION_TABLE_HEADER_EXPIRY, field: 'expiry', width: 150,
                        },
						{
                            title: TEXT.NOTIFICATION_TABLE_HEADER_DIVICES, field: 'devices', width: 150,
							render: rowData =>
                            {
								const result = _.reduce(Object.entries(rowData.devices) || [], (result, device) => {
									return device[1] == true ? [...result, device[0]] : result
								}, [])

								return result.join(', ')
							}	
                        },
						{
                            title: () => (
                                <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
                                    <span>{TEXT.TABLE_HEADER_STATUS}</span>
                                    <Tooltip 
                                        title={TEXT.NOTIFICATION_TOOLTIP_STATUS}
                                        classes={{tooltip: classes.toolTip}}
                                        placement={'top'}
                                    >
                                        <Icon style={{ color: '#AEAEAE', marginLeft: 10 }} >help</Icon>
                                    </Tooltip>
                                </div>
                            ),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							filtering: false,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData, columnDef, 'status')
                        },
						{
                            title: TEXT.NOTIFICATION_TABLE_HEADER_AUDIENCE, field: 'audience', width: 150,
							render: rowData =>
                            {
								return (
									<CmsControlPermission
										control={
											<Tooltip 
												title={TEXT.NOTIFICATION_TOOLTIP_VIEW_AUDIENCE}
												placement={'top'}
											>
												<IconButton
													onClick={(event) => {
														this.handleAction('json_editor_view', rowData.audience)(event)
													}}
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
								const { devices: { ios, android }, audience: { userIds, attributes }  } = rowData
								rowData = { ...rowData, ios, android, userIds, attributes, fromExcel: false, file: null }
								this.handleAction('template_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.NOTIFICATION_TOOLTIP_EDIT_TEMPLATE),
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
								this.handleAction('template_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.NOTIFICATION_TOOLTIP_DELETE_TEMPLATE),
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
								this.handleAction('template_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.NOTIFICATION_TOOLTIP_RESTORE_TEMPLATE),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}	

                    data={this.props.notificationTemplates || []}

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

	renderSchedulesNotificationTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.NOTIFICATION_TABLE_HEADER_NAME, field: 'name', width: 150,
							
                        },
						{
                            title: TEXT.NOTIFICATION_TABLE_HEADER_TYPE, field: 'type', width: 150,
							
                        },
						{
                            title: () => (
                                <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
                                    <span>{TEXT.TABLE_HEADER_STATUS}</span>
                                    <Tooltip 
                                        title={TEXT.NOTIFICATION_TOOLTIP_STATUS}
                                        classes={{tooltip: classes.toolTip}}
                                        placement={'top'}
                                    >
                                        <Icon style={{ color: '#AEAEAE', marginLeft: 10 }} >help</Icon>
                                    </Tooltip>
                                </div>
                            ),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							filtering: false,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData, columnDef, 'status')
                        },
						{
                            title: TEXT.NOTIFICATION_TABLE_HEADER_CONFIGS, field: 'configs', sorting: false, width: 200,
							render: rowData => this.renderConfigsColumn(rowData)
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
								rowData = { ...rowData, gapCount: rowData.configs.gapCount || 0, selection: rowData.configs.selection || '', serverBased: rowData.configs.serverBased || false }
								this.handleAction('schedule_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.NOTIFICATION_TOOLTIP_EDIT_SCHEDULE),
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
								this.handleAction('schedule_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.NOTIFICATION_TOOLTIP_DELETE_SCHEDULE),
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
								this.handleAction('schedule_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.NOTIFICATION_TOOLTIP_RESTORE_SCHEDULE),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}	

                    data={this.props.notificationSchedules || []}

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

	renderDeleteRestoreTemplate = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'template_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.NOTIFICATION_MESSAGE_DELETE_TEMPLATES, this.state.rowData.length) : TEXT.NOTIFICATION_MESSAGE_DELETE_TEMPLATE) ||
						this.state.dialogType === 'template_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.NOTIFICATION_MESSAGE_RESTORE_TEMPLATES, this.state.rowData.length) : TEXT.NOTIFICATION_MESSAGE_RESTORE_TEMPLATE) ||
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
									{`${data.name} - ${data.type} - ${data.status}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.type} - ${this.state.rowData.status}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderDeleteRestoreSchedule = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'schedule_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.NOTIFICATION_MESSAGE_DELETE_SCHEDULES, this.state.rowData.length) : TEXT.NOTIFICATION_MESSAGE_DELETE_SCHEDULE) ||
						this.state.dialogType === 'schedule_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.NOTIFICATION_MESSAGE_RESTORE_SCHEDULES, this.state.rowData.length) : TEXT.NOTIFICATION_MESSAGE_RESTORE_SCHEDULE) ||
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
									{`${data.name} - ${data.type} - ${data.status}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.type} - ${this.state.rowData.status}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderDeleteNotification = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'notification_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.NOTIFICATION_MESSAGE_DELETE_NOTIFICATIONS, this.state.rowData.length) : TEXT.NOTIFICATION_MESSAGE_DELETE_NOTIFICATION) ||
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
									{`${data.type} - ${data.template} - ${data.schedule}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.type} - ${this.state.rowData.template} - ${this.state.rowData.schedule}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderViewNotificationPayload = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				<div className={clsx(classes.root, classes.divColumn)}>
					<JsonEditor
						key={'text'}
						value={this.state.rowData}
						mode={'text'}
					/>
				</div>
			</div>
		)
	}

	renderAddNotification = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_TEMPLATE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.template}
						options={_.map(this.props.notificationTemplates || [], template => (template.name))}
						onChange={(evt, value) => {
							this.handleAction('template', value)(evt)
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
					<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.type}
						options={this.props.TYPES}
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
				{
					(this.state.rowData.type === 'Schedule') &&
					<div className={clsx(classes.divColumn)}>
						<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_SCHEDULE}</Typography>
						<Autocomplete
							autoComplete
							autoSelect
							filterSelectedOptions
							value={this.state.rowData.schedule}
							options={_.map(this.props.notificationSchedules || [], schedule => (schedule.name))}
							onChange={(evt, value) => {
								this.handleAction('schedule', value)(evt)
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
				}
				{
					(this.state.rowData.type === 'Schedule' || this.state.rowData.type === 'DailyRewardReminder' || this.state.rowData.type === 'Retention') &&
					<div className={clsx(classes.divColumn)}>
						<Typography>{`${TEXT.NOTIFICATION_TABLE_HEADER_START_DATE} (${TEXT.TABLE_HEADER_UTC_0})`}</Typography>
						<div className={clsx(classes.divColumn)}>
							<div className={clsx(classes.divColumn, classes.divHeight, classes.cmsDate)}>
								<CmsDate
									views={['date', 'hours', 'minutes']} 
									raiseSubmitOnMounted={true}
									enableFullTimeFormat={true} 
									disableToolbar={false} 
									disablePast={true} 
									disableCheckMaxRange={true}
									onDateSubmit={(data) => {
										this.handleAction('startDate', data.ms_begin_utc)(null)
									}}
									isSingleChoice={true}
									disabledEndDate={true}
								/>
							</div>
						</div>
					</div>
				}
				{
					this.state.rowData.type === 'Retention' &&
					<div className={clsx(classes.divColumn)}>
						<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_RETENTION_DETAIL}</Typography>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<TextField
								className={clsx(classes.inputTextField, classes.marginTop, classes.marginRight)}
								value={this.state.rowData.dayGap || 0}
								margin="normal"
								fullWidth
								variant={'outlined'}
								onChange={(evt) => { this.handleAction('dayGap', evt.target.value)(evt) }}
								label={TEXT.NOTIFICATION_TABLE_HEADER_DAY_GAP}
							/>
							<FormControlLabel
								control={
									<Checkbox
										color={'primary'}
										checked={this.state.rowData.keepReminding || false}
										onChange={(evt, checked) => {
											this.handleAction('keepReminding', checked)(evt)
										}}
									/>
								}
								label={TEXT.NOTIFICATION_TABLE_HEADER_KEEP_REMINDING}
								labelPlacement={'end'}
							/>
						</div>
						<Typography style={{fontSize: '0.75rem', fontWeight: 500, marginTop: -5}}>{TEXT.NOTIFICATION_TOOLTIP_DAY_GAP}</Typography>
					</div>
				}
			</div>
		)
	}	

	renderAddEditTemplate = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divRow, classes.justifyBetween)}>
					<div className={clsx(classes.divColumn)} style={{ width: '45%'}}>
						<div className={clsx(classes.divColumn)}>
							<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_NAME}</Typography>
							<TextField
								className={clsx(classes.inputTextField, classes.inputText)}
								value={this.state.rowData.name}
								margin="normal"
								fullWidth
								variant={'outlined'}
								onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
								disabled={this.state.dialogType === 'template_edit'}
							/>
						</div>
						<div className={clsx(classes.divColumn)}>
							<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_TYPE}</Typography>
							<TextField
								className={clsx(classes.inputTextField, classes.inputText)}
								value={this.state.rowData.type}
								margin="normal"
								fullWidth
								variant={'outlined'}
								onChange={(evt) => { this.handleAction('type', evt.target.value)(evt) }}
							/>
						</div>
						<div className={clsx(classes.divColumn)}>
							<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_TITLE}</Typography>
							<TextField
								className={clsx(classes.inputTextField, classes.inputText)}
								value={this.state.rowData.title}
								margin="normal"
								fullWidth
								variant={'outlined'}
								onChange={(evt) => { this.handleAction('title', evt.target.value)(evt) }}
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
					</div>
					<div className={clsx(classes.divColumn)} style={{ width: '45%'}}>
						<div className={clsx(classes.divColumn)}>
							<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_MESSAGE}</Typography>
							<TextField
								className={clsx(classes.inputTextField, classes.inputText)}
								value={this.state.rowData.message}
								margin="normal"
								fullWidth
								variant={'outlined'}
								onChange={(evt) => { this.handleAction('message', evt.target.value)(evt) }}
							/>
						</div>
						<div className={clsx(classes.divColumn)}>
							<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_MEDIA_URL}</Typography>
							<TextField
								className={clsx(classes.inputTextField, classes.inputText)}
								value={this.state.rowData.mediaURL}
								margin="normal"
								fullWidth
								variant={'outlined'}
								onChange={(evt) => { this.handleAction('mediaURL', evt.target.value)(evt) }}
							/>
						</div>
						<div className={clsx(classes.divColumn)}>
							<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_EXPIRY}</Typography>
							<TextField
								className={clsx(classes.inputTextField, classes.inputText)}
								value={this.state.rowData.expiry || 0}
								margin="normal"
								fullWidth
								variant={'outlined'}
								onChange={(evt) => { this.handleAction('expiry', evt.target.value)(evt) }}
							/>
						</div>
						<div className={clsx(classes.divColumn)}>
							<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_DIVICES}</Typography>
							<div className={clsx(classes.divRow, classes.alignCenter)}>
								<FormControlLabel
									control={
										<Checkbox
											color={'primary'}
											checked={this.state.rowData.ios || false}
											onChange={(evt, checked) => {
												this.handleAction('ios', checked)(evt)
											}}
										/>
									}
									label={TEXT.NOTIFICATION_TABLE_HEADER_IOS}
									labelPlacement={'end'}
								/>
								<FormControlLabel
									control={
										<Checkbox
											color={'primary'}
											checked={this.state.rowData.android || false}
											onChange={(evt, checked) => {
												this.handleAction('android', checked)(evt)
											}}
										/>
									}
									label={TEXT.NOTIFICATION_TABLE_HEADER_ANDROID}
									labelPlacement={'end'}
								/>
							</div>
						</div>
					</div>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_AUDIENCE}</Typography>
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.alignCenter, classes.justifyBetween)}>
							<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_USER_ID}</Typography>
							<FormControlLabel
								control={
									<Checkbox
										color={'primary'}
										checked={this.state.rowData.fromExcel || false}
										onChange={(evt, checked) => {
											this.handleAction('fromExcel', checked)(evt)
										}}
									/>
								}
								label={TEXT.NOTIFICATION_TITLE_FROM_EXCEL_FILE}
								labelPlacement={'end'}
							/>
						</div>
						{
							!!this.state.rowData.fromExcel
							?
							<div className={clsx(classes.divColumn)}>
								<CmsInputFile 
									name={'file'}
									value={this.state.rowData.file || []} 
									onChange={(file) => { this.handleAction('file', file)(null) }} 
									acceptFile={'.xlsx'}
									helperText={TEXT.NOTIFICATION_TOOLTIP_USER_ID_LIMIT}
								/>
							</div>
							:
							<Autocomplete
								multiple
								freeSolo
								autoSelect
								filterSelectedOptions
								value={this.state.rowData.userIds || []}
								options={[]}
								onChange={(evt, value) => {
									this.handleAction('userIds', value)(evt)
								}}
								renderInput={(params) => (
									<TextField {...params}
										variant="outlined"
									/>
								)}
								classes={{
									root: clsx(classes.autoComplete),
									input: classes.autoCompleteInput,
									inputRoot: classes.autoCompleteInputRoot
								}}
								size={'small'}
								limitTags={1}
							/>
						}
					</div>
					<div className={clsx(classes.divColumn)}>
						<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_ATTRIBUTES}</Typography>
						<div style={{marginBottom: 15, paddingTop: 10, borderTop: `1px ${defaultBorderColor} solid`, borderBottom: `1px ${defaultBorderColor} solid`, minHeight: 200, maxHeight: 200, overflow:'auto'}}>
						{
							_.map(this.state.rowData.attributes, (attribute, index) => {
								return (
									<div key={index} className={clsx(classes.divRow, classes.alignCenter)}>
										<TextField
											className={clsx(classes.inputTextField, classes.inputText, classes.marginRight, classes.marginTop)}
											value={attribute.attribute}
											margin="normal"
											fullWidth
											variant={'outlined'}
											onChange={(evt) => { this.handleAction('attribute', { index, value: evt.target.value })(evt) }}
											label={TEXT.NOTIFICATION_TABLE_HEADER_ATTRIBUTE}
										/>
										<FormControlLabel
											control={
												<Checkbox
													color={'primary'}
													checked={attribute.isNot || false}
													onChange={(evt, checked) => {
														this.handleAction('isNot', { index, value: checked })(evt)
													}}
												/>
											}
											label={TEXT.NOTIFICATION_TABLE_HEADER_IS_NOT}
											labelPlacement={'end'}
										/>
										<Autocomplete
											autoComplete
											autoSelect
											filterSelectedOptions
											value={attribute.operator}
											options={this.props.ATTRIBUTES_OPERATORS}
											onChange={(evt, value) => {
												this.handleAction('operator', { index, value })(evt)
											}}
											disableClearable={true}
											renderInput={(params) => (
												<TextField {...params}
													variant="outlined"
													label={TEXT.NOTIFICATION_TABLE_HEADER_OPERATOR}
												/>
											)}
											classes={{
												root: clsx(classes.autoComplete, classes.selection, classes.marginRight),
												input: classes.autoCompleteInput,
												inputRoot: classes.autoCompleteInputRoot
											}}
										/>
										{
											attribute.operator === 'includes'
											?
											<Autocomplete
												multiple
												freeSolo
												autoSelect
												filterSelectedOptions
												value={_.isEmpty(attribute.value) ? [] : attribute.value?.split(',')}
												options={[]}
												onChange={(evt, value) => {
													this.handleAction('value', { index, value: value.join(',') })(evt)
												}}
												renderInput={(params) => (
													<TextField {...params}
														variant="outlined"
														label={TEXT.NOTIFICATION_TABLE_HEADER_VALUE}
													/>
												)}
												classes={{
													root: clsx(classes.autoComplete, classes.selection, classes.marginRight),
													input: classes.autoCompleteInput,
													inputRoot: classes.autoCompleteInputRoot
												}}
												size={'small'}
												limitTags={1}
											/>
											:
											<TextField
												className={clsx(classes.inputTextField, classes.inputText, classes.marginRight, classes.marginTop)}
												value={attribute.value}
												margin="normal"
												fullWidth
												variant={'outlined'}
												onChange={(evt) => { this.handleAction('value', { index, value: evt.target.value })(evt) }}
												label={TEXT.NOTIFICATION_TABLE_HEADER_VALUE}
											/>
										}
										<Icons.IconRemove onClick={this.handleAction('attribute_delete', index)} style={{ marginLeft:10, cursor:'pointer' }}/>
									</div>
								)
							})
						}
						</div>
						<div>
							<Button
								variant='outlined'
								color={'default'}
								startIcon={<Icons.IconAdd />}
								onClick={this.handleAction('attribute_add')}
							>
								{TEXT.NOTIFICATION_BUTTON_ADD_ATTRIBUTE}
							</Button> 
						</div>
					</div>	
				</div>
			</div>
		)
	}

	renderAddEditSchedule = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'schedule_edit'}
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
					<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.type}
						options={this.props.TYPES}
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
				
					<div className={clsx(classes.divColumn)}>
						<Typography>{TEXT.NOTIFICATION_TABLE_HEADER_CONFIGS}</Typography>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							{
								this.state.rowData.type !== 'Instant' &&
								<TextField
									className={clsx(classes.inputTextField, classes.marginTop, classes.marginRight)}
									value={this.state.rowData.gapCount || 0}
									margin="normal"
									fullWidth
									variant={'outlined'}
									onChange={(evt) => { this.handleAction('gapCount', evt.target.value)(evt) }}
									label={TEXT.NOTIFICATION_TABLE_HEADER_GAP_COUNT}
								/>
							}
							{
								this.state.rowData.type === 'Weekly' &&
								<Autocomplete
									autoComplete
									autoSelect
									filterSelectedOptions
									value={this.state.rowData.selection}
									options={this.props.SELECTIONS}
									onChange={(evt, value) => {
										this.handleAction('selection', value)(evt)
									}}
									disableClearable={true}
									renderInput={(params) => (
										<TextField {...params}
											variant="outlined"
											label={TEXT.NOTIFICATION_TABLE_HEADER_SELECTION}
										/>
									)}
									classes={{
										root: clsx(classes.autoComplete, classes.selection),
										input: classes.autoCompleteInput,
										inputRoot: classes.autoCompleteInputRoot
									}}
								/>
							}
							<FormControlLabel
								control={
									<Checkbox
										color={'primary'}
										checked={this.state.rowData.serverBased || false}
										onChange={(evt, checked) => {
											this.handleAction('serverBased', checked)(evt)
										}}
									/>
								}
								label={TEXT.NOTIFICATION_TABLE_HEADER_SERVER_BASED}
								labelPlacement={'end'}
							/>
						</div>
						{
							this.state.rowData.type !== 'Instant' &&
							<Typography style={{fontSize: '0.75rem', fontWeight: 500, marginTop: -5}}>{TEXT.NOTIFICATION_TOOLTIP_GAP_COUNT}</Typography>
						}
					</div>
			
			</div>
		)
	}

	renderNotificationsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.NOTIFICATION_TABLE_HEADER_OPERATION_ID, field: 'operationId', width: 200,
							filtering: false,
							disableClick: false,
							cellTooltip: TEXT.NOTIFICATION_TOOLTIP_COPY_TO_CLIPBOARD,
							render: rowData =>
							{
								return (
									<div style={{ width: 180, marginLeft: 10, wordWrap: 'break-word' }}>
										{rowData.operationId}
									</div>
								)
							}
						},
                        {
                            title: TEXT.NOTIFICATION_TABLE_HEADER_TEMPLATE, field: 'template', width: 150,
                        },
						{
                            title: TEXT.NOTIFICATION_TABLE_HEADER_SCHEDULE, field: 'schedule', width: 150,
                        },
						{
                            title: TEXT.NOTIFICATION_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: () => (
                                <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
                                    <span>{TEXT.TABLE_HEADER_STATUS}</span>
                                    <Tooltip 
                                        title={TEXT.NOTIFICATION_TOOLTIP_STATUS}
                                        classes={{tooltip: classes.toolTip}}
                                        placement={'top'}
                                    >
                                        <Icon style={{ color: '#AEAEAE', marginLeft: 10 }} >help</Icon>
                                    </Tooltip>
                                </div>
                            ),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 101,
							filtering: false,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData, columnDef, 'status')
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 250,
							filtering: false,
							render: rowData => this.renderDateColumn(rowData),
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							filtering: false,
						},
						{
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy', width: 350,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy', hidden: true,
							filtering: false,
                        },
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', width: 150,
							filtering: false,
                            render: rowData => this.renderDeletedAtColumn(rowData),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconRemove {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('notification_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0 || rowData.status === 'Sent') ? '' : TEXT.NOTIFICATION_TOOLTIP_DELETE_NOTIFICATION),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0 || rowData.status === 'Sent'),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
						{
							icon: (props) => <Icons.IconEyeShow {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('json_editor_view', rowData.payload)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode) ? '' : TEXT.NOTIFICATION_TOOLTIP_VIEW_PAYLOAD),
							disabled: (rowData) => (this.state.isMultiSelectMode),
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
						let notification_data = _.reduce(filters, (notification_data, filter) =>
						{
							return {...notification_data, [filter.column.field]: filter.value}
						}, {})

						notification_data = {
							...NOTIFICATION_DATA, 
							...notification_data,
							page: page + 1, 
							pageSize
						}

						return new Promise((resolve) =>
						{
							this.props.SetLoading('')
							API.NotificationsLoad(notification_data)
							.then(result =>
							{
								resolve({
									data: result.items,
									page: _.isEmpty(result.items) ? 0 : result.pagination.page - 1,
									totalCount: result.pagination.totalItems,
								})

								this.props.SetProps([{ key: 'TYPES', value: result.TYPES }])
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
						fixedColumns: {
							left: 1,
							right: -100
						},
                        showTitle: false,
                        search: false,
                        filtering: true,
						sorting: false,
                        pageSize: this.state.pageSize,
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

	renderConfigsColumn = (rowData) =>
	{
		const { classes } = this.props

		return (
			_.isEmpty(rowData.configs)
			?
			null
			:
			<div className={clsx(classes.divRow, classes.justifyStart)}>
				<div className={clsx(classes.divColumn, classes.alignStart)}>
					{
						rowData.type !== 'Instant' &&
						<div className={classes.divRow}>
							<div style={{ fontWeight: 'bold', marginRight: 10 }}>
							{
								`${TEXT.NOTIFICATION_TABLE_HEADER_GAP_COUNT}:`
							}
							</div>
							<div>
							{
								`${rowData.configs.gapCount}`
							}
							</div>
						</div>
					}
					{
						rowData.type === 'Weekly' &&
						<div className={classes.divRow}>
							<div style={{ fontWeight: 'bold', marginRight: 10 }}>
							{
								`${TEXT.NOTIFICATION_TABLE_HEADER_SELECTION}:`
							}
							</div>
							<div>
							{
								`${rowData.configs.selection}`
							}
							</div>
						</div>
					}
					<div className={classes.divRow}>
						<div style={{ fontWeight: 'bold', marginRight: 10 }}>
						{
							`${TEXT.NOTIFICATION_TABLE_HEADER_SERVER_BASED}:`
						}
						</div>
						<div>
						{
							`${rowData.configs.serverBased}`
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

OnlineNotification.propTypes =
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
	ClearProps: (keys) =>
	{
		dispatch(ActionCMS.ClearProps(keys))
	},
	NotificationAdd: (notification_data) =>
	{
		dispatch(ActionCMS.NotificationAdd(notification_data))
	},
	NotificationDelete: (notification_data) =>
	{
		dispatch(ActionCMS.NotificationDelete(notification_data))
	},
	NotificationSchedulesLoad: () =>
	{
		dispatch(ActionCMS.NotificationSchedulesLoad())
	},
	NotificationScheduleAdd: (notification_data) =>
	{
		dispatch(ActionCMS.NotificationScheduleAdd(notification_data))
	},
	NotificationScheduleEdit: (notification_data, manual) =>
	{
		dispatch(ActionCMS.NotificationScheduleEdit(notification_data, manual))
	},
	NotificationScheduleDelete: (notification_data) =>
	{
		dispatch(ActionCMS.NotificationScheduleDelete(notification_data))
	},
	NotificationScheduleRestore: (notification_data) =>
	{
		dispatch(ActionCMS.NotificationScheduleRestore(notification_data))
	},
	NotificationTemplatesLoad: () =>
	{
		dispatch(ActionCMS.NotificationTemplatesLoad())
	},
	NotificationTemplateAdd: (notification_data) =>
	{
		dispatch(ActionCMS.NotificationTemplateAdd(notification_data))
	},
	NotificationTemplateEdit: (notification_data, manual) =>
	{
		dispatch(ActionCMS.NotificationTemplateEdit(notification_data, manual))
	},
	NotificationTemplateDelete: (notification_data) =>
	{
		dispatch(ActionCMS.NotificationTemplateDelete(notification_data))
	},
	NotificationTemplateRestore: (notification_data) =>
	{
		dispatch(ActionCMS.NotificationTemplateRestore(notification_data))
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
)(OnlineNotification);

