import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography, Button, TextField, Tooltip, IconButton, Checkbox, FormControlLabel } from '@material-ui/core'
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
import CmsDate from '../../Components/CmsDate';
import CmsImport from '../../Components/CmsImport'
import { DEBUG_FIELD } from '../../Components/CmsImport/ExcelParser'
import { JsonEditor } from '../../3rdParty/jsoneditor-react-master/src'

import ModalDialog from '../../Components/Dialogs/ModalDialog'
import { saveAs } from 'file-saver';


const styles = theme => ({
	table: {
        flexGrow: 0,
        flexShrink: 0,
        marginTop: 0,
    },
	divMaxHeight: {
		maxHeight: '20vh',
		overflowY: 'auto'
	},
	cmsDate: {
        marginBottom: theme.spacing(1)
    },
	generalTitle: {
        marginBottom: '1rem',
    },
	jsonEditorTitle: {
        marginTop: theme.spacing(3),
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

class Leaderboard extends React.Component
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
			errorJsonEditor: false,
			isJsonEditorMode: false,
			viewJsonMode: 'text',
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

				let apiAdd, apiUpdate, apiDelete
				
				apiAdd = API.LeaderboardsAdd.bind(API)
				apiUpdate = API.LeaderboardsEdit.bind(API)
				apiDelete = API.LeaderboardsDelete.bind(API)
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
									fileNameExtend={`/${TEXT.LEADERBOARD_LEADERBOARD_FILE_NAME}`}
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
													onClick={
														this.handleAction('leaderboard_restore')
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
												{
													TEXT.LEADERBOARD_BUTTON_RESTORE_LEADERBOARD
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
														this.handleAction('leaderboard_delete')
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
												{
													TEXT.LEADERBOARD_BUTTON_DELETE_LEADERBOARD
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
													this.handleAction('leaderboard_add',{name: '', status: '',type: '', description: '', start_end_date: '', seasonName: '', autoExport: false, crossSeason: false, freezable: false, configs: {} })
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
											{
												TEXT.LEADERBOARD_BUTTON_NEW_LEADERBOARD 
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
			props.ClearRefresh()
			if(state.isJsonEditorMode || _.includes(state.dialogType, 'leaderboard_'))
			{
				props.LeaderboardsLoad()
			}
			else
			{
				saveAs(new Blob([props.leaderboardFileData]), `${state.rowData.name}.zip` )
				props.ClearProps(['leaderboardFileData'])
			}

			return {
				isDialogOpen: false,
				isMultiSelectMode: false,
				dialogType: '',
				rowData: state.isJsonEditorMode ? state.rowData : {},
			}
		}

        return null;
    }

	componentDidMount()
	{
		this.props.SetTitle(TEXT.LEADERBOARD_MANAGEMENT_TITLE)
		this.props.LeaderboardsLoad()
	}

	render()
	{
		const { classes } = this.props
		
		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.state.isJsonEditorMode ? this.renderJsonEditor() : this.renderLeaderboardsTable()}
				{this.renderDialog()}
			</div>
		)
	}

	dateFilterAndSearch = (term, rowData, columnDef, field) =>
	{
		var terms = term.split(';');
		let timestamp = rowData[field] !== -1 ? moment.utc(rowData[field]).format(FULLTIME_FORMAT) : ''	
		return _.some(terms, value =>
		{
			if (value.length > 0)
			{
				return columnDef.searchAlgorithm === 'includes' ? _.includes(timestamp, value) : _.startsWith(timestamp, value)
			}

			return false
		})
	}

	handleExportDialog = (isOpen) =>
	{
		this.setState({
			isExportOpen: isOpen
		})
	}

	formatExcelData = () =>
	{
		let result = []
		if (this.state.tableTab === 0)
		{
			result = this.props.leaderboards
		}
		
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
            let { time, isLive ,createdAt, modifiedAt, deletedAt, configs, autoExport, crossSeason, freezable, ...others} = value
			configs = JSON.stringify(configs)
			time = JSON.stringify(time)
			isLive = isLive.toString()
			autoExport = autoExport.toString()
			crossSeason = crossSeason.toString()
			freezable = freezable.toString()
            createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
			modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
			deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
            return {...others, configs, autoExport, crossSeason, freezable, time, isLive,createdAt, modifiedAt, deletedAt}
        })
        
        console.log('formatExcelData:', result)
		return result
	}

	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.TABLE_HEADER_NAME, field: 'name' },
			{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.TABLE_HEADER_ORDER, field: 'order' },
			{ title: TEXT.TABLE_HEADER_TYPE, field: 'type' },
			{ title: TEXT.TABLE_HEADER_IS_TIME, field: 'time' },
			{ title: TEXT.TABLE_HEADER_SEASON_NAME, field: 'seasonName' },
			{ title: TEXT.TABLE_HEADER_DESCRIPTION, field: 'description' },
			{ title: TEXT.TABLE_HEADER_IS_LIVE, field: 'isLive' },
			{ title: TEXT.TABLE_HEADER_AUTO_EXPORT, field: 'autoExport' },
			{ title: TEXT.TABLE_HEADER_CROSS_SEASON, field: 'crossSeason' },
			{ title: TEXT.TABLE_HEADER_FREEZABLE, field: 'freezable' },
			{ title: TEXT.TABLE_HEADER_CONFIGS, field: 'configs' },


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
			{ title: TEXT.TABLE_HEADER_NAME, field: 'name' },
			{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.TABLE_HEADER_ORDER, field: 'order' },
			{ title: TEXT.TABLE_HEADER_TYPE, field: 'type' },
			{ title: TEXT.TABLE_HEADER_IS_TIME, field: 'time' },
			{ title: TEXT.TABLE_HEADER_SEASON_NAME, field: 'seasonName' },
			{ title: TEXT.TABLE_HEADER_DESCRIPTION, field: 'description' },
			{ title: TEXT.TABLE_HEADER_AUTO_EXPORT, field: 'autoExport' },
			{ title: TEXT.TABLE_HEADER_CROSS_SEASON, field: 'crossSeason' },
			{ title: TEXT.TABLE_HEADER_FREEZABLE, field: 'freezable' },
			{ title: TEXT.TABLE_HEADER_CONFIGS, field: 'configs' },
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
			case 'name':
			case 'seasonName':
			case 'description':
				data = rawData.trim()
				if (_.isEmpty(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}	
				break
			case 'status':
				data = rawData.trim();
				if (_.isEmpty(data) || !_.includes(this.props.statuses, data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break
			case 'type':
				data = rawData.trim();
				if (_.isEmpty(data) || !_.includes(this.props.types, data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break
			case 'time':
				try
				{
					data = JSON.parse(rawData.trim());
					if (!data.hasOwnProperty('start') || !data.hasOwnProperty('end') || _.isNaN(data.start) || _.isNaN(data.end))
					{
						throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
					}
				}
				catch(err)
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break
			case 'configs':
				try
				{
					data = JSON.parse(rawData.trim());
				}
				catch(err)
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break	
			case 'autoExport':
			case 'crossSeason':
			case 'freezable':		
				data = rawData;
				if(!_.isBoolean(data))
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
			this.props.LeaderboardsLoad()
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
					rowData: {},
					isJsonEditorMode: false,
					viewJsonMode: 'text',
				})

				break
			case 'submit':
				if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						this.state.dialogType === 'leaderboard_delete' && this.props.LeaderboardsDelete(row) ||
						this.state.dialogType === 'leaderboard_restore' && this.props.LeaderboardsRestore(row)
					})
				}
				else
				{
					const { start_end_date, type } = this.state.rowData;
					let time;
					if (type === 'Event')
					{
						time = {
							start: start_end_date?.ms_begin_utc || 0,
							end: start_end_date?.ms_end_utc || 0
						}

						this.state.rowData = {
							...this.state.rowData,
							time
						}
					}
						
					this.state.dialogType === 'leaderboard_add' && this.props.LeaderboardsAdd(this.state.rowData) ||
					this.state.dialogType === 'leaderboard_edit' && this.props.LeaderboardsEdit(this.state.rowData) ||
					this.state.isJsonEditorMode && this.props.LeaderboardsEdit(this.state.rowData) ||
					this.state.dialogType === 'leaderboard_delete' && this.props.LeaderboardsDelete(this.state.rowData) ||
					this.state.dialogType === 'leaderboard_restore' && this.props.LeaderboardsRestore(this.state.rowData) 
				}
				
				break
			case 'download_leaderboard':
				this.setState(
					{
						dialogType: name,
						rowData: data
					},
					() =>
					{
						this.props.LeaderboardDetailLoad(data)
					}
				)

				break	
			case 'leaderboard_add':
			case 'leaderboard_edit':
				this.setState(
					{
						isDialogOpen: true,
						dialogType: name,
						rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
					},
					() =>
					{
						this.props.SeasonsLoad()
					}
				)
				
				break
			case 'leaderboard_delete':
			case 'leaderboard_restore':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})

				break		
			case 'json_editor':
				this.setState({
					isJsonEditorMode: true,
					rowData: data
				})
				
				break	
			case 'viewJsonMode':	
				this.setState({
					errorJsonEditor: false,
					viewJsonMode: data,
				})

				break
			case 'configs':
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
						[name]: data
					}
                })
		}		
	}

    validateSubmit = (submit_data) =>
	{
		let {
			name,
			status,
			type,
			description,
			seasonName,
			crossSeason,
		} = submit_data

		let result = _.some([name, status, type, description], data => _.isEmpty(data))
		if (!result)
		{
			crossSeason = type === 'Seasonal' ? false : crossSeason
			if (!crossSeason)
			{
				result = _.isEmpty(seasonName)
			}
			
		}

		return result
	}

	renderGeneralTableTitle = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter, classes.generalTitle)}>
					<Typography className={clsx(classes.title)}>{TEXT.SEASON_GENERAL_TITLE}</Typography>
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
							title: TEXT.TABLE_HEADER_NAME, field: 'name', width: 250,
						},
						{
							title: TEXT.TABLE_HEADER_STATUS, field: 'status', width: 150,
						},
						{
							title: TEXT.TABLE_HEADER_ORDER, field: 'order', width: 150,
						},
						{
							title: TEXT.TABLE_HEADER_TYPE, field: 'type', width: 150,
						},
						{
							title: TEXT.TABLE_HEADER_IS_TIME, placeholder: TEXT.TABLE_HEADER_START_DATE, field: 'time', width: 250,
							render: rowData => this.renderStartEndColumn(rowData),
						},
						{
							title: TEXT.TABLE_HEADER_SEASON_NAME, field: 'seasonName', width: 200,
						},
						{
							title: TEXT.TABLE_HEADER_CROSS_SEASON, field: 'crossSeason', width: 150,
						},
						{
							title: TEXT.TABLE_HEADER_DESCRIPTION, field: 'description', width: 150,
						},
						{
							title: TEXT.TABLE_HEADER_IS_LIVE, field: 'isLive', width: 150,
						},
						{
							title: TEXT.TABLE_HEADER_AUTO_EXPORT, field: 'autoExport', width: 150,
						},
						{
							title: TEXT.TABLE_HEADER_FREEZABLE, field: 'freezable', width: 150,
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
					<Typography className={clsx(classes.title)}>{TEXT.TABLE_HEADER_CONFIGS}</Typography>
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
					value={this.state.rowData.configs}
					onChange={(value) => this.handleAction('configs', value)(null)}
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

	renderLeaderboardsTable = () =>
	{
		const { classes , leaderboardItems } = this.props
		
		
		return (
			<div className={clsx(classes.table, classes.divColumn)}>
					<CmsTable
						columns={[
							{
								title: TEXT.TABLE_HEADER_NAME, field: 'name', width: 250,
							},
							{
								title: TEXT.TABLE_HEADER_STATUS, field: 'status', width: 150,
							},
							{
								title: TEXT.TABLE_HEADER_ORDER, field: 'order', width: 150,
							},
							{
								title: TEXT.TABLE_HEADER_TYPE, field: 'type', width: 150,
							},
							{
							    title: TEXT.TABLE_HEADER_IS_TIME, placeholder: TEXT.TABLE_HEADER_START_DATE, field: 'time', width: 250,
								render: rowData => this.renderStartEndColumn(rowData),
								customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData.time, columnDef, 'start'),
							},
							{
								title: TEXT.TABLE_HEADER_SEASON_NAME, field: 'seasonName', width: 200,
							},
							{
								title: TEXT.TABLE_HEADER_CROSS_SEASON, field: 'crossSeason', width: 150,
							},
							{
								title: TEXT.TABLE_HEADER_DESCRIPTION, field: 'description', width: 150,
							},
							{
								title: TEXT.TABLE_HEADER_IS_LIVE, field: 'isLive', width: 150,
							},
							{
								title: TEXT.TABLE_HEADER_AUTO_EXPORT, field: 'autoExport', width: 150,
							},
							{
								title: TEXT.TABLE_HEADER_FREEZABLE, field: 'freezable', width: 150,
							},
							{
								title: TEXT.TABLE_HEADER_CONFIGS, field: 'configs', nofilter: true, sorting: false, width: 101,
								render: rowData =>
								{
									return (
										<CmsControlPermission
											control={
												<Tooltip 
													title={rowData.status === 'Ended' ? '' : TEXT.LEADERBOARD_TOOLTIP_CONFIGS}
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
									this.handleAction('leaderboard_edit', rowData)(event)
								},
								tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.LEADERBOARD_TOOLTIP_EDIT_LEADERBOARD),
								disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0 || rowData.status === 'Ended'),
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
									this.props.history.push(`${this.props.location.pathname}/${rowData.id}/${encodeURIComponent(rowData.name)}/scores`)
								},
								tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.LEADERBOARD_TOOLTIP_SCORES ),
								disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0),
								iconProps: { color: 'inherit' },
								position: 'row',
								controlPermission: {
									link: '',
									attribute: ''
								}
							},
							{
								icon: (props) => <Icons.IconDownload {...props} />,
								onClick: (event, rowData) =>
								{
									this.handleAction('download_leaderboard',rowData)(event)
								},
								tooltip: (rowData) =>
								{
									if (this.state.isMultiSelectMode || rowData.deletedAt > 0) return ''
									if (rowData.status === 'Ended' || rowData.deletedAt > 0) return TEXT.LEADERBOARD_DOWNLOAD_LEADERBOARD
									if (rowData.type === 'Seasonal' && rowData.time?.end > 0) return TEXT.LEADERBOARD_DOWNLOAD_LEADERBOARD
									return ''
								},
								disabled: (rowData) =>
								{
									if (this.state.isMultiSelectMode || rowData.deletedAt > 0) return true
									if (rowData.status === 'Ended' || rowData.deletedAt > 0) return false
									if (rowData.type === 'Seasonal' && rowData.time?.end > 0) return false
									return true
								},
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
									this.handleAction('leaderboard_delete', rowData)(event)
								},
								tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.LEADERBOARD_TOOLTIP_DELETE_LEADERBOARD),
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
									this.handleAction('leaderboard_restore', rowData)(event)
								},
								tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.LEADERBOARD_TOOLTIP_RESTORE_LEADERBOARD),
								disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
								iconProps: { color: 'inherit' },
								position: 'row',
								controlPermission: {
									link: '',
									attribute: ''
								}
							}
						]}

						data={leaderboardItems || []}
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

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
                    this.state.dialogType === 'leaderboard_add' && TEXT.LEADERBOARD_BUTTON_NEW_LEADERBOARD ||
                    this.state.dialogType === 'leaderboard_edit' && TEXT.LEADERBOARD_BUTTON_EDIT_LEADERBOARD ||
                    this.state.dialogType === 'leaderboard_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'leaderboard_restore' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'leaderboard_delete' || this.state.dialogType === 'leaderboard_restore') && this.renderDeleteRestoreLeaderboards()
			}
			{
				(this.state.dialogType === 'leaderboard_add' || this.state.dialogType === 'leaderboard_edit') && this.renderAddEditLeaderboards()
			}
			</ModalDialog>
		)
	}

	renderDeleteRestoreLeaderboards = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'leaderboard_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.LEADERBOARD_MESSAGE_DELETE_LEADERBOARDS, this.state.rowData.length) : TEXT.LEADERBOARD_MESSAGE_DELETE_LEADERBOARD) ||
						this.state.dialogType === 'leaderboard_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.LEADERBOARD_MESSAGE_RESTORE_LEADERBOARDS, this.state.rowData.length) : TEXT.LEADERBOARD_MESSAGE_RESTORE_LEADERBOARD) ||
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
									{`${data.name} - ${data.status} - ${data.type}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.status} - ${this.state.rowData.type}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}		

	renderAddEditLeaderboards = () =>
	{
		const { classes , statuses , types } = this.props;
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.TABLE_HEADER_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'leaderboard_edit'}
					/>
					
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.TABLE_HEADER_STATUS}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.status}
						options={statuses || []}
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
					<Typography>{TEXT.TABLE_HEADER_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.type}
						options={types || []}
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
					<Typography>{TEXT.TABLE_HEADER_DESCRIPTION}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.description || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('description', evt.target.value)(evt) }}
					/>
				</div>
				{
					this.state.rowData.type === 'Event' &&
					<div className={clsx(classes.divColumn)}>
						<Typography>{`${TEXT.TABLE_HEADER_IS_TIME} (${TEXT.TABLE_HEADER_UTC_0})`}</Typography>
						<div className={clsx(classes.divColumn)}>
							<div className={clsx(classes.divColumn, classes.divHeight, classes.cmsDate)}>
								<CmsDate
									views={['date', 'hours', 'minutes']}
									disableToolbar={false} 
									enableFullTimeFormat={true}
									disableCheckMaxRange={true}
									raiseSubmitOnMounted={true}
									disablePast={this.state.dialogType === 'leaderboard_add' ? true : false}
									initDate={
										this.state.dialogType === 'leaderboard_edit' 
										?	
										{ 
											date_begin: this.state.rowData.time.start === 0 ? moment().valueOf() : Utils.convertToLocalTime(this.state.rowData.time.start), 
											date_end: this.state.rowData.time.end === 0 ? moment().valueOf() : Utils.convertToLocalTime(this.state.rowData.time.end)
										} 
										: null
									}
									onDateSubmit={(data) => {
										this.handleAction('start_end_date', data)(null)
									}}
								/>
							</div>
						</div>
					</div>
				}
				{
					this.state.rowData.type !== 'Seasonal' &&
					<div className={clsx(classes.divColumn)}>
						<FormControlLabel
							control={
								<Checkbox
									color={'primary'}
									checked={this.state.rowData.crossSeason || false}
									onChange={(evt, checked) => {
										this.handleAction('crossSeason', checked)(evt)
									}}
								/>
							}
							label={TEXT.TABLE_HEADER_CROSS_SEASON}
							labelPlacement={'end'}
						/>
					</div>
				}
				{
					(this.state.rowData.crossSeason === false || this.state.rowData.type === 'Seasonal') &&
					<div className={clsx(classes.divColumn)}>
						<Typography>{TEXT.TABLE_HEADER_SEASON_NAME}</Typography>
						<Autocomplete
							freeSolo
							autoSelect
							filterSelectedOptions
							value={this.state.rowData.seasonName}
							options={_.map(this.props.seasons || [], season => (season.name))}
							onChange={(evt, value) => {
								this.handleAction('seasonName', value)(evt)
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
				}
				{
					this.state.rowData.type === 'Seasonal' &&
					<div className={clsx(classes.divColumn)}>
						<FormControlLabel
							control={
								<Checkbox
									color={'primary'}
									checked={this.state.rowData.freezable || false}
									onChange={(evt, checked) => {
										this.handleAction('freezable', checked)(evt)
									}}
								/>
							}
							label={TEXT.TABLE_HEADER_FREEZABLE}
							labelPlacement={'end'}
						/>
					</div>
				}
				<div className={clsx(classes.divColumn)}>
					<FormControlLabel
						control={
							<Checkbox
								color={'primary'}
								checked={this.state.rowData.autoExport || false}
								onChange={(evt, checked) => {
									this.handleAction('autoExport', checked)(evt)
								}}
							/>
						}
						label={TEXT.TABLE_HEADER_AUTO_EXPORT}
						labelPlacement={'end'}
					/>
				</div>
			</div>
		)
	}		

	renderStartEndColumn = (rowData) => 
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.divRow, classes.justifyStart)}>
				<div className={clsx(classes.divColumn, classes.alignStart)}>
					<div className={classes.divRow}>
						<div style={{ fontWeight: 'bold', marginRight: 5 }}>
						{
							`${TEXT.TABLE_HEADER_START_DATE}:`
						}
						</div>
						<div>
						{
							`${rowData.time?.start !== 0
								? moment.utc(rowData.time.start).format(FULLTIME_FORMAT)
								: ''
							}`
						}
						</div>
					</div>
					<div className={classes.divRow}>
						<div style={{ fontWeight: 'bold', marginRight: 5 }}>
						{
							`${TEXT.TABLE_HEADER_END_DATE}:`
						}
						</div>
						<div>
						{
							`${rowData.time?.end !== 0
								? moment.utc(rowData.time.end).format(FULLTIME_FORMAT)
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

Leaderboard.propTypes =
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
	LeaderboardsLoad: () =>
	{
		dispatch(ActionCMS.LeaderboardsLoad())
	},
	LeaderboardsAdd: (leaderboards_data) =>
	{
		dispatch(ActionCMS.LeaderboardsAdd(leaderboards_data))
	},
	LeaderboardsEdit: (leaderboards_data) =>
	{
		dispatch(ActionCMS.LeaderboardsEdit(leaderboards_data))
	},
	LeaderboardsDelete: (leaderboards_data) =>
	{
		dispatch(ActionCMS.LeaderboardsDelete(leaderboards_data))
	},
	LeaderboardsRestore: (leaderboards_data) =>
	{
		dispatch(ActionCMS.LeaderboardsRestore(leaderboards_data))
	},
	LeaderboardDetailLoad: (leaderboards_data) =>
	{
		dispatch(ActionCMS.LeaderboardDetailLoad(leaderboards_data))
	},
	SeasonsLoad: () =>
	{
		dispatch(ActionCMS.SeasonsLoad())
	},
})

export default compose(
	connect(mapStateToProps, mapDispatchToProps),
	withMultipleStyles(customStyle, styles),
	withRouter
)(Leaderboard);
