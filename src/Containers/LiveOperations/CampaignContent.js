import React from 'react';
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography,Chip,Divider,Tabs, Tab, Button, TextField, Icon, Tooltip, IconButton } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { WarningRounded } from '@material-ui/icons'

import Utils from '../../Utils'
import API from '../../Api/API'


import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import TEXT from './Data/Text'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as Icons from '../../Components/CmsIcons'
import CmsControlPermission from '../../Components/CmsControlPermission'
import CmsTable from '../../Components/CmsTable'
import CmsExcel from '../../Components/CmsExcel'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsImport from '../../Components/CmsImport'
import { DEBUG_FIELD } from '../../Components/CmsImport/ExcelParser'
import { JsonEditor } from '../../3rdParty/jsoneditor-react-master/src';


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
	marginRight: {
		marginRight: 10,
	},
	pointcuts: {
		height:'200px',
		overflowY: 'auto',
		padding:'10px 0px'
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
});

class CampaignContent extends React.Component
{
	constructor(props)
	{
		super(props)
		this.state = {
			dialogType: '',
			isPageOpen: false,
			isDialogOpen: false,
			isImportOpen: false,
			isExportOpen: false,
			isMultiSelectMode: false,
			errorConfigs: false,
			viewConfigs: 'text',
			rowData: {},
			tableTab: 0,
		};

		this.campaign_id = ''
		this.pointcutsArray = []
		this.spaPackages = []
		
		this.tableRef = React.createRef();
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
				
				
				apiAdd = API.CampaignsContentAdd.bind(API)
				apiUpdate = API.CampaignsContentEdit.bind(API)
				apiDelete = API.CampaignsContentDelete.bind(API)
				
				
				return (
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
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
									fileNameExtend={`${TEXT.CAMPAIGN_TABLE_TAB_CONTENT}`}
								/>
								{
									this.state.isMultiSelectMode
									?
									<>
									{
										_.filter(this.selectedRows, data => data.deletedAt > 0).length > 0 &&
										<CmsControlPermission
											control={
												<Button
													variant={'contained'}
													color={'primary'}
													onClick={this.handleAction('content_restore')}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
												{
													TEXT.CAMPAIGN_BUTTON_RESTORE_CONTENT
												}
												</Button>
											}
											link={''}
											attribute={''}
										/>
									}	
									{
										_.filter(this.selectedRows, data => data.deletedAt === 0).length > 0 &&
										<CmsControlPermission
											control={
												<Button
													variant={'contained'}
													color={'primary'}
													onClick={this.handleAction('content_delete')}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
												{
													TEXT.CAMPAIGN_BUTTON_DELETE_CONTENTS
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
													this.handleAction('content_add', {pointcuts:[], app_code:'',app_name:'', app_version:'', app_url:'', status:''})
												}		
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
											{
												TEXT.CAMPAIGN_BUTTON_NEW_CONTENT		
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
		};
	}

	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_APP_CODE, field: 'app_code' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_APP_NAME, field: 'app_name' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_APP_VERION, field: 'app_version' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_APP_URL, field: 'app_url' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_POINTCUT, field: 'pointcuts' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_CONFIG, field: 'config' },
			{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt' },
			{ title: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt' },
			{ title: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy' },
			{ title: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy' },
			{ title: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt' },
		]

		return columns
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
		
		result = this.props.contents
		result = _.map(result, value => {
			let {
				pointcuts,
				config,
				...others
			} = value;

			pointcuts = JSON.stringify(pointcuts)
			config = JSON.stringify(config)

			return {...others,pointcuts,config}
			})

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
	}

	getImportColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_CAMPAIGN_ID, field: 'campaign_id' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_POINTCUT, field: 'pointcuts' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_APP_CODE, field: 'app_code' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_APP_NAME, field: 'app_name' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_APP_VERION, field: 'app_version' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_APP_URL, field: 'app_url' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_CONFIG, field: 'config' },
			{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },

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
			case 'campaign_id':
			case 'app_code':
			case 'app_name':
			case 'app_url':
				data = rawData.trim();
				if (_.isEmpty(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break
			case 'status':
				data = rawData.trim();
				if (_.isEmpty(data) || !_.includes(this.props.STATUSES, data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break
			case 'pointcuts':
				try
				{
					data = JSON.parse(rawData.trim())
					if (!Array.isArray(data))
					{
						throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
					}
				}
				catch(e)
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break
			case 'config':
				try
				{
					data = JSON.parse(rawData.trim())
					if (!_.isObject(data))
					{
						throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
					}
				}
				catch(e)
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break
			case 'app_version':
				data = rawData;
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
			this.props.CampaignsPointcutsLoad();
			this.props.CampaignsContentLoad(this.props.match.params.campaignId)
		}
	}

	static getDerivedStateFromProps(props, state)
	{
		if(props.spaPackageDetails) return null;

        if (props.needRefresh)
		{			
			props.ClearRefresh()
			props.CampaignsContentLoad(props.match.params.campaignId)
			props.CampaignsPointcutsLoad();
			props.SPAPackagesLoad()
			return {
				isDialogOpen: false,
				isMultiSelectMode: false,
				isPageOpen: false,
				dialogType: '',
				rowData: {},
			}
		}

        return null;
    }

    componentDidMount()
	{
        this.campaign_id = this.props.match.params.campaignId;
		this.props.SetTitle(`${TEXT.CAMPAIGN_CONTENT_MANAGEMENT_TITLE}`)
        this.props.CampaignsContentLoad(this.campaign_id)
		this.props.CampaignsPointcutsLoad();
		this.props.SPAPackagesLoad()
	}

	componentWillUnmount() 
	{
		this.props.ClearProps([])
	}

	componentDidUpdate(prevProps, prevState)
	{
		this.props !== prevProps && this.createPointcuts()
	}

	createPointcuts = () =>
	{
		this.pointcutsArray = Object.keys(_.groupBy(_.filter(this.props.pointcuts || [], (pointcut) => pointcut.deletedAt === 0 ) || [] , pointcut => pointcut.name))
		this.spaPackages = _.filter(this.props.spaPackages || [], (spaPackage) => spaPackage.deletedAt === 0 ) 
	}

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
                    this.state.dialogType === 'content_add' && TEXT.CAMPAIGN_BUTTON_NEW_CONTENT ||
                    this.state.dialogType === 'content_edit' && TEXT.CAMPAIGN_TOOLTIP_EDIT_CONTENT ||
                    this.state.dialogType === 'content_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'content_restore' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(this.state.dialogType ==='content_add' || this.state.dialogType ==='content_edit') && this.validateSubmit(this.state.rowData) }
			>
			{
				(this.state.dialogType === 'content_delete' || this.state.dialogType === 'content_restore') && this.renderDeleteRestoreContents()
			}
			{
				(this.state.dialogType === 'content_add' || this.state.dialogType === 'content_edit') && this.renderAddEditContents()
			}
			</ModalDialog>
		)
	}

	renderDeleteRestoreContents = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'content_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.CAMPAIGN_MESSAGE_DELETE_CONTENTS, this.state.rowData.length) : TEXT.CAMPAIGN_MESSAGE_DELETE_CONTENT) ||
						this.state.dialogType === 'content_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.CAMPAIGN_MESSAGE_RESTORE_CONTENTS, this.state.rowData.length) : TEXT.CAMPAIGN_MESSAGE_RESTORE_CONTENT) ||
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
									{`${data.app_name} - ${data.app_code} - ${data.app_version}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.app_name} - ${this.state.rowData.app_code} - ${this.state.rowData.app_version}` }
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderAddEditContents = () =>
	{
		const {classes, STATUSES, spaPackageDetails} = this.props;
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CAMPAIGN_TABLE_HEADER_APP_CODE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.app_code || ''}
						options={this.spaPackages || []}
						onChange={(evt, value) => {
							this.handleAction('app_code', value)(evt)
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
						getOptionLabel={(option)=>option.code || ''}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CAMPAIGN_TABLE_HEADER_APP_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.app_name || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('app_name', evt.target.value)(evt) }}
					/>	
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CAMPAIGN_TABLE_HEADER_APP_VERION}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={_.find(spaPackageDetails, spaPackageDetail => spaPackageDetail.version === this.state.rowData.app_version ) || this.state.rowData.app_version || ''}
						options={spaPackageDetails || []}
						onChange={(evt, value) => {
							this.handleAction('app_version', value)(evt)
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
						getOptionLabel={(option)=>option?.version?.toString() || ''}
					/>
					
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CAMPAIGN_TABLE_HEADER_APP_URL}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.app_url || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('app_url', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.TABLE_HEADER_STATUS}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.status}
						options={STATUSES || []}
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
					<Typography>{TEXT.CAMPAIGN_TABLE_HEADER_POINTCUT}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						multiple={true}
						filterSelectedOptions
						value={this.state.rowData.pointcuts}
						options={this.pointcutsArray || []}
						onChange={(evt, value) => {
							this.handleAction('pointcuts', value)(evt)
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

	validateSubmit = (data) =>
	{
		return (
			_.isEmpty(data['app_code'])
			|| _.isEmpty(data['status'])		
		)
	}

	submitData = (data) =>
	{
		if(this.state.dialogType !== 'content_add') 
		{
			return {
				...data , 
				app_code: data.app_code?.code || data.app_code,
				app_version:+data.app_version?.version || +data.app_version
			}
		}

		return {
			...data,
			campaign_id: this.campaign_id,
			app_code: data.app_code?.code || data.app_code,
			app_version: +data.app_version?.version || +data.app_version,
			config: {}
		}
	}

	handleAction = (name, data, index ) => (evt) =>
	{
		switch (name)
		{
			case 'close':
				this.setState({
					viewConfigs: 'text',
					isDialogOpen: false,
					isPageOpen: false,
					dialogType: '',
					rowData: {}
				})
				break
			
			case 'submit':
				this.props.ClearProps(['spaPackageDetails'])
				if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						this.state.dialogType === 'content_delete' && this.props.CampaignsContentDelete(row) ||						
						this.state.dialogType === 'content_restore' && this.props.CampaignsContentRestore(row)
					})
				}
				else
				{
					let data = this.submitData(this.state.rowData);

					this.state.dialogType === 'content_add' && this.props.CampaignsContentAdd(data) ||
					this.state.dialogType === 'content_edit' && this.props.CampaignsContentEdit(data) ||
					this.state.dialogType === 'content_delete' && this.props.CampaignsContentDelete(data) ||
					this.state.dialogType === 'content_restore' && this.props.CampaignsContentRestore(data) ||	
					this.state.isPageOpen && this.props.CampaignsContentEdit(data)
				}
				break
			case 'json_editor':
			case 'view_items':	
				this.setState({
					isPageOpen: true,
					actionType: name,
					rowData: data
				})
				break	
			case 'viewConfigs':	
				this.setState({
					errorConfigs: false,
					viewConfigs: data,
				})

				break
			case 'config':	
				this.setState({
					errorConfigs: false,
					rowData: {
						...this.state.rowData, 
						[name]: data
					}
				})
				break
			case 'content_edit':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: {
						...data,
						app_code: _.find(this.spaPackages,spaPackage => spaPackage.code === data.app_code),
					}
				},
				() =>
				{
					let data_code = _.find(this.spaPackages,spaPackage => spaPackage.code === data.app_code)
					this.props.SPAPackageDetailsLoad(data_code)
				})
				break
			case 'content_add':
			case 'content_delete':
			case 'content_restore':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})
				break
			case 'app_code':
				this.setState(
					{
						rowData: {
							...this.state.rowData,
							app_code: data,
							app_name: data.name,
							app_version: '',
							app_url:''
						}
					},
					() => 
					{
						this.props.SPAPackageDetailsLoad(data)
					})
				break
			case 'app_version':
				this.setState({
					rowData: {
						...this.state.rowData,
						[name]: data,
						app_url: data.hostURL
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

    render()
    {
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                {this.state.isPageOpen ?  this.renderPage() : this.renderContentTable()}
				{this.renderDialog()}
            </div>
        );
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

	renderStatusTitleColumn = () =>
	{
		const { classes } = this.props
		return (
			<div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
				<span>{TEXT.TABLE_HEADER_STATUS}</span>
				<Tooltip 
					title={TEXT.CAMPAIGN_TOOLTIP_STATUS}
					classes={{tooltip: classes.toolTip}}
					placement={'top'}
				>
					<Icon style={{ color: '#AEAEAE', marginLeft: 10 }} >help</Icon>
				</Tooltip>
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
							TEXT.CAMPAIGN_TOOLTIP_JSON_EDITOR.split('&').map((line, index) =>
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

	renderChipColumn = (data, NUMBER_CHIPS = 1) =>
	{
		const { classes } = this.props
		
		const chips = data.slice(0, NUMBER_CHIPS)
		const hidden = (data.length - chips.length > 0)
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
				options={data}
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
								label={option}
							/>
							{
								hidden && (index === NUMBER_CHIPS - 1) &&
								(
									!isOpen
									?
									<Chip 
										color="primary"
										size={'small'} 
										label={`+${data.length - chips.length}`}
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

	renderContentTable = () =>
	{
		const {contents, classes } = this.props;
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_APP_CODE, field: 'app_code', width: 200,
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_APP_NAME, field: 'app_name', width: 250,
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_APP_VERION, field: 'app_version', width: 150,
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_APP_URL, field: 'app_url', width: 250,
							render: rowData => (<div style={{ width: 250, wordWrap: 'break-word' }}>{rowData.app_url}</div>)
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_CONFIG, 
							field: 'config', 
							width: 150,
							render: rowData => this.renderEditJsonsColumn(rowData)
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_POINTCUT, 
							field: 'pointcuts', 
							width: 200,
							render: (rowData) => this.renderChipColumn(rowData.pointcuts)
                        },
						{
                            title: () => this.renderStatusTitleColumn(),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.status, columnDef)
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, 
							placeholder: TEXT.TABLE_HEADER_CREATED_DATE, 
							field: 'createdAt', width: 260,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'createdAt'),
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'modifiedAt'),
						},
						{
                            title: TEXT.TABLE_HEADER_OWNER, 
							placeholder: TEXT.TABLE_HEADER_CREATED_BY, 
							field: 'createdBy', width: 350,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, 
							field: 'modifiedBy', 
							hidden: true,
                        },
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', 
							width: 150,
                            render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'deletedAt'),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('content_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.CAMPAIGN_TOOLTIP_EDIT_CONTENT),
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
								this.handleAction('content_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.CAMPAIGN_TOOLTIP_DELETE_CONTENT),
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
								this.handleAction('content_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.CAMPAIGN_TOOLTIP_RESTORE_CONTENT),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						}
					]}

                    data={contents || []}

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

	renderPage = () =>
	{
		return (
			<>
				{this.state.actionType === 'json_editor' && this.renderJsonEditor()}
				{this.state.actionType === 'view_items' && this.renderQuestItemsTable()}
			</>
		)
	}

	renderJsonEditor = () =>
	{
		const { classes } = this.props
		
		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderContentGeneralTable()}
				<div className={clsx(classes.root, classes.divColumn, classes.jsonEditor)}> 
					{this.renderJsonEditorTitle(TEXT.CAMPAIGN_TABLE_HEADER_CONFIG, 'viewConfigs', 'errorConfigs')}
					<JsonEditor
						key={this.state.viewConfigs}
						value={this.state.rowData.config}
						onChange={(value) => this.handleAction('config', value)(null)}
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

	renderContentGeneralTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderGeneralTableTitle()}
                <CmsTable
                     columns={[
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_APP_CODE, field: 'app_code', width: 200,
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_APP_NAME, field: 'app_name', width: 200,
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_APP_VERION, field: 'app_version', width: 150,
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_APP_URL, field: 'app_url', width: 200,
							// render: rowData => (<div style={{ width: 200, wordWrap: 'break-word' }}>{rowData.app_url}</div>)
                        },
						{
                            title: () => this.renderStatusTitleColumn(),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.status, columnDef)
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
	
	renderGeneralTableTitle = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter, classes.generalTitle)}>
					<Typography className={clsx(classes.title)}>{TEXT.CAMPAIGN_GENERAL_TITLE}</Typography>
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
}

CampaignContent.propTypes =
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
	CampaignsPointcutsLoad: () =>
	{
		dispatch(ActionCMS.CampaignsPointcutsLoad())
	},
    CampaignsContentLoad: (id) =>
	{
		dispatch(ActionCMS.CampaignsContentLoad(id))
	},
	CampaignsContentAdd: (campaign_content_data) =>
	{
		dispatch(ActionCMS.CampaignsContentAdd(campaign_content_data))
	},
	CampaignsContentEdit: (campaign_content_data) =>
	{
		dispatch(ActionCMS.CampaignsContentEdit(campaign_content_data))
	},
	CampaignsContentDelete: (campaign_content_data) =>
	{
		dispatch(ActionCMS.CampaignsContentDelete(campaign_content_data))
	},
	CampaignsContentRestore: (campaign_content_data) =>
	{
		dispatch(ActionCMS.CampaignsContentRestore(campaign_content_data))
	},
	SPAPackagesLoad: () =>
	{
		dispatch(ActionCMS.SPAPackagesLoad())
	},
	SPAPackageDetailsLoad: (spa_data) =>
	{
		dispatch(ActionCMS.SPAPackageDetailsLoad(spa_data))
	},

})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle)
)(CampaignContent);

