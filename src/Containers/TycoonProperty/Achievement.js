import React from 'react';
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography,Divider, Button, TextField, Icon, Tooltip, Chip } from '@material-ui/core'
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
	}
});

class Achievement extends React.Component
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
		this.selectedRows = [];
		this.booleanArray = ['true','false'];
		this.duplicatedName = []
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
				
				apiAdd = API.AchievementAdd.bind(API)
				apiUpdate = API.AchievementEdit.bind(API)
				apiDelete = API.AchievementDelete.bind(API)

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
									fileNameExtend={`/${TEXT.ACHIEVEMENT_MANAGEMENT_TITLE}`}
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
														this.handleAction('achievement_restore')
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
												{
													TEXT.ACHIEVEMENT_BUTTON_RESTORE_ACHIEVEMENT
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
														this.handleAction('achievement_delete')
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
												{
													TEXT.ACHIEVEMENT_BUTTON_DELETE_ACHIEVEMENT
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
													this.handleAction('achievement_add',{ name:'', description:'', condition:'', condition_tier: [], hidden:'', permanent:'', status:''})
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
											{
												TEXT.ACHIEVEMENT_BUTTON_NEW_ACHIEVEMENT 
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

	getImportColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.ACHIEVEMENT_TABLE_HEADER_NAME, field: 'name' },
			{ title: TEXT.ACHIEVEMENT_TABLE_HEADER_DESCRIPTION, field: 'description' },
			{ title: TEXT.ACHIEVEMENT_TABLE_HEADER_CONDITION, field: 'condition' },
			{ title: TEXT.ACHIEVEMENT_TABLE_HEADER_CONDITION_TIER, field: 'condition_tier' },
			{ title: TEXT.ACHIEVEMENT_TABLE_HEADER_HIDDEN, field: 'hidden' },
			{ title: TEXT.ACHIEVEMENT_TABLE_HEADER_PERMANENT, field: 'permanent' },
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
			case 'condition':
			case 'description':
				data = rawData.trim()
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
			case 'condition_tier':
				try
				{
					data = JSON.parse(rawData.trim());
					data = _.sortBy(data)
					if(	!_.isObject(data) || _.isEmpty(data))
					{
						throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
					}	
				}
				catch
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}
				break;
			case 'hidden':
			case 'permanent':
				data = rawData;
				if (!_.isBoolean(data))
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
			this.props.AchievementLoad()
		}
	}
	
	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.TABLE_HEADER_STATUS, field: 'status' },
			{ title: TEXT.ACHIEVEMENT_TABLE_HEADER_NAME, field: 'name' },
			{ title: TEXT.ACHIEVEMENT_TABLE_HEADER_DESCRIPTION, field: 'description' },
			{ title: TEXT.ACHIEVEMENT_TABLE_HEADER_CONDITION, field: 'condition' },
			{ title: TEXT.ACHIEVEMENT_TABLE_HEADER_CONDITION_TIER, field: 'condition_tier' },
			{ title: TEXT.ACHIEVEMENT_TABLE_HEADER_HIDDEN, field: 'hidden' },
			{ title: TEXT.ACHIEVEMENT_TABLE_HEADER_PERMANENT, field: 'permanent' },
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
		let result = []
		if (this.state.tableTab === 0)
		{
			result = this.props.achievements
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
            let {  condition_tier, createdAt, modifiedAt, deletedAt, ...others} = value
			condition_tier = JSON.stringify(condition_tier)
            createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
			modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
			deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
            return {...others, condition_tier, createdAt, modifiedAt, deletedAt}
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

    componentDidMount()
	{
		this.props.SetTitle(TEXT.ACHIEVEMENT_MANAGEMENT_TITLE)
		this.props.AchievementLoad();
	}

	static getDerivedStateFromProps(props, state)
	{
        if (props.needRefresh)
		{
			props.ClearRefresh()
			
			_.includes(state.dialogType, 'achievement_') && props.AchievementLoad();

			return {
				isDialogOpen: false,
				isMultiSelectMode: false,
				dialogType: '',
				rowData: {},
			}
		}

        return null;
    }

	componentWillUnmount() 
	{
		this.props.ClearProps([])
	}

	componentDidUpdate(prevProps, prevState)
	{
		this.props !== prevProps && this.formatDuplicateKey()
	}

	formatDuplicateKey = () =>
	{	
		let formatName = _.reduce(this.props.achievements, (result,currentValue) => 
		{
			return currentValue.deletedAt === 0 ? result : [...result,currentValue]
		},[])
	
		this.duplicatedName = Object.keys(_.groupBy(formatName,  name => name.name))

	}

	preprocessDataSubmit = (data) => 
	{
		let {
			hidden,
			permanent,
			condition_tier,
			...others
		} = data;

		hidden = hidden === 'true';
		permanent =  permanent === 'true';

		condition_tier = _.sortBy(_.map(condition_tier, item => +item ))

		return {...others,hidden,permanent,condition_tier}
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
						this.state.dialogType === 'achievement_delete' && this.props.AchievementDelete(row) ||
						this.state.dialogType === 'achievement_restore' && this.props.AchievementRestore(row)
					})
				}
				else
				{
					let data = this.preprocessDataSubmit(this.state.rowData);
					this.state.dialogType === 'achievement_add' && this.props.AchievementAdd(data) ||
					this.state.dialogType === 'achievement_edit' && this.props.AchievementEdit(data) ||
					this.state.dialogType === 'achievement_delete' && this.props.AchievementDelete(data) ||
					this.state.dialogType === 'achievement_restore' && this.props.AchievementRestore(data) 
				}
				break

			case 'achievement_add':
			case 'achievement_edit':
			case 'achievement_delete':
			case 'achievement_restore':
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

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
                    this.state.dialogType === 'achievement_add' && TEXT.ACHIEVEMENT_BUTTON_NEW_ACHIEVEMENT ||
                    this.state.dialogType === 'achievement_edit' && TEXT.ACHIEVEMENT_BUTTON_EDIT_ACHIEVEMENT ||
                    this.state.dialogType === 'achievement_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'achievement_restore' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'achievement_delete' || this.state.dialogType === 'achievement_restore') && this.renderDeleteRestoreAchievement()
			}
			{
				(this.state.dialogType === 'achievement_add' || this.state.dialogType === 'achievement_edit') && this.renderAddEditAchievement()
			}
			</ModalDialog>
		)
	}

	validateSubmit = (data) =>
	{
		return (
			_.isEmpty(data.name)
			|| 	(_.includes(this.state.dialogType,'_add') && _.includes(this.duplicatedName,data.name) )
			|| _.isEmpty(data.description)
			|| _.isEmpty(data.condition)
			|| _.isEmpty(data.status)
			|| _.isEmpty(data.condition_tier)
			|| _.isEmpty(data.hidden)
			|| _.isEmpty(data.permanent)
			// || _.some(data.condition_tier,tier=>isNaN(tier))
		)
	}

	renderAddEditAchievement = () =>
	{
		const { classes , STATUSES  } = this.props;
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.ACHIEVEMENT_TABLE_HEADER_NAME}</Typography>
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
					this.state.dialogType === 'achievement_add' 
					&&  _.includes(this.duplicatedName,this.state.rowData.name)
					&& (
						<div className={clsx(classes.divColumn)}>
							<div className={clsx(classes.alignCenter,classes.divRow)}>
								<WarningRounded className={classes.warningIcon} fontSize={'large'} />
								<Typography>{TEXT.ACHIVEMENT_WARNING_DUPLICATE_NAME}</Typography>
							</div>
						
						</div>
					)
				}
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
					<Typography>{TEXT.ACHIEVEMENT_TABLE_HEADER_DESCRIPTION}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.description || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('description', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.ACHIEVEMENT_TABLE_HEADER_CONDITION}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.condition || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('condition', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.ACHIEVEMENT_TABLE_HEADER_HIDDEN}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.hidden.toString() || ''}
						options={this.booleanArray}
						onChange={(evt, value) => {
							this.handleAction('hidden', value)(evt)
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
					<Typography>{TEXT.ACHIEVEMENT_TABLE_HEADER_PERMANENT}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.permanent.toString() || ''}
						options={this.booleanArray}
						onChange={(evt, value) => {
							this.handleAction('permanent', value)(evt)
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
					<Typography>{TEXT.ACHIEVEMENT_TABLE_HEADER_CONDITION_TIER}</Typography>
						<Autocomplete
							freeSolo
							fullWidth
							multiple
							limitTags={3}
							size={'small'}
							value={this.state.rowData.condition_tier}
							options={[]}
							onChange={(evt, value) => {
								if(_.some(value, item => !/^\d+$/.test(item))) return null	
								this.handleAction('condition_tier', value)(evt)						
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
			</div>
		)
	}

	renderDeleteRestoreAchievement = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'achievement_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.ACHIEVEMENT_MESSAGE_DELETE_ACHIEVEMENTS, this.state.rowData.length) : TEXT.ACHIEVEMENT_MESSAGE_DELETE_ACHIEVEMENT) ||
						this.state.dialogType === 'achievement_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.ACHIEVEMENT_MESSAGE_RESTORE_ACHIEVEMENTS, this.state.rowData.length) : TEXT.ACHIEVEMENT_MESSAGE_RESTORE_ACHIEVEMENT) ||
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
									{`${data.name} - ${data.status} - ${data.condition}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.status} - ${this.state.rowData.condition}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}	

    render()
    {
        const { classes } = this.props;
        
        return (
            <div className={classes.root}>
                {this.renderAchievementTable()}
				{this.renderDialog()}
            </div>
        );
    }

	renderStatusTitleColumn = () =>
	{
		const { classes } = this.props

		return (
			<div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
				<span>{TEXT.TABLE_HEADER_STATUS}</span>
				<Tooltip 
					title={TEXT.ACHIEVEMENT_TOOLTIP_STATUS}
					classes={{tooltip: classes.toolTip}}
					placement={'top'}
				>
					<Icon style={{ color: '#AEAEAE', marginLeft: 10 }} >help</Icon>
				</Tooltip>
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

	renderConditionTierColumn = (condition_tier,NUMBER_CHIPS = 2) =>
	{
		const { classes } = this.props
		
		const chips = condition_tier.slice(0, NUMBER_CHIPS)
		const hidden = (condition_tier.length - chips.length > 0)
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
				options={condition_tier}
				getOptionLabel={(option) => (option?.name || '')}
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
						<div key={index} className={clsx(classes.divRow)}>
							<Chip
								variant={'outlined'}
								style={{marginRight: 5}}
								size={'small'} 
								label={option?.name || ''}
							/>
							{
								hidden && (index === NUMBER_CHIPS - 1) &&
								(
									!isOpen
									?
									<Chip 
										color="primary"
										size={'small'} 
										label={`+${condition_tier.length - chips.length}`}
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

	renderAchievementTable = () =>
	{
		const { classes , achievements } = this.props;
		return (
			<div className={clsx(classes.table, classes.divColumn)}>
					<CmsTable
						columns={[
							{
								title: TEXT.ACHIEVEMENT_TABLE_HEADER_NAME, field: 'name', width: 250,
							},
							{
								title: () => this.renderStatusTitleColumn(),
								placeholder: TEXT.TABLE_HEADER_STATUS,
								field: 'status', width: 150,
								customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.status, columnDef)
                        	},
							{
								title: TEXT.ACHIEVEMENT_TABLE_HEADER_DESCRIPTION, field: 'description', width: 250,
								render: rowData =>
								{
									return (
										<div style={{ width: 230, marginLeft: 10, wordWrap: 'break-word' }}>
											{rowData.description}
										</div>
									)
								}
							},
							{
								title: TEXT.ACHIEVEMENT_TABLE_HEADER_CONDITION, field: 'condition', width: 250,
							},
							{
								title: TEXT.ACHIEVEMENT_TABLE_HEADER_HIDDEN, field: 'hidden', width: 150,
							},
							{
								title: TEXT.ACHIEVEMENT_TABLE_HEADER_PERMANENT, field: 'permanent', width: 150,
							},
							{
								title: TEXT.ACHIEVEMENT_TABLE_HEADER_CONDITION_TIER, 
								field: 'permanent',
								width: 300,
								render: rowData => 
								{
									const fieldData = _.map(rowData.condition_tier, (value, id) => ({id, name: value.toString()}))
									return this.renderConditionTierColumn(fieldData)
								}
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
										hidden:rowData.hidden.toString(),
										permanent:rowData.permanent.toString(),	
									}
									this.handleAction('achievement_edit', rowData)(event)
								},
								tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.ACHIEVEMENT_TOOLTIP_EDIT_ACHIEVEMENT),
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
									this.handleAction('achievement_delete', rowData)(event)
								},
								tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.ACHIEVEMENT_TOOLTIP_DELETE_ACHIEVEMENT),
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
									this.handleAction('achievement_restore', rowData)(event)
								},
								tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.ACHIEVEMENT_TOOLTIP_RESTORE_ACHIEVEMENT),
								disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
								iconProps: { color: 'inherit' },
								position: 'row',
								controlPermission: {
									link: '',
									attribute: ''
								}
							}
						]}

						data={achievements || []}
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

}

Achievement.propTypes =
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
	AchievementLoad: () =>
	{
		dispatch(ActionCMS.AchievementLoad())
	},
	AchievementAdd: (achievement_data) =>
	{
		dispatch(ActionCMS.AchievementAdd(achievement_data))
	},
	AchievementEdit: (achievement_data) =>
	{
		dispatch(ActionCMS.AchievementEdit(achievement_data))
	},
	AchievementDelete: (achievement_data) =>
	{
		dispatch(ActionCMS.AchievementDelete(achievement_data))
	},
	AchievementRestore: (achievement_data) =>
	{
		dispatch(ActionCMS.AchievementRestore(achievement_data))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle)
)(Achievement);

