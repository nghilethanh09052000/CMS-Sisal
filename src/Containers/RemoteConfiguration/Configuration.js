import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography, Button, TextField, Chip, FormControlLabel, Checkbox } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { WarningRounded } from '@material-ui/icons'

import { COUNTRY_LIST_SERVER } from '../../Defines'
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
	generalTitle: {
        marginBottom: '1rem',
    },
	additionalTitle: {
        marginTop: theme.spacing(4),
		marginBottom: '1rem',
    },
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
const COUNTRY_ALL = 'All'
const COUNTRY_NONE = 'None'
const COUNTRY_LIST = _.map(COUNTRY_LIST_SERVER, country => (country.code))

class Configuration extends React.Component
{
	constructor(props)
	{
		super(props)

		this.state = {
			dialogType: props.match.params.goLive === 'true' ? 'config_warning' : '',
            isDialogOpen: props.match.params.goLive === 'true',
			isImportOpen: false,
			isExportOpen: false,
			isMultiSelectMode: false,
			rowData: {},
			versionData: {
				versionId: props.match.params.id,
				client: decodeURIComponent(props.match.params.client),
				version: props.match.params.version,
				env: props.match.params.env,
				status: props.match.params.status,
				goLive: props.match.params.goLive === 'true',
			}
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

				const apiAdd = API.ConfigAdd.bind(API)
				const apiUpdate = API.ConfigEdit.bind(API)
				const apiDelete = API.ConfigDelete.bind(API)

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
									formatData={this.formatImportData}
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
													onClick={this.handleAction('config_restore')}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
													{ TEXT.CONFIGURATION_BUTTON_RESTORE_CONFIGURATION }
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
													onClick={this.handleAction('config_delete')}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
													{ TEXT.CONFIGURATION_BUTTON_DELETE_CONFIGURATION }
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
												onClick={this.handleAction('config_add', {...this.state.versionData, key: '', value: '', allowedCountries: [COUNTRY_ALL], deniedCountries: [COUNTRY_NONE]})}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
												{ TEXT.CONFIGURATION_BUTTON_NEW_CONFIGURATION }
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
			
			props.ConfigsLoad(state.rowData)
		
			return {
				isDialogOpen: false,
				isMultiSelectMode: false,
				dialogType: '',
				rowData: {},

				// Update versionData
				versionData: state.dialogType === 'version_edit'
								? {...state.versionData, env: state.rowData.env, goLive: state.rowData.goLive, status: state.rowData.goLive ? 'Live' : 'Ready'}
								: state.versionData
			}
		}

        return null; // No change to state
    }

