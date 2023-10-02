import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

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

class Currency extends React.Component
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
			searchText: '', // sample-profile-id
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

				const apiAdd = API.CurrencyTypeAdd.bind(API)
				const apiUpdate = API.CurrencyTypeEdit.bind(API)
				const apiDelete = API.CurrencyTypeDelete.bind(API)

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
													onClick={this.handleAction('currency_restore')}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
													{ TEXT.CURRENCY_BUTTON_RESTORE_CURRENCY }
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
													onClick={this.handleAction('currency_delete')}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
													{ TEXT.CURRENCY_BUTTON_DELETE_CURRENCY }
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
												onClick={this.handleAction('currency_add', {name: '', type: '', status: '', defaultQuantity: 0, crossSeason:'', settings: {}})}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
												{ TEXT.CURRENCY_BUTTON_NEW_CURRENCY }
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
			if (state.dialogType === 'currency_profile_edit')
			{
				props.CurrenciesLoad(state.searchText)
			}
			else
			{
				props.CurrencyTypesLoad()
			}
		
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
		this.props.SetTitle(TEXT.CURRENCY_MANAGEMENT_TITLE)
		this.props.CurrencyTypesLoad()
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
		let result = this.props.currencyTypes
		
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
            let { createdAt, modifiedAt, deletedAt, settings, ...others} = value
			settings = JSON.stringify(settings)
            createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
			modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
			deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
            return {...others, settings, createdAt, modifiedAt, deletedAt}
        })
        
        console.log('formatExcelData:', result)
		return result
	}

	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.CURRENCY_TABLE_HEADER_NAME, field: 'name'},
			{ title: TEXT.CURRENCY_TABLE_HEADER_TYPE, field: 'type' },
			{ title: TEXT.CURRENCY_TABLE_HEADER_DEFAULT_QUANTITY, field: 'defaultQuantity'},
			{ title: TEXT.CURRENCY_TABLE_HEADER_CROSS_SEASON, field: 'crossSeason'},
			{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.CURRENCY_TABLE_HEADER_SETTING, field: 'settings' },
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
			{ title: TEXT.CURRENCY_TABLE_HEADER_NAME, field: 'name'},
			{ title: TEXT.CURRENCY_TABLE_HEADER_TYPE, field: 'type' },
			{ title: TEXT.CURRENCY_TABLE_HEADER_DEFAULT_QUANTITY, field: 'defaultQuantity'},
			{ title: TEXT.CURRENCY_TABLE_HEADER_CROSS_SEASON, field: 'crossSeason'},
			{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.CURRENCY_TABLE_HEADER_SETTING, field: 'settings' },
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
			case 'name':
			case 'type':	    
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
			case 'crossSeason':
				data = rawData;
				if(!_.isBoolean(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break
			case 'defaultQuantity':    
				data = rawData
				if (isNaN(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break	
			case 'settings':    
				try
				{
					data = JSON.parse(rawData.trim())
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
			this.props.CurrencyTypesLoad()
		}
	}

	transformData = (data) =>
	{
		let {
			crossSeason,
			...others
		} = data;
		crossSeason = crossSeason === 'true'
		return {...others,crossSeason}
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
					rowData: {}
				})

				break
			case 'submit':
				if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						this.state.dialogType === 'currency_delete' && this.props.CurrencyTypeDelete(row) ||
						this.state.dialogType === 'currency_restore' && this.props.CurrencyTypeRestore(row)
					})
				}
				else
				{
					let data = this.transformData(this.state.rowData)
					this.state.dialogType === 'currency_add' && this.props.CurrencyTypeAdd(data) ||
					this.state.dialogType === 'currency_edit' && this.props.CurrencyTypeEdit(data, true) ||
					this.state.dialogType === 'currency_delete' && this.props.CurrencyTypeDelete(this.state.rowData) ||
					this.state.dialogType === 'currency_restore' && this.props.CurrencyTypeRestore(this.state.rowData) ||
					this.state.isJsonEditorMode && this.props.CurrencyTypeEdit(this.state.rowData, true) ||
					this.state.dialogType === 'currency_profile_edit' && this.props.CurrencyProfileEdit(this.state.rowData)
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
						if (this.state.tableTab === 1)
						{
							this.props.CurrencyTypesLoad()
						}

						this.props.ClearProps(['currencies'])
					}
				)

				break	
			case 'json_editor':
				this.setState({
					isJsonEditorMode: true,
					rowData: data
				})
				
				break	
			case 'currency_add':
			case 'currency_edit':
			case 'currency_delete':
			case 'currency_restore':
			case 'currency_profile_edit':	
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})

				break
			case 'currency_profile_search':
				this.setState(
					{
						searchText: data
					},
					() =>
					{
						this.props.CurrenciesLoad(data)
					}
				)

				break	
			case 'viewJsonMode':	
				this.setState({
					errorJsonEditor: false,
					viewJsonMode: data,
				})

				break
			case 'settings':
				this.setState({
					errorJsonEditor: false,
					rowData: {
						...this.state.rowData, 
						[name]: data
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
		const { name, type, status, crossSeason } = submit_data
		let result = _.some(Object.keys({ name, type, status, crossSeason }), key => {
			return _.isEmpty(submit_data[key])
		})

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
						<Tab label={TEXT.CURRENCY_CURRENCY_TITLE} />
						<Tab label={TEXT.CURRENCY_TABLE_HEADER_TYPE}/>
					</Tabs>
					{
						this.state.tableTab === 1 && this.actionsExtend.createElement(this.actionsExtend)
					}
				</div>
				<CmsTabPanel value={this.state.tableTab} index={0} >
				{
					this.renderCurrencysProfileTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={1} >
				{
					this.renderCurrencysTable()
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
                    this.state.dialogType === 'currency_add' && TEXT.CURRENCY_BUTTON_NEW_CURRENCY ||
                    this.state.dialogType === 'currency_edit' && TEXT.CURRENCY_BUTTON_EDIT_CURRENCY ||
                    this.state.dialogType === 'currency_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'currency_restore' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'currency_profile_edit' && TEXT.CURRENCY_BUTTON_EDIT_PROFILE_CURRENCY ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(this.state.dialogType === 'currency_profile_edit' || _.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'currency_delete' || this.state.dialogType === 'currency_restore') && this.renderDeleteRestoreCurrency()
			}
			{
				(this.state.dialogType === 'currency_add' || this.state.dialogType === 'currency_edit') && this.renderAddEditCurrency()
			}
			{
				this.state.dialogType === 'currency_profile_edit' && this.renderAddEditProfileCurrency()
			}
			</ModalDialog>
		)
	}

	renderSearchBar = () =>
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.divColumn, classes.searchBar)}>
				<div className={clsx(classes.divRow, classes.divHeight)}>
					<div className={clsx(classes.divColumn, classes.divFullWidth)}>
						<Typography>{TEXT.CURRENCY_TABLE_HEADER_PROFILE_ID}</Typography>
						<CmsSearch
							searchText={this.state.searchText}
							key={'profileId'}
							onSearchClick={(searchText) => {
								this.handleAction('currency_profile_search', searchText)(null)
							}}
						/>
					</div>
				</div>
			</div>	
		)	
	}

	renderCurrencysProfileTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderSearchBar()}
                <CmsTable
                    columns={[
						{
                            title: TEXT.CURRENCY_TABLE_HEADER_PROFILE_ID, field: 'profileId', width: 150,
							
                        },
						{
                            title: TEXT.CURRENCY_TABLE_HEADER_QUANTITY, field: 'quantity', width: 150,
							
                        },
						{
                            title: TEXT.CURRENCY_TABLE_HEADER_TYPE, field: 'type', width: 150,
							
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
								this.handleAction('currency_profile_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.CURRENCY_TOOLTIP_EDIT_CURRENCY),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}	

                    data={this.props.currencies || []}

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

	renderDeleteRestoreCurrency = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'currency_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.CURRENCY_MESSAGE_DELETE_CURRENCIES, this.state.rowData.length) : TEXT.CURRENCY_MESSAGE_DELETE_CURRENCY) ||
						this.state.dialogType === 'currency_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.CURRENCY_MESSAGE_RESTORE_CURRENCIES, this.state.rowData.length) : TEXT.CURRENCY_MESSAGE_RESTORE_CURRENCY) ||
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

	renderAddEditCurrency = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CURRENCY_TABLE_HEADER_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CURRENCY_TABLE_HEADER_TYPE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.type}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('type', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'currency_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CURRENCY_TABLE_HEADER_DEFAULT_QUANTITY}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.defaultQuantity || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('defaultQuantity', evt.target.value)(evt) }}
						helperText={TEXT.CURRENCY_TOOLTIP_DEFAULT_QUANTITY}
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
					<Typography>{TEXT.CURRENCY_TABLE_HEADER_CROSS_SEASON}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.crossSeason}
						options={['true','false']}
						onChange={(evt, value) => {
							this.handleAction('crossSeason', value)(evt)
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
		)
	}	

	renderAddEditProfileCurrency = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CURRENCY_TABLE_HEADER_PROFILE_ID}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.profileId}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('profileId', evt.target.value)(evt) }}
						disabled
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CURRENCY_TABLE_HEADER_TYPE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.type}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('type', evt.target.value)(evt) }}
						disabled
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CURRENCY_TABLE_HEADER_QUANTITY}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.quantity || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('quantity', evt.target.value)(evt) }}
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
					<Typography className={clsx(classes.title)}>{TEXT.CURRENCY_GENERAL_TITLE}</Typography>
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
                            title: TEXT.CURRENCY_TABLE_HEADER_NAME, field: 'name', width: 150,
                        },
						{
                            title: TEXT.CURRENCY_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: TEXT.CURRENCY_TABLE_HEADER_DEFAULT_QUANTITY, field: 'defaultQuantity', width: 150,
                        },
						{
                            title: TEXT.TABLE_HEADER_STATUS, field: 'status', width: 150,
                        },
						{
                            title: TEXT.CURRENCY_TABLE_HEADER_CROSS_SEASON, field: 'crossSeason', width: 150,
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

	renderJsonEditorTitle = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter, classes.jsonEditorTitle)}>
					<Typography className={clsx(classes.title)}>{TEXT.CURRENCY_TABLE_HEADER_SETTING}</Typography>
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
					value={this.state.rowData.settings}
					onChange={(value) => this.handleAction('settings', value)(null)}
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

	renderCurrencysTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.CURRENCY_TABLE_HEADER_NAME, field: 'name', width: 150,
							
                        },
						{
                            title: TEXT.CURRENCY_TABLE_HEADER_TYPE, field: 'type', width: 150,
							
                        },
						{
                            title: TEXT.CURRENCY_TABLE_HEADER_DEFAULT_QUANTITY, field: 'defaultQuantity', width: 150,
                        },
						{
                            title: TEXT.CURRENCY_TABLE_HEADER_CROSS_SEASON, field: 'crossSeason', width: 150,
                        },
						{
                            title: () => (
                                <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
                                    <span>{TEXT.TABLE_HEADER_STATUS}</span>
                                    <Tooltip 
                                        title={TEXT.CURRENCY_TOOLTIP_STATUS}
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
                            title: TEXT.CURRENCY_TABLE_HEADER_SETTING, field: 'settings', nofilter: true, sorting: false, width: 101,
							render: rowData =>
                            {
								return (
									<CmsControlPermission
										control={
											<Tooltip 
												title={
													TEXT.CURRENCY_TOOLTIP_EDIT_SETTING.split('&').map((line, index) =>
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
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								rowData = {
									...rowData,
									crossSeason:rowData.crossSeason.toString()
								}
								this.handleAction('currency_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.CURRENCY_TOOLTIP_EDIT_CURRENCY),
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
								this.handleAction('currency_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.CURRENCY_TOOLTIP_DELETE_CURRENCY),
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
								this.handleAction('currency_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.CURRENCY_TOOLTIP_RESTORE_CURRENCY),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.currencyTypes || []}

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

Currency.propTypes =
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
	CurrencyTypesLoad: () =>
	{
		dispatch(ActionCMS.CurrencyTypesLoad())
	},
	CurrencyTypeAdd: (currency_data) =>
	{
		dispatch(ActionCMS.CurrencyTypeAdd(currency_data))
	},
	CurrencyTypeEdit: (currency_data, manual) =>
	{
		dispatch(ActionCMS.CurrencyTypeEdit(currency_data, manual))
	},
	CurrencyTypeDelete: (currency_data) =>
	{
		dispatch(ActionCMS.CurrencyTypeDelete(currency_data))
	},
	CurrencyTypeRestore: (currency_data) =>
	{
		dispatch(ActionCMS.CurrencyTypeRestore(currency_data))
	},
	CurrenciesLoad: (profileId) =>
	{
		dispatch(ActionCMS.CurrenciesLoad(profileId))
	},
	CurrencyProfileEdit: (currency_data) =>
	{
		dispatch(ActionCMS.CurrencyProfileEdit(currency_data))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(Currency);

