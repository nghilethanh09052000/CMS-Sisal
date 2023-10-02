import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import { saveAs } from 'file-saver'

import { Typography, Tabs, Tab, Button, TextField, Icon, Tooltip } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { WarningRounded } from '@material-ui/icons'

import { LANGUAGE_LIST_SERVER } from '../../Defines'
import Utils from '../../Utils'
// import API from '../../Api/API'


import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import TEXT from './Data/Text'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as Icons from '../../Components/CmsIcons'
import CmsControlPermission from '../../Components/CmsControlPermission'
import CmsTable from '../../Components/CmsTable'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
/* import CmsExcel from '../../Components/CmsExcel'
import CmsImport from '../../Components/CmsImport'
import { DEBUG_FIELD } from '../../Components/CmsImport/ExcelParser' */
import CmsTabPanel from '../../Components/CmsTabPanel'
import CmsInputFile from '../../Components/CmsInputFile'

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
	divMaxHeight: {
		maxHeight: '20vh',
		overflowY: 'auto'
	},
	textFieldMilestones: {
		marginRight:'10px'
	},
	importBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(2),
		marginBottom: theme.spacing(3)
	},
});

class QuizBank extends React.Component
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
		}

		this.tableRef = React.createRef();
		this.searchText = ''
		this.duplicatedTypes = [];
		this.duplicatedThemes = []
		this.actionsExtend = {
			createElement: (parentProps) =>
			{
				const { classes } = this.props

				/* const columns = this.getExcelColumns()
				const importColumns = this.getImportColumns()

				// Use "API" instead of Redux, as I don't want to refresh render
				// Use "bind" because of these functions will be pass as component property
				// to fixed: "this" keyword is undefined

				let apiAdd, apiUpdate, apiDelete
				if (this.state.tableTab === 0)
				{
					apiAdd = API.TypesAdd.bind(API)
					apiUpdate = API.TypesEdit.bind(API)
					apiDelete = API.TypesDelete.bind(API)
				}
				else if (this.state.tableTab === 1)
				{
					apiAdd = API.ThemesAdd.bind(API)
					apiUpdate = API.ThemesEdit.bind(API)
					apiDelete = API.ThemesDelete.bind(API)
				} */

				return (
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<div className={clsx(classes.divRow)}>
								{/* <CmsImport
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
									fileNameExtend={
										this.state.tableTab === 0 && `/${TEXT.QUIZ_BANK_FILE_NAME_TITLE_TYPE}` ||
										this.state.tableTab === 1 && `/${TEXT.QUIZ_BANK_FILE_NAME_TITLE_THEME}` ||
										this.state.tableTab === 2 && `/${TEXT.QUIZ_BANK_FILE_NAME_TITLE_CONFIG}` ||  ''
										
									}
								/> */}
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
														this.state.tableTab === 1 && this.handleAction('type_restore') ||
														this.state.tableTab === 0 && this.handleAction('theme_restore') ||
														null
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
												{
													this.state.tableTab === 1 && TEXT.TYPE_BUTTON_RESTORE_TYPE ||
													this.state.tableTab === 0 && TEXT.THEME_BUTTON_RESTORE_THEME ||
													''
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
														this.state.tableTab === 1 && this.handleAction('type_delete') ||
														this.state.tableTab === 0 && this.handleAction('theme_delete') ||
														''
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
												{
													this.state.tableTab === 1 && TEXT.TYPE_BUTTON_DELETE_TYPE ||
													this.state.tableTab === 0 && TEXT.THEME_BUTTON_DELETE_THEME ||
													''
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
													this.state.tableTab === 1 && this.handleAction('type_add', { name: '', status: '', answerType: '', maxAnswers: 0 }) ||
													this.state.tableTab === 0 && this.handleAction('theme_add', { name: '', description: '', status: '', language: {}, order: 0 })																								
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
											{
												this.state.tableTab === 1 && TEXT.TYPE_BUTTON_ADD_TYPE ||
												this.state.tableTab === 0 && TEXT.THEME_BUTTON_ADD_THEME ||
												// this.state.tableTab === 2 && TEXT.CONFIG_BUTTON_ADD_CONFIG || 
												''
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

	/* getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_NAME, field: 'name'},
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_MAX_ANSWERS, field: 'maxAnswers' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_ANSWER_TYPE, field: 'answerType' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_DESCRIPTION, field: 'description' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_LANGUAGE, field: 'language' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_ORDER, field: 'order' },
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
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' }
		]

		if (this.state.tableTab === 1)
		{
			columns = [
				... columns,
				{ title: TEXT.QUIZ_BANK_TABLE_HEADER_NAME, field: 'name' },
				{ title: TEXT.QUIZ_BANK_TABLE_HEADER_DESCRIPTION, field: 'description' },
				{ title: TEXT.QUIZ_BANK_TABLE_HEADER_STATUS, field: 'status'},
				{ title: TEXT.QUIZ_BANK_TABLE_HEADER_LANGUAGE, field: 'language'},
				{ title: TEXT.QUIZ_BANK_TABLE_HEADER_ORDER, field: 'order'}
			]
		}
		else if (this.state.tableTab === 0)
		{
			columns = [
				... columns,
				{ title: TEXT.QUIZ_BANK_TABLE_HEADER_NAME, field: 'name' },
				{ title: TEXT.QUIZ_BANK_TABLE_HEADER_STATUS, field: 'status' },
				{ title: TEXT.QUIZ_BANK_TABLE_HEADER_MAX_ANSWERS, field: 'maxAnswers' },
				{ title: TEXT.QUIZ_BANK_TABLE_HEADER_ANSWER_TYPE, field: 'answerType'}
			]
		}
		
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
			case 'description':
			case 'language':    
				data = rawData.trim()
				if (_.isEmpty(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				
				break
			case 'status':
				data = rawData.trim();
				if (_.isEmpty(data) 
					|| (
						this.state.tableTab === 0 && !_.includes(this.props.statusTypes, data)
						|| this.state.tableTab === 1 && !_.includes(this.props.statusThemes, data)
						) 
				)
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break
			case 'answerType':
				data = rawData.trim();
				if (_.isEmpty(data) || !_.includes(this.props.answerTypes, data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break
			case 'maxAnswers':	
			case 'order':
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
			this.state.tableTab === 0 && this.props.TypesLoad() ||
			this.state.tableTab === 1 && this.props.ThemesLoad()
		}
	}

	formatExcelData = () =>
	{
		let result = [];
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
			result = this.props.typeItems
		}
		else if (this.state.tableTab === 1)
		{
			result = this.props.themeItems
		}
        result = _.map(result, value => {
            let {
				createdAt, 
				modifiedAt, 
				deletedAt, 
				...others
			} = value;
            createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
			modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
			deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
            return {...others, createdAt, modifiedAt, deletedAt}
        })
        
        console.log('formatExcelData:', result)
		return result
	}

	handleExportDialog = (isOpen) =>
	{
		this.setState({
			isExportOpen: isOpen
		})
	} */

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
		this.props.SetTitle(TEXT.QUIZ_BANK_MANAGEMENT_TITLE)
		// this.props.TypesLoad();
		this.props.ThemesLoad();
	}

	componentWillUnmount() 
	{
		this.props.ClearProps([])
	}

	componentDidUpdate(prevProps, prevState)
	{
		this.props !== prevProps && (this.formatDuplicateKey() )
		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()

			if (prevState.dialogType === 'quiz_export')
			{
				saveAs(new Blob([this.props.fileData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${TEXT.QUIZ_BANK_QUIZZES_TITLE}.xlsx`)
				this.props.ClearProps(['fileData'])
			}
			else
			{
				this.state.tableTab === 1 && this.props.TypesLoad() ||
				this.state.tableTab === 0 && this.props.ThemesLoad()
			}
		}
	}

	formatDuplicateKey = () =>
	{
		this.duplicatedTypes = Object.keys(_.groupBy(this.props.typeItems|| [] , type => type.name))
		this.duplicatedThemes = Object.keys(_.groupBy(this.props.themeItems || [] , theme => theme.name))
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

	handleAction = (name, data, index ) => (evt) =>
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
						this.state.dialogType === 'type_delete' && this.props.TypesDelete(row) ||
						this.state.dialogType === 'theme_delete' && this.props.ThemesDelete(row) ||
						
						this.state.dialogType === 'type_restore' && this.props.TypesRestore(row) ||
						this.state.dialogType === 'theme_restore' && this.props.ThemesRestore(row) 
					})
				}
				else
				{
					this.state.dialogType === 'quiz_import' && this.props.ResourcesImport('quiz', this.state.rowData) ||

					this.state.dialogType === 'type_add' && this.props.TypesAdd(this.state.rowData) ||
					this.state.dialogType === 'type_edit' && this.props.TypesEdit(this.state.rowData) ||
					this.state.dialogType === 'type_delete' && this.props.TypesDelete(this.state.rowData) || 
					this.state.dialogType === 'type_restore' && this.props.TypesRestore(this.state.rowData) || 

							
					this.state.dialogType === 'theme_add' && this.props.ThemesAdd({...this.state.rowData, language: this.state.rowData.language.code}) ||
					this.state.dialogType === 'theme_edit' && this.props.ThemesEdit({...this.state.rowData, language: this.state.rowData.language.code}, true) ||
					this.state.dialogType === 'theme_delete' && this.props.ThemesDelete(this.state.rowData) || 
					this.state.dialogType === 'theme_restore' && this.props.ThemesRestore(this.state.rowData)
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
						if (this.state.tableTab === 0)
						{
							this.props.ThemesLoad()
						}
						else if (this.state.tableTab === 1)
						{
							this.props.TypesLoad()
						}
						/* else if (this.state.tableTab === 2)
						{
							this.props.QuizConfigLoad()
						} */
					}
				)
				break
			case 'quiz_export':
				this.setState(
					{
						dialogType: name,
						rowData: data
					},
					() =>
					{
						this.props.ResourcesExport('quiz')
					}
				)

				break	

			case 'quiz_import':	
			case 'type_add':
			case 'type_edit':
			case 'type_delete':
			case 'type_restore':
			case 'theme_add':
			case 'theme_edit':
			case 'theme_delete':
			case 'theme_restore':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})
				break	
				

            default:
                this.setState({
                    rowData: {
						...this.state.rowData,
						[name]: _.includes(['maxAnswers', 'order'], name) ? (data === '' ? 0 : (isNaN(data) ? this.state.rowData[name] : parseInt(data))) : data
					}
                })
		}		
	}

    render()
    {
        const { classes } = this.props;
        
        return (
            <div className={clsx(classes.root, classes.divColumn)}>
                {this.renderTableTabs()}
				{this.renderDialog()}
			</div>
        );
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
								onClick={this.handleAction('quiz_import', {})}
								className={clsx(classes.buttonLeft)}
								startIcon={<Icons.IconAdd/>}
							>
								{ TEXT.QUIZ_BANK_BUTTON_IMPORT }
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
								onClick={this.handleAction('quiz_export', {})}
								className={clsx(classes.buttonLeft)}
								startIcon={<Icons.ExportIcon/>}
							>
								{ TEXT.QUIZ_BANK_BUTTON_EXPORT }
							</Button>
						}
						link={''}
						attribute={''}
					/>
				</div>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
					<Tabs
						value={this.state.tableTab}
						indicatorColor="primary"
						onChange={(evt, index) => {
							this.handleAction('tableTab', index)(evt)
						}}
						classes={{
							root: clsx(classes.tabs),
						}}
					>
						<Tab label={TEXT.QUIZ_BANK_TABLE_HEADER_THEME} />
						<Tab label={TEXT.QUIZ_BANK_TABLE_HEADER_TYPE}/>
					</Tabs>
					{this.actionsExtend.createElement(this.actionsExtend)}
				</div>
				<CmsTabPanel value={this.state.tableTab} index={0}>
				{
					this.renderThemesTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={1}>
				{
					this.renderTypesTable()
				}
				</CmsTabPanel>
			</>	
		)	
	}

	renderTypesTable = () =>
	{
		const {typeItems, classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.QUIZ_BANK_TABLE_HEADER_NAME, field: 'name', width: 250,
                        },
						{
                            title: () => this.renderStatusTitleColumn(),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.status, columnDef)
                        },
						{
                            title: TEXT.QUIZ_BANK_TABLE_HEADER_MAX_ANSWERS, field: 'maxAnswers', width: 120,
                        },
						{
                            title: TEXT.QUIZ_BANK_TABLE_HEADER_ANSWER_TYPE, field: 'answerType', width: 120,
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 260,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'createdAt'),
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'modifiedAt'),
						},
						{
                            title: TEXT.TABLE_HEADER_OWNER, 
							placeholder: TEXT.TABLE_HEADER_CREATED_BY, 
							field: 'createdBy', width: 350,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.TABLE_HEADER_OWNER, 
							placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, 
							field: 'modifiedBy', 
							hidden: true,
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
								this.handleAction('type_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUIZ_BANK_TOOLTIP_EDIT_TYPE),
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
								this.handleAction('type_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUIZ_BANK_TOOLTIP_DELETE_TYPE),
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
								this.handleAction('type_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.QUIZ_BANK_TOOLTIP_RESTORE_TYPE),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={typeItems || []}

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

	renderThemesTable = () =>
	{
		const {themeItems, classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.QUIZ_BANK_TABLE_HEADER_NAME, field: 'name', width: 250,
                        },
						{
                            title: TEXT.QUIZ_BANK_TABLE_HEADER_DESCRIPTION, field: 'description', width: 250,
                        },
						{
                            title: () => this.renderStatusTitleColumn(),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.status, columnDef)
                        },
						{
                            title: TEXT.QUIZ_BANK_TABLE_HEADER_LANGUAGE, field: 'language', width: 150,
                        },
						{
                            title: TEXT.QUIZ_BANK_TABLE_HEADER_ORDER, field: 'order', width: 150,
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
                            title: TEXT.TABLE_HEADER_OWNER, 
							placeholder: TEXT.TABLE_HEADER_CREATED_BY, 
							field: 'createdBy', width: 350,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.TABLE_HEADER_OWNER, 
							placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy', hidden: true,
                        },
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', width: 150,
                            render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'deletedAt'),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconLeaderboard {...props} />,
							onClick: (event, rowData) =>
							{
								this.props.history.push(`${this.props.location.pathname}/${rowData.id}/${encodeURIComponent(rowData.name)}/quizzes`)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUIZ_BANK_TOOLTIP_QUIZZES),
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
								rowData = { ...rowData, language: _.find(LANGUAGE_LIST_SERVER, language => (language.code ===  rowData.language.toLowerCase())) || {}}
								this.handleAction('theme_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUIZ_BANK_TOOLTIP_EDIT_THEME),
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
								this.handleAction('theme_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUIZ_BANK_TOOLTIP_DELETE_THEME),
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
								this.handleAction('theme_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.QUIZ_BANK_TOOLTIP_RESTORE_THEME),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={themeItems|| []}

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

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
					this.state.dialogType === 'quiz_import' && `${TEXT.QUIZ_BANK_BUTTON_IMPORT} ${TEXT.QUIZ_BANK_QUIZZES_TITLE}` ||

                    this.state.dialogType === 'type_add' && TEXT.QUIZ_BANK_BUTTON_NEW_TYPE ||
                    this.state.dialogType === 'type_edit' && TEXT.QUIZ_BANK_BUTTON_EDIT_TYPE ||
                    this.state.dialogType === 'type_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'type_restore' && TEXT.REMIND_TITLE ||

					this.state.dialogType === 'theme_add' && TEXT.QUIZ_BANK_BUTTON_NEW_THEME ||
                    this.state.dialogType === 'theme_edit' && TEXT.QUIZ_BANK_BUTTON_EDIT_THEME ||
                    this.state.dialogType === 'theme_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'theme_restore' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'type_delete' || this.state.dialogType === 'type_restore') && this.renderDeleteRestoreTypes()
			}
			{
				(this.state.dialogType === 'type_add' || this.state.dialogType === 'type_edit') && this.renderAddEditTypes()
			}

			{
				(this.state.dialogType === 'theme_delete' || this.state.dialogType === 'theme_restore') && this.renderDeleteRestoreThemes()
			}
			{
				(this.state.dialogType === 'theme_add' || this.state.dialogType === 'theme_edit') && this.renderAddEditThemes()
			}
			{
				this.state.dialogType === 'quiz_import' && this.renderImportQuizzes()
			}
			</ModalDialog>
		)
	}

	validateSubmit = () =>
	{
		const {tableTab , rowData , dialogType} = this.state

		if (dialogType === 'quiz_import')
		{
			return _.isEmpty(rowData.file)
		}
		
		switch(tableTab)
		{
			case 1:
				return (
					( _.isEmpty(rowData.name))
					|| (_.isEmpty(rowData.status))
					|| (_.isEmpty(rowData.answerType) )
					|| (dialogType == 'type_add' && _.includes(this.duplicatedTypes, rowData.name ))
					)	
			case 0:
				return (
					(_.isEmpty(rowData.name))
					|| (_.isEmpty(rowData.status) )
					|| (_.isEmpty(rowData.description) )
					|| (_.isEmpty(rowData.language) )
					|| (dialogType == 'theme_add' && this.props.themeItems.some(theme=> (theme.name === rowData.name && theme.language === rowData.language.code)  ))
					)	
			default:
				return true
		}
	}

	renderAddEditTypes = () =>
	{
		const { classes , statusTypes , answerTypes } = this.props;
	
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUIZ_BANK_TABLE_HEADER_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'type_edit'}
					/>
					
				</div>
				{
					this.state.dialogType === 'type_add' 
					&&  _.includes(this.duplicatedTypes ,this.state.rowData.name)
					&& (
						<div className={clsx(classes.divColumn)}>
							<div className={clsx(classes.justifyStartWarning, classes.alignCenter,classes.divRow)}>
								<WarningRounded className={classes.warningIcon} fontSize={'large'} />
								<Typography>{TEXT.QUIZ_BANK_WARNING_DUPLICATE_NAME}</Typography>
							</div>
						
						</div>
					)
				}
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUIZ_BANK_TABLE_HEADER_STATUS}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.status}
						options={statusTypes || []}
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
					<Typography>{TEXT.QUIZ_BANK_TABLE_HEADER_ANSWER_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.answerType}
						options={answerTypes || []}
						onChange={(evt, value) => {
							this.handleAction('answerType', value)(evt)
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
					<Typography>{TEXT.QUIZ_BANK_TABLE_HEADER_MAX_ANSWERS}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.maxAnswers || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('maxAnswers', evt.target.value)(evt) }}
					/>
				</div>
			</div>
		)
	}

	renderDeleteRestoreTypes = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'type_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.QUIZ_BANK_MESSAGE_DELETE_TYPES, this.state.rowData.length) : TEXT.QUIZ_BANK_MESSAGE_DELETE_TYPE) ||
						this.state.dialogType === 'type_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.QUIZ_BANK_MESSAGE_RESTORE_TYPES, this.state.rowData.length) : TEXT.QUIZ_BANK_MESSAGE_RESTORE_TYPE) ||
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
									{`${data.name} - ${data.status} - ${data.maxAnswers} - ${data.answerType}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.status} - ${this.state.rowData.maxAnswers} - ${this.state.rowData.answerType}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderImportQuizzes = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<Typography>{TEXT.QUIZ_BANK_QUIZ_FILE}</Typography>
				<CmsInputFile 
					name={'file'}
					value={this.state.rowData.file || []} 
					onChange={(file) => { this.handleAction('file', file)(null) }} 
					acceptFile={'.xlsx'}
				/>
			</div>
		)
	}

	renderAddEditThemes = () =>
	{
		const { classes , statusThemes } = this.props;
	
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUIZ_BANK_TABLE_HEADER_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
					/>
				</div>
				{
					this.state.dialogType === 'theme_add' 
					&&  this.props.themeItems.some(theme=> (theme.name === this.state.rowData.name && theme.language === this.state.rowData.language.code))
					&& (
						<div className={clsx(classes.divColumn)}>
							<div className={clsx(classes.justifyStartWarning, classes.alignCenter,classes.divRow)}>
								<WarningRounded className={classes.warningIcon} fontSize={'large'} />
								<Typography>{TEXT.QUIZ_BANK_WARNING_DUPLICATE_NAME_AND_LANGUAGE}</Typography>
							</div>
						
						</div>
					)
				}
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUIZ_BANK_TABLE_HEADER_DESCRIPTION}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.description}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('description', evt.target.value)(evt) }}
					/>		
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUIZ_BANK_TABLE_HEADER_STATUS}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.status}
						options={statusThemes || []}
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
					<Typography>{TEXT.QUIZ_BANK_TABLE_HEADER_LANGUAGE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.language}
						options={LANGUAGE_LIST_SERVER}
						getOptionLabel={option => (_.isEmpty(option) ? '' : `${option.name} (${option.code})`)}
						onChange={(evt, value) => {
							this.handleAction('language', value)(evt)
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
						disabled={this.state.dialogType === 'theme_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUIZ_BANK_TABLE_HEADER_ORDER}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.order || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('order', evt.target.value)(evt) }}
					/>
				</div>
			</div>
		)
	}

	renderDeleteRestoreThemes = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'theme_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.QUIZ_BANK_MESSAGE_DELETE_THEMES, this.state.rowData.length) : TEXT.QUIZ_BANK_MESSAGE_DELETE_THEME) ||
						this.state.dialogType === 'theme_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.QUIZ_BANK_MESSAGE_RESTORE_THEMES, this.state.rowData.length) : TEXT.QUIZ_BANK_MESSAGE_RESTORE_THEME) ||
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
									{`${data.name} - ${data.status} - ${data.description} - ${data.language}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.status} - ${this.state.rowData.description} - ${this.state.rowData.language}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}


}

QuizBank.propTypes =
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
	TypesLoad: () =>
	{
		dispatch(ActionCMS.TypesLoad())
	},
	TypesAdd: (quiz_data) =>
	{
		dispatch(ActionCMS.TypesAdd(quiz_data))
	},
	TypesEdit: (quiz_data) =>
	{
		dispatch(ActionCMS.TypesEdit(quiz_data))
	},
	TypesDelete: (quiz_data) =>
	{
		dispatch(ActionCMS.TypesDelete(quiz_data))
	},
	TypesRestore: (quiz_data) =>
	{
		dispatch(ActionCMS.TypesRestore(quiz_data))
	},
	ThemesLoad: () =>
	{
		dispatch(ActionCMS.ThemesLoad())
	},
	ThemesAdd: (theme_data) =>
	{
		dispatch(ActionCMS.ThemesAdd(theme_data))
	},
	ThemesEdit: (theme_data, manual) =>
	{
		dispatch(ActionCMS.ThemesEdit(theme_data, manual))
	},
	ThemesDelete: (theme_data) =>
	{
		dispatch(ActionCMS.ThemesDelete(theme_data))
	},
	ThemesRestore: (theme_data) =>
	{
		dispatch(ActionCMS.ThemesRestore(theme_data))
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
)(QuizBank);

