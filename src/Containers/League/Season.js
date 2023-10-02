import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography, Button, TextField, Tooltip, Icon, FormControlLabel, Checkbox, IconButton } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'

import TEXT from './Data/Text'
import Utils from '../../Utils'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import * as Icons from '../../Components/CmsIcons'
import { JsonEditor } from '../../3rdParty/jsoneditor-react-master/src'
import CmsControlPermission from '../../Components/CmsControlPermission'
import CmsTable from '../../Components/CmsTable'
import CmsExcel from '../../Components/CmsExcel'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsDate from '../../Components/CmsDate'

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
	generalTitle: {
        marginBottom: '1rem',
    },
	jsonEditorTitle: {
        marginTop: theme.spacing(3),
    },
	marginBottom: {
		marginBottom: 10,
	},
	marginLeft: {
        marginLeft: '0 !important'
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

class Season extends React.Component
{
	constructor(props)
	{
		super(props)

		this.state = {
			dialogType: '',
            isDialogOpen: false,
			isExportOpen: false,
			rowData: {},
			errorJsonEditor: false,
			isJsonEditorMode: false,
			viewJsonMode: 'text',
		}

		this.tableRef = React.createRef()
		this.actionsExtend = {
			createElement: (parentProps) =>
			{
				const { classes } = this.props
				const columns = this.getExcelColumns()

				return (
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<div className={clsx(classes.divRow)}>
								<CmsExcel
									classes={{ button: clsx(classes.buttonLeft) }}
									multiSheetData={this.formatExcelData}
									columns={columns}
									controlPermission={{
										link: '',
										attribute: ''
									}}
									onProgress={this.handleExportDialog}
								/>
								<CmsControlPermission
									control={
										<Button
											variant={'contained'}
											color={'primary'}
											onClick={this.handleAction('season_add', {name: '', freezeDate: 0, expectedEndDate: 0, goLive: false, configs: {}})}
											className={clsx(classes.buttonLeft)}
											startIcon={<Icons.IconAdd/>}
										>
											{ TEXT.SEASON_BUTTON_NEW_SEASON }
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
		}
	}

	static getDerivedStateFromProps(props, state)
	{
        if (props.needRefresh)
		{
			props.ClearRefresh()
			
			props.SeasonsLoad()
		
			return {
				isDialogOpen: false,
				dialogType: '',
				rowData: state.isJsonEditorMode ? state.rowData : {},
			}
		}

        return null; // No change to state
    }

    componentDidMount()
	{
		this.props.SetTitle(TEXT.SEASON_MANAGEMENT_TITLE)
		this.props.SeasonsLoad()
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
				{this.state.isJsonEditorMode ? this.renderJsonEditor() : this.renderSeasonsTable()}
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
		let result = this.props.seasons
		
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
            let { createdAt, modifiedAt, deletedAt, startDate, endDate, freezeDate, expectedEndDate, configs, ...others} = value
			configs = JSON.stringify(configs)
			startDate = startDate === 0 ? '' : moment.utc(startDate).format(FULLTIME_FORMAT)
			endDate = endDate === 0 ? '' : moment.utc(endDate).format(FULLTIME_FORMAT)
			freezeDate = freezeDate === 0 ? '' : moment.utc(freezeDate).format(FULLTIME_FORMAT)
			expectedEndDate = expectedEndDate === 0 ? '' : moment.utc(expectedEndDate).format(FULLTIME_FORMAT)
            createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
			modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
            return {...others, startDate, endDate, freezeDate, expectedEndDate, createdAt, modifiedAt, configs}
        })
        
        console.log('formatExcelData:', result)
		return result
	}

	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.SEASON_TABLE_HEADER_NAME, field: 'name'},
			{ title: TEXT.SEASON_TABLE_HEADER_START_DATE, field: 'startDate' },
			{ title: TEXT.SEASON_TABLE_HEADER_END_DATE, field: 'endDate' },
			{ title: TEXT.SEASON_TABLE_HEADER_FREEZE_DATE, field: 'freezeDate' },
			{ title: TEXT.SEASON_TABLE_HEADER_EXPECTED_END_DATE, field: 'expectedEndDate' },
			{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.SEASON_TABLE_HEADER_CONFIGS, field: 'configs' },
			{ title: TEXT.SEASON_TABLE_HEADER_PREVIOUS_SEASON, field: 'previousSeason' },
			{ title: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt' },
			{ title: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy' },
			{ title: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy' },
			{ title: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt' },
		]

		return columns
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
				this.state.dialogType === 'season_add' && this.props.SeasonAdd(this.state.rowData) ||
				this.state.dialogType === 'season_edit' && this.props.SeasonEdit(this.state.rowData) ||
				this.state.isJsonEditorMode && this.props.SeasonEdit(this.state.rowData)

				break
			case 'season_add':
			case 'season_edit':
			case 'season_delete':
			case 'season_restore':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: data
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
			case 'goLive':
				this.setState({
                    rowData: {
						...this.state.rowData, 
						goLive: data,
						freezeDate: data ? moment().valueOf() : 0,
						expectedEndDate: data ? moment().valueOf() : 0,
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
		const { name, goLive, freezeDate, expectedEndDate } = submit_data
		return _.isEmpty(name) || goLive && !(freezeDate < expectedEndDate)
	}

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
                    this.state.dialogType === 'season_add' && TEXT.SEASON_BUTTON_NEW_SEASON ||
                    this.state.dialogType === 'season_edit' && TEXT.SEASON_BUTTON_EDIT_SEASON ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'season_add' || this.state.dialogType === 'season_edit') && this.renderAddEditSeason()
			}
			</ModalDialog>
		)
	}

	renderAddEditSeason = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.SEASON_TABLE_HEADER_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'season_edit'}
					/>
				</div>
				{
					this.state.dialogType === 'season_edit' &&
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
							disabled={this.state.rowData.disableStatus === true}
						/>
					</div>
				}
				{
					this.state.dialogType === 'season_add' &&
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
						label={TEXT.SEASON_TABLE_HEADER_GOLIVE}
						labelPlacement={'end'}
					/>
				}
				{
					(this.state.rowData.goLive === true || this.state.rowData.status === 'Active') &&
					<div className={clsx(classes.divColumn)}>
						<Typography>{`${TEXT.SEASON_TABLE_HEADER_FREEZE_DATE} (${TEXT.TABLE_HEADER_UTC_0})`}</Typography>
						<div className={clsx(classes.divColumn, classes.divHeight, classes.cmsDate, classes.marginBottom)}>
							<CmsDate
								key={'freezeDate'}
								views={['date', 'hours', 'minutes']} 
								raiseSubmitOnMounted={true}
								enableFullTimeFormat={true} 
								disableToolbar={false} 
								disablePast={true} 
								disableCheckMaxRange={true}
								initDate={
									{ 
										date_begin: this.state.rowData.freezeDate === 0 ? moment().valueOf() : Utils.convertToLocalTime(this.state.rowData.freezeDate)
									}
								}
								onDateSubmit={(data) => {
									this.handleAction('freezeDate', data.ms_begin_utc)(null)
								}}
								isSingleChoice={true}
								disabled={this.state.rowData.freezeDate !== 0 && this.state.rowData.freezeDate <= Utils.convertToUTC(moment().valueOf())}
							/>
						</div>
					</div>
				}
				{
					(this.state.rowData.goLive === true || this.state.rowData.status === 'Active') &&
					<div className={clsx(classes.divColumn)}>
						<Typography>{`${TEXT.SEASON_TABLE_HEADER_EXPECTED_END_DATE} (${TEXT.TABLE_HEADER_UTC_0})`}</Typography>
						<div className={clsx(classes.divColumn)}>
							<div className={clsx(classes.root, classes.divRow, classes.justifyStart, classes.marginLeft)}>
								<div className={clsx(classes.divColumn, classes.divHeight, classes.cmsDate)}>
									<CmsDate
										key={'expectedEndDate'}
										views={['date', 'hours', 'minutes']} 
										raiseSubmitOnMounted={true}
										enableFullTimeFormat={true} 
										disableToolbar={false} 
										disablePast={true} 
										disableCheckMaxRange={true}
										initDate={
											{ 
												date_begin: this.state.rowData.expectedEndDate === 0 ? moment().valueOf() : Utils.convertToLocalTime(this.state.rowData.expectedEndDate)
											}
										}
										onDateSubmit={(data) => {
											this.handleAction('expectedEndDate', data.ms_begin_utc)(null)
										}}
										isSingleChoice={true}
										disabledEndDate={true}
									/>
								</div>
								<Tooltip 
									title={TEXT.SEASON_TOOLTIP_EXPECTED_END_DATE_1}
									classes={{tooltip: classes.toolTip}}
									placement={'top'}
								>
									<Icon style={{ color: '#AEAEAE', marginLeft: 10, marginTop: 10 }} >help</Icon>
								</Tooltip>
							</div>
							<Typography style={{fontSize: '0.75rem', fontWeight: 500}}>{TEXT.SEASON_TOOLTIP_EXPECTED_END_DATE}</Typography>
						</div>
					</div>
				}
			</div>
		)
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
                            title: TEXT.SEASON_TABLE_HEADER_NAME, field: 'name', width: 150,
							
                        },
						{
                            title: () => (
                                <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
                                    <span>{TEXT.TABLE_HEADER_STATUS}</span>
                                    <Tooltip 
                                        title={TEXT.SEASON_TOOLTIP_STATUS}
                                        classes={{tooltip: classes.toolTip}}
                                        placement={'top'}
                                    >
                                        <Icon style={{ color: '#AEAEAE', marginLeft: 10 }} >help</Icon>
                                    </Tooltip>
                                </div>
                            ),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							
                        },
						{
                            title: TEXT.SEASON_TABLE_HEADER_START_DATE, field: 'startDate', width: 150,
							render: rowData => this.renderCustomDateColumn(rowData, 'startDate'),
                        },
						{
                            title: TEXT.SEASON_TABLE_HEADER_END_DATE, field: 'endDate', width: 150,
							render: rowData => this.renderCustomDateColumn(rowData, 'endDate'),
                        },
						{
                            title: TEXT.SEASON_TABLE_HEADER_PREVIOUS_SEASON, field: 'previousSeason', width: 150,
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
					<Typography className={clsx(classes.title)}>{TEXT.SEASON_TABLE_HEADER_CONFIGS}</Typography>
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
									disabled={this.state.errorJsonEditor || this.state.rowData.status === 'Inactive'}
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

	renderSeasonsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.SEASON_TABLE_HEADER_NAME, field: 'name', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.name, columnDef)
                        },
						{
                            title: () => (
                                <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
                                    <span>{TEXT.TABLE_HEADER_STATUS}</span>
                                    <Tooltip 
                                        title={TEXT.SEASON_TOOLTIP_STATUS}
                                        classes={{tooltip: classes.toolTip}}
                                        placement={'top'}
                                    >
                                        <Icon style={{ color: '#AEAEAE', marginLeft: 10 }} >help</Icon>
                                    </Tooltip>
                                </div>
                            ),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.status, columnDef)
                        },
						{
                            title: TEXT.SEASON_TABLE_HEADER_START_DATE, field: 'startDate', width: 150,
							render: rowData => this.renderCustomDateColumn(rowData, 'startDate'),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.startDate, columnDef, true)
                        },
						{
                            title: TEXT.SEASON_TABLE_HEADER_END_DATE, field: 'endDate', width: 150,
							render: rowData => this.renderCustomDateColumn(rowData, 'endDate'),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.endDate, columnDef, true)
                        },
						{
                            title: TEXT.SEASON_TABLE_HEADER_FREEZE_DATE, field: 'freezeDate', width: 150,
							render: rowData => this.renderCustomDateColumn(rowData, 'freezeDate'),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.endDate, columnDef, true)
                        },
						{
                            title: TEXT.SEASON_TABLE_HEADER_EXPECTED_END_DATE, field: 'expectedEndDate', width: 150,
							render: rowData => this.renderCustomDateColumn(rowData, 'expectedEndDate'),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.endDate, columnDef, true)
                        },
						{
                            title: TEXT.SEASON_TABLE_HEADER_PREVIOUS_SEASON, field: 'previousSeason', width: 150,
                        },
						{
                            title: TEXT.SEASON_TABLE_HEADER_CONFIGS, field: 'configs', nofilter: true, sorting: false, width: 101,
							render: rowData =>
                            {
								return (
									<CmsControlPermission
										control={
											<Tooltip 
											title={rowData.status === 'Inactive' ? TEXT.SEASON_TOOLTIP_VIEW_SETTING : TEXT.SEASON_TOOLTIP_EDIT_SETTING}
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
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								rowData = {...rowData, disableStatus: rowData.status === 'Active'}
								this.handleAction('season_edit', rowData)(event)
							},
							tooltip: (rowData) => ((rowData.deletedAt > 0 || rowData.status === 'Inactive') ? '' : TEXT.SEASON_TOOLTIP_EDIT_SEASON),
							disabled: (rowData) => (rowData.deletedAt > 0 || rowData.status === 'Inactive'),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						}
					]}

                    data={this.props.seasons}

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

					ignoredRender={this.state.isDialogOpen || this.state.isExportOpen}

					tableRef={this.tableRef}

					actionsExtend={this.actionsExtend}
                />
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

	renderCustomDateColumn = (rowData, field) =>
	{
		return (
			<div>
			{
				`${rowData[field] > 0
					? moment.utc(rowData[field]).format(FULLTIME_FORMAT)
					: ''
				}`
			}
			</div>
		)
	}
}

Season.propTypes =
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
	SeasonsLoad: () =>
	{
		dispatch(ActionCMS.SeasonsLoad())
	},
	SeasonAdd: (season_data) =>
	{
		dispatch(ActionCMS.SeasonAdd(season_data))
	},
	SeasonEdit: (season_data) =>
	{
		dispatch(ActionCMS.SeasonEdit(season_data))
	}
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(Season);

