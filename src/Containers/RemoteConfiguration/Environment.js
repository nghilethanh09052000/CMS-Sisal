import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography, Button, TextField } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { WarningRounded } from '@material-ui/icons'

import Utils from '../../Utils'
import TEXT from './Data/Text'
import API from '../../Api/API'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import * as Icons from '../../Components/CmsIcons'
import CmsControlPermission from '../../Components/CmsControlPermission'
import CmsTable from '../../Components/CmsTable'
import CmsExcel from '../../Components/CmsExcel'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsImport from '../../Components/CmsImport'
import { DEBUG_FIELD } from '../../Components/CmsImport/ExcelParser'

const styles = theme => ({
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
	marginRight: {
		marginRight: 10,
	},
	marginTop: {
		marginTop: 10,
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
const TABLE_HEIGHT = 670
const FULLTIME_FORMAT = 'MMM DD YYYY HH:mm'

class Environment extends React.Component
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
		}

		this.tableRef = React.createRef()
		this.selectedRows = []
		this.environments = null
		this.environmentsFetched = null
		this.services = null
		this.actionsExtend = {
			createElement: (parentProps) =>
			{
				const { classes } = this.props

				const columns = this.getExcelColumns()
				const importColumns = this.getImportColumns()

				// Use "API" instead of Redux, as I don't want to refresh render
				// Use "bind" because of these functions will be pass as component property
				// to fixed: "this" keyword is undefined

				const apiAdd = API.EnvironmentAdd.bind(API)
				const apiUpdate = API.EnvironmentEdit.bind(API)
				const apiDelete = API.EnvironmentDelete.bind(API)

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
													onClick={this.handleAction('environment_restore')}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
													{ TEXT.ENVIRONMENT_BUTTON_RESTORE_ENVIRONMENT }
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
													onClick={this.handleAction('environment_delete')}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
													{ TEXT.ENVIRONMENT_BUTTON_DELETE_ENVIRONMENT }
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
												onClick={this.handleAction('environment_add', {env: '', service: '', api: '', cms: '', internal: ''})}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
												{ TEXT.ENVIRONMENT_BUTTON_NEW_ENVIRONMENT }
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
			
			props.EnvironmentsLoad()
		
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
		this.props.SetTitle(TEXT.ENVIRONMENT_TITLE)
		this.props.EnvironmentsLoad()
	}

	componentWillUnmount() 
	{
		
	}

	componentDidUpdate(prevProps, prevState)
	{
		this.props !== prevProps && this.formatEnvironments()
	}

    render()
    {
        const { classes } = this.props

		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderEnvironmentsTable()}
				{this.renderDialog()}
			</div>
		)
    }

	formatEnvironments = () =>
	{
		if (this.environmentsFetched !== this.props.environments)
		{
			this.environmentsFetched = this.props.environments

			const environments = _.reduce(this.props.environments, (environments, row) => {
				return row.deletedAt === 0 ? [...environments, row] : environments
			}, [])

			this.environments = _.reduce(_.groupBy(environments, env => env.env), (result, value, key) =>
			{
				return {...result, [key]: _.map(value, service => (service.service))}
			}, {})

			// console.log('this.environments', this.services)

			this.services = _.reduce(_.groupBy(environments || [], service => service.service), (result, value, key) =>
			{
				return {...result, [key]: _.map(value, env => (env.env))}
			},{})

			// console.log('this.services', this.services)
		}
	}

	handleExportDialog = (isOpen) =>
	{
		this.setState({
			isExportOpen: isOpen
		})
	}

	formatExcelData = () =>
	{
		let result = this.props.environments
		
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
            let { createdAt, modifiedAt, deletedAt, endpoint, ...others} = value
			endpoint = JSON.stringify(endpoint)
            createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
			modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
			deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
            return {...others, endpoint, createdAt, modifiedAt, deletedAt}
        })
        
        console.log('formatExcelData:', result)
		return result
	}

	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.ENVIRONMENT_TABLE_HEADER_ENVIRONMENT, field: 'env'},
			{ title: TEXT.ENVIRONMENT_TABLE_HEADER_SERVICE, field: 'service' },
			{ title: TEXT.ENVIRONMENT_TABLE_HEADER_END_POINT, field: 'endpoint' },
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
			{ title: TEXT.ENVIRONMENT_TABLE_HEADER_ENVIRONMENT, field: 'env'},
			{ title: TEXT.ENVIRONMENT_TABLE_HEADER_SERVICE, field: 'service' },
			{ title: TEXT.ENVIRONMENT_TABLE_HEADER_END_POINT, field: 'endpoint' },
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
			case 'service':	    
				data = rawData.trim()
				if (_.isEmpty(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				
				break
            case 'env':    
                data = rawData.trim()
				if (_.isEmpty(data) || !_.includes(this.props.ENVS, data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break
			case 'endpoint':
				try
				{
					data = JSON.parse(rawData.trim())
					if (!data.hasOwnProperty('api') || !data.hasOwnProperty('cms') || !data.hasOwnProperty('internal'))
					{
						throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
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
			this.props.EnvironmentsLoad()
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
						this.state.dialogType === 'environment_delete' && this.props.EnvironmentDelete(row) ||
						this.state.dialogType === 'environment_restore' && this.props.EnvironmentRestore(row)
					})
				}
				else
				{
					this.state.dialogType === 'environment_add' && this.props.EnvironmentAdd(this.state.rowData) ||
					this.state.dialogType === 'environment_edit' && this.props.EnvironmentEdit(this.state.rowData, true) ||
					this.state.dialogType === 'environment_delete' && this.props.EnvironmentDelete(this.state.rowData) ||
					this.state.dialogType === 'environment_restore' && this.props.EnvironmentRestore(this.state.rowData)
				}

				break
			case 'environment_add':
			case 'environment_edit':
			case 'environment_delete':
			case 'environment_restore':
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
						[name]: data
					}
                })
		}		
	}

	validateSubmit = (submit_data) =>
	{
		const { env, service, api, cms } = submit_data
		let result = _.some(Object.keys({ env, service }), key => {
			return _.isEmpty(submit_data[key])
		}) || (_.isEmpty(api) && _.isEmpty(cms))

		return result
	}

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
                    this.state.dialogType === 'environment_add' && TEXT.ENVIRONMENT_BUTTON_NEW_ENVIRONMENT ||
                    this.state.dialogType === 'environment_edit' && TEXT.ENVIRONMENT_BUTTON_EDIT_ENVIRONMENT ||
                    this.state.dialogType === 'environment_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'environment_restore' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'environment_delete' || this.state.dialogType === 'environment_restore') && this.renderDeleteRestoreEnvironment()
			}
			{
				(this.state.dialogType === 'environment_add' || this.state.dialogType === 'environment_edit') && this.renderAddEditEnvironment()
			}
			</ModalDialog>
		)
	}

	renderDeleteRestoreEnvironment = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'environment_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.ENVIRONMENT_MESSAGE_DELETE_ENVIRONMENTS, this.state.rowData.length) : TEXT.ENVIRONMENT_MESSAGE_DELETE_ENVIRONMENT) ||
						this.state.dialogType === 'environment_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.ENVIRONMENT_MESSAGE_RESTORE_ENVIRONMENTS, this.state.rowData.length) : TEXT.ENVIRONMENT_MESSAGE_RESTORE_ENVIRONMENT) ||
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
									{`${data.env} - ${data.service}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.env} - ${this.state.rowData.service}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderAddEditEnvironment = () =>
	{
		const { classes } = this.props

		let environments = this.props.ENVS
		if (this.services.hasOwnProperty(this.state.rowData.service))
		{
			environments = _.xor(environments, this.services[this.state.rowData.service])
		}

		let services = Object.keys(this.services)
		if (this.environments.hasOwnProperty(this.state.rowData.env))
		{
			services = _.xor(services, this.environments[this.state.rowData.env])
		}

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.ENVIRONMENT_TABLE_HEADER_ENVIRONMENT}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.env}
						options={environments || []}
						onChange={(evt, value) => {
							this.handleAction('env', value)(evt)
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
						disabled={this.state.dialogType === 'environment_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.ENVIRONMENT_TABLE_HEADER_SERVICE}</Typography>
					<Autocomplete
						freeSolo
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.service}
						options={services || []}
						onChange={(evt, value) => {
							this.handleAction('service', value)(evt)
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
						disabled={this.state.dialogType === 'environment_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.ENVIRONMENT_TABLE_HEADER_END_POINT}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.marginTop, classes.marginRight)}
						value={this.state.rowData.api || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('api', evt.target.value)(evt) }}
						label={TEXT.ENVIRONMENT_TABLE_HEADER_API}
					/>
					<TextField
						className={clsx(classes.inputTextField, classes.marginTop)}
						value={this.state.rowData.cms || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('cms', evt.target.value)(evt) }}
						label={TEXT.ENVIRONMENT_TABLE_HEADER_CMS}
					/>
					<TextField
						className={clsx(classes.inputTextField, classes.marginTop)}
						value={this.state.rowData.internal || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('internal', evt.target.value)(evt) }}
						label={TEXT.ENVIRONMENT_TABLE_HEADER_INTERNAL}
					/>
				</div>
			</div>
		)
	}	

	renderEnvironmentsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.ENVIRONMENT_TABLE_HEADER_ENVIRONMENT, field: 'env', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData, columnDef, 'env')
                        },
						{
                            title: TEXT.ENVIRONMENT_TABLE_HEADER_SERVICE, field: 'service', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData, columnDef, 'service')
                        },
						{
                            title: TEXT.ENVIRONMENT_TABLE_HEADER_END_POINT, field: 'endpoint', nofilter: true, sorting: false, width: 1000,
							render: rowData => this.renderJsonColumn(rowData.endpoint, ['api', 'cms', 'internal'], [TEXT.ENVIRONMENT_TABLE_HEADER_API, TEXT.ENVIRONMENT_TABLE_HEADER_CMS, TEXT.ENVIRONMENT_TABLE_HEADER_INTERNAL])
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
								rowData = {...rowData, api: rowData.endpoint.api, cms: rowData.endpoint.cms, internal: rowData.endpoint.internal}
								delete rowData.endpoint
								this.handleAction('environment_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.ENVIRONMENT_TOOLTIP_EDIT_ENVIRONMENT),
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
								this.handleAction('environment_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.ENVIRONMENT_TOOLTIP_DELETE_ENVIRONMENT),
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
								this.handleAction('environment_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.ENVIRONMENT_TOOLTIP_RESTORE_ENVIRONMENT),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.environments || []}

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

	renderJsonColumn = (fieldData, keys, titles) =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divRow, classes.justifyStart)}>
				<div className={clsx(classes.divColumn, classes.alignStart)}>
				{	
					_.map(keys, (key, idx) => {
						return (
							<div key={`${key}-${idx}`} className={classes.divRow}>
								<div style={{ fontWeight: 'bold', marginRight: 10 }}>
								{
									`${titles[idx]}:`
								}
								</div>
								<div>
								{
									`${fieldData[key]}`
								}
								</div>
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

Environment.propTypes =
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
	EnvironmentsLoad: () =>
	{
		dispatch(ActionCMS.EnvironmentsLoad())
	},
	EnvironmentAdd: (type_data) =>
	{
		dispatch(ActionCMS.EnvironmentAdd(type_data))
	},
	EnvironmentEdit: (type_data, manual) =>
	{
		dispatch(ActionCMS.EnvironmentEdit(type_data, manual))
	},
	EnvironmentDelete: (type_data) =>
	{
		dispatch(ActionCMS.EnvironmentDelete(type_data))
	},
	EnvironmentRestore: (type_data) =>
	{
		dispatch(ActionCMS.EnvironmentRestore(type_data))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(Environment);

