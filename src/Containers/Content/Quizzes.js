import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography,  Button, Chip ,TextField, Icon, Tooltip, IconButton, Divider } from '@material-ui/core'
import { WarningRounded } from '@material-ui/icons'
import Autocomplete from '@material-ui/lab/Autocomplete'
import Utils from '../../Utils'
import TEXT from './Data/Text'
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

import ModalDialog from '../../Components/Dialogs/ModalDialog'

const styles = theme => ({
	buttonLeft: {
		marginLeft: 10,
	},
    warningIcon: {
		color: theme.palette.warning.main,
		alignSelf: 'flex-start',
		marginRight: 20
	},
	divFullWidth: {
		width: '100%'
	},
	divMaxHeight: {
		maxHeight: '30vh',
		overflowY: 'auto'
	},
	inputTextField: {
		marginBottom: 15,
		marginRight: 15,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	quizAnswers:{
		maxHeight:'300px',
		overflowY: 'auto',
		paddingTop: theme.spacing(3),
	},
	searchBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(2),
		marginBottom: theme.spacing(3),
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
const TABLE_HEIGHT = 770
const FULLTIME_FORMAT = 'MMM DD YYYY HH:mm'
const QUIZZES_DATA = { question: '', type: '', status: '' }

class Quizzes extends React.Component
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
		
		this.name = decodeURIComponent(props.match.params.name)
		this.tableRef = React.createRef()
		this.typeName = ''
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
				let apiAdd, apiUpdate, apiDelete
				
				apiAdd = API.QuizzesAdd.bind(API)
				apiUpdate = API.QuizzesEdit.bind(API)
				apiDelete = API.QuizzesDelete.bind(API) */

				return (
					<div className={clsx(classes.divColumn, classes.searchBar)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<Typography className={clsx(classes.title)}>{this.props.match.params.name}</Typography>
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
									fileNameExtend={`/${TEXT.QUIZ_BANK_FILE_NAME_TITLE_QUIZZES}`}
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
														this.handleAction('quizzes_restore')
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
												{
													TEXT.QUIZZES_BUTTON_RESTORE_QUIZZES
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
														this.handleAction('quizzes_delete')
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
												{
													TEXT.QUIZZES_BUTTON_DELETE_QUIZZES
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
													this.handleAction('quizzes_add',{question:'', type:'', status:'',answers:[] , correctAnswer:0 })
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
											{
												TEXT.QUIZZES_BUTTON_ADD_QUIZZES
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

        return null;
    }

	componentDidMount()
	{
		this.props.SetTitle(TEXT.QUIZ_BANK_QUIZZES_TITLE)
		this.props.TypesLoad();
		// this.props.QuizzesLoad(this.props.match.params.theme_id)	
	}

	componentWillUnmount() 
	{
		this.props.ClearProps([])
	}

	componentDidUpdate(prevProps, prevState)
	{
		this.props !== prevProps && (this.formatDuplicateKey())
		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()
			_.includes(prevState.dialogType, 'quizzes_') && this.tableRef.current.onQueryChange(this.state.query, null)
		}
	}

	formatDuplicateKey = () =>
	{
		this.typeName = Object.keys(_.groupBy(_.filter(this.props.typeItems || [], (type) => type.deletedAt === 0 ) || [] , type => type.name))
	}

	
	render()
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderQuizzesTable()}
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
		
		result = this.props.quizzesItems
		
		
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
            let { answers,createdAt, modifiedAt, deletedAt, ...others} = value
			answers = JSON.stringify(answers)
            createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
			modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
			deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
            return {...others, answers, createdAt, modifiedAt, deletedAt}
        })
        
        console.log('formatExcelData:', result)
		return result
	}

	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_QUESTION, field: 'question' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_THEME_ID, field: 'theme_id' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_TYPE, field: 'type' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_ANSWERS, field: 'answers' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_CORRECT_ANSWER, field: 'correctAnswer' },
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
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_QUESTION, field: 'question' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_THEME_ID, field: 'theme_id' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_TYPE, field: 'type' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_ANSWERS, field: 'answers' },
			{ title: TEXT.QUIZ_BANK_TABLE_HEADER_CORRECT_ANSWER, field: 'correctAnswer' },
			
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
			case 'theme_id':
			case 'question':
				data = rawData.trim()
				if (_.isEmpty(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break	
			case 'type':     
				data = rawData.trim()
				if (_.isEmpty(data) || !_.includes(this.typeName,data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break
			case 'correctAnswer':
				data = rawData
				if (isNaN(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				
				break
			case 'status':
				data = rawData.trim();
				if (_.isEmpty(data) || !_.includes(this.props.statusQuizzes, data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break
			case 'answers':
				try
				{
					data = JSON.parse(rawData.trim());
					if(!data)
					{
						throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
					}
					_.forEach(data ,(item)=>{
						if(_.isEmpty(item))
						{
							throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
						}
					})
				}
				catch
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
			this.props.QuizzesLoad(this.props.match.params.theme_id)
		}
	} */

	handleAction = (name, data, index) => (evt) =>
	{
		const {typeItems} = this.props;
		switch (name)
		{
			case 'close':
				this.setState({
					isDialogOpen: false,
					dialogType: '',
					rowData: {}
				})

				break
			case 'addAnswer':
				let maxAnswer = _.find(typeItems,({name})=>this.state.rowData.type === name)?.maxAnswers;
				if(this.state.rowData.answers.length  === maxAnswer) return;
				this.setState({
					rowData: {
						...this.state.rowData,
						answers: [
							...this.state.rowData.answers,
							''
						]
					}
				})
				break;
			case 'removeAnswer':
				this.setState({
					rowData: {
						...this.state.rowData,
						answers: this.state.rowData.answers.filter((answer,idx)=>index!==idx)
					}
				})
				break
			case 'submit':
				if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						this.state.dialogType === 'quizzes_delete' && this.props.QuizzesDelete(row) ||
						this.state.dialogType === 'quizzes_restore' && this.props.QuizzesRestore(row)
					})
				}
				else
				{
					this.state.rowData = {
						...this.state.rowData,
						theme_id:this.props.match.params.theme_id
					}
					this.state.dialogType === 'quizzes_add' && this.props.QuizzesAdd(this.state.rowData) ||
					this.state.dialogType === 'quizzes_edit' && this.props.QuizzesEdit(this.state.rowData) ||
					this.state.dialogType === 'quizzes_delete' && this.props.QuizzesDelete(this.state.rowData) ||
					this.state.dialogType === 'quizzes_restore' && this.props.QuizzesRestore(this.state.rowData) 
				}
					
				break
			case 'quizzes_add':
			case 'quizzes_edit':
			case 'quizzes_delete':
			case 'quizzes_restore':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
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
			case 'pageSize':
				this.setState({
					pageSize: data
				})
				
				break		
            default:
                this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: name === 'answers' 
								?  this.state.rowData.answers.map((item,idx) => idx === index ? data : item )
								: _.includes(['correctAnswer'], name) ? (data === '' ? 0 : (isNaN(data) ? this.state.rowData[name] : parseInt(data))) : data
					}
                })
		}		
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

	renderAnswersColumn = (answers, NUMBER_CHIPS = 2) =>
	{
		const { classes } = this.props
		
		const chips = answers.slice(0, NUMBER_CHIPS)
		const hidden = (answers.length - chips.length > 0)
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
				options={answers}
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
					<div  className={clsx(classes.divRow, classes.justifyBetween,classes.alignCenter)}>
						{
							value.map((option, index) => (
								<Chip
									key={index}
									variant={'outlined'}
									style={{marginRight: 5}}
									size={'small'} 
									label={option}
								/>
							))
						}
						{
							hidden &&
							(
								!isOpen
								?
								<div>
									<Chip 
										color="primary"
										size={'small'} 
										label={`+${answers.length - chips.length}`}
									/>
								</div>
								:
								<div style={{ minWidth: 30}}/>
							)
						}
					</div>
				}
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

	renderQuizzesTable = () =>
	{
		const { classes } = this.props;

		return (
			<div className={clsx(classes.table, classes.divColumn)}>
				{this.actionsExtend.createElement(this.actionsExtend)}
				<CmsTable
					columns={[
						{
							title: TEXT.QUIZ_BANK_TABLE_HEADER_QUESTION, field: 'question', width: 250,
							// defaultFilter: this.state[`default_filter_question`] || '',
							render: rowData =>
							{
								return (
									<div style={{ width: 230, marginLeft: 10, wordWrap: 'break-word' }}>
										{rowData.question}
									</div>
								)
							}
						},
						{
							title: TEXT.QUIZ_BANK_TABLE_HEADER_TYPE, field: 'type', width: 150,
							// defaultFilter: this.state[`default_filter_type`] || '',
						},
						{
							title: () => this.renderStatusTitleColumn(),
							// defaultFilter: this.state[`default_filter_status`] || '',
							placeholder: TEXT.TABLE_HEADER_STATUS,
							field: 'status', 
							width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.status, columnDef)
						},
						{
							title: TEXT.QUIZ_BANK_TABLE_HEADER_CORRECT_ANSWER,
							filtering: false, 
							field: 'correctAnswer', 
							width: 150,
						},
						{
							title: TEXT.QUIZ_BANK_TABLE_HEADER_ANSWERS,
							filtering: false, 
							field: 'answers', 
							width: 350,
							render: (rowData) => this.renderAnswersColumn(rowData.answers)
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
							field: 'createdBy', 
							width: 350,
							render: rowData => this.renderOwnersColumn(rowData)
						},
						{
							title: TEXT.TABLE_HEADER_OWNER, 
							filtering: false,
							placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, 
							field: 'modifiedBy', hidden: true,
						},
						{
							title: TEXT.TABLE_HEADER_DELETED_AT,
							field: 'deletedAt',
							width: 200,
							type: 'boolean',
							filterPlaceholder: TEXT.TABLE_HEADER_IGNORE_DELETE,
							render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'deletedAt'),
						},
					]}
					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('quizzes_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUIZ_BANK_TOOLTIP_EDIT_QUIZZES),
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
								this.handleAction('quizzes_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.QUIZ_BANK_TOOLTIP_DELETE_QUIZZES),
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
								this.handleAction('quizzes_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.QUIZ_BANK_TOOLTIP_RESTORE_QUIZZES),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
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
						
						let quizzes_data = _.reduce(filters, (quizzes_data, filter) =>
						{
							return {...quizzes_data, [filter.column.field]: filter.value}
						}, {})

						quizzes_data = {
							...QUIZZES_DATA,
							...quizzes_data, 
							theme_id: this.props.match.params.theme_id,
							page: page + 1, 
							pageSize
						}

						return new Promise((resolve) =>
						{
							this.props.SetLoading('')
							API.QuizzesLoad(quizzes_data)
							.then(result =>
							{
								resolve({
									data: result.items,
									page: _.isEmpty(result.items) ? 0 : result.pagination.page - 1,
									totalCount: result.pagination.totalItems,
								})

								this.props.SetProps([{ key: 'statusQuizzes', value: result.STATUSES }])
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
                    this.state.dialogType === 'quizzes_add' && TEXT.QUIZ_BANK_BUTTON_NEW_QUIZZES ||
                    this.state.dialogType === 'quizzes_edit' && TEXT.QUIZ_BANK_BUTTON_EDIT_QUIZZES ||
                    this.state.dialogType === 'quizzes_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'quizzes_restore' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={ 
					(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore') ) 
					? false 
					: this.validateSubmit(this.state.rowData) 
					}
			>
			{
				(this.state.dialogType === 'quizzes_delete' || this.state.dialogType === 'quizzes_restore') && this.renderDeleteRestoreQuizzes()
			}
			{
				(this.state.dialogType === 'quizzes_add' || this.state.dialogType === 'quizzes_edit') && this.renderAddEditQuizzes()
			}
			</ModalDialog>
		)
	}

	validateSubmit = (rowData) =>
	{
		return _.isEmpty(rowData.question) 
				|| _.isEmpty(rowData.type)
				|| _.isEmpty(rowData.status)
				|| _.isEmpty(rowData.answers)
				|| _.some(rowData.answers, answer => _.isEmpty(answer))
				|| rowData.correctAnswer === 0
				|| !(rowData.correctAnswer <= rowData.answers.length)
	}

	renderDeleteRestoreQuizzes = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'quizzes_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.QUIZ_BANK_MESSAGE_DELETE_QUIZZES, this.state.rowData.length) : TEXT.QUIZ_BANK_MESSAGE_DELETE_QUIZZ) ||
						this.state.dialogType === 'quizzes_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.QUIZ_BANK_MESSAGE_RESTORE_QUIZZES, this.state.rowData.length) : TEXT.QUIZ_BANK_MESSAGE_RESTORE_QUIZZ) ||
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
									{`${data.question} - ${data.type} - ${data.status}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.question} - ${this.state.rowData.type} - ${this.state.rowData.status} `}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}	

	renderAddEditQuizzes = () =>
	{
		const { classes , statusQuizzes, typeItems} = this.props;
		
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUIZ_BANK_TABLE_HEADER_QUESTION}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.question || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('question', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.QUIZ_BANK_TABLE_HEADER_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.type}
						options={this.typeName || []}
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
					<Typography>{TEXT.QUIZ_BANK_TABLE_HEADER_STATUS}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.status}
						options={statusQuizzes || []}
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
					<Typography>{TEXT.QUIZ_BANK_TABLE_HEADER_CORRECT_ANSWER}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.correctAnswer || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('correctAnswer', evt.target.value)(evt) }}
					/>
				</div>
				{
					this.state.rowData.type 
					&& (
						<>
						<div className={clsx(classes.justifyBetween,classes.alignCenter,classes.divRow)} style={{marginBottom:'15px'}}>
							<div className={clsx(classes.divRow)}> 
								<Typography>{TEXT.QUIZ_BANK_TABLE_HEADER_ANSWERS} (Max: {_.find(typeItems,({name})=>this.state.rowData.type === name)?.maxAnswers})
								</Typography>
							</div>
							<div className={clsx(classes.divRow)}> 
								<Button
									variant='outlined'
									color={'default'}
									className={classes.buttonAdd}
									startIcon={<Icons.IconAdd />}
									onClick={this.handleAction('addAnswer')}
								>
									{TEXT.QUIZ_BANK_BUTTON_ADD_ANSWERS}
								</Button> 
							</div>
						</div>	
						<Divider/>
						</>
					)
				}
				<div className={clsx(classes.divColumn,classes.quizAnswers)}>
					{
						this.state.rowData.type
						&&
						_.map(this.state.rowData.answers, (answer,index) => 
						{
							return (
								<div className={clsx(classes.justifyBetween,classes.alignCenter,classes.divRow)} key={index}>
									<TextField
										className={clsx(classes.inputTextField, classes.inputText)}
										value={answer || ''}
										margin="normal"
										label={TEXT.QUIZ_BANK_TABLE_HEADER_ANSWER}
										fullWidth
										variant={'outlined'}
										onChange={(evt) => { this.handleAction('answers', evt.target.value, index)(evt) }}
									/>
							
									<IconButton
										onClick={this.handleAction('removeAnswer', '', index )}
										style={{marginBottom:'10px'}}
									>
										<Icons.IconRemove/>	
									</IconButton>
												
								</div>
							)
						}) 
					}
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

Quizzes.propTypes =
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
	TypesLoad: () =>
	{
		dispatch(ActionCMS.TypesLoad())
	},
	QuizzesLoad: (quizzes_data) =>
	{
		dispatch(ActionCMS.QuizzesLoad(quizzes_data))
	},
	QuizzesAdd: (quizzes_data) =>
	{
		dispatch(ActionCMS.QuizzesAdd(quizzes_data))
	},
	QuizzesEdit: (quizzes_data) =>
	{
		dispatch(ActionCMS.QuizzesEdit(quizzes_data))
	},
	QuizzesDelete: (quizzes_data) =>
	{
		dispatch(ActionCMS.QuizzesDelete(quizzes_data))
	},
	QuizzesRestore: (quizzes_data) =>
	{
		dispatch(ActionCMS.QuizzesRestore(quizzes_data))
	},
})

export default compose(
	connect(mapStateToProps, mapDispatchToProps),
	withMultipleStyles(customStyle, styles),
	withRouter
)(Quizzes);