    componentDidMount()
	{
		this.props.SetTitle(TEXT.CONFIGURATION_CONFIGURATION_TITLE)
		this.props.ConfigsLoad(this.state.versionData)
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
				{this.renderGeneralTable()}
				{this.renderAdditionalTable()}
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
		let result = this.props.configs
		
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
            let { createdAt, modifiedAt, deletedAt, allowedCountries, deniedCountries, ...others} = value
			allowedCountries = allowedCountries.join(',')
			deniedCountries = deniedCountries.join(',')
            createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
			modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
			deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
            return {...others, allowedCountries, deniedCountries, createdAt, modifiedAt, deletedAt}
        })
        
        console.log('formatExcelData:', result)
		return result
	}

	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.CONFIGURATION_TABLE_HEADER_KEY, field: 'key'},
			{ title: TEXT.CONFIGURATION_TABLE_HEADER_VALUE, field: 'value' },
			{ title: TEXT.CONFIGURATION_TABLE_HEADER_ALLOWED_COUNTRIES, field: 'allowedCountries' },
			{ title: TEXT.CONFIGURATION_TABLE_HEADER_DENIED_COUNTRIES, field: 'deniedCountries' },
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
			{ title: TEXT.CONFIGURATION_TABLE_HEADER_KEY, field: 'key'},
			{ title: TEXT.CONFIGURATION_TABLE_HEADER_VALUE, field: 'value' },
			{ title: TEXT.CONFIGURATION_TABLE_HEADER_ALLOWED_COUNTRIES, field: 'allowedCountries' },
			{ title: TEXT.CONFIGURATION_TABLE_HEADER_DENIED_COUNTRIES, field: 'deniedCountries' },
		]

		return columns
	}

	formatImportData = (rowData) =>
	{
		return {...rowData, ...this.state.versionData}
	}

    getImportData = (rowData, field, column) =>
	{
		let rawData = rowData[column]
		let data = rawData

		console.log('getImportData rawData', rawData, 'field', field, 'column', column)

		switch (field)
		{ 
			case 'versionId':
			case 'id':
			case 'key':
			case 'value':	    
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
			case 'allowedCountries': 
				data = rawData.trim()
				if (_.isEmpty(data))
				{
					data = [COUNTRY_ALL]
				}
				else
				{
					data = data.split(',')
				}

				break
			case 'deniedCountries':  
				data = rawData.trim()
				if (_.isEmpty(data))
				{
					data = [COUNTRY_NONE]
				}
				else
				{
					data = data.split(',')
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
			this.props.ConfigsLoad(this.state.versionData)
		}
	}

	handleAction = (name, data) => (evt) =>
	{
		switch (name)
		{
			case 'config_back':
				this.props.history.goBack()

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
						this.state.dialogType === 'config_delete' && this.props.ConfigDelete(row) ||
						this.state.dialogType === 'config_restore' && this.props.ConfigRestore(row)
					})
				}
				else
				{
					this.state.dialogType === 'config_add' && this.props.ConfigAdd(this.state.rowData) ||
					this.state.dialogType === 'config_edit' && this.props.ConfigEdit(this.state.rowData) ||
					this.state.dialogType === 'config_delete' && this.props.ConfigDelete(this.state.rowData) ||
					this.state.dialogType === 'config_restore' && this.props.ConfigRestore(this.state.rowData) ||
					this.state.dialogType === 'version_edit' && this.props.VersionEdit({...this.state.rowData, id: this.state.rowData.versionId})
				}

				break
			case 'config_add':
			case 'config_edit':
			case 'config_delete':
			case 'config_restore':
			case 'version_edit':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})

				break
			case 'allowedCountries':
				let allowedCountries = _.filter(data, country => (country !== COUNTRY_ALL))
				if (_.isEmpty(data))
				{
					allowedCountries = [COUNTRY_ALL]
				}

				this.setState({
                    rowData: {
						...this.state.rowData, 
						allowedCountries
					}
                })

				break
			case 'deniedCountries':
				let deniedCountries = _.filter(data, country => (country !== COUNTRY_NONE))
				if (_.isEmpty(data))
				{
					deniedCountries = [COUNTRY_NONE]
				}

				this.setState({
                    rowData: {
						...this.state.rowData, 
						deniedCountries
					}
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
		const { version, client, env, key, value } = submit_data
		let result = false

		if (this.state.dialogType === 'version_edit')
		{
			result = _.some(Object.keys({ version, client, env }), key => {
				return _.isEmpty(submit_data[key])
			})
		}
		else
		{
			result = _.some(Object.keys({ key, value }), key => {
				return _.isEmpty(submit_data[key])
			})

			if (!result && this.state.dialogType === 'config_add')
			{
				result = _.find(this.props.configs, { key : submit_data.key }) !== undefined
			}
		}

		return result
	}

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
                    this.state.dialogType === 'config_add' && TEXT.CONFIGURATION_BUTTON_NEW_CONFIGURATION ||
                    this.state.dialogType === 'config_edit' && TEXT.CONFIGURATION_BUTTON_EDIT_CONFIGURATION ||
                    this.state.dialogType === 'config_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'config_restore' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'config_warning' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'version_edit' && TEXT.CONFIGURATION_BUTTON_UPDATE_ENVIRONMENT ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={this.state.dialogType === 'config_warning' ? null : TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction(this.state.dialogType === 'config_warning' ? 'close' : 'submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(_.includes(this.state.dialogType, '_warning') || _.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'config_warning' || this.state.dialogType === 'config_delete' || this.state.dialogType === 'config_restore') && this.renderWarning()
			}
			{
				(this.state.dialogType === 'config_add' || this.state.dialogType === 'config_edit') && this.renderAddEditConfig()
			}
			{
				this.state.dialogType === 'version_edit' && this.renderUpdateVersion()
			}
			</ModalDialog>
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
						this.state.dialogType === 'config_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.CONFIGURATION_MESSAGE_DELETE_CONFIGURATIONS, this.state.rowData.length) : TEXT.CONFIGURATION_MESSAGE_DELETE_CONFIGURATION) ||
						this.state.dialogType === 'config_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.CONFIGURATION_MESSAGE_RESTORE_CONFIGURATIONS, this.state.rowData.length) : TEXT.CONFIGURATION_MESSAGE_RESTORE_CONFIGURATION) ||
						this.state.dialogType === 'config_warning' && TEXT.CONFIGURATION_MESSAGE_WARNING_CONFIGURATION ||
						''
					}
					</Typography>
					<div className={clsx(classes.divColumn, classes.divMaxHeight)}>
					{
						this.state.dialogType === 'config_warning'
						?
						<Typography key={this.state.versionData.versionId} style={{ paddingBottom: 5 }}>
							{`${this.state.versionData.client} - ${this.state.versionData.version} - ${this.state.versionData.env}`}
						</Typography>
						:
						<>
						{
							this.state.isMultiSelectMode
							?
							_.map(this.state.rowData, data => {
								return (
									<Typography key={data.id} style={{ paddingBottom: 5 }}>
										{`${data.key} - ${data.value}`}
									</Typography>
								)	
							})
							:
							<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
								{`${this.state.rowData.key} - ${this.state.rowData.value}`}
							</Typography>
						}
						</>
					}
					</div>
				</div>
			</div>
		)
	}

	renderAddEditConfig = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CONFIGURATION_TABLE_HEADER_KEY}</Typography>
					<Autocomplete
						freeSolo
						autoSelect
						autoComplete
						filterSelectedOptions
						value={this.state.rowData.key}
						options={[]}
						onChange={(evt, value) => {
							this.handleAction('key', value)(evt)
						}}
						renderInput={(params) => (
							<TextField {...params}
								variant="outlined"
								error={_.find(this.props.configs, { key : this.state.rowData.key }) !== undefined}
								helperText={_.find(this.props.configs, { key : this.state.rowData.key }) !== undefined ? TEXT.CONFIGURATION_MESSAGE_EXIST_CONFIGURATION : ' '}
							/>
						)}
						classes={{
							root: classes.autoComplete,
							input: classes.autoCompleteInput,
							inputRoot: classes.autoCompleteInputRoot
						}}
						disabled={this.state.dialogType === 'config_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CONFIGURATION_TABLE_HEADER_VALUE}</Typography>
					<Autocomplete
						freeSolo
						autoSelect
						autoComplete
						filterSelectedOptions
						value={this.state.rowData.value}
						options={[]}
						onChange={(evt, value) => {
							this.handleAction('value', value)(evt)
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
					<Typography>{TEXT.CONFIGURATION_TABLE_HEADER_ALLOWED_COUNTRIES}</Typography>
					<Autocomplete
						multiple
						limitTags={4}
						size={'small'}
						filterSelectedOptions
						value={this.state.rowData.allowedCountries}
						options={COUNTRY_LIST}
						getOptionLabel={option => Utils.getCountryName(option)}
						getOptionDisabled={(option) => {
							return _.some(this.state.rowData.deniedCountries, country => (country === option))
						}}
						onChange={(evt, value) => {
							this.handleAction('allowedCountries', value)(evt)
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
					<Typography>{TEXT.CONFIGURATION_TABLE_HEADER_DENIED_COUNTRIES}</Typography>
					<Autocomplete
						multiple
						limitTags={4}
						size={'small'}
						filterSelectedOptions
						value={this.state.rowData.deniedCountries}
						options={COUNTRY_LIST}
						getOptionLabel={option => Utils.getCountryName(option)}
						getOptionDisabled={(option) => {
							return _.some(this.state.rowData.allowedCountries, country => (country === option))
						}}
						onChange={(evt, value) => {
							this.handleAction('deniedCountries', value)(evt)
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
	
	renderUpdateVersion = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.OVERVIEW_TABLE_HEADER_CLIENT}</Typography>
					<Autocomplete
						freeSolo
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.client}
						options={[]}
						onChange={(evt, value) => {
							this.handleAction('client', value)(evt)
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
						disabled={this.state.dialogType === 'version_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.OVERVIEW_TABLE_HEADER_VERSION}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.version || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('version', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'version_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.OVERVIEW_TABLE_HEADER_ENVIRONMENT}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.env}
						options={this.props.ENVS}
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
					/>
				</div>
				<FormControlLabel
					control={
						<Checkbox
							color={'primary'}
							checked={this.state.rowData.goLive || false}
							onChange={(evt, checked) => {
								this.handleAction('goLive', checked)(evt)
							}}
						/>
					}
					label={TEXT.OVERVIEW_TABLE_HEADER_GOLIVE}
					labelPlacement={'end'}
				/>
			</div>
		)
	}

	renderGeneralTableTitle = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter, classes.generalTitle)}>
					<Typography className={clsx(classes.title)}>{TEXT.CONFIGURATION_GENERAL_TITLE}</Typography>
					<div className={clsx(classes.divRow)}>
						<Button
							variant={'contained'}
							color={'primary'}
							onClick={this.handleAction('config_back', {})}
							className={clsx(classes.buttonLeft)}
						>
							{ TEXT.MODAL_BACK }
						</Button>
						<CmsControlPermission
							control={
								<Button
									variant={'contained'}
									color={'primary'}
									onClick={this.handleAction('version_edit', {...this.state.versionData})}
									className={clsx(classes.buttonLeft)}
									startIcon={<Icons.UpgradeIcon/>}
								>
									{ TEXT.CONFIGURATION_BUTTON_UPDATE_ENVIRONMENT }
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

	renderGeneralTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.general, classes.divColumn)}>
				{this.renderGeneralTableTitle()}
                <CmsTable
                    columns={[
                        {
                            title: TEXT.OVERVIEW_TABLE_HEADER_CLIENT, field: 'client', width: 150,
                        },
						{
                            title: TEXT.OVERVIEW_TABLE_HEADER_VERSION, field: 'version', width: 150,
                        },
						{
                            title: TEXT.OVERVIEW_TABLE_HEADER_ENVIRONMENT, field: 'env', width: 150,
                        },
						{
                            title: TEXT.TABLE_HEADER_STATUS, field: 'status', width: 150,
                        },
                    ]}

                    data={[this.state.versionData] || []}

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

	renderAdditionalTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				<Typography className={clsx(classes.title, classes.additionalTitle)}>{TEXT.CONFIGURATION_ADDITIONAL_TITLE}</Typography>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.CONFIGURATION_TABLE_HEADER_KEY, field: 'key', width: 250,
                        },
						{
                            title: TEXT.CONFIGURATION_TABLE_HEADER_VALUE, field: 'value', width: 300,
							render: rowData =>
							{
								return (
									<div style={{ width: 280, marginLeft: 10, wordWrap: 'break-word' }}>
										{rowData.value}
									</div>
								)
							}
                        },
						{
                            title: TEXT.CONFIGURATION_TABLE_HEADER_ALLOWED_COUNTRIES, field: 'allowedCountries', width: 400,
							render: rowData => this.renderChipsColumn(rowData, 'allowedCountries'),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.allowedCountries.join(','), columnDef)
                        },
						{
                            title: TEXT.CONFIGURATION_TABLE_HEADER_DENIED_COUNTRIES , field: 'deniedCountries', width: 400,
							render: rowData => this.renderChipsColumn(rowData, 'deniedCountries'),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deniedCountries.join(','), columnDef)
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
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdAt', width: 350,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy', hidden: true,
                        },
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', width: 150,
                            render: rowData => this.renderDeletedAtColumn(rowData),
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
									...this.state.versionData,
									allowedCountries: _.isEmpty(rowData.allowedCountries) ? [COUNTRY_ALL] : rowData.allowedCountries,
									deniedCountries: _.isEmpty(rowData.deniedCountries) ? [COUNTRY_NONE] : rowData.deniedCountries
								}

								this.handleAction('config_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.CONFIGURATION_TOOLTIP_EDIT_CONFIGURATION),
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
								rowData = {
									...rowData,
									...this.state.versionData,
								}

								this.handleAction('config_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.CONFIGURATION_TOOLTIP_DELETE_CONFIGURATIONT),
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
								rowData = {
									...rowData,
									...this.state.versionData,
								}

								this.handleAction('config_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.CONFIGURATION_TOOLTIP_RESTORE_CONFIGURATION),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.configs || []}

                    options={{
						actionsColumnIndex: -1,
						fixedColumns: {
							left: 2,
							right: -100
						},
						tableStickyHeader: false,
                        showTitle: false,
                        search: true,
                        filtering: false,
						sorting: true,
                        pageSize: PAGE_SIZE/2,
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
				key={`${rowData.id}-${field}`}
				fullWidth
				multiple
				disableClearable
				filterSelectedOptions
				limitTags={NUMBER_CHIPS}
				size={'small'}
				value={chips}
				options={fieldData}
				getOptionLabel={option => Utils.getCountryName(option)}
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
								label={Utils.getCountryName(option)}
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

Configuration.propTypes =
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
	ConfigsLoad: (version_data) =>
	{
		dispatch(ActionCMS.ConfigsLoad(version_data))
	},
	ConfigAdd: (config_data) =>
	{
		dispatch(ActionCMS.ConfigAdd(config_data))
	},
	ConfigEdit: (config_data) =>
	{
		dispatch(ActionCMS.ConfigEdit(config_data))
	},
	ConfigDelete: (config_data) =>
	{
		dispatch(ActionCMS.ConfigDelete(config_data))
	},
	ConfigRestore: (config_data) =>
	{
		dispatch(ActionCMS.ConfigRestore(config_data))
	},
	VersionEdit: (version_data) =>
	{
		dispatch(ActionCMS.VersionEdit(version_data))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(Configuration);

