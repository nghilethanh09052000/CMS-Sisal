import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import { saveAs } from 'file-saver'

import { Typography, Tabs, Tab, Button, TextField, Chip, Tooltip, IconButton, Icon, Checkbox } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { WarningRounded } from '@material-ui/icons'

import { LANGUAGE_LIST_SERVER } from '../../Defines'
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
import CmsInputFile from '../../Components/CmsInputFile'
import CmsDate from '../../Components/CmsDate'

const styles = theme => ({
	tabs: {
		width: '50%'
	},
	table: {
        flexGrow: 0,
        flexShrink: 0,
        marginTop: 0,
    },
	inputText: {
		marginTop: 0,
	},
	marginRight: {
		marginRight: 10,
	},
	marginTop: {
		marginTop: 10,
	},
	marginBottom: {
		marginBottom: 0
	},
	generalTitle: {
        marginBottom: '1rem',
    },
	itemTitle: {
        marginTop: '2rem',
		marginBottom: '1rem',
    },
	jsonEditorTitle: {
        marginTop: theme.spacing(3),
    },
	jsonEditor: {
		width: '100%'
    },
	searchBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(5),
		marginBottom: theme.spacing(3)
	},
	divMaxHeight: {
		maxHeight: '20vh',
		overflowY: 'auto'
	},
	importBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(2),
		marginBottom: theme.spacing(3)
	},
	cmsDate: {
		marginBottom: theme.spacing(1),
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

const PAGE_SIZE = 8
const TABLE_HEIGHT = 550
const TABLE_HEIGHT_1 = 450
const FULLTIME_FORMAT = 'MMM DD YYYY HH:mm'

class QuestSytem extends React.Component
{
	constructor(props)
	{
		super(props)

		this.state = {
			
            isDialogOpen: false,
			isImportOpen: false,
			isExportOpen: false,
			isMultiSelectMode: false,
			isPageOpen: false,
			errorConfigs: false,
			hasEntertainmentLevel: false,
			hasUserLevel: false,
			viewConfigs: 'text',
			dialogType: '',
			rowData: {},
			generalData: {},
			tableTab: 0,
		}

		this.excelRef = React.createRef()
		this.tableRef = React.createRef()
		this.selectedRows = []
		this.rowData = null
		this.searchText = ''
		this.actionsExtend = {
			createElement: (parentProps) =>
			{
				const { classes } = this.props

				const columns = this.getExcelColumns()
				const importColumns = this.getImportColumns()

				// Use "API" instead of Redux, as I don't want to refresh render
				// Use "bind" because of these functions will be pass as component property
				// to fixed: "this" keyword is undefined

				let apiAdd, apiUpdate, apiDelete
				if (this.state.tableTab === 0)
				{
					if (this.state.pageType === 'view_item_localizations')
					{
						apiAdd = API.QuestLocalizationAdd.bind(API)
						apiUpdate = API.QuestLocalizationEdit.bind(API)
						apiDelete = API.QuestLocalizationEdit.bind(API)
					}
					/* else
					{
						apiAdd = API.QuestItemAdd.bind(API)
						apiUpdate = API.QuestItemEdit.bind(API)
						apiDelete = API.QuestItemDelete.bind(API)
					} */
				}
				/* else if (this.state.tableTab === 1)
				{
					apiAdd = API.QuestConfigAdd.bind(API)
					apiUpdate = API.QuestConfigEdit.bind(API)
					apiDelete = API.QuestConfigDelete.bind(API)
				}
				else if (this.state.tableTab === 3)
				{
					apiAdd = API.QuestRequirementAdd.bind(API)
					apiUpdate = API.QuestRequirementEdit.bind(API)
					apiDelete = API.QuestRequirementDelete.bind(API)
				} */

				return (
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<div className={clsx(classes.divRow)}>
								{
									this.state.pageType === 'view_item_localizations' &&
									<>
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
											disabledUpdate={false}
											normalizeData={this.getImportData}
											onProgress={this.handleImportDialog}
											disabledUpdateBeforeDelete={true}
											disabledUpdateAfterAdd={true}
										/>
										<CmsExcel
											excelRef={this.excelRef}
											multiSheetData={this.formatExcelData}
											columns={columns}
											controlPermission={{
												link: '',
												attribute: ''
											}}
											onProgress={this.handleExportDialog}
											fileNameExtend={
												this.state.tableTab === 0 && this.state.pageType === 'view_item_localizations' && `/${TEXT.QUEST_SYSTEM_LOCALIZATION_TITLE}_${this.state.generalData.code}` ||
												/* this.state.tableTab === 0 && this.state.pageType !== 'view_item_localizations' && `/${TEXT.QUEST_SYSTEM_ITEM_TITLE}` ||
												this.state.tableTab === 1 && `/${TEXT.QUEST_SYSTEM_CONFIG_TITLE}` ||
												this.state.tableTab === 3 && `/${TEXT.QUEST_SYSTEM_REQUIREMENT_TITLE}` ||  */
												''
											}
										/>
									</>
								}
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
													onClick={
														(this.state.tableTab === 0 && this.state.pageType === 'view_item_localizations') && this.handleAction('localization_restore') ||
														(this.state.tableTab === 0 && this.state.pageType !== 'view_item_localizations') && this.handleAction('item_restore') ||
														this.state.tableTab === 1 && this.handleAction('config_restore') ||
														this.state.tableTab === 3 && this.handleAction('requirement_restore') || null
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
												{
													(this.state.tableTab === 0 && this.state.pageType === 'view_item_localizations') &&  TEXT.QUEST_SYSTEM_BUTTON_RESTORE_LOCALIZATIONS ||
													(this.state.tableTab === 0 && this.state.pageType !== 'view_item_localizations') && TEXT.QUEST_SYSTEM_BUTTON_RESTORE_ITEMS ||
													this.state.tableTab === 1 && TEXT.QUEST_SYSTEM_BUTTON_RESTORE_CONFIGS ||
													this.state.tableTab === 3 && TEXT.QUEST_SYSTEM_BUTTON_RESTORE_REQUIREMENTS || ''
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
														(this.state.tableTab === 0 && this.state.pageType === 'view_item_localizations') && this.handleAction('localization_delete') ||
														(this.state.tableTab === 0 && this.state.pageType !== 'view_item_localizations') && this.handleAction('item_delete') ||
														this.state.tableTab === 1 && this.handleAction('config_delete') ||
														this.state.tableTab === 3 && this.handleAction('requirement_delete') || null
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
												{
													this.state.tableTab === 0 && TEXT.QUEST_SYSTEM_BUTTON_DELETE_ITEMS ||
													this.state.tableTab === 1 && TEXT.QUEST_SYSTEM_BUTTON_DELETE_CONFIGS ||
													this.state.tableTab === 3 && TEXT.QUEST_SYSTEM_BUTTON_DELETE_REQUIREMENTS || ''
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
													(this.state.tableTab === 0 && this.state.pageType === 'view_item_localizations') && this.handleAction('localization_add', { lang: {}, title: '', description: '' }) ||
													(this.state.tableTab === 0 && this.state.pageType !== 'view_item_localizations') && this.handleAction('item_add', { code: '', status: '', type: '', difficulty: '', name: '', amount: 0, configs: {}, title: '', description: '', userLevel: 0, entertainmentLevel: 0, preconditions:[] }) ||
													this.state.tableTab === 1 && this.handleAction('config_add', { status: '', level: 0, easy: 0, medium: 0, hard: 0, divider_1: '', multiplier_1: 0, divider_2: '', multiplier_2: 0, divider_3: '', multiplier_3: 0}) ||
													this.state.tableTab === 3 && this.handleAction('requirement_add', { name: '', type: '', description: ''}) || null
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
											{
												(this.state.tableTab === 0 && this.state.pageType === 'view_item_localizations') && TEXT.QUEST_SYSTEM_BUTTON_NEW_LOCALIZATION ||
												(this.state.tableTab === 0 && this.state.pageType !== 'view_item_localizations') && TEXT.QUEST_SYSTEM_BUTTON_NEW_ITEM ||
												this.state.tableTab === 1 && TEXT.QUEST_SYSTEM_BUTTON_NEW_CONFIG ||
												this.state.tableTab === 3 && TEXT.QUEST_SYSTEM_BUTTON_NEW_REQUIREMENT || ''
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
				dialogType: state.dialogType === 'localization_download' ? state.dialogType : '',
				rowData: {},
			}
		}

        return null; // No change to state
    }

	componentDidMount()
	{
		this.props.SetTitle(TEXT.QUEST_SYSTEM_TITLE)
		this.props.QuestItemsLoad()
		this.props.QuestRequirementsLoad()
	}

	componentWillUnmount() 
	{
		
	}

	componentDidUpdate(prevProps, prevState)
	{
		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()

			if (prevState.dialogType === 'quest_export')
			{
				saveAs(new Blob([this.props.fileData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${TEXT.QUEST_SYSTEM_QUEST_TITLE}.xlsx`)
				this.props.ClearProps(['fileData'])
			}
			else
			{
				prevState.tableTab === 0 && prevState.pageType === 'view_item_localizations' && prevState.dialogType === 'localization_download' && this.excelRef.current && this.excelRef.current.click() ||
				prevState.tableTab === 0 && prevState.pageType === 'view_item_localizations' && prevState.dialogType !== 'localization_download' && this.props.QuestLocalizationsLoad(prevState.generalData) ||
				prevState.tableTab === 0 && prevState.pageType !== 'view_item_localizations' && prevState.dialogType !== 'localization_download' && this.props.QuestItemsLoad() ||
				prevState.tableTab === 1 && this.props.QuestConfigLoad() ||
				prevState.tableTab === 3 && this.props.QuestRequirementsLoad()
			}
		}
	}

	render()
	{
		const { classes } = this.props
		
		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.state.isPageOpen ?  this.renderPage() : this.renderTableTabs()}
				{this.renderDialog()}
			</div>
		)
	}

	renderPage = () =>
	{
		return (
			<>
				{this.state.pageType === 'json_editor' && this.renderJsonEditor()}
				{this.state.pageType === 'view_items' && this.renderQuestItemsTable()}
				{this.state.pageType === 'view_item_localizations' && this.renderLocalizationsTable()}
			</>
		)
	}

	renderTableTabs = () =>
	{
		const { classes } = this.props
		return (
			<>
				<div className={clsx(classes.divRow, classes.alignCenter, classes.importBar)}>
					<CmsControlPermission
						control={
							<Button
								variant={'contained'}
								color={'primary'}
								onClick={this.handleAction('quest_import', {})}
								className={clsx(classes.buttonLeft)}
								startIcon={<Icons.IconAdd/>}
							>
								{ TEXT.QUEST_SYSTEM_BUTTON_IMPORT }
							</Button>
						}
						link={''}
						attribute={''}
					/>
					<CmsControlPermission
						control={
							<Button
								variant={'contained'}
								color={'primary'}
								onClick={this.handleAction('quest_export', {})}
								className={clsx(classes.buttonLeft)}
								startIcon={<Icons.ExportIcon/>}
							>
								{ TEXT.QUEST_SYSTEM_BUTTON_EXPORT }
							</Button>
						}
						link={''}
						attribute={''}
					/>
				</div>
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
						<Tab label={TEXT.QUEST_SYSTEM_ITEM_TITLE}/>
						<Tab label={TEXT.QUEST_SYSTEM_CONFIG_TITLE} />
						<Tab label={TEXT.QUEST_SYSTEM_QUEST_TITLE} />
						<Tab label={TEXT.QUEST_SYSTEM_REQUIREMENT_TITLE} />
					</Tabs>
					{
						this.state.tableTab !== 2 && this.actionsExtend.createElement(this.actionsExtend)
					}
				</div>
				<CmsTabPanel value={this.state.tableTab} index={0} >
				{
					this.renderItemsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={1} >
				{
					this.renderEXPsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={2} >
				{
					this.renderQuestsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={3} >
				{
					this.renderRequirementsTable()
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
					this.state.dialogType === 'quest_import' && `${TEXT.QUEST_SYSTEM_BUTTON_IMPORT} ${TEXT.QUEST_SYSTEM_QUEST_TITLE}` ||

                    this.state.dialogType === 'item_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'item_restore' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'item_add' && TEXT.QUEST_SYSTEM_BUTTON_NEW_ITEM ||
					this.state.dialogType === 'item_edit' && TEXT.QUEST_SYSTEM_BUTTON_EDIT_ITEM ||

					this.state.dialogType === 'config_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'config_restore' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'config_add' && TEXT.QUEST_SYSTEM_BUTTON_NEW_CONFIG ||
					this.state.dialogType === 'config_edit' && TEXT.QUEST_SYSTEM_BUTTON_EDIT_CONFIG ||

					this.state.dialogType === 'localization_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'localization_restore' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'localization_add' && TEXT.QUEST_SYSTEM_BUTTON_NEW_LOCALIZATION ||
					this.state.dialogType === 'localization_edit' && TEXT.QUEST_SYSTEM_BUTTON_EDIT_LOCALIZATION ||
					this.state.dialogType === 'localization_download' && TEXT.QUEST_SYSTEM_BUTTON_DOWNLOAD_LOCALIZATIONS ||
					
					this.state.dialogType === 'requirement_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'requirement_restore' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'requirement_add' && TEXT.QUEST_SYSTEM_BUTTON_NEW_REQUIREMENT ||
					this.state.dialogType === 'requirement_edit' && TEXT.QUEST_SYSTEM_BUTTON_EDIT_REQUIREMENT ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
				confirmDisable={(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore') || this.state.dialogType === 'localization_download') ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'item_delete' || this.state.dialogType === 'item_restore') && this.renderDeleteRestoreItem()
			}
			{
				(this.state.dialogType === 'config_delete' || this.state.dialogType === 'config_restore') && this.renderDeleteRestoreEXP()
			}
			{
				(this.state.dialogType === 'localization_delete' || this.state.dialogType === 'localization_restore') && this.renderDeleteRestoreLocalization()
			}
			{
				(this.state.dialogType === 'requirement_delete' || this.state.dialogType === 'requirement_restore') && this.renderDeleteRestoreRequirement()
			}
			{
				(this.state.dialogType === 'item_add' || this.state.dialogType === 'item_edit') && this.renderAddEditItem()
			}
			{
				(this.state.dialogType === 'config_add' || this.state.dialogType === 'config_edit') && this.renderAddEditEXP()
			}
			{
				(this.state.dialogType === 'localization_add' || this.state.dialogType === 'localization_edit') && this.renderAddEditLocalization()
			}
			{
				this.state.dialogType === 'localization_download' && this.renderDownloadLocalization()
			}
			{
				(this.state.dialogType === 'requirement_add' || this.state.dialogType === 'requirement_edit') && this.renderAddEditRequirement()
			}
			{
				this.state.dialogType === 'quest_import' && this.renderImportReward()
			}
			</ModalDialog>
		)
	}

	customFilterAndSearch = (term, strData, columnDef, isDate = false) =>
	{
		var terms = term.split(';')

		if (isDate)
		{
			strData = strData === 0 ? '' : moment.utc(strData).format(FULLTIME_FORMAT)
		}

		return _.some(terms, value =>
		{
			if (value.length > 0)
			{
				return columnDef.searchAlgorithm === 'includes' ? _.includes(strData, value) : _.startsWith(strData, value)
			}

			return false
		})
	}

	handleExportDialog = (isOpen) =>
	{
		this.setState({
			isExportOpen: isOpen,
			dialogType: isOpen ? this.state.dialogType : ''
		})
	}

	formatExcelData = () =>
	{
		console.log('formatExcelData', this.state.dialogType)
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

		if (this.state.tableTab === 0)
		{
			if (this.state.pageType === 'view_item_localizations')
			{
				if (this.state.dialogType === 'localization_download')
				{
					result = this.props.fileData
				}

				result = _.map(result, value => {
					let { createdAt, modifiedAt, deletedAt, ...others} = value
					createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
					modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
					deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
					return {...others, itemId: this.state.generalData.id, itemCode: this.state.generalData.code, createdAt, modifiedAt, deletedAt}
				})
			}
			/* else
			{
				result = _.map(result, value => {
					let { createdAt, modifiedAt, deletedAt, requirement, configs, pickingCondition, ...others} = value
					requirement = JSON.stringify(requirement)
					configs = JSON.stringify(configs)
					pickingCondition = JSON.stringify(pickingCondition.preconditions ? pickingCondition : { ...pickingCondition, preconditions: null })
					createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
					modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
					deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
					return {...others, requirement, configs, pickingCondition, createdAt, modifiedAt, deletedAt}
				})
			} */
		}
		/* else if (this.state.tableTab === 1)
		{
			result = _.map(result, value => {
				let { createdAt, modifiedAt, deletedAt, tierOperator, quantityConfig, ...others} = value
				tierOperator = JSON.stringify(tierOperator)
				quantityConfig = JSON.stringify(quantityConfig)
				createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
				modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
				deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
				return {...others, tierOperator, quantityConfig, createdAt, modifiedAt, deletedAt}
			})
		}
		else if (this.state.tableTab === 2 || this.state.tableTab === 3)
		{
			result = _.map(result, value => {
				let { createdAt, modifiedAt, deletedAt, ...others} = value
				createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
				modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
				deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
				return {...others, createdAt, modifiedAt, deletedAt}
			})
		} */
        
        console.log('formatExcelData:', result)
		return result
	}

	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_ITEM_ID, field: 'itemId' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_ITEM_CODE, field: 'itemCode' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_CODE, field: 'code' },
			{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_DIFFICULTY, field: 'difficulty' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TYPE, field: 'type' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_REQUIREMENT, field: 'requirement' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_CONFGIS, field: 'configs' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_LEVEL, field: 'level' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TIER_OPERATOR, field: 'tierOperator' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_QUANTITY_CONFIG, field: 'quantityConfig' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TITLE, field: 'title' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_DESCRIPTION, field: 'description' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_PICKING_CONDITION, field: 'pickingCondition' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_LANGUAGE, field: 'lang' },
			{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_NAME, field: 'name' },
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
		let columns = []
		if (this.state.tableTab === 0)
		{
			if (this.state.pageType === 'view_item_localizations')
			{
				columns = [
					{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_ITEM_ID, field: 'itemId' },
					{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_ITEM_CODE, field: 'itemCode' },
					{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
					{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_LANGUAGE, field: 'lang' },
					{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TITLE, field: 'title' },
					{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_DESCRIPTION, field: 'description' },
				]
			}
			/* else
			{
				columns = [
					{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
					{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_CODE, field: 'code' },
					{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
					{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_DIFFICULTY, field: 'difficulty' },
					{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TYPE, field: 'type' },
					{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_REQUIREMENT, field: 'requirement' },
					{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_CONFGIS, field: 'configs' },
					{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TITLE, field: 'title' },
					{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_DESCRIPTION, field: 'description' },
					{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_PICKING_CONDITION, field: 'pickingCondition' },
				]
			} */
		}
		/* else if (this.state.tableTab === 1)
		{
			columns = [
				{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
				{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
				{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_LEVEL, field: 'level' },
				{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TIER_OPERATOR, field: 'tierOperator' },
				{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_QUANTITY_CONFIG, field: 'quantityConfig' },
			]
		}
		else if (this.state.tableTab === 3)
		{
			columns = [
				{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
				{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_NAME, field: 'name' },
				{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TYPE, field: 'type' },
				{ title: TEXT.QUEST_SYSTEM_TABLE_HEADER_DESCRIPTION, field: 'description' },
			]
		} */

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
			case 'name':	
			case 'code':
			case 'title':
			case 'description':		    
				data = rawData.trim()
				if (_.isEmpty(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				
				break
			case 'type':    
                data = rawData.trim()
				if (_.isEmpty(data) || !_.includes(this.props.TYPES, data))
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
			case 'difficulty':
                data = rawData.trim()
				if (_.isEmpty(data) || !_.includes(this.props.DIFFICULTIES, data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break	
			case 'requirement':
				try
				{
					data = JSON.parse(rawData.trim())
					if (!data.hasOwnProperty('name') || isNaN(data.amount))
					{
						throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
					}
				}
				catch(e)
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break
			case 'pickingCondition':
				try
				{
					data = JSON.parse(rawData.trim())
					if (!data.hasOwnProperty('userLevel') || !data.hasOwnProperty('entertainmentLevel' || !data.hasOwnProperty('preconditions')  || !Array.isArray(data.precondition)))
					{
						throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
					}
				}
				catch(e)
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break	
			case 'level':
				data = rawData
				if (isNaN(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
	
				break	
			case 'quantityConfig':
				try
				{
					data = JSON.parse(rawData.trim())
					if (isNaN(data.easy) || isNaN(data.medium) || isNaN(data.hard))
					{
						throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
					}
				}
				catch(e)
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break
			case 'tierOperator':
				try
				{
					data = JSON.parse(rawData.trim())
					if (!data.hasOwnProperty('tier1') || 
						!data.hasOwnProperty('tier2') || 
						!data.hasOwnProperty('tier3') ||
						!data.tier1?.hasOwnProperty('divider') || 
						!data.tier1?.hasOwnProperty('multiplier') || 
						!data.tier2?.hasOwnProperty('divider') || 
						!data.tier2?.hasOwnProperty('multiplier') || 
						!data.tier3?.hasOwnProperty('divider') || 
						!data.tier3?.hasOwnProperty('multiplier'))
					{
						throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
					}
				}
				catch(e)
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break		
			case 'configs':
				try
				{
					data = JSON.parse(rawData.trim())
				}
				catch(e)
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break
			case 'lang':
				data = rawData.trim()
				if (_.isEmpty(data) || _.find(LANGUAGE_LIST_SERVER, language => (language.code === data)) === undefined)
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
			this.state.tableTab === 0 && this.state.pageType === 'view_item_localizations' && this.props.QuestLocalizationsLoad(this.state.generalData) // ||
			/* this.state.tableTab === 0 && this.state.pageType !== 'view_item_localizations' && this.props.QuestItemsLoad() ||
			this.state.tableTab === 1 && this.props.QuestConfigLoad() ||
			this.state.tableTab === 3 && this.props.QuestRequirementsLoad() */
		}
	}

	handleAction = (name, data, index) => (evt) =>
	{
		switch (name)
		{
			case 'back':
				this.setState({
					isPageOpen: false,
					viewConfigs: 'text',
					pageType: '',
					dialogType: '',
					rowData: {},
					generalData: {}
				})

				break
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
						this.state.dialogType === 'item_delete' && this.props.QuestItemDelete(row) ||
						this.state.dialogType === 'item_restore' && this.props.QuestItemRestore(row)

						this.state.dialogType === 'config_delete' && this.props.QuestConfigDelete(row, TEXT.QUEST_SYSTEM_TABLE_HEADER_LEVEL) ||
						this.state.dialogType === 'config_restore' && this.props.QuestConfigRestore(row, TEXT.QUEST_SYSTEM_TABLE_HEADER_LEVEL) ||

						this.state.dialogType === 'localization_delete' && this.props.QuestLocalizationDelete(row) ||
						this.state.dialogType === 'localization_restore' && this.props.QuestLocalizationRestore(row) ||

						this.state.dialogType === 'requirement_delete' && this.props.QuestRequirementDelete(row) ||
						this.state.dialogType === 'requirement_restore' && this.props.QuestRequirementRestore(row)
					})
				}
				else
				{
					this.state.dialogType === 'quest_import' && this.props.ResourcesImport('quest', this.state.rowData) ||

					this.state.dialogType === 'item_add' && this.props.QuestItemAdd(this.state.rowData) ||
					this.state.dialogType === 'item_edit' && this.props.QuestItemEdit(this.state.rowData, true) ||
					this.state.pageType === 'json_editor' && this.props.QuestItemEdit(this.state.generalData, true) ||
					this.state.dialogType === 'item_delete' && this.props.QuestItemDelete(this.state.rowData) ||
					this.state.dialogType === 'item_restore' && this.props.QuestItemRestore(this.state.rowData) ||

					this.state.dialogType === 'config_add' && this.props.QuestConfigAdd(this.state.rowData) ||
					this.state.dialogType === 'config_edit' && this.props.QuestConfigEdit(this.state.rowData, true) ||
					this.state.dialogType === 'config_delete' && this.props.QuestConfigDelete(this.state.rowData, TEXT.QUEST_SYSTEM_TABLE_HEADER_LEVEL) ||
					this.state.dialogType === 'config_restore' && this.props.QuestConfigRestore(this.state.rowData, TEXT.QUEST_SYSTEM_TABLE_HEADER_LEVEL) ||

					this.state.dialogType === 'localization_add' && this.props.QuestLocalizationAdd({ ...this.state.rowData, lang: this.state.rowData.lang.code, itemId: this.state.generalData.id, }) ||
					this.state.dialogType === 'localization_edit' && this.props.QuestLocalizationEdit({ ...this.state.rowData, lang: this.state.rowData.lang.code }, true) ||
					this.state.dialogType === 'localization_delete' && this.props.QuestLocalizationDelete(this.state.rowData) ||
					this.state.dialogType === 'localization_restore' && this.props.QuestLocalizationRestore(this.state.rowData) ||
					this.state.dialogType === 'localization_download' && this.props.QuestLocalizationsLoadAll(this.state.rowData) ||

					this.state.dialogType === 'requirement_add' && this.props.QuestRequirementAdd(this.state.rowData) ||
					this.state.dialogType === 'requirement_edit' && this.props.QuestRequirementEdit(this.state.rowData, true) ||
					this.state.dialogType === 'requirement_delete' && this.props.QuestRequirementDelete(this.state.rowData) ||
					this.state.dialogType === 'requirement_restore' && this.props.QuestRequirementRestore(this.state.rowData)
				}

				break
			case 'item_add':
			case 'item_edit':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: data,
					hasUserLevel: data.userLevel === null,
					hasEntertainmentLevel: data.entertainmentLevel === null
				})

				break
			case 'quest_export':
				this.setState(
					{
						dialogType: name,
						rowData: data
					},
					() =>
					{
						this.props.ResourcesExport('quest')
					}
				)

				break	
			case 'quest_import':	
			case 'item_delete':
			case 'item_restore':
			case 'config_add':
			case 'config_edit':
			case 'config_delete':
			case 'config_restore':
			case 'localization_add':
			case 'localization_edit':
			case 'localization_delete':
			case 'localization_restore':
			case 'localization_download':
			case 'requirement_add':
			case 'requirement_edit':
			case 'requirement_delete':
			case 'requirement_restore':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})

				break
			case 'json_editor':
			case 'view_items':
				this.setState({
					isPageOpen: true,
					pageType: name,
					generalData: data
				})
				
				break
			case 'view_item_localizations':	
				this.setState(
					{
						isPageOpen: true,
						pageType: name,
						generalData: data
					},
					()=>
					{
						this.props.QuestLocalizationsLoad(data)
					}
				)
					
				break
			case 'tableTab':
				(data !== this.state.tableTab) && this.setState(
					{
						tableTab: data,
						isMultiSelectMode: false,
					},
					() =>
					{
						if (this.state.tableTab === 0)
						{
							this.props.QuestItemsLoad()
							this.props.QuestRequirementsLoad()
						}
						else if (this.state.tableTab === 1)
						{
							this.props.QuestConfigLoad()
						}
						else if (this.state.tableTab === 3)
						{
							this.props.QuestRequirementsLoad()
						}

						this.searchText = ''
						this.props.ClearProps(['quests'])
					}
				)

				break
			case 'viewConfigs':	
				this.setState({
					errorConfigs: false,
					viewConfigs: data,
				})

				break
			case 'configs':	
				this.setState({
					errorConfigs: false,
					generalData: {
						...this.state.generalData, 
						[name]: data
					}
				})

				break
			case 'hasUserLevel':
				this.setState({
					hasUserLevel: !this.state.hasUserLevel,
					rowData: {
						...this.state.rowData, 
						userLevel: !this.state.hasUserLevel ? null : 0
					}
				})

				break
			case 'hasEntertainmentLevel':
				this.setState({
					hasEntertainmentLevel: !this.state.hasEntertainmentLevel,
					rowData: {
						...this.state.rowData, 
						entertainmentLevel: !this.state.hasEntertainmentLevel ? null : 0
					}
				})
				break		
			case 'preconditions':
				this.setState({
					rowData: {
						...this.state.rowData,
						preconditions: _.map(this.state.rowData.preconditions,(precondition,idx)=>index===idx ? data : precondition)
					}
				})
				break	
			case 'addPreconditions':
				this.setState({
					rowData: {
						...this.state.rowData,
						preconditions: [...(this.state.rowData.preconditions || []), '']
					}
				})
				break
			case 'removePreconditions':
				this.setState({
					rowData: {
						...this.state.rowData,
						preconditions: _.filter(this.state.rowData.preconditions, (precondition,idx)=> index!==idx)
					}
				})
				break
			case 'type':
				this.setState({
                    rowData: {
						...this.state.rowData, 
						type : data,
						name: '',
						amount: 0
					}
                })

				break	
            default:
                this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: _.includes(['amount', 'level', 'easy', 'medium', 'hard', 'userLevel', 'entertainmentLevel'], name) ? (data === '' ? 0 : (isNaN(data) ? this.state.rowData[name] : parseInt(data))) : data
					}
                })
		}		
	}

    validateSubmit = (submit_data) =>
	{
		if (this.state.dialogType === 'quest_import')
		{
			return _.isEmpty(submit_data.file)
		}

		const { 
			code, 
			type, 
			status, 
			difficulty, 
			name,
            divider_1,
            multiplier_1,
            divider_2,
            multiplier_2,
            divider_3,
            multiplier_3,
			title,
			description,
			lang,
		} = submit_data

		let result = true

		if (this.state.tableTab === 0)
		{
			if (_.includes(this.state.dialogType, 'localization_'))
			{
				result = _.some(Object.keys({ lang, title, description }), key => {
					return _.isEmpty(submit_data[key])
				})
			}
			else
			{
				result = _.some(Object.keys({ code, type, status, difficulty, name, title, description }), key => {
					return _.isEmpty(submit_data[key])
				})
			}
		}
		else if (this.state.tableTab === 1)
		{
			result = _.some(Object.keys({ status, divider_1, multiplier_1, divider_2, multiplier_2, divider_3, multiplier_3 }), key => {
				return _.isEmpty(submit_data[key])
			})
		}
		else if (this.state.tableTab === 3)
		{
			result = _.some(Object.keys({ name, type, description }), key => {
				return _.isEmpty(submit_data[key])
			})
		}
		
		return result
	}

	renderItemsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_CODE, field: 'code', width: 250,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_DIFFICULTY, field: 'difficulty', width: 150,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TITLE, field: 'title', width: 250,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_DESCRIPTION, field: 'description', width: 250,
                        },
						{
                            title: () => this.renderStatusTitleColumn(),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.status, columnDef)
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_REQUIREMENT, field: 'requirement', nofilter: true, sorting: false, width: 250,
							render: rowData => this.renderJsonColumn(rowData.requirement, ['name', 'amount'], [TEXT.QUEST_SYSTEM_TABLE_HEADER_NAME, TEXT.QUEST_SYSTEM_TABLE_HEADER_AMOUNT])
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_PICKING_CONDITION, field: 'pickingCondition', nofilter: true, sorting: false, width: 300,
							render: rowData => this.renderJsonColumn(rowData.pickingCondition, ['userLevel', 'entertainmentLevel','preconditions'], [TEXT.QUEST_SYSTEM_TABLE_HEADER_USER_LEVEL, TEXT.QUEST_SYSTEM_TABLE_HEADER_ENTERTAINMENT_LEVEL,TEXT.QUEST_SYSTEM_TABLE_HEADER_PRECONDITIONS])
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_CONFGIS, field: 'configs', nofilter: true, sorting: false, width: 150,
							render: rowData => this.renderEditJsonsColumn(rowData)
                        },
                        {
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TIME, placeholder: TEXT.QUEST_SYSTEM_START_DATE, field: 'time', width: 250,
							render: rowData => this.renderTimeColumn(rowData.time),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.time?.startDate || 0, columnDef, true)
                        },
						{
							title: TEXT.QUEST_SYSTEM_END_DATE, placeholder: TEXT.QUEST_SYSTEM_END_DATE, field: 'time', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.time?.endDate || 0, columnDef, true)
						},
						{
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 250,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true)
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true)
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
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true)
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconView {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('view_item_localizations', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUEST_SYSTEM_TOOLTIP_LOAD_LOCALIZATION),
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
								rowData = {
									...rowData,
									name: rowData.requirement.name, 
									amount: rowData.requirement.amount,
									userLevel: rowData.pickingCondition.userLevel, 
									entertainmentLevel: rowData.pickingCondition.entertainmentLevel,
									preconditions: rowData.pickingCondition.preconditions || []
								}

								delete rowData.requirement
								delete rowData.pickingCondition
								this.handleAction('item_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUEST_SYSTEM_BUTTON_EDIT_ITEM),
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
								this.handleAction('item_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUEST_SYSTEM_BUTTON_DELETE_ITEM),
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
								this.handleAction('item_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.QUEST_SYSTEM_BUTTON_RESTORE_ITEM),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.questItems || []}

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

	renderAddEditItem = () =>
	{
		const { classes } = this.props
		
		return (
			<div>
				<div className={clsx(classes.divRow, classes.justifyBetween)}>
					<div className={clsx(classes.divColumn)} style={{ width: '45%'}}>
						<div className={clsx(classes.divColumn)}>
							<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_CODE}</Typography>
							<TextField
								className={clsx(classes.inputTextField, classes.inputText)}
								value={this.state.rowData.code || ''}
								margin="normal"
								fullWidth
								variant={'outlined'}
								onChange={(evt) => { this.handleAction('code', evt.target.value)(evt) }}
								disabled={this.state.dialogType === 'item_edit'}
							/>
						</div>
						<div className={clsx(classes.divColumn)}>
							<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_TITLE}</Typography>
							<TextField
								className={clsx(classes.inputTextField, classes.inputText)}
								value={this.state.rowData.title || ''}
								margin="normal"
								fullWidth
								variant={'outlined'}
								onChange={(evt) => { this.handleAction('title', evt.target.value)(evt) }}
							/>
						</div>
						<div className={clsx(classes.divColumn)}>
							<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_TYPE}</Typography>
							<Autocomplete
								autoComplete
								autoSelect
								filterSelectedOptions
								value={this.state.rowData.type}
								options={this.props.TYPES || []}
								onChange={(evt, value) => {
									this.handleAction('type', value)(evt)
								}}
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
							<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_DIFFICULTY}</Typography>
							<Autocomplete
								autoComplete
								autoSelect
								filterSelectedOptions
								value={this.state.rowData.difficulty}
								options={this.props.DIFFICULTIES || []}
								onChange={(evt, value) => {
									this.handleAction('difficulty', value)(evt)
								}}
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
							<Typography>{TEXT.TABLE_HEADER_STATUS}</Typography>
							<Autocomplete
								autoComplete
								autoSelect
								filterSelectedOptions
								value={this.state.rowData.status}
								options={this.props.STATUSES || []}
								onChange={(evt, value) => {
									this.handleAction('status', value)(evt)
								}}
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
							<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_DESCRIPTION}</Typography>
							<TextField
								className={clsx(classes.inputTextField, classes.inputText)}
								value={this.state.rowData.description || ''}
								margin="normal"
								fullWidth
								variant={'outlined'}
								onChange={(evt) => { this.handleAction('description', evt.target.value)(evt) }}
							/>
						</div>
					</div>
				</div>
				{
					this.state.rowData.type === 'Event' &&
					<div className={clsx(classes.divColumn)}>
						<Typography>{`${TEXT.QUEST_SYSTEM_TABLE_HEADER_TIME} (${TEXT.TABLE_HEADER_UTC_0})`}</Typography>
						<div className={clsx(classes.divColumn, classes.divHeight, classes.cmsDate)}>
							<CmsDate
								views={['date', 'hours', 'minutes']}
								enableFullTimeFormat={true}
								disableCheckMaxRange={true}
								raiseSubmitOnMounted={true}
								disableToolbar={false} 
								onDateSubmit={(data) => {
									this.handleAction('time', data)(null)
								}}
								initDate={
									this.state.rowData.time
									? 
									{ 
										date_begin: Utils.convertToLocalTime(this.state.rowData.time.startDate), 
										date_end: Utils.convertToLocalTime(this.state.rowData.time.endDate) 
									} 
									: null
								}
							/>
						</div>
					</div>
				}
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_REQUIREMENT}</Typography>
					<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
						<Autocomplete
							autoComplete
							autoSelect
							filterSelectedOptions
							value={this.state.rowData.name || ''}
							options={_.reduce(this.props.questRequirements || [], (result, requirement) => {
								return (requirement.deletedAt === 0 && requirement.type === this.state.rowData.type) ? [...result, requirement.name] : result
							}, [])}
							onChange={(evt, value) => {
								this.handleAction('name', value)(evt)
							}}
							renderInput={(params) => (
								<TextField {...params}
									variant="outlined"
									label={TEXT.QUEST_SYSTEM_TABLE_HEADER_NAME}
								/>
							)}
							classes={{
								root: clsx(classes.autoComplete, classes.marginRight, classes.marginBottom),
								input: classes.autoCompleteInput,
								inputRoot: classes.autoCompleteInputRoot
							}}
							fullWidth
						/>
						<TextField
							className={clsx(classes.inputTextField, classes.marginTop)}
							value={this.state.rowData.amount || 0}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('amount', evt.target.value)(evt) }}
							label={TEXT.QUEST_SYSTEM_TABLE_HEADER_AMOUNT}
						/>
					</div>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_PICKING_CONDITION}</Typography>
					<Typography style={{fontSize: '0.75rem', fontWeight: 500}}>{TEXT.QUEST_SYSTEM_TOOLTIP_SET_NULL}</Typography>
					<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
						<div className={clsx(classes.root, classes.divRow, classes.justifyBetween, classes.alignCenter, classes.marginRight)}>
							<TextField
								className={clsx(classes.inputTextField, classes.marginTop)}
								value={this.state.hasUserLevel ? '' : (this.state.rowData.userLevel || 0)}
								margin="normal"
								fullWidth
								variant={'outlined'}
								onChange={(evt) => { this.handleAction('userLevel', evt.target.value)(evt) }}
								label={TEXT.QUEST_SYSTEM_TABLE_HEADER_USER_LEVEL}
								disabled={this.state.hasUserLevel}
							/>
							<Checkbox
								color={'primary'}
								checked={this.state.hasUserLevel}
								onChange={(evt, checked) => {
									this.handleAction('hasUserLevel', checked)(evt)
								}}
							/>
						</div>
						<div className={clsx(classes.root, classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<TextField
								className={clsx(classes.inputTextField, classes.marginTop)}
								value={this.state.hasEntertainmentLevel ? '' : (this.state.rowData.entertainmentLevel || 0)}
								margin="normal"
								fullWidth
								variant={'outlined'}
								onChange={(evt) => { this.handleAction('entertainmentLevel', evt.target.value)(evt) }}
								label={TEXT.QUEST_SYSTEM_TABLE_HEADER_ENTERTAINMENT_LEVEL}
								disabled={this.state.hasEntertainmentLevel}
							/>
							<Checkbox
								color={'primary'}
								checked={this.state.hasEntertainmentLevel}
								onChange={(evt, checked) => {
									this.handleAction('hasEntertainmentLevel', checked)(evt)
								}}
							/>
						</div>
					</div>
					<div className={clsx(classes.divColumn)}>
						<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_PRECONDITIONS}</Typography>
						<div style={{marginBottom: 15, paddingTop: 10, borderTop: `1px ${defaultBorderColor} solid`, borderBottom: `1px ${defaultBorderColor} solid`, minHeight: 190, maxHeight: 190, overflow:'auto'}}>
						{
							_.map(this.state.rowData.preconditions, (precondition, index) => (
								<div 
									className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)} 
									key={index} 
									
								>
									<TextField
										className={clsx(classes.inputTextField, classes.marginTop)}
										value={precondition || ''}
										margin="normal"
										fullWidth
										variant={'outlined'}
										onChange={(evt) => { this.handleAction('preconditions', evt.target.value, index)(evt) }}
										label={TEXT.QUEST_SYSTEM_TABLE_HEADER_PRECONDITION}
										disabled={this.state.preconditions}
									/>
									<Icons.IconRemove onClick={this.handleAction('removePreconditions','',index)} style={{marginLeft:10,cursor:'pointer'}}/>
								</div>
							))
						}
						</div>			
						<div>
							<Button
								variant='outlined'
								color={'default'}
								startIcon={<Icons.IconAdd />}
								onClick={this.handleAction('addPreconditions')}
							>
								{TEXT.QUEST_BUTTON_ADD_PRECONDITION}
							</Button> 
						</div>
					</div>
				</div>
			</div>
		)
	}

	renderDeleteRestoreItem = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'item_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.QUEST_SYSTEM_MESSAGE_DELETE_ITEMS, this.state.rowData.length) : TEXT.QUEST_SYSTEM_MESSAGE_DELETE_ITEM) ||
						this.state.dialogType === 'item_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.QUEST_SYSTEM_MESSAGE_RESTORE_ITEMS, this.state.rowData.length) : TEXT.QUEST_SYSTEM_MESSAGE_RESTORE_ITEM) ||
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
									{`${data.code} - ${data.type} - ${data.difficulty}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.code} - ${this.state.rowData.type} - ${this.state.rowData.difficulty}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderDeleteRestoreEXP = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'config_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.QUEST_SYSTEM_MESSAGE_DELETE_CONFIGS, this.state.rowData.length) : TEXT.QUEST_SYSTEM_MESSAGE_DELETE_CONFIG) ||
						this.state.dialogType === 'config_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.QUEST_SYSTEM_MESSAGE_RESTORE_CONFIGS, this.state.rowData.length) : TEXT.QUEST_SYSTEM_MESSAGE_RESTORE_CONFIG) ||
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
									{`${TEXT.QUEST_SYSTEM_TABLE_HEADER_LEVEL}: ${data.level} - ${data.status}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${TEXT.QUEST_SYSTEM_TABLE_HEADER_LEVEL}: ${this.state.rowData.level} - ${this.state.rowData.status}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderEXPsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_LEVEL, field: 'level', nofilter: true, sorting: false, width: 150,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_QUANTITY_CONFIG, field: 'quantityConfig', nofilter: true, sorting: false, width: 150,
							render: rowData => this.renderJsonColumn(rowData.quantityConfig, ['easy', 'medium', 'hard'], [TEXT.QUEST_SYSTEM_TABLE_HEADER_EASY, TEXT.QUEST_SYSTEM_TABLE_HEADER_MEDIUM, TEXT.QUEST_SYSTEM_TABLE_HEADER_HARD])
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TIER_1, field: 'tierOperator', nofilter: true, sorting: false, width: 150,
							render: rowData => this.renderJsonColumn(rowData.tierOperator.tier1, ['divider', 'multiplier'], [TEXT.QUEST_SYSTEM_TABLE_HEADER_DIVIDER, TEXT.QUEST_SYSTEM_TABLE_HEADER_MULTIPLIER])
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TIER_2, field: 'tierOperator', nofilter: true, sorting: false, width: 150,
							render: rowData => this.renderJsonColumn(rowData.tierOperator.tier2, ['divider', 'multiplier'], [TEXT.QUEST_SYSTEM_TABLE_HEADER_DIVIDER, TEXT.QUEST_SYSTEM_TABLE_HEADER_MULTIPLIER])
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TIER_3, field: 'tierOperator', nofilter: true, sorting: false, width: 150,
							render: rowData => this.renderJsonColumn(rowData.tierOperator.tier3, ['divider', 'multiplier'], [TEXT.QUEST_SYSTEM_TABLE_HEADER_DIVIDER, TEXT.QUEST_SYSTEM_TABLE_HEADER_MULTIPLIER])
                        },
						{
                            title: () => this.renderStatusTitleColumn(),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.status, columnDef)
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 250,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true)
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true)
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
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true)
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								rowData = {
									...rowData,
									easy: rowData.quantityConfig.easy,
									medium: rowData.quantityConfig.medium,
									hard: rowData.quantityConfig.hard,
									divider_1: rowData.tierOperator.tier1.divider,
									multiplier_1: rowData.tierOperator.tier1.multiplier,
									divider_2: rowData.tierOperator.tier2.divider,
									multiplier_2: rowData.tierOperator.tier2.multiplier,
									divider_3: rowData.tierOperator.tier3.divider,
									multiplier_3: rowData.tierOperator.tier3.multiplier,
								}

								delete rowData.quantityConfig
								delete rowData.tierOperator

								this.handleAction('config_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUEST_SYSTEM_BUTTON_EDIT_CONFIG),
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
								this.handleAction('config_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUEST_SYSTEM_BUTTON_DELETE_CONFIG),
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
								this.handleAction('config_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.QUEST_SYSTEM_BUTTON_RESTORE_CONFIG),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.questExps || []}

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

	renderAddEditEXP = () =>
	{
		const { classes } = this.props
		
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_LEVEL}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.marginTop, classes.marginRight)}
						value={this.state.rowData.level || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('level', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'config_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.TABLE_HEADER_STATUS}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.status}
						options={this.props.STATUSES || []}
						onChange={(evt, value) => {
							this.handleAction('status', value)(evt)
						}}
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
					<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_TIER_1}</Typography>
					<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
						<TextField
							className={clsx(classes.inputTextField, classes.marginTop, classes.marginRight)}
							value={this.state.rowData.divider_1 || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('divider_1', evt.target.value)(evt) }}
							label={TEXT.QUEST_SYSTEM_TABLE_HEADER_DIVIDER}
						/>
						<TextField
							className={clsx(classes.inputTextField, classes.marginTop)}
							value={this.state.rowData.multiplier_1 || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('multiplier_1', evt.target.value)(evt) }}
							label={TEXT.QUEST_SYSTEM_TABLE_HEADER_MULTIPLIER}
						/>
					</div>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_TIER_2}</Typography>
					<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
						<TextField
							className={clsx(classes.inputTextField, classes.marginTop, classes.marginRight)}
							value={this.state.rowData.divider_2 || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('divider_2', evt.target.value)(evt) }}
							label={TEXT.QUEST_SYSTEM_TABLE_HEADER_DIVIDER}
						/>
						<TextField
							className={clsx(classes.inputTextField, classes.marginTop)}
							value={this.state.rowData.multiplier_2 || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('multiplier_2', evt.target.value)(evt) }}
							label={TEXT.QUEST_SYSTEM_TABLE_HEADER_MULTIPLIER}
						/>
					</div>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_TIER_3}</Typography>
					<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
						<TextField
							className={clsx(classes.inputTextField, classes.marginTop, classes.marginRight)}
							value={this.state.rowData.divider_3 || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('divider_3', evt.target.value)(evt) }}
							label={TEXT.QUEST_SYSTEM_TABLE_HEADER_DIVIDER}
						/>
						<TextField
							className={clsx(classes.inputTextField, classes.marginTop)}
							value={this.state.rowData.multiplier_3 || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('multiplier_3', evt.target.value)(evt) }}
							label={TEXT.QUEST_SYSTEM_TABLE_HEADER_MULTIPLIER}
						/>
					</div>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_QUANTITY_CONFIG}</Typography>
					<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
						<TextField
							className={clsx(classes.inputTextField, classes.marginTop, classes.marginRight)}
							value={this.state.rowData.easy || 0}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('easy', evt.target.value)(evt) }}
							label={TEXT.QUEST_SYSTEM_TABLE_HEADER_EASY}
						/>
						<TextField
							className={clsx(classes.inputTextField, classes.marginTop, classes.marginRight)}
							value={this.state.rowData.medium || 0}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('medium', evt.target.value)(evt) }}
							label={TEXT.QUEST_SYSTEM_TABLE_HEADER_MEDIUM}
						/>
						<TextField
							className={clsx(classes.inputTextField, classes.marginTop)}
							value={this.state.rowData.hard || 0}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('hard', evt.target.value)(evt) }}
							label={TEXT.QUEST_SYSTEM_TABLE_HEADER_HARD}
						/>
					</div>
				</div>
			</div>
		)
	}

	renderAddEditLocalization = () =>
	{
		const { classes } = this.props
		
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_LANGUAGE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.lang}
						options={LANGUAGE_LIST_SERVER}
						getOptionLabel={option => (_.isEmpty(option) ? '' : `${option.name} (${option.code})`)}
						onChange={(evt, value) => {
							this.handleAction('lang', value)(evt)
						}}
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
						disabled={this.state.dialogType === 'localization_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_TITLE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.marginTop, classes.marginRight)}
						value={this.state.rowData.title || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('title', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_DESCRIPTION}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.marginTop, classes.marginRight)}
						value={this.state.rowData.description || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('description', evt.target.value)(evt) }}
					/>
				</div>
			</div>
		)
	}

	renderDownloadLocalization = () =>
	{
		const { classes } = this.props
		
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						disableClearable
						value={this.state.rowData.type || ''}
						options={this.props.TYPES}
						onChange={(evt, value) => {
							this.handleAction('type', value)(evt)
						}}
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
		)
	}

	renderImportReward = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<Typography>{TEXT.QUEST_SYSTEM_QUEST_FILE}</Typography>
				<CmsInputFile 
					name={'file'}
					value={this.state.rowData.file || []} 
					onChange={(file) => { this.handleAction('file', file)(null) }} 
					acceptFile={'.xlsx'}
				/>
			</div>
		)
	}

	renderAddEditRequirement = () =>
	{
		const { classes } = this.props
		
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.type}
						options={this.props.TYPES}
						onChange={(evt, value) => {
							this.handleAction('type', value)(evt)
						}}
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
						disabled={this.state.dialogType === 'requirement_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.marginTop, classes.marginRight)}
						value={this.state.rowData.name || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'requirement_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_DESCRIPTION}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.marginTop, classes.marginRight)}
						value={this.state.rowData.description || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('description', evt.target.value)(evt) }}
					/>
				</div>
			</div>
		)
	}

	renderDeleteRestoreLocalization = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'localization_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.QUEST_SYSTEM_MESSAGE_DELETE_LOCALIZATIONS, this.state.rowData.length) : TEXT.QUEST_SYSTEM_MESSAGE_DELETE_LOCALIZATION) ||
						this.state.dialogType === 'localization_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.QUEST_SYSTEM_MESSAGE_RESTORE_LOCALIZATIONS, this.state.rowData.length) : TEXT.QUEST_SYSTEM_MESSAGE_RESTORE_LOCALIZATION) ||
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
									{`${TEXT.QUEST_SYSTEM_TABLE_HEADER_LANGUAGE}: ${data.lang} - ${data.title}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${TEXT.QUEST_SYSTEM_TABLE_HEADER_LANGUAGE}: ${this.state.rowData.lang} - ${this.state.rowData.title}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderDeleteRestoreRequirement = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'requirement_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.QUEST_SYSTEM_MESSAGE_DELETE_REQUIREMENTS, this.state.rowData.length) : TEXT.QUEST_SYSTEM_MESSAGE_DELETE_REQUIREMENT) ||
						this.state.dialogType === 'requirement_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.QUEST_SYSTEM_MESSAGE_RESTORE_REQUIREMENTS, this.state.rowData.length) : TEXT.QUEST_SYSTEM_MESSAGE_RESTORE_REQUIREMENT) ||
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
									{`${data.name} - ${data.type}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.type}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderQuestsTable = () =>
	{
		const { classes } = this.props
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderSearchBar()}
                <CmsTable
                    columns={[
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_PROFILE_ID, field: 'profileId', width: 150,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 250,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true)
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true)
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
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true)
                        },
			
                    ]}

                    data={this.props.quests || []}

					detailPanel={({items}) => {
							return (
								<CmsTable
									columns={[
										{
											title: TEXT.QUEST_SYSTEM_TABLE_HEADER_PROCESS, 
											field: 'process', 
											width: 100,
										},
										{
											title: TEXT.QUEST_SYSTEM_TABLE_HEADER_REROLL_SLOT, 
											field: 'rerollSlot', 
											width: 100,
										},
										{
											title: TEXT.QUEST_SYSTEM_TABLE_HEADER_IS_CLAIMED, 
											field: 'isClaimed', 
											width: 100,
										},
										{
											title: TEXT.QUEST_SYSTEM_TABLE_HEADER_REFRESH_TIME_REMAINING, 
											field: 'refreshTimeRemaining', 
											width: 100,
										}
									]}
									data={items}
									options={{
											showTitle: false,
											search: false,
											filtering: false,
											sorting: false,
											emptyRowsWhenPaging: false, 
											tableMaxHeight: 290,
											selection: false,
											cellStyle: { ...defaultCellStyle, textAlign: 'center', height: 40 },
											headerStyle: { ...defaultHeaderStyle, textAlign: 'center', height: 40, borderTop: `1px ${defaultBorderColor} solid` },
										}}
								/>
							)
						}}
                    options={{
						actionsColumnIndex: -1,
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

					ignoredRender={this.state.isExportOpen}

					tableRef={this.tableRef}
                />
            </div>		
		)
	}

	renderLocalizationsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderItemGeneralTable()}
				{this.renderLocalizationsTableTitle()}
                <CmsTable
                    columns={[
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_LANGUAGE, field: 'lang', width: 150,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TITLE, field: 'title', width: 150,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_DESCRIPTION, field: 'description', width: 150,
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 250,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true)
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true)
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
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true)
                        },
			
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								rowData = { ...rowData, lang: _.find(LANGUAGE_LIST_SERVER, lang => (lang.code ===  rowData.lang)) || {}}
								this.handleAction('localization_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUEST_SYSTEM_BUTTON_EDIT_LOCALIZATION),
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
								this.handleAction('localization_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUEST_SYSTEM_BUTTON_DELETE_LOCALIZATION),
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
								this.handleAction('localization_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.QUEST_SYSTEM_BUTTON_RESTORE_LOCALIZATION),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.questLocalizations || []}

                    options={{
						actionsColumnIndex: -1,
                        showTitle: false,
                        search: true,
                        filtering: false,
						sorting: true,
                        pageSize: PAGE_SIZE,
						tableMaxHeight: TABLE_HEIGHT_1,
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

	renderRequirementsTable = () =>
	{
		const { classes } = this.props
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_NAME, field: 'name', width: 200,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_DESCRIPTION, field: 'description', width: 150,
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 250,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true)
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true)
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
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true)
                        },
			
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('requirement_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUEST_SYSTEM_BUTTON_EDIT_REQUIREMENT),
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
								this.handleAction('requirement_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUEST_SYSTEM_BUTTON_DELETE_REQUIREMENT),
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
								this.handleAction('requirement_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.QUEST_SYSTEM_BUTTON_RESTORE_REQUIREMENT),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.questRequirements || []}

                    options={{
						actionsColumnIndex: -1,
                        showTitle: false,
                        search: true,
                        filtering: false,
						sorting: true,
                        pageSize: PAGE_SIZE + 2,
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

	renderQuestItemsTable = () =>
	{
		const { classes } = this.props

		const items = _.filter(this.props.questItems, item => (_.includes(this.state.rowData.items, item.id)))

		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderQuestGeneralTable()}
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter, classes.itemTitle)}>
					<Typography className={clsx(classes.title)}>{TEXT.QUEST_SYSTEM_TABLE_HEADER_ITEMS}</Typography>
				</div>
				<CmsTable
                    columns={[
                        {
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_CODE, field: 'code', width: 150,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_DIFFICULTY, field: 'difficulty', width: 150,
                        },
						{
                            title: () => this.renderStatusTitleColumn(),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.status, columnDef)
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_REQUIREMENT, field: 'requirement', nofilter: true, sorting: false, width: 150,
							render: rowData => this.renderJsonColumn(rowData.requirement, ['name', 'amount'], [TEXT.QUEST_SYSTEM_TABLE_HEADER_NAME, TEXT.QUEST_SYSTEM_TABLE_HEADER_AMOUNT])
                        },
                    ]}

                    data={items}

                    options={{
						actionsColumnIndex: -1,
                        showTitle: false,
                        search: false,
                        filtering: false,
						sorting: false,
                        selection: true,
						paging: true,
						cellStyle: { ...defaultCellStyle, textAlign: 'center', height: 40 },
						headerStyle: { ...defaultHeaderStyle, textAlign: 'center', height: 40, borderTop: `1px ${defaultBorderColor} solid` },
                    }}

					ignoredRender={this.state.isDialogOpen || this.state.isImportOpen || this.state.isExportOpen}
                />
			</div>
		)
	}

	renderQuestGeneralTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderGeneralTableTitle()}
                <CmsTable
                    columns={[
                        {
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_PROFILE_ID, field: 'profileId', width: 150,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_REFRESH_TIME_REMAINING, field: 'refreshTimeRemaining', width: 200,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TIME_CREATED, field: 'timeCreated', width: 150,
                            render: rowData => this.renderSingleDateColumn(rowData.timeCreated),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.timeCreated, columnDef, true),
                        },
                    ]}

                    data={[this.state.rowData] || []}

                    options={{
						actionsColumnIndex: -1,
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
                />
            </div>		
		)
	}

	renderSearchBar = () =>
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.divColumn, classes.searchBar)}>
				<div className={clsx(classes.divRow, classes.divHeight)}>
					<div className={clsx(classes.divColumn, classes.divFullWidth)}>
						<Typography>{TEXT.QUEST_SYSTEM_TABLE_HEADER_PROFILE_ID}</Typography>
						<CmsSearch
							searchText={this.searchText}
							key={'profileId'}
							onSearchClick={(searchText) => {
								this.searchText = searchText
								this.props.QuestsLoad(searchText)
							}}
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
				{this.renderItemGeneralTable()}
				<div className={clsx(classes.root, classes.divColumn, classes.jsonEditor)}> 
					{this.renderJsonEditorTitle(TEXT.QUEST_SYSTEM_TABLE_HEADER_CONFGIS, 'viewConfigs', 'errorConfigs')}
					<JsonEditor
						key={this.state.viewConfigs}
						value={this.state.generalData.configs}
						onChange={(value) => this.handleAction('configs', value)(null)}
						onError={(errorConfigs) =>
						{
							errorConfigs = errorConfigs !== null
							this.setState({errorConfigs})
						}}
						mode={this.state.viewConfigs}
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
					<Typography className={clsx(classes.title)}>{TEXT.QUEST_SYSTEM_GENERAL_TITLE}</Typography>
					<div className={clsx(classes.divRow)}>
						<Button
							variant={'contained'}
							color={'primary'}
							onClick={this.handleAction('back')}
							className={clsx(classes.buttonLeft)}
						>
							{ TEXT.MODAL_BACK }
						</Button>
					</div>
					{
						this.state.pageType === 'view_item_localizations' &&
						<div className={clsx(classes.divRow)}>
							<Button
								variant={'contained'}
								color={'primary'}
								onClick={this.handleAction('localization_download', { ...this.state.generalData, cursor: '' })}
								className={clsx(classes.buttonLeft)}
								startIcon={<Icons.IconDownload/>}
							>
								{ TEXT.QUEST_SYSTEM_BUTTON_DOWNLOAD_LOCALIZATIONS }
							</Button>
						</div>
					}
				</div>
			</div>
		)
	}

	renderItemGeneralTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderGeneralTableTitle()}
                <CmsTable
                    columns={[
                        {
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_CODE, field: 'code', width: 150,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TYPE, field: 'type', width: 101,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_DIFFICULTY, field: 'difficulty', width: 101,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_TITLE, field: 'title', width: 150,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_DESCRIPTION, field: 'description', width: 150,
                        },
						{
                            title: () => this.renderStatusTitleColumn(), field: 'status', width: 101,
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_REQUIREMENT, field: 'requirement', width: 150,
							render: rowData => this.renderJsonColumn(rowData.requirement, ['name', 'amount'], [TEXT.QUEST_SYSTEM_TABLE_HEADER_NAME, TEXT.QUEST_SYSTEM_TABLE_HEADER_AMOUNT])
                        },
						{
                            title: TEXT.QUEST_SYSTEM_TABLE_HEADER_PICKING_CONDITION, field: 'pickingCondition', width: 200,
							render: rowData => this.renderJsonColumn(rowData.pickingCondition, ['userLevel', 'entertainmentLevel','preconditions'], [TEXT.QUEST_SYSTEM_TABLE_HEADER_USER_LEVEL, TEXT.QUEST_SYSTEM_TABLE_HEADER_ENTERTAINMENT_LEVEL,TEXT.QUEST_SYSTEM_TABLE_HEADER_PRECONDITIONS])
                        },
                    ]}

                    data={[this.state.generalData] || []}

                    options={{
						actionsColumnIndex: -1,
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
                />
            </div>		
		)
	}

	renderJsonEditorTitle = (title, view, error) =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter, classes.jsonEditorTitle)}>
					<Typography className={clsx(classes.title)}>{title}</Typography>
					<div className={clsx(classes.divRow)} >
						<Autocomplete
							key={view}
							fullWidth
							autoComplete
							autoSelect
							filterSelectedOptions
							value={this.state[view]}
							options={['text', 'tree']}
							getOptionLabel={option => option === 'tree' ? TEXT.OBJECT_MODE_TITLE : TEXT.PLAIN_MODE_TITLE}
							onChange={(evt, value) => {
								this.handleAction(view, value)(evt)
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
									key={view}
									variant={'contained'}
									color={'primary'}
									onClick={this.handleAction('submit')}
									className={clsx(classes.buttonLeft)}
									disabled={this.state[error]}
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

	renderLocalizationsTableTitle = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter, classes.jsonEditorTitle)}>
					<Typography className={clsx(classes.title)}>{TEXT.QUEST_SYSTEM_LOCALIZATION_TITLE}</Typography>
					<div className={clsx(classes.divRow)} >
						{this.actionsExtend.createElement(this.actionsExtend)}
					</div>
				</div>
			</div>
		)
	}

	renderTimeColumn = (rowData) =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divRow, classes.justifyStart)}>
				<div className={clsx(classes.divColumn, classes.alignStart)}>
					<div className={classes.divRow}>
						<div style={{ fontWeight: 'bold', marginRight: 10 }}>
						{
							`${TEXT.QUEST_SYSTEM_START_DATE}:`
						}
						</div>
						<div>
						{
							`${rowData && rowData.startDate !== 0
								? moment.utc(rowData.startDate).format(FULLTIME_FORMAT)
								: ''
							}`
						}
						</div>
					</div>
					<div className={classes.divRow}>
						<div style={{ fontWeight: 'bold', marginRight: 5 }}>
						{
							`${TEXT.QUEST_SYSTEM_END_DATE}:`
						}
						</div>
						<div>
						{
							`${rowData && rowData.endDate !== 0
								? moment.utc(rowData.endDate).format(FULLTIME_FORMAT)
								: ''
							}`
						}
						</div>
					</div>
				</div>
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

	renderSingleDateColumn = (fieldData) =>
	{
		return (
			<div>
			{
				`${fieldData > 0
					? moment.utc(fieldData).format(FULLTIME_FORMAT)
					: ''
				}`
			}
			</div>
		)
	}	

	renderChipsColumn = (fieldData, NUMBER_CHIPS = 1) =>
	{
		fieldData = _.map(fieldData,data=>({name:data}))

		const { classes } = this.props
		
		const chips = fieldData.slice(0, NUMBER_CHIPS)
		const hidden = (fieldData.length - chips.length > 0)
		let isOpen = false

		return (
			<Autocomplete
				// key={rowData.id}
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

	renderJsonColumn = (fieldData, keys, titles) =>
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.divRow, classes.justifyStart)}>
				<div className={clsx(classes.divColumn, classes.alignStart)}>
				{	
					_.map(keys, (key, idx) => {
						return (
							<div key={`${key}-${idx}`} className={clsx(classes.divRow,classes.alignCenter,classes.justifyCenter)}>
								<div style={{ fontWeight: 'bold', marginRight: 10 }}>
								{
									`${titles[idx]}:`
								}
								</div>
								{
									!_.isArray(fieldData[key])
									? (
										<div>
											{
												`${fieldData[key]}`
											}
										</div>
									)
									: (
										this.renderChipsColumn(fieldData[key])
									)
								}			
							</div>
						)
					})
				}	
				</div>
			</div>
		)
	}

	renderEditJsonsColumn = (rowData) =>
	{
		const { classes } = this.props

		return (
			<CmsControlPermission
				control={
					<Tooltip 
						title={
							TEXT.QUEST_SYSTEM_TOOLTIP_JSON_EDITOR.split('&').map((line, index) =>
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

	renderStatusTitleColumn = () =>
	{
		const { classes } = this.props

		return (
			<div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
				<span>{TEXT.TABLE_HEADER_STATUS}</span>
				<Tooltip 
					title={TEXT.QUEST_SYSTEM_TOOLTIP_STATUS}
					classes={{tooltip: classes.toolTip}}
					placement={'top'}
				>
					<Icon style={{ color: '#AEAEAE', marginLeft: 10 }} >help</Icon>
				</Tooltip>
			</div>
		)
	}
	
	renderViewItemsColumn = (rowData) =>
	{
		const { classes } = this.props

		return (
			<CmsControlPermission
				control={
					<Tooltip 
						title={
							TEXT.QUEST_SYSTEM_TOOLTIP_VIEW_ITEMS.split('&').map((line, index) =>
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
								this.handleAction('view_items', rowData)(event)
							}}
						>
							<Icons.IconView />
						</IconButton>
					</Tooltip>
				}
				link={''}
				attribute={''}
			/>
		)
	}
}

QuestSytem.propTypes =
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
	QuestItemsLoad: () =>
	{
		dispatch(ActionCMS.QuestItemsLoad())
	},
	QuestItemAdd: (item_data) =>
	{
		dispatch(ActionCMS.QuestItemAdd(item_data))
	},
	QuestItemEdit: (item_data, manual) =>
	{
		dispatch(ActionCMS.QuestItemEdit(item_data, manual))
	},
	QuestItemDelete: (item_data) =>
	{
		dispatch(ActionCMS.QuestItemDelete(item_data))
	},
	QuestItemRestore: (item_data) =>
	{
		dispatch(ActionCMS.QuestItemRestore(item_data))
	},
	QuestConfigLoad: () =>
	{
		dispatch(ActionCMS.QuestConfigLoad())
	},
	QuestConfigAdd: (config_data) =>
	{
		dispatch(ActionCMS.QuestConfigAdd(config_data))
	},
	QuestConfigEdit: (config_data, manual) =>
	{
		dispatch(ActionCMS.QuestConfigEdit(config_data, manual))
	},
	QuestConfigDelete: (config_data, message) =>
	{
		dispatch(ActionCMS.QuestConfigDelete(config_data, message))
	},
	QuestConfigRestore: (config_data, message) =>
	{
		dispatch(ActionCMS.QuestConfigRestore(config_data, message))
	},
	QuestsLoad: (profileId) =>
	{
		dispatch(ActionCMS.QuestsLoad(profileId))
	},
	QuestLocalizationsLoadAll: (item_data) =>
	{
		dispatch(ActionCMS.QuestLocalizationsLoadAll(item_data))
	},
	QuestLocalizationsLoad: (item_data) =>
	{
		dispatch(ActionCMS.QuestLocalizationsLoad(item_data))
	},
	QuestLocalizationAdd: (item_data) =>
	{
		dispatch(ActionCMS.QuestLocalizationAdd(item_data))
	},
	QuestLocalizationEdit: (item_data, manual) =>
	{
		dispatch(ActionCMS.QuestLocalizationEdit(item_data, manual))
	},
	QuestLocalizationDelete: (item_data) =>
	{
		dispatch(ActionCMS.QuestLocalizationDelete(item_data))
	},
	QuestLocalizationRestore: (item_data) =>
	{
		dispatch(ActionCMS.QuestLocalizationRestore(item_data))
	},
	QuestRequirementsLoad: () =>
	{
		dispatch(ActionCMS.QuestRequirementsLoad())
	},
	QuestRequirementAdd: (requirement_data) =>
	{
		dispatch(ActionCMS.QuestRequirementAdd(requirement_data))
	},
	QuestRequirementEdit: (requirement_data, manual) =>
	{
		dispatch(ActionCMS.QuestRequirementEdit(requirement_data, manual))
	},
	QuestRequirementDelete: (requirement_data) =>
	{
		dispatch(ActionCMS.QuestRequirementDelete(requirement_data))
	},
	QuestRequirementRestore: (requirement_data) =>
	{
		dispatch(ActionCMS.QuestRequirementRestore(requirement_data))
	},
	ResourcesExport: (service) =>
	{
		dispatch(ActionCMS.ResourcesExport(service))
	},
	ResourcesImport: (service, data) =>
	{
		dispatch(ActionCMS.ResourcesImport(service, data))
	},
})

export default compose(
	connect(mapStateToProps, mapDispatchToProps),
	withMultipleStyles(customStyle, styles),
	withRouter
)(QuestSytem);

