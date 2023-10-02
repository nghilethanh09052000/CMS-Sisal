import React from 'react';
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography,Chip,Tabs, Tab, Button, TextField, Icon, Tooltip } from '@material-ui/core'
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
import CmsDate from '../../Components/CmsDate';
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsImport from '../../Components/CmsImport'
import { DEBUG_FIELD } from '../../Components/CmsImport/ExcelParser'
import CmsTabPanel from '../../Components/CmsTabPanel'



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
const TITLE_WIDTH_2 = '20%'

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
	marginBottom: {
		marginBottom: 10,
	},
	marginRight: {
		marginRight: 10,
	},
	listBox: {
		marginBottom: 15, 
		paddingTop: 10, 
		borderTop: `1px ${defaultBorderColor} solid`, 
		borderBottom: `1px ${defaultBorderColor} solid`,
		minHeight: 250, 
		maxHeight: 250, 
		overflow:'auto'
	},
	marginBottomDiv : {
		marginBottom: '20px'
	},
	cmsDate: {
        marginBottom: theme.spacing(1)
    }
});

class Campaign extends React.Component
{
	constructor(props)
	{
		super(props)
		this.state = {
			dialogType: '',
            isDialogOpen: false,
			isPageOpen: false,
			isImportOpen: false,
			isExportOpen: false,
			isMultiSelectMode: false,
			rowData: {},
			tableTab: 0,
		}

		this.tableRef = React.createRef();
		this.selectedRows = [];
		this.operation = ['=','>','>=','<','<=','<>','is_one_of','is_out_of']
		
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
				
				if(this.state.tableTab === 0)
				{
					apiAdd = API.CampaignsAdd.bind(API)
					apiUpdate = API.CampaignsEdit.bind(API)
					apiDelete = API.CampaignsDelete.bind(API)
				}
				else
				{
					apiAdd = API.CampaignsPointcutsAdd.bind(API)
					apiUpdate = API.CampaignsPointcutsEdit.bind(API)
					apiDelete = API.CampaignsPointcutsDelete.bind(API)
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
										this.state.tableTab === 0 && `${TEXT.CAMPAIGN_TABLE_TAB_CAMPAIGN}` ||
										this.state.tableTab === 1 && `${TEXT.CAMPAIGN_TABLE_TAB_POINTCUT}` 
									}
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
													onClick={
														this.state.tableTab === 0 && this.handleAction('campaign_restore') ||
														this.state.tableTab === 1 && this.handleAction('pointcut_restore')
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
												{
													this.state.tableTab === 0 && TEXT.CAMPAIGN_BUTTON_RESTORE_CAMPAIGNS ||
													this.state.tableTab === 1 && TEXT.CAMPAIGN_BUTTON_RESTORE_POINTCUTS ||
													''
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
													onClick={
														this.state.tableTab === 0 && this.handleAction('campaign_delete') ||
														this.state.tableTab === 1 && this.handleAction('pointcut_delete')
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
												{
													this.state.tableTab === 0 && TEXT.CAMPAIGN_BUTTON_DELETE_CAMPAIGNS ||
													this.state.tableTab === 1 && TEXT.CAMPAIGN_BUTTON_DELETE_POINTCUTS ||
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
													this.state.tableTab === 0 &&  this.handleAction('campaign_add', {code: '', name: '', description: '', type: '', country: [], platform: [], version: [], gender: [], specific_user: [], priority: 0, start_end_date: {}, start_hour: '', end_hour:'' ,custom_condition: [], online_param: [], status: '' })
													||
													this.state.tableTab === 1 && this.handleAction('pointcut_add', {name: '', description: ''})
												}		
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
											{
												this.state.tableTab === 0 && TEXT.CAMPAIGN_BUTTON_NEW_CAMPAIGN ||
												this.state.tableTab === 1 && TEXT.CAMPAIGN_BUTTON_NEW_POINTCUT ||
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

	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_CODE, field: 'code'},
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_NAME, field: 'name' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_DESCRIPTION, field: 'description' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_TYPE, field: 'type' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_COUNTRY, field: 'country' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_PLATFORM, field: 'platform' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_VERSION, field: 'version' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_GENDER, field: 'gender' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_SPECIFIC_USER, field: 'specific_user' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_PRIORITY, field: 'priority' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_START_HOUR, field: 'start_hour' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_END_HOUR, field: 'end_hour' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_START_DATE, field: 'start_date' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_END_DATE, field: 'end_date' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_CUSTOM_CONDITION, field: 'custom_condition' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_ONLINE_PARAM, field: 'online_param' },
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
		if (this.state.tableTab === 0)
		{
			result = this.props.campaigns
			result = _.map(result, value => {
				let {
					country,
					platform,
					version,
					gender,
					specific_user,
					custom_condition,
					online_param,
					...others
				} = value;

					country = JSON.stringify(country)
					platform = JSON.stringify(platform)
					version = JSON.stringify(version)
					gender = JSON.stringify(gender)
					specific_user = JSON.stringify(specific_user)
					custom_condition = JSON.stringify(custom_condition)
					online_param = JSON.stringify(online_param)

				return {
						...others, 
						country, 
						platform,
						version,
						gender,
						specific_user,
						custom_condition,
						online_param
					}
				})

		}
		else if (this.state.tableTab === 1)
		{
			result = this.props.pointcuts
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
	}

	getImportColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_NAME, field: 'name' },
			{ title: TEXT.CAMPAIGN_TABLE_HEADER_DESCRIPTION, field: 'description' },

		]

		if (this.state.tableTab === 0)
		{
			columns = [
				... columns,
				{ title: TEXT.CAMPAIGN_TABLE_HEADER_CODE, field: 'code'},	
				{ title: TEXT.CAMPAIGN_TABLE_HEADER_TYPE, field: 'type' },
				{ title: TEXT.CAMPAIGN_TABLE_HEADER_COUNTRY, field: 'country' },
				{ title: TEXT.CAMPAIGN_TABLE_HEADER_PLATFORM, field: 'platform' },
				{ title: TEXT.CAMPAIGN_TABLE_HEADER_VERSION, field: 'version' },
				{ title: TEXT.CAMPAIGN_TABLE_HEADER_GENDER, field: 'gender' },
				{ title: TEXT.CAMPAIGN_TABLE_HEADER_SPECIFIC_USER, field: 'specific_user' },
				{ title: TEXT.CAMPAIGN_TABLE_HEADER_PRIORITY, field: 'priority' },
				{ title: TEXT.CAMPAIGN_TABLE_HEADER_START_HOUR, field: 'start_hour' },
				{ title: TEXT.CAMPAIGN_TABLE_HEADER_END_HOUR, field: 'end_hour' },
				{ title: TEXT.CAMPAIGN_TABLE_HEADER_START_DATE, field: 'start_date' },
				{ title: TEXT.CAMPAIGN_TABLE_HEADER_END_DATE, field: 'end_date' },
				{ title: TEXT.CAMPAIGN_TABLE_HEADER_CUSTOM_CONDITION, field: 'custom_condition' },
				{ title: TEXT.CAMPAIGN_TABLE_HEADER_ONLINE_PARAM, field: 'online_param' },
				{ title: TEXT.TABLE_HEADER_STATUS, field: 'status'},
			]
		}
		else if (this.state.tableTab === 1)
		{
			columns = [
				... columns
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
			case 'code':
			case 'name':
			case 'start_hour':
			case 'end_hour':
			case 'description':
				data = rawData.trim();
				if (_.isEmpty(data))
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break
			case 'country':
			case 'version':
			case 'specific_user':
			case 'custom_condition':
			case 'online_param':
			case 'gender':
			case 'platform':
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
			case 'type':
				data = rawData.trim();
				if (_.isEmpty(data) || !_.includes(this.props.TYPES, data))
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
			case 'priority':
			case 'start_date':
			case 'end_date':
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
			this.state.tableTab === 0 && this.props.CampaignsLoad() ||
			this.state.tableTab === 1 && this.props.CampaignsPointcutsLoad() 
		}
	}

	static getDerivedStateFromProps(props, state)
	{
        if (props.needRefresh)
		{
			props.ClearRefresh()
			
			_.includes(state.dialogType, 'campaign_') && props.CampaignsLoad()
			_.includes(state.dialogType, 'pointcut_') && props.CampaignsPointcutsLoad()
		
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
		this.props.SetTitle(TEXT.CAMPAIGN_MANAGEMENT_TITLE)
		this.props.CampaignsLoad()
		this.props.CampaignsPointcutsLoad()
	}

	componentWillUnmount() 
	{
		this.props.ClearProps([])
	}

	componentDidUpdate(prevProps, prevState)
	{
		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()
			// To do
		}
	}

	renderAddEditCampaign = () =>
	{
		const {
			classes,
			TYPES,
			STATUSES,
			GENDERS,
			PLATFORMS
		} = this.props;
		return (
				<div>
				{this.renderTitle(this.state.dialogType === 'campaign_add' ? TEXT.CAMPAIGN_BUTTON_NEW_CAMPAIGN : TEXT.CAMPAIGN_TOOLTIP_EDIT_CAMPAIGN)}
					<div className={clsx(classes.divRow, classes.justifyBetween)}>
						<div className={clsx(classes.divColumn)} style={{ width: '45%'}}>
							<div className={clsx(classes.divColumn, classes.marginBottom)}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.CAMPAIGN_TABLE_HEADER_CODE}</Typography>
								<TextField
									variant={'outlined'}
									className={classes.textField}
									value={this.state.rowData.code}
									onChange={(evt) => { this.handleAction('code', evt.target.value)(evt) }}
									fullWidth
								/>
							</div>
							<div className={clsx(classes.divColumn, classes.marginBottom)}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.CAMPAIGN_TABLE_HEADER_DESCRIPTION}</Typography>
								<TextField
									variant={'outlined'}
									className={classes.textField}
									value={this.state.rowData.description}
									onChange={(evt) => { this.handleAction('description', evt.target.value)(evt) }}
									fullWidth
								/>
							</div>
							<div className={clsx(classes.divColumn, classes.marginBottom)}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.CAMPAIGN_TABLE_HEADER_TYPE}</Typography>
								<Autocomplete
									autoComplete
									autoSelect
									filterSelectedOptions
									value={this.state.rowData.type}
									options={TYPES || []}
									onChange={(evt, value) => {
										this.handleAction('type', value)(evt)
									}}
									disableClearable={true}
									renderInput={(params) => (
										<TextField {...params}
											variant="outlined"
										/>
									)}
									fullWidth
									classes={{
										root: classes.autoComplete,
										input: classes.autoCompleteInput,
										inputRoot: classes.autoCompleteInputRoot
									}}
									style={{marginBottom:'0px'}}
								/>
							</div>
							<div className={clsx(classes.divColumn, classes.marginBottom)}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.CAMPAIGN_TABLE_HEADER_PLATFORM}</Typography>
								<Autocomplete
									autoComplete
									autoSelect
									filterSelectedOptions
									multiple={true}
									value={this.state.rowData.platform}
									options={PLATFORMS || []}
									onChange={(evt, value) => {
										this.handleAction('platform', value)(evt)
									}}
									disableCloseOnSelect
									disableClearable={true}
									renderInput={(params) => (
										<TextField {...params}
											variant="outlined"
										/>
									)}
									renderTags={(value, getTagProps) =>
										value.map((option, index) => (
											<Chip 
												variant={'outlined'}
												size={'small'} 
												label={option} 
												{...getTagProps({ index })}
											/>
									))}
									fullWidth
									classes={{
										root: classes.autoComplete,
										input: classes.autoCompleteInput,
										inputRoot: classes.autoCompleteInputRoot
									}}
									style={{marginBottom:'0px'}}
								/>
							</div>
							<div className={clsx(classes.divColumn, classes.marginBottom)}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.CAMPAIGN_TABLE_HEADER_VERSION}</Typography>							
								<Autocomplete
									freeSolo
									fullWidth
									multiple
									limitTags={3}
									size={'small'}
									value={this.state.rowData.version}
									options={[]}
									onChange={(evt, value) => {
										this.handleAction('version', value)(evt)
									}}
									disableClearable={true}
									renderInput={(params) => (
										<TextField {...params}
											variant={'outlined'}
										/>
									)}
									renderTags={(value, getTagProps) =>
										value.map((option, index) => (
											<Chip 
												variant={'outlined'}
												size={'small'} 
												label={option} 
												{...getTagProps({ index })}
											/>
									))}
									classes={{
										root: classes.autoComplete,
										input: classes.autoCompleteInput,
										inputRoot: classes.autoCompleteInputRoot
									}}
								/>
							</div>
							<div className={clsx(classes.divColumn, classes.marginBottom)}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.CAMPAIGN_TABLE_HEADER_SPECIFIC_USER}</Typography>
								<Autocomplete
									freeSolo
									fullWidth
									multiple
									limitTags={3}
									size={'small'}
									value={this.state.specific_user}
									options={[]}
									onChange={(evt, value) => {
										this.handleAction('specific_user', value)(evt)
									}}
									disableClearable={true}
									renderInput={(params) => (
										<TextField {...params}
											label={TEXT.CAMPAIGN_TABLE_HEADER_SPECIFIC_USER}
											variant={'outlined'}
										/>
									)}
									renderTags={(value, getTagProps) =>
										value.map((option, index) => (
											<Chip 
												variant={'outlined'}
												size={'small'} 
												label={option} 
												{...getTagProps({ index })}
											/>
									))}
									classes={{
										root: classes.autoComplete,
										input: classes.autoCompleteInput,
										inputRoot: classes.autoCompleteInputRoot
									}}
								/>
							</div>
							<div>
								<Typography>{TEXT.CAMPAIGN_TABLE_HEADER_START_HOUR}</Typography>
								<div className={clsx(classes.divColumn, classes.divHeight, classes.cmsDate)}>
									<CmsDate
										views={['date','hours','minutes']}
										openTo='hours'
										disablePast={true}
										disableFuture={true}
										enableFullTimeFormat={true}
										disableCheckMaxRange={true}
										raiseSubmitOnMounted={true}
										format=''
										initDate={{  
											date_begin: this.state.rowData.init_start_hour || this.state.rowData?.start_hour || new Date((new Date().setHours("00","00")))
										}}
										onDateSubmit={(data) => {
											this.handleAction('start_hour',data.date_begin)(null)
										}}
										isSingleChoice={true}
									/>
								</div>
							</div>
						</div>	
						<div className={clsx(classes.divColumn)} style={{ width: '45%'}}>
							<div className={clsx(classes.divColumn, classes.marginBottom)}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.CAMPAIGN_TABLE_HEADER_NAME}</Typography>
								<TextField
									variant={'outlined'}
									className={classes.textField}
									value={this.state.rowData.name}
									onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
									fullWidth
								/>
							</div>
							<div className={clsx(classes.divColumn, classes.marginBottom)}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.CAMPAIGN_TABLE_HEADER_PRIORITY}</Typography>
								<TextField
									variant={'outlined'}
									className={classes.textField}
									value={this.state.rowData.priority}
									onChange={(evt) => { this.handleAction('priority', evt.target.value)(evt) }}
									fullWidth
								/>
							</div>
							<div className={clsx(classes.divColumn, classes.marginBottom)}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.TABLE_HEADER_STATUS}</Typography>
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
									fullWidth
									classes={{
										root: classes.autoComplete,
										input: classes.autoCompleteInput,
										inputRoot: classes.autoCompleteInputRoot
									}}
									style={{marginBottom:'0px'}}
								/>
							</div>
							<div className={clsx(classes.divColumn, classes.marginBottom)}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.CAMPAIGN_TABLE_HEADER_GENDER}</Typography>
								<Autocomplete
									autoComplete
									autoSelect
									filterSelectedOptions
									disableCloseOnSelect
									multiple={true}
									value={this.state.rowData.gender}
									options={GENDERS || []}
									onChange={(evt, value) => {
										this.handleAction('gender', value)(evt)
									}}
									disableClearable={true}
									renderInput={(params) => (
										<TextField {...params}
											variant="outlined"
										/>
									)}
									renderTags={(value, getTagProps) =>
										value.map((option, index) => (
											<Chip 
												variant={'outlined'}
												size={'small'} 
												label={option} 
												{...getTagProps({ index })}
											/>
									))}
									fullWidth
									classes={{
										root: classes.autoComplete,
										input: classes.autoCompleteInput,
										inputRoot: classes.autoCompleteInputRoot
									}}
									style={{marginBottom:'0px'}}
								/>
							</div>
							<div className={clsx(classes.divColumn, classes.marginBottom)}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.CAMPAIGN_TABLE_HEADER_COUNTRY}</Typography>
								<Autocomplete
									freeSolo
									fullWidth
									multiple
									limitTags={3}
									size={'small'}
									value={this.state.rowData.country}
									options={[]}
									onChange={(evt, value) => {
										this.handleAction('country', value)(evt)
									}}
									disableClearable={true}
									renderInput={(params) => (
										<TextField {...params}
											variant={'outlined'}
										/>
									)}
									renderTags={(value, getTagProps) =>
										value.map((option, index) => (
											<Chip 
												variant={'outlined'}
												size={'small'} 
												label={option} 
												{...getTagProps({ index })}
											/>
									))}
									classes={{
										root: classes.autoComplete,
										input: classes.autoCompleteInput,
										inputRoot: classes.autoCompleteInputRoot
									}}
								/>
							</div>
							<div className={clsx(classes.divColumn, classes.marginBottom)}>
								<div className={clsx(classes.divColumn)}>
									<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.CAMPAIGN_TABLE_HEADER_DATE}</Typography>
									<div className={clsx(classes.divColumn, classes.divHeight, classes.cmsDate)}>
										<CmsDate
											views={['date']}
											disableToolbar={false} 
											enableFullTimeFormat={true}
											disableCheckMaxRange={true}
											raiseSubmitOnMounted={true}
											disablePast={true}
											initDate={{ 
												date_begin: this.state.rowData?.start_end_date.start_date, 
												date_end: this.state.rowData?.start_end_date.end_date
											}}
											onDateSubmit={(data) => {
												this.handleAction('start_end_date',data)(null)
											}}
											
										/>
									</div>
								</div>
							</div>
							<div className={clsx(classes.divColumn, classes.marginBottom)}>		
									<div className={clsx(classes.divColumn)}>
										<Typography>{TEXT.CAMPAIGN_TABLE_HEADER_END_HOUR}</Typography>
										<div className={clsx(classes.divColumn, classes.divHeight, classes.cmsDate)}>
											<CmsDate
												views={['date','hours','minutes']}
												openTo='hours'
												disablePast={true}
												disableFuture={true}
												enableFullTimeFormat={true}
												disableCheckMaxRange={true}
												raiseSubmitOnMounted={true}
												format=''
												initDate={{ 
													date_begin: this.state.rowData.init_end_hour || this.state.rowData?.end_hour || new Date((new Date().setHours("00","00")))
												}}
												onDateSubmit={(data) => {
													this.handleAction('end_hour', data.date_begin)(null)
												}}
												isSingleChoice={true}
											/>
										</div>
									</div>
								</div>
						</div>	
					</div>
					<div className={clsx(classes.divRow, classes.justifyBetween)}>
							<div className={clsx(classes.divColumn)} style={{ width: '45%'}}>
								<div className={clsx(classes.divColumn, classes.marginBottom)}>
									<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter,classes.marginBottom)}> 
										<Typography>
											{TEXT.CAMPAIGN_TABLE_HEADER_CUSTOM_CONDITION}
										</Typography>
										<Button
											variant='outlined'
											color={'default'}
											className={classes.buttonAdd}
											startIcon={<Icons.IconAdd />}
											onClick={this.handleAction('addItem','custom_condition',{key:'',operation:'',value:''})}
										>
											{TEXT.CAMPAIGN_BUTTON_ADD_CUSTOM_CONDITION}
										</Button> 

										
									</div>
									<div className={clsx(classes.divColumn,classes.listBox)}>
										{
											_.map(this.state.rowData.custom_condition, (data,index) => 
											{
												return (
													<div className={clsx(classes.divRow)} key={index} style={{marginBottom:'10px'}}>
														<TextField
															className={clsx(classes.inputTextField, classes.inputText)}
															value={data.key || ''}
															margin="normal"
															fullWidth
															variant={'outlined'}
															onChange={(evt) => { this.handleAction('custom_condition-key', evt.target.value, index)(evt) }}
															style={{marginRight:'10px'}}
														/>
														<Autocomplete
															autoComplete
															autoSelect
															filterSelectedOptions
															value={data.operation}
															options={this.operation || []}
															onChange={(evt, value) => {
																this.handleAction('custom_condition-operation', value, index)(evt)
															}}
															disableClearable={true}
															renderInput={(params) => (
																<TextField {...params}
																	variant="outlined"
																/>
															)}
															fullWidth
															classes={{
																root: classes.autoComplete,
																input: classes.autoCompleteInput,
																inputRoot: classes.autoCompleteInputRoot
															}}
															style={{marginBottom:'0px',marginRight:'10px'}}
														/>
														<TextField
															className={clsx(classes.inputTextField, classes.inputText)}
															value={data.value || ''}
															margin="normal"
															fullWidth
															variant={'outlined'}
															onChange={(evt) => { this.handleAction('custom_condition-value', evt.target.value, index)(evt) }}
															style={{marginRight:'10px'}}
														/>
														<Icons.IconRemove
															onClick={this.handleAction('removeItem', 'custom_condition', index )}
															style={{marginTop:'6px',marginLeft:'5px',cursor:'pointer'}}
														/>	
													</div>
												)
											}) 
										}
									</div>
								</div>
							</div>
							<div className={clsx(classes.divColumn)} style={{ width: '45%'}}>
								<div className={clsx(classes.divColumn, classes.marginBottom)}>
									<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter,classes.marginBottom)}> 
										<Typography>
											{TEXT.CAMPAIGN_TABLE_HEADER_ONLINE_PARAM}
										</Typography>
										<Button
											variant='outlined'
											color={'default'}
											className={classes.buttonAdd}
											startIcon={<Icons.IconAdd />}
											onClick={this.handleAction('addItem','online_param',{key:'',value:''})}
										>
											{TEXT.CAMPAIGN_BUTTON_ADD_ONLINE_PARAM}
										</Button> 
				
									</div>
									<div className={clsx(classes.divColumn,classes.listBox)}>
										{
											_.map(this.state.rowData.online_param, (data,index) => 
											{
												return (
													<div className={clsx(classes.divRow)} key={index} style={{marginBottom:'10px'}}>
														<TextField
															className={clsx(classes.inputTextField, classes.inputText)}
															value={data.key || ''}
															margin="normal"
															fullWidth
															variant={'outlined'}
															onChange={(evt) => { this.handleAction('online_param-key', evt.target.value, index)(evt) }}
															style={{marginRight:'10px'}}
														/>
														<TextField
															className={clsx(classes.inputTextField, classes.inputText)}
															value={data.value || ''}
															margin="normal"
															fullWidth
															variant={'outlined'}
															onChange={(evt) => { this.handleAction('online_param-value', evt.target.value, index)(evt) }}
															style={{marginRight:'10px'}}
														/>
														<Icons.IconRemove
															onClick={this.handleAction('removeItem', 'online_param', index )}
															style={{marginTop:'6px',marginLeft:'5px',cursor:'pointer'}}
														/>	
													</div>
												)
											}) 
										}
									</div>
									
								</div>
							</div>
					</div>	
				</div>
		)
	}

	renderTitle = (title) =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn, classes.marginBottom)}>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
					<Typography className={clsx(classes.title)}>{title}</Typography>
					<div className={clsx(classes.divRow)} >
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
						<CmsControlPermission
							control={
								<Button
									variant={'contained'}
									color={'primary'}
									onClick={this.handleAction('submit')}
									className={clsx(classes.buttonLeft)}
									disabled={this.validateSubmit(this.state.rowData)}
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

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
                    this.state.dialogType === 'pointcut_add' && TEXT.CAMPAIGN_BUTTON_NEW_POINTCUT ||
                    this.state.dialogType === 'pointcut_edit' && TEXT.CAMPAIGN_TOOLTIP_EDIT_POINTCUT ||
                    this.state.dialogType === 'pointcut_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'pointcut_restore' && TEXT.REMIND_TITLE ||

                    this.state.dialogType === 'campaign_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'campaign_restore' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'campaign_delete' || this.state.dialogType === 'campaign_restore') && this.renderDeleteRestoreCampaign()
			}
			{
				(this.state.dialogType === 'pointcut_delete' || this.state.dialogType === 'pointcut_restore') && this.renderDeleteRestorePointcut()
			}
			{
				(this.state.dialogType === 'pointcut_add' || this.state.dialogType === 'pointcut_edit') && this.renderAddEditPointcut()
			}		
			</ModalDialog>
		)
	}

	renderDeleteRestoreCampaign = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'campaign_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.CAMPAIGN_MESSAGE_DELETE_CAMPAIGNS, this.state.rowData.length) : TEXT.CAMPAIGN_MESSAGE_DELETE_CAMPAIGN) ||
						this.state.dialogType === 'campaign_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.CAMPAIGN_MESSAGE_RESTORE_CAMPAIGNS, this.state.rowData.length) : TEXT.CAMPAIGN_MESSAGE_RESTORE_CAMPAIGN) ||
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
									{`${data.name} - ${data.code} - ${data.type}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.code} - ${this.state.rowData.type}` }
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderDeleteRestorePointcut = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'pointcut_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.CAMPAIGN_MESSAGE_DELETE_POINTCUTS, this.state.rowData.length) : TEXT.CAMPAIGN_MESSAGE_DELETE_POINTCUT) ||
						this.state.dialogType === 'pointcut_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.CAMPAIGN_MESSAGE_RESTORE_POINTCUT, this.state.rowData.length) : TEXT.CAMPAIGN_MESSAGE_RESTORE_POINTCUT) ||
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
									{`${data.name} - ${data.description}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.description}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderAddEditPointcut = () =>
	{
		const {classes} = this.props;
	
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CAMPAIGN_TABLE_HEADER_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
					/>
					
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.CAMPAIGN_TABLE_HEADER_DESCRIPTION}</Typography>
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
		)
	}

	validateSubmit = (data) =>
	{
		const {tableTab} = this.state;
		switch(tableTab)
		{
			case 0: 
				return (
					_.isEmpty(data['code'])
					|| _.isEmpty(data['name'])
					|| _.isEmpty(data['type'])
					|| _.isEmpty(data['status'])
				)
			case 1:
				return _.every(Object.keys(data),item => _.isEmpty(data[item]))
		}
	}

	submitData = (data) =>
	{
		if(_.includes(['campaign_delete','campaign_restore'], this.state.dialogType) || this.state.tableTab !== 0) return data

		let { 
			start_end_date, 
			start_hour,
			end_hour
		} = data;

		let start_date = start_end_date?.date_begin?.getTime() || start_end_date.start_date || moment().valueOf();
		let end_date = start_end_date?.date_end?.getTime() || start_end_date.end_date || moment().valueOf();


		start_hour =  start_hour === '' ? '00:00' : `${start_hour?.getHours()?.toString()}:${start_hour?.getMinutes().toString()}`;
		end_hour = end_hour === '' ? '00:00' : `${end_hour?.getHours()?.toString()}:${end_hour?.getMinutes().toString()}`;
		
		data = {
			...data,
			start_hour,
			end_hour,
			start_date,
			end_date
		}

		delete data.start_end_date
		return data
	}

	handleAction = (name, data, index ) => (evt) =>
	{
		switch (name)
		{
			case 'close':
				this.setState({
					isDialogOpen: false,
					isPageOpen: false,
					dialogType: '',
					rowData: {}
				})
				break
			case 'addItem':
				this.setState({
					rowData:{
						...this.state.rowData,
						[data]: [
							...this.state.rowData[data],
							index
						]
					}
				})
				break;
			case 'removeItem':
				this.setState({
					rowData: {
						...this.state.rowData,
						[data]: this.state.rowData[data].filter((name,idx) => index!==idx)
					}
				})
				break;
			case 'submit':
				if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						this.state.dialogType === 'campaign_delete' && this.props.CampaignsDelete(row) ||
						this.state.dialogType === 'pointcut_delete' && this.props.CampaignsPointcutsDelete(row) ||
						
						this.state.dialogType === 'campaign_restore' && this.props.CampaignsRestore(row) ||
						this.state.dialogType === 'pointcut_restore' && this.props.CampaignsPointcutsRestore(row) 
					})
				}
				else
				{
					let data = this.submitData(this.state.rowData)

					this.state.dialogType === 'campaign_add' && this.props.CampaignsAdd(data) ||
					this.state.dialogType === 'campaign_edit' && this.props.CampaignsEdit(data) ||
					this.state.dialogType === 'campaign_delete' && this.props.CampaignsDelete(data) ||
					this.state.dialogType === 'campaign_restore' && this.props.CampaignsRestore(data) ||
							
					this.state.dialogType === 'pointcut_add' && this.props.CampaignsPointcutsAdd(data) ||
					this.state.dialogType === 'pointcut_edit' && this.props.CampaignsPointcutsEdit(data) ||
					this.state.dialogType === 'pointcut_delete' && this.props.CampaignsPointcutsDelete(data) ||
					this.state.dialogType === 'pointcut_restore' && this.props.CampaignsPointcutsRestore(data) 

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
							this.props.ClearProps(['pointcuts'])
							this.props.CampaignsLoad()
						}
						else if (this.state.tableTab === 1)
						{
							this.props.ClearProps(['campaigns'])
							this.props.CampaignsPointcutsLoad()
						}
					}
				)
				break
			case 'campaign_add':
			case 'campaign_edit':
			case 'campaign_delete':
			case 'campaign_restore':
			case 'pointcut_add':
			case 'pointcut_edit':
			case 'pointcut_delete':
			case 'pointcut_restore':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					isPageOpen: _.includes(['campaign_add','campaign_edit'],name),
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})
				break

			case 'custom_condition-key':
			case 'custom_condition-operation':
			case 'custom_condition-value':
			case 'online_param-key':
			case 'online_param-value':
				let key = name.split('-')[1];
				name = name.split('-')[0];
				this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: _.map(this.state.rowData[name], (item,idx) => index === idx ? {...item, [key]: data } : item)
					}
                })
				break

            default:
                this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: _.includes(['priority'],name) ? +data : data
					}
                })
		}		
	}

	

    render()
    {
        const { classes } = this.props;

        return (
            <div className={classes.root} style={{overflow: this.state.isPageOpen && 'hidden'}}>
				{
					this.state.isPageOpen ? this.renderAddEditCampaign() : this.renderTableTabs()
				}
				{
					(
						_.includes(this.state.dialogType, 'pointcut_')
						|| this.state.dialogType === 'campaign_delete'
						|| this.state.dialogType === 'campaign_restore'
					)
					&& this.renderDialog()
				}  
            </div>
        );
    }

	renderTableTabs = () =>
	{
		const { classes } = this.props
		return (
			<>
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
						<Tab label={TEXT.CAMPAIGN_TABLE_TAB_CAMPAIGN}/>
						<Tab label={TEXT.CAMPAIGN_TABLE_TAB_POINTCUT} />
					</Tabs>
					{this.actionsExtend.createElement(this.actionsExtend)}
				</div>
				<CmsTabPanel value={this.state.tableTab} index={0}>
				{
					this.renderCampaignTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={1}>
				{
					this.renderPointcutTable()
				}
				</CmsTabPanel>
			</>	
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

	renderTimeColumn = (rowData, values) =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divRow, classes.justifyStart)}>
				<div className={clsx(classes.divColumn, classes.alignStart)}>
					{
						_.map(values, value =>
						(
							<div className={classes.divRow} key={value.title}>
								<div style={{ fontWeight: 'bold', marginRight: 10 }}>
								{
									value.title
								}
								</div>
								<div>
								{
									_.isString(value.time)
									? value.time
									: moment.utc(value.time).format(FULLTIME_FORMAT)
								}
								</div>
							</div>
						))
					}
				</div>
			</div>
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

	renderCampaignTable = () =>
	{
		const {campaigns, classes } = this.props;
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.CAMPAIGN_TABLE_HEADER_CODE, field: 'code', width: 150,
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_NAME, field: 'name', width: 200,
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_DESCRIPTION, field: 'description', width: 250,
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_COUNTRY, 
							field: 'country', 
							width: 200,
							render: (rowData) => this.renderChipColumn(rowData.country)
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_PLATFORM, 
							field: 'platform', 
							width: 200,
							render: (rowData) => this.renderChipColumn(rowData.platform)
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_VERSION, 
							field: 'version', 
							width: 200,
							render: (rowData) => this.renderChipColumn(rowData.version)
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_GENDER, 
							field: 'gender', 
							width: 200,
							render: (rowData) => this.renderChipColumn(rowData.gender)
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_SPECIFIC_USER, 
							field: 'specific_user', 
							width: 200,
							render: (rowData) => this.renderChipColumn(rowData.specific_user)
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_PRIORITY, field: 'priority', width: 100,
                        },

						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_HOUR, 
							field: 'start_hour', 
							width: 250,
							render: (rowData) => this.renderTimeColumn(rowData, [{title:TEXT.CAMPAIGN_TABLE_HEADER_START_HOUR, time:rowData.start_hour},{title:TEXT.CAMPAIGN_TABLE_HEADER_END_HOUR,time:rowData.end_hour}])
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_DATE, 
							field: 'end_date', 
							width: 250,
							render: (rowData) => this.renderTimeColumn(rowData, [{title:TEXT.CAMPAIGN_TABLE_HEADER_START_DATE, time:rowData.start_date},{title:TEXT.CAMPAIGN_TABLE_HEADER_END_DATE,time:rowData.end_date}])
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
								let {
									start_date,
									end_date,
									start_hour,
									end_hour
								} = rowData;


								let start_end_date = {
									start_date,
									end_date,
								}
								let init_start_hour = new Date();
								let init_end_hour = new Date();
								init_start_hour.setHours(start_hour.split(':')[0], start_hour.split(':')[1]);
								init_end_hour.setHours(end_hour.split(':')[0], end_hour.split(':')[1]);
								start_hour = init_start_hour
								end_hour = init_end_hour
								
								rowData = {
									...rowData,
									start_end_date,
									start_hour,
									end_hour
								}
								this.handleAction('campaign_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.CAMPAIGN_TOOLTIP_EDIT_CAMPAIGN),
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
								this.handleAction('campaign_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.CAMPAIGN_TOOLTIP_DELETE_CAMPAIGN),
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
								this.handleAction('campaign_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.CAMPAIGN_TOOLTIP_RESTORE_CAMPAIGN),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
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
								this.props.history.push(`${this.props.location.pathname}/${rowData.id}/contents`)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.CAMPAIGN_TABLE_TAB_CONTENT),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={campaigns || []}

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
	
	renderPointcutTable = () =>
	{
		const {pointcuts, classes } = this.props;
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_NAME, field: 'name', width: 200,
                        },
						{
                            title: TEXT.CAMPAIGN_TABLE_HEADER_DESCRIPTION, field: 'description', width: 250,
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
								this.handleAction('pointcut_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.CAMPAIGN_TOOLTIP_EDIT_POINTCUT),
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
								this.handleAction('pointcut_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.CAMPAIGN_TOOLTIP_DELETE_POINTCUT),
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
								this.handleAction('pointcut_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.CAMPAIGN_TOOLTIP_RESTORE_POINTCUT),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						}
					]}

                    data={pointcuts || []}

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

}

Campaign.propTypes =
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
	CampaignsLoad: () =>
	{
		dispatch(ActionCMS.CampaignsLoad())
	},
	CampaignsAdd: (campaign_data) =>
	{
		dispatch(ActionCMS.CampaignsAdd(campaign_data))
	},
	CampaignsEdit: (campaign_data) =>
	{
		dispatch(ActionCMS.CampaignsEdit(campaign_data))
	},
	CampaignsDelete: (campaign_data) =>
	{
		dispatch(ActionCMS.CampaignsDelete(campaign_data))
	},
	CampaignsRestore: (campaign_data) =>
	{
		dispatch(ActionCMS.CampaignsRestore(campaign_data))
	},
	CampaignsPointcutsLoad: () =>
	{
		dispatch(ActionCMS.CampaignsPointcutsLoad())
	},
	CampaignsPointcutsAdd: (campaign_pointcuts_data) =>
	{
		dispatch(ActionCMS.CampaignsPointcutsAdd(campaign_pointcuts_data))
	},
	CampaignsPointcutsEdit: (campaign_pointcuts_data) =>
	{
		dispatch(ActionCMS.CampaignsPointcutsEdit(campaign_pointcuts_data))
	},
	CampaignsPointcutsDelete: (campaign_pointcuts_data) =>
	{
		dispatch(ActionCMS.CampaignsPointcutsDelete(campaign_pointcuts_data))
	},
	CampaignsPointcutsRestore: (campaign_pointcuts_data) =>
	{
		dispatch(ActionCMS.CampaignsPointcutsRestore(campaign_pointcuts_data))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle)
)(Campaign);

