import React from 'react';
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import { saveAs } from 'file-saver'

import { Typography, Chip, Divider, Tabs, Tab, Button, TextField, Icon, Tooltip, IconButton, FormControlLabel, Checkbox } from '@material-ui/core'
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
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsTabPanel from '../../Components/CmsTabPanel'
import CmsSearch from '../../Components/CmsSearch'
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
const REWARD_SETTING_DATA = { type: '', item: '', status: '' }
const REWARD_PACK_DATA = { name: '', item: '' }
const REWARD_DATA = { type: '', received: false }
const DIALOG_PAGE_SIZE = 5
const DIALOG_TABLE_HEIGHT = 290

const styles = theme => ({
	tabs: {
		width: '60%'
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
	rewardRequirement: {
		height:'200px',
		overflowY: 'auto',
		padding:'10px 0px'
	},
	searchBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(5),
		marginBottom: theme.spacing(3)
	},
	importBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(2),
		marginBottom: theme.spacing(3)
	},
	marginLeft: {
		marginLeft: 15,
	},
	marginTop: {
		marginTop: 5,
	},
	marginBottom: {
		marginBottom: 10,
	},
	autoComplete: {
        minHeight: 40,
        minWidth: 200,
        height: '100%',
    },
});


class Reward extends React.Component
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

		this.tableRef = React.createRef();

		this.minMax = {
			min: 0,
			max: 0
		}

		this.duplicatedTypesName = [];
		this.duplicatedItemsName = [];
		this.duplicatedItemsNameSingle = [];
		this.duplicatedItemsNamePackage = [];
		this.duplicatedPacksName = [];

		this.playerCards = [];
		this.singleItems = [];

		this.actionsExtend = {
			createElement: (parentProps) =>
			{
				const { classes } = this.props
			
				return (
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<div className={clsx(classes.divRow)}>
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
														this.state.tableTab === 2 && this.handleAction('item_restore') ||
														this.state.tableTab === 3 && this.handleAction('pack_restore') || 
														this.state.tableTab === 4 && this.handleAction('setting_restore') || 
														null
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
												{
													this.state.tableTab === 1 && `${TEXT.REWARD_BUTTON_RESTORE_TYPES}` ||
													this.state.tableTab === 2 && `${TEXT.REWARD_BUTTON_RESTORE_ITEMS}` ||
													this.state.tableTab === 3 && `${TEXT.REWARD_BUTTON_RESTORE_PACKS}` ||  
													this.state.tableTab === 4 && `${TEXT.REWARD_BUTTON_RESTORE_SETTINGS}` ||  ''
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
														this.state.tableTab === 2 && this.handleAction('item_delete') ||
														this.state.tableTab === 3 && this.handleAction('pack_delete') || 
														this.state.tableTab === 4 && this.handleAction('setting_delete') || 
														null
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
												{
													this.state.tableTab === 1 && `${TEXT.REWARD_BUTTON_DELETE_TYPES}` ||
													this.state.tableTab === 2 && `${TEXT.REWARD_BUTTON_DELETE_ITEMS}` ||
													this.state.tableTab === 3 && `${TEXT.REWARD_BUTTON_DELETE_PACKS}` ||  
													this.state.tableTab === 4 && `${TEXT.REWARD_BUTTON_DELETE_SETTINGS}` ||  ''
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
													this.state.tableTab === 0 && this.handleAction('gift_send',  { profileId: this.searchText,  extraInfo: '{}', gifts: [], item: '', itemAmount: 0, card: {}, cardAmount: 0, fromExcel: false, file: null }) ||
													this.state.tableTab === 1 && this.handleAction('type_add',  { name: '',  description: '', status: '', requirement: []}) ||
													this.state.tableTab === 2 && this.handleAction('item_add',  { name: '', description: '', status: '', type: '', giftable: false }) ||
													this.state.tableTab === 3 && this.handleAction('pack_add', {name: '', item: '', status: '', chancePercentage:'', quantity:this.minMax, businessLevel:this.minMax }) ||
													this.state.tableTab === 4 && this.handleAction('setting_add', {type:'' ,item: '', requirement:{} ,status: '',chancePercentage:'', quantity:'', stadiumLevel:this.minMax })																								
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
											{
												this.state.tableTab === 0 && `${TEXT.REWARD_BUTTON_SEND_GIFT}` ||
												this.state.tableTab === 1 && `${TEXT.REWARD_BUTTON_ADD_TYPE}` ||
												this.state.tableTab === 2 && `${TEXT.REWARD_BUTTON_ADD_ITEM}` ||
												this.state.tableTab === 3 && `${TEXT.REWARD_BUTTON_ADD_PACK}` ||  
												this.state.tableTab === 4 && `${TEXT.REWARD_BUTTON_ADD_SETTING}` ||  ''
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
		this.props.SetTitle(TEXT.REWARD_MANAGEMENT_TITLE)
		this.props.RewardItemLoad()
		this.props.PlayerCardsLoad()
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

			if (prevState.dialogType === 'reward_export')
			{
				saveAs(new Blob([this.props.fileData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${TEXT.REWARD_TABLE_TAB_REWARD}.xlsx`)
				this.props.ClearProps(['fileData'])
			}
			else if (prevState.dialogType === 'gift_send' && !prevState.rowData.fromExcel)
			{
				this.searchText = prevState.rowData.profileId || ''
				this.tableRef.current.onQueryChange(this.state.query, null)
			}
			else
			{
				this.state.tableTab === 1 && this.props.RewardTypeLoad() ||
				this.state.tableTab === 2 && this.props.RewardItemLoad() ||
				this.state.tableTab === 3 && this.tableRef.current.onQueryChange(this.state.query, null) ||
				this.state.tableTab === 4 && this.tableRef.current.onQueryChange(this.state.query, null)
			}
		}
	}

	formatDuplicateKey = () =>
	{	
		this.duplicatedTypesName = Object.keys(_.groupBy(_.filter(this.props.rewardTypes || [], (type) => type.deletedAt === 0 ) || [] , type => type.name))
		this.duplicatedItemsName = Object.keys(_.groupBy(_.filter(this.props.rewardItems || [], (item) => item.deletedAt === 0 ) || [] , item => item.name))
		this.duplicatedItemsNameSingle = Object.keys(_.groupBy(_.filter(this.props.rewardItems || [], (item) => (item.deletedAt === 0 && item.type === 'Single') ) || [] , item => item.name))
		this.duplicatedItemsNamePackage = Object.keys(_.groupBy(_.filter(this.props.rewardItems || [], (item) => (item.deletedAt === 0 && item.type === 'Package') ) || [] , item => item.name))
		this.duplicatedPacksName = Object.keys(_.groupBy(_.filter(this.props.rewardPacks || [], (pack) => pack.deletedAt === 0 ) || [] , pack => pack.name))

		this.playerCards = _.filter(this.props.playerCards, card => (card.deletedAt === 0))
		this.singleItems = _.reduce(this.props.rewardItems, (items, item) => {
			return !!item.giftable && item.status === 'Active' ? [...items, item.name] : items
		}, [])
	}

	validateGift = (type) =>
	{
		if (type === 'item')
		{
			return _.isEmpty(this.state.rowData.item) || this.state.rowData.itemAmount === 0
		}
		else if (type === 'card')
		{
			return _.isEmpty(this.state.rowData.card) || this.state.rowData.cardAmount === 0
		}

		return false
	}

	addGift = (type) =>
	{
		let gifts = this.state.rowData.gifts
		let index = _.findIndex(gifts, gift => (gift.type === type && gift.name === this.state.rowData[type]))
		if (index === -1)
		{
			gifts = [...gifts, { name: this.state.rowData[type], type, amount: this.state.rowData[`${type}Amount`] }]
		}
		else
		{
			gifts[index].amount += this.state.rowData[`${type}Amount`]
		}
		
		return gifts
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
			case 'addRequirement':
				this.setState({
					rowData:{
						...this.state.rowData,
						requirement: [
							...this.state.rowData.requirement,
							''
						]
					}
				})
				break;
			case 'removeRequirement':
				this.setState({
					rowData: {
						...this.state.rowData,
						requirement: this.state.rowData.requirement.filter((answer,idx)=>index!==idx)
					}
				})
				break;
			case 'submit':
				if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						this.state.dialogType === 'type_delete' && this.props.RewardTypeDelete(row) ||
						this.state.dialogType === 'item_delete' && this.props.RewardItemDelete(row) ||
						this.state.dialogType === 'pack_delete' && this.props.RewardPackDelete(row) || 
						this.state.dialogType === 'setting_delete' && this.props.RewardSettingDelete(row) ||

						this.state.dialogType === 'type_restore' && this.props.RewardTypeRestore(row) ||
						this.state.dialogType === 'item_restore' && this.props.RewardItemRestore(row) ||
						this.state.dialogType === 'pack_restore' && this.props.RewardPackRestore(row) ||
						this.state.dialogType === 'setting_restore' && this.props.RewardSettingRestore(row) 
					})
				}
				else
				{
					this.state.dialogType === 'reward_import' && this.props.ResourcesImport('reward', this.state.rowData) ||

					this.state.dialogType === 'gift_send' && this.props.RewardSendGift(this.state.rowData) ||

					this.state.dialogType === 'type_add' && this.props.RewardTypeAdd(this.state.rowData) ||
					this.state.dialogType === 'type_edit' && this.props.RewardTypeEdit(this.state.rowData, true) ||
					this.state.dialogType === 'type_delete' && this.props.RewardTypeDelete(this.state.rowData) || 
					this.state.dialogType === 'type_restore' && this.props.RewardTypeRestore(this.state.rowData) || 

							
					this.state.dialogType === 'item_add' && this.props.RewardItemAdd(this.state.rowData) ||
					this.state.dialogType === 'item_edit' && this.props.RewardItemEdit(this.state.rowData, true) ||
					this.state.dialogType === 'item_delete' && this.props.RewardItemDelete(this.state.rowData) || 
					this.state.dialogType === 'item_restore' && this.props.RewardItemRestore(this.state.rowData) ||

							
					this.state.dialogType === 'pack_add' && this.props.RewardPackAdd(this.state.rowData) ||
					this.state.dialogType === 'pack_edit' && this.props.RewardPackEdit(this.state.rowData, true) ||
					this.state.dialogType === 'pack_delete' && this.props.RewardPackDelete(this.state.rowData) || 
					this.state.dialogType === 'pack_restore' && this.props.RewardPackRestore(this.state.rowData) || 

					this.state.dialogType === 'setting_add' && this.props.RewardSettingAdd(this.state.rowData) ||
					this.state.dialogType === 'setting_edit' && this.props.RewardSettingEdit(this.state.rowData) ||
					this.state.dialogType === 'setting_delete' && this.props.RewardSettingDelete(this.state.rowData) || 
					this.state.dialogType === 'setting_restore' && this.props.RewardSettingRestore(this.state.rowData)
				}
				break

			case 'tableTab':
				(data !== this.state.tableTab) && this.setState(
					{
						tableTab: data,
						pageSize: PAGE_SIZE,
						isMultiSelectMode: false,
					},
					() =>
					{
						if (this.state.tableTab === 0)
						{
							this.props.RewardItemLoad()
							this.props.PlayerCardsLoad()
						}
						else if (this.state.tableTab === 1)
						{
							this.props.RewardTypeLoad()
						}
						else if (this.state.tableTab === 2)
						{
							this.props.RewardItemLoad()
						}
						else if (this.state.tableTab === 4)
						{
							this.props.RewardTypeLoad()
						}
					}
				)
				break
			case 'reward_import':	
			case 'type_add':
			case 'type_edit':
			case 'type_delete':
			case 'type_restore':
			case 'item_add':
			case 'item_edit':
			case 'item_delete':
			case 'item_restore':
			case 'pack_add':
			case 'pack_edit':
			case 'pack_delete':
			case 'pack_restore':
			case 'setting_add':
			case 'setting_edit':
			case 'setting_delete':
			case 'setting_restore':
			case 'gift_send':	
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})
				break	
			case 'requirement':
				this.setState({
                    rowData: {
						...this.state.rowData, 
						requirement: this.state.tableTab === 1 ? this.state.rowData.requirement.map((item,idx) => idx === index ? data : item ) : {...this.state.rowData.requirement,[index]:data}
					}
                })
				break
			case 'min':
			case 'max':
				this.setState({
                    rowData: {
						...this.state.rowData, 
						[index] : {
							...this.state.rowData[index],
							[name]: (data === '' ? 0 : (isNaN(data) ? this.state.rowData[index][name] : parseInt(data)))
						}
					}
                })
				break;
			case 'pageSize':
			case 'selectedFilter':	
				this.setState({
					[name]: data
				})
				
				break	
			case 'reward_export':
				this.setState(
					{
						dialogType: name,
						rowData: data
					},
					() =>
					{
						this.props.ResourcesExport('reward')
					}
				)

				break
			case 'add_item':
				this.setState({
					rowData: {
						...this.state.rowData,
						gifts: this.addGift('item')
					}
				})

				break
			case 'add_card':
				this.setState({
					rowData: {
						...this.state.rowData, 
						gifts: this.addGift('card')
					}
				})

				break
			case 'delete_gift':
				this.setState({
					rowData: {
						...this.state.rowData, 
						gifts: _.reject(this.state.rowData.gifts, gift => _.isEqual(gift, data))
					}
				})

				break	
            default:
                this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: _.includes(['chancePercentage', 'itemAmount', 'cardAmount'], name) 
								? 
								(data === '' ? 0 : (isNaN(data) ? this.state.rowData[name] : (parseInt(data) > 2147483648 ? 0 : parseInt(data)))) 
								: 
								name === 'extraInfo' && data === '' ? '{}' : data
					}
                })
		}		
	}

    render()
    {
        const { classes } = this.props;
        
        return (
            <div className={classes.root}>
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
								onClick={this.handleAction('reward_import', {})}
								className={clsx(classes.buttonLeft)}
								startIcon={<Icons.IconAdd/>}
							>
								{ TEXT.BUTTON_IMPORT }
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
								onClick={this.handleAction('reward_export', {})}
								className={clsx(classes.buttonLeft)}
								startIcon={<Icons.ExportIcon/>}
							>
								{ TEXT.BUTTON_EXPORT }
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
						scrollButtons="auto"
						variant='scrollable'
						classes={{
							root: clsx(classes.tabs),
						}}
					>
						<Tab label={TEXT.REWARD_TABLE_TAB_REWARD} />
						<Tab label={TEXT.REWARD_TABLE_TAB_TYPE}/>
						<Tab label={TEXT.REWARD_TABLE_TAB_ITEM} />
						<Tab label={TEXT.REWARD_TABLE_TAB_PACK} />
						<Tab label={TEXT.REWARD_TABLE_TAB_SETTING} />
					</Tabs>
					{this.actionsExtend.createElement(this.actionsExtend)}
				</div>
				<CmsTabPanel value={this.state.tableTab} index={0} >
				{
					this.renderRewardsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={1}>
				{
					this.renderTypesTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={2}>
				{
					this.renderItemsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={3} >
				{
					this.renderPacksTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={4} >
				{
					this.renderSettingsTable()
				}
				</CmsTabPanel>
			</>	
		)	
	}

	renderStatusTitleColumn = () =>
	{
		const { classes } = this.props

		return (
			<div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
				<span>{TEXT.TABLE_HEADER_STATUS}</span>
				<Tooltip 
					title={TEXT.CONTENT_TOOLTIP_STATUS}
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

	renderSingleDateColumn = (rowData) =>
	{
		return (
			<div>
			{
				`${rowData > 0
					? moment.utc(rowData).format(FULLTIME_FORMAT)
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

	renderSearchBar = () =>
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.divColumn, classes.searchBar)}>
				<div className={clsx(classes.divRow, classes.divHeight)}>
					<div className={clsx(classes.divColumn, classes.divFullWidth)}>
						<Typography>{TEXT.REWARD_TABLE_HEADER_PROFILE_ID}</Typography>
						<CmsSearch
							searchText={this.searchText}
							key={'profileId'}
							onSearchClick={(searchText) => {
								this.searchText = searchText
								this.tableRef.current.onQueryChange(this.state.query, null)
							}}
						/>
					</div>
				</div>
			</div>	
		)	
	}

	renderMinMaxColumn = (rowData,name) =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divRow, classes.justifyStart)}>
				<div className={clsx(classes.divColumn, classes.alignStart)}>
					<div className={classes.divRow}>
						<div style={{ fontWeight: 'bold', marginRight: 10 }}>
						{
							`${TEXT.REWARD_TABLE_HEADER_MIN}:`
						}
						</div>
						<div>
						{
							rowData[name].min
						}
						</div>
					</div>
					<div className={classes.divRow}>
						<div style={{ fontWeight: 'bold', marginRight: 5 }}>
						{
							`${TEXT.REWARD_TABLE_HEADER_MAX}:`
						}
						</div>
						<div>
						{
							rowData[name].max
						}
						</div>
					</div>
				</div>
			</div>
		)
	}

	renderRequirementColumn = (rowData) => 
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.divRow, classes.justifyStart)}>		
				<div className={clsx(classes.divColumn, classes.alignStart)}>
					{
						_.map(Object.keys(rowData.requirement),data =>{
							return (
								<div className={classes.divRow} key={data}>
									<div style={{ fontWeight: 'bold', marginRight: 10 }}>
									{
										`${data}:`
									}
									</div>
									<div>
									{
										rowData.requirement[data]
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

	renderChipRequirementColumn = (requirement,NUMBER_CHIPS = 2) =>
	{
		const { classes } = this.props
		
		const chips = requirement.slice(0, NUMBER_CHIPS)
		const hidden = (requirement.length - chips.length > 0)
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
				options={requirement}
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
										label={`+${requirement.length - chips.length}`}
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

	renderItemColumn = (items, data) =>
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.divRow, classes.alignCenter,classes.justifyCenter)}>
				<div className={clsx(classes.divColumn, classes.alignCenter)}>
				{
					_.map(items, (item,index) => (
						<div className={classes.divRow} key={index}>
							<div style={{ fontWeight: 'bold', marginRight: 10 }}>
							{
								item
							}
							</div>
							<div>
							{
								data[item]
							}
							</div>
						</div>
					))
				}
				</div>
			</div>
		)
	}

	renderCardsColumn = (cards,NUMBER_CHIPS = 1) =>
	{
		cards = _.map(cards,(card,index)=>({name:card,item:index}))
		const { classes } = this.props
		const chips = cards.slice(0, NUMBER_CHIPS)
		const hidden = (cards.length - chips.length > 0)
		let isOpen = false;

		return (
			<Autocomplete
				fullWidth
				multiple
				disableClearable
				filterSelectedOptions
				limitTags={NUMBER_CHIPS}
				size={'small'}
				value={chips}
				options={cards}
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
				getOptionLabel={(option)=>option.name}
				renderTags={(value, getTagProps) =>
					{
						return (
								<div  className={clsx(classes.divRow, classes.justifyBetween,classes.alignCenter)}>
									{
										value.map((option, index) => (
											<Chip
												key={index}
												variant={'outlined'}
												style={{marginRight: 5}}
												size={'small'} 
												label={option.name}
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
													label={`+${cards.length - chips.length}`}
												/>
											</div>
											:
											<div style={{ minWidth: 30}}/>
										)
									}
								</div>
							)
					}	
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

	renderTypesTable = () =>
	{
		const {rewardTypes, classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.TABLE_HEADER_NAME, field: 'name', width: 250,
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_DESCRIPTION, field: 'description', width: 250,
                        },
						{
                            title: () => this.renderStatusTitleColumn(),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.status, columnDef)
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_REQUIREMENTS,
                            field: 'requirement', 
							width: 350,
							render: (rowData) => this.renderChipRequirementColumn(rowData.requirement)
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
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.REWARD_TOOLTIP_EDIT_TYPE),
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.REWARD_TOOLTIP_DELETE_TYPE),
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.REWARD_TOOLTIP_RESTORE_TYPE),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={rewardTypes || []}

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

	renderItemsTable = () =>
	{
		const {rewardItems, classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.TABLE_HEADER_NAME, field: 'name', width: 250,
                        },
						{
                            title: TEXT.TABLE_HEADER_TYPE, field: 'type', width: 250,
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_GIFTABLE, field: 'giftable', width: 150,
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_DESCRIPTION, field: 'description', width: 250,
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
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', width: 150,
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'deletedAt'),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('item_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.REWARD_TOOLTIP_EDIT_ITEM),
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
								this.handleAction('item_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.REWARD_TOOLTIP_DELETE_ITEM),
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
								this.handleAction('item_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.REWARD_TOOLTIP_RESTORE_ITEM),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={rewardItems || []}

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

	renderPacksTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.TABLE_HEADER_NAME, field: 'name', width: 250,
                        },
						{
                            title: TEXT.TABLE_HEADER_ITEM, field: 'item', width: 250,
                        },
						{
                            title: () => this.renderStatusTitleColumn(),
							filtering: false,
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.status, columnDef)
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_CHANCE_PERCENTAGE, 
							field: 'chancePercentage',
							filtering: false,
							width: 300
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_QUANTITY, 
							field: 'quantity',
							filtering: false,
							width: 250,
							render: rowData => this.renderMinMaxColumn(rowData,'quantity'),
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_BUSINESS_LEVEL, 
							field: 'businessLevel',
							filtering: false,
							width: 250,
							render: rowData => this.renderMinMaxColumn(rowData,'businessLevel'),
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, 
							placeholder: TEXT.TABLE_HEADER_CREATED_DATE, 
							field: 'createdAt', width: 260,
							filtering: false,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'createdAt'),
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							field: 'modifiedAt', hidden: true,
							filtering: false,
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'modifiedAt'),
						},
						{
                            title: TEXT.TABLE_HEADER_OWNER, 
							placeholder: TEXT.TABLE_HEADER_CREATED_BY, 
							field: 'createdBy', width: 350,
							filtering: false,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, 
							field: 'modifiedBy',
							filtering: false, 
							hidden: true,
                        },
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', width: 200,
							type: 'boolean',
							filterPlaceholder: TEXT.TABLE_HEADER_IGNORE_DELETE,
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'deletedAt'),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('pack_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.REWARD_TOOLTIP_EDIT_ITEM),
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
								this.handleAction('pack_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.REWARD_TOOLTIP_DELETE_ITEM),
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
								this.handleAction('pack_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.REWARD_TOOLTIP_RESTORE_ITEM),
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
						
						let reward_pack_data = _.reduce(filters, (reward_pack_data, filter) =>
						{
							return {...reward_pack_data, [filter.column.field]: filter.value}
						}, {})

						reward_pack_data = {
							...REWARD_PACK_DATA,
							...reward_pack_data, 
							page: page + 1, 
							pageSize
						}

						return new Promise((resolve) =>
						{
							this.props.SetLoading('')
							API.RewardPackLoad(reward_pack_data)
							.then(result =>
							{
								resolve({
									data: result.items,
									page: _.isEmpty(result.items) ? 0 : result.pagination.page - 1,
									totalCount: result.pagination.totalItems,
								})

								this.props.SetProps([{ key: 'STATUSES', value: result.STATUSES }])
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
						sorting: true,
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
                />
            </div>		
		)
	}

	renderSettingsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.TABLE_HEADER_TYPE, field: 'type', width: 250,
                        },
						{
                            title: TEXT.TABLE_HEADER_ITEM, field: 'item', width: 250,
                        },
						{
                            title: () => this.renderStatusTitleColumn(),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.status, columnDef)
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_QUANTITY, field: 'quantity', filtering: false, width: 150,
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_REQUIREMENT, 
							field: 'requirement',
							filtering: false, 
							width: 250,
							render: rowData => this.renderRequirementColumn(rowData)
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_CHANCE_PERCENTAGE, 
							field: 'chancePercentage',
							filtering: false,
							width: 150
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_STADIUM_LEVEL, 
							field: 'stadiumLevel',
							filtering: false,
							width: 150,
							render: rowData => this.renderMinMaxColumn(rowData,'stadiumLevel'),
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, 
							placeholder: TEXT.TABLE_HEADER_CREATED_DATE, 
							field: 'createdAt', width: 250,
							filtering: false,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'createdAt'),
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							field: 'modifiedAt', hidden: true,
							filtering: false,
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'modifiedAt'),
						},
						{
                            title: TEXT.TABLE_HEADER_OWNER, 
							placeholder: TEXT.TABLE_HEADER_CREATED_BY, 
							field: 'createdBy', width: 350,
							filtering: false,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, 
							field: 'modifiedBy',
							filtering: false, 
							hidden: true,
                        },
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', width: 200,
							type: 'boolean',
							filterPlaceholder: TEXT.TABLE_HEADER_IGNORE_DELETE,
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'deletedAt'),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('setting_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.REWARD_TOOLTIP_EDIT_ITEM),
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
								this.handleAction('setting_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.REWARD_TOOLTIP_DELETE_ITEM),
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
								this.handleAction('setting_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.REWARD_TOOLTIP_RESTORE_ITEM),
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
						let reward_setting_data = _.reduce(filters, (reward_setting_data, filter) =>
						{
							return {...reward_setting_data, [filter.column.field]: filter.value}
						}, {})

						reward_setting_data = {
							...REWARD_SETTING_DATA,
							...reward_setting_data,
							page: page + 1, 
							pageSize
						}

						return new Promise((resolve) =>
						{
							this.props.SetLoading('')
							API.RewardSettingLoad(reward_setting_data)
							.then(result =>
							{
								resolve({
									data: result.items,
									page: _.isEmpty(result.items) ? 0 : result.pagination.page - 1,
									totalCount: result.pagination.totalItems,
								})

								this.props.SetProps([{ key: 'STATUSES', value: result.STATUSES }])
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
                />
            </div>		
		)
	}

	renderRewardsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderSearchBar()}
                <CmsTable
                    columns={[
						{
                            title: TEXT.REWARD_TABLE_HEADER_PROFILE_ID, field: 'profileId', width: 200,
							filtering: false,
							render: rowData =>
                            {
								return (
									<div style={{ marginLeft: 10, marginRight: 10, wordWrap: 'break-word' }}>
										{rowData.profileId}
									</div>
								)
							}	
                        },
						{
                            title: TEXT.TABLE_HEADER_TYPE, field: 'type', width: 200,
							filterComponent: ({ columnDef, onFilterChanged }) => (
								<Autocomplete
									autoComplete
									autoSelect
									filterSelectedOptions
									value={this.state.selectedFilter || ''}
									options={this.props.TYPES || []}
									onChange={(evt, value) => {
										this.handleAction('selectedFilter', value)(evt)
										onFilterChanged(columnDef.tableData.id, value)
									}}
									renderInput={(params) => (
										<TextField {...params}
											variant="standard"
										/>
									)}
									classes={{
										root: classes.autoComplete,
										input: classes.autoCompleteInput,
										inputRoot: classes.autoCompleteInputRoot
									}}
								/>
							),
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_RECEIVED, field: 'received', width: 200,
							type: 'boolean',
							filterPlaceholder: TEXT.REWARD_TABLE_HEADER_AVAILABLE_ONLY,
							render: rowData => this.renderSingleDateColumn(rowData.received),
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_PACKAGE, field: 'package', width: 150,
							filtering: false,
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_ITEMS, 
							field: 'items', 
							filtering: false, width: 150,
							render: rowData => this.renderItemColumn(Object.keys(rowData.items),rowData.items)
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_CARDS, 
							field: 'cards', 
							filtering: false, width: 350,
							render: rowData => this.renderCardsColumn(rowData.cards)
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_REMAINING_ITEMS, 
							field: 'remainings', 
							filtering: false, width: 150,
							render: rowData => this.renderItemColumn(Object.keys(rowData.remainings?.items || {}),rowData.items)
                        },
						{
                            title: TEXT.REWARD_TABLE_HEADER_REMAINING_CARDS, 
							field: 'remainings', 
							filtering: false, width: 350,
							render: rowData => this.renderCardsColumn(rowData.remainings?.cards || [])
                        },
						{
                            title: TEXT.TABLE_HEADER_DATE, 
							placeholder: TEXT.TABLE_HEADER_CREATED_DATE, 
							field: 'createdAt', width: 260,
							filtering: false,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'createdAt'),
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							field: 'modifiedAt', hidden: true,
							filtering: false,
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'modifiedAt'),
						},
						{
                            title: TEXT.TABLE_HEADER_OWNER, 
							placeholder: TEXT.TABLE_HEADER_CREATED_BY, 
							field: 'createdBy', width: 350,
							filtering: false,
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
							filtering: false,
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'deletedAt'),
                        },
                    ]}

					data={query =>
					{
						const { filters, page, pageSize } = query
						
						let reward_data = _.reduce(filters, (reward_data, filter) =>
						{
							return {...reward_data, [filter.column.field]: filter.value}
						}, {})

						reward_data = {
							profileId: _.isEmpty(this.searchText) ? 'profileId' : this.searchText,
							...REWARD_DATA,
							...reward_data, 
							type: _.isEmpty(this.state.selectedFilter) ? '' : this.state.selectedFilter,
							page: page + 1, 
							pageSize
						}

						return new Promise((resolve) =>
						{
							this.props.SetLoading('')
							API.RewardLoad(reward_data)
							.then(result =>
							{
								resolve({
									data: result.items,
									page: _.isEmpty(result.items) ? 0 : result.pagination.page - 1,
									totalCount: result.pagination.totalItems,
								})

								this.props.SetProps([{ key: 'TYPES', value: result.TYPES }])
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

					onRowsPerPageChange={(pageSize) =>
					{
						this.handleAction('pageSize', pageSize)(null)
					}}

					options={{
						actionsColumnIndex: -1,
						/* fixedColumns: {
							left: 2,
							right: 1
						}, */
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

					ignoredRender={this.state.isDialogOpen || this.state.isImportOpen || this.state.isExportOpen}

					tableRef={this.tableRef}
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
					this.state.dialogType === 'reward_import' && `${TEXT.BUTTON_IMPORT} ${TEXT.REWARD_TABLE_TAB_REWARD}` ||

					this.state.dialogType === 'gift_send' && TEXT.REWARD_BUTTON_SEND_GIFT ||

                    this.state.dialogType === 'type_add' && TEXT.REWARD_TITLE_NEW_TYPE ||
                    this.state.dialogType === 'type_edit' && TEXT.REWARD_TITLE_EDIT_TYPE ||
                    this.state.dialogType === 'type_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'type_restore' && TEXT.REMIND_TITLE ||

					this.state.dialogType === 'item_add' && TEXT.REWARD_TITLE_NEW_ITEM ||
                    this.state.dialogType === 'item_edit' && TEXT.REWARD_TITLE_EDIT_ITEM ||
                    this.state.dialogType === 'item_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'item_restore' && TEXT.REMIND_TITLE ||

					this.state.dialogType === 'pack_add' && TEXT.REWARD_TITLE_NEW_PACK ||
                    this.state.dialogType === 'pack_edit' && TEXT.REWARD_TITLE_EDIT_PACK ||
                    this.state.dialogType === 'pack_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'pack_restore' && TEXT.REMIND_TITLE ||
                    
					this.state.dialogType === 'setting_add' && TEXT.REWARD_TITLE_NEW_SETTING ||
                    this.state.dialogType === 'setting_edit' && TEXT.REWARD_TITLE_EDIT_SETTING ||
                    this.state.dialogType === 'setting_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'setting_restore' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit()}
			>
			{
				(this.state.dialogType === 'type_delete' || this.state.dialogType === 'type_restore') && this.renderDeleteRestoreTypes()
			}
			{
				(this.state.dialogType === 'type_add' || this.state.dialogType === 'type_edit') && this.renderAddEditTypes()
			}

			{
				(this.state.dialogType === 'item_delete' || this.state.dialogType === 'item_restore') && this.renderDeleteRestoreItems()
			}
			{
				(this.state.dialogType === 'item_add' || this.state.dialogType === 'item_edit') && this.renderAddEditItems()
			}
			{
				(this.state.dialogType === 'pack_delete' || this.state.dialogType === 'pack_restore') && this.renderDeleteRestorePacks()
			}
			{
				(this.state.dialogType === 'pack_add' || this.state.dialogType === 'pack_edit') && this.renderAddEditPacks()
			}
			{
				(this.state.dialogType === 'setting_delete' || this.state.dialogType === 'setting_restore') && this.renderDeleteRestoreSettings()
			}
			{
				(this.state.dialogType === 'setting_add' || this.state.dialogType === 'setting_edit') && this.renderAddEditSettings()
			}
			{
				this.state.dialogType === 'reward_import' && this.renderImportReward()
			}
			{
				this.state.dialogType === 'gift_send' && this.renderSendGift()
			}
			</ModalDialog>
		)
	}

	validateSubmit = () =>
	{
		const { tableTab, rowData, dialogType } = this.state

		if (dialogType === 'reward_import')
		{
			return _.isEmpty(rowData.file)
		}

		switch(tableTab)
		{
			case 0:
				return (
					(!!rowData.fromExcel ? _.isEmpty(rowData.file) : _.isEmpty(rowData.profileId))
					|| _.isEmpty(rowData.gifts)
					|| !Utils.isJSON(rowData.extraInfo)
				)
			case 1:
				return (
					_.isEmpty(rowData.name)
					|| _.isEmpty(rowData.description)
					|| (
						rowData.requirement.length > 0 
						&& _.uniq(rowData.requirement).length !== rowData.requirement.length	
					)
					|| _.isEmpty(rowData.status)
				)
			case 2:
				return (
					_.isEmpty(rowData.name)
					|| _.isEmpty(rowData.description)
					|| _.isEmpty(rowData.type)
					|| _.isEmpty(rowData.status)
				)
			case 3:
				return (
					_.isEmpty(rowData.name)
					|| _.isEmpty(rowData.item)
					|| _.isEmpty(rowData.status)
					|| isNaN(rowData.chancePercentage)
					|| isNaN(rowData.quantity.min)
					|| isNaN(rowData.quantity.max)
					|| isNaN(rowData.businessLevel.min)
					|| isNaN(rowData.businessLevel.max)	
				)	
			case 4:
				return (
					_.isEmpty(rowData.type)
					|| _.isEmpty(rowData.item)
					|| _.isEmpty(rowData.status)
					|| _.isEmpty(rowData.quantity)
					|| isNaN(rowData.chancePercentage)
					|| isNaN(rowData.stadiumLevel.min)
					|| isNaN(rowData.stadiumLevel.max)	
					|| (
						Object.keys(rowData.requirement).length > 0
						&& _.some(
							Object.keys(rowData.requirement),
							data => rowData.requirement[data] === "" || _.isNil(rowData.requirement[data]))
					)	
				)	
				
			default:
				return true
		}
	}

	renderAddEditTypes = () =>
	{
		const { classes , STATUSES } = this.props;
	
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
						disabled={this.state.dialogType === 'type_edit'}
					/>
					
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.REWARD_TABLE_HEADER_DESCRIPTION}</Typography>
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
				<div className={clsx(classes.justifyBetween,classes.alignCenter,classes.divRow)} style={{marginBottom:'10px'}}>
					<div className={clsx(classes.divRow)}> 
						<Typography>{TEXT.REWARD_TABLE_HEADER_REQUIREMENTS}
						</Typography>
					</div>
					<div className={clsx(classes.divRow)}> 
						<Button
							variant='outlined'
							color={'default'}
							className={classes.buttonAdd}
							startIcon={<Icons.IconAdd />}
							onClick={this.handleAction('addRequirement')}
						>
							{TEXT.REWARD_BUTTON_ADD_REQUIREMENT}
						</Button> 
					</div>
				</div>	
				<Divider/>
				<div className={clsx(classes.divColumn,classes.rewardRequirement)}>
					{
						_.map(this.state.rowData.requirement, (data,index) => 
						{
							return (
								<div className={clsx(classes.justifyBetween,classes.alignCenter,classes.divRow)} key={index}>
									<TextField
										className={clsx(classes.inputTextField, classes.inputText)}
										value={data || ''}
										margin="normal"
										label={TEXT.REWARD_TABLE_HEADER_REQUIREMENT}
										fullWidth
										variant={'outlined'}
										onChange={(evt) => { this.handleAction('requirement', evt.target.value, index)(evt) }}
									/>
							
									<IconButton
										onClick={this.handleAction('removeRequirement', '', index )}
										style={{marginBottom:'10px'}}
									>
										<Icons.IconRemove/>	
									</IconButton>					
								</div>
							)
						}) 
					}
				</div>
				{
					_.uniq(this.state.rowData.requirement).length !== this.state.rowData?.requirement.length
					&& (
						<div className={clsx(classes.divColumn)}>
							<div className={clsx(classes.alignCenter,classes.divRow)}>
								<WarningRounded className={classes.warningIcon} fontSize={'large'} />
								<Typography>{TEXT.REWARD_WARNING_DUPLICATE_REQUIREMENT}</Typography>
							</div>
						</div>
					)
				}
				
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
						this.state.dialogType === 'type_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.REWARD_MESSAGE_DELETE_TYPES, this.state.rowData.length) : TEXT.REWARD_MESSAGE_DELETE_TYPE) ||
						this.state.dialogType === 'type_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.REWARD_MESSAGE_RESTORE_TYPES, this.state.rowData.length) : TEXT.REWARD_MESSAGE_RESTORE_TYPE) ||
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
									{`${data.name} - ${data.status}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.status}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderAddEditItems = () =>
	{
		const { classes , STATUSES, TYPES } = this.props;
	
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
						disabled={this.state.dialogType === 'item_edit'}
					/>
					
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.REWARD_TABLE_HEADER_DESCRIPTION}</Typography>
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
					<Typography>{TEXT.TABLE_HEADER_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.type}
						options={TYPES || []}
						onChange={(evt, value) => {
							this.setState({
								rowData: {
									...this.state.rowData, 
									type: value,
									giftable: value === TYPES[1] /* 'Package' */ ? false : this.state.rowData.giftable,
								}
							})
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
					<FormControlLabel
						control={
							<Checkbox
								color={'primary'}
								checked={this.state.rowData.giftable || false}
								onChange={(evt, checked) => {
									this.handleAction('giftable', checked)(evt)
								}}
								disabled={this.state.rowData.type === TYPES[1] /* 'Package' */}
							/>
						}
						label={TEXT.REWARD_TABLE_HEADER_GIFTABLE}
						labelPlacement={'end'}
					/>
				</div>
			</div>
		)
	}

	renderDeleteRestoreItems = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'item_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.REWARD_MESSAGE_DELETE_ITEMS, this.state.rowData.length) : TEXT.REWARD_MESSAGE_DELETE_ITEM) ||
						this.state.dialogType === 'item_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.REWARD_MESSAGE_RESTORE_ITEMS, this.state.rowData.length) : TEXT.REWARD_MESSAGE_RESTORE_ITEM) ||
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

	renderAddEditPacks = () =>
	{
		const { classes, STATUSES } = this.props;
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.TABLE_HEADER_NAME}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.name}
						options={this.duplicatedItemsNamePackage || []}
						onChange={(evt, value) => {
							this.handleAction('name', value)(evt)
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
					<Typography>{TEXT.TABLE_HEADER_ITEM}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.item}
						options={this.duplicatedItemsNameSingle || []}
						onChange={(evt, value) => {
							this.handleAction('item', value)(evt)
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
					<Typography>{TEXT.REWARD_TABLE_HEADER_CHANCE_PERCENTAGE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={+this.state.rowData.chancePercentage}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('chancePercentage', evt.target.value)(evt) }}
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
					<Typography>{TEXT.REWARD_TABLE_HEADER_QUANTITY}</Typography>
					<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
						<TextField
							className={clsx(classes.inputTextField, classes.marginRight)}
							value={+this.state.rowData.quantity.min}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('min', evt.target.value, 'quantity')(evt) }}
							label={TEXT.REWARD_TABLE_HEADER_MIN}
						/>
						<TextField
							className={clsx(classes.inputTextField)}
							value={+this.state.rowData.quantity.max}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('max', evt.target.value, 'quantity')(evt) }}
							label={TEXT.REWARD_TABLE_HEADER_MAX}
						/>
					</div>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.REWARD_TABLE_HEADER_BUSINESS_LEVEL}</Typography>
					<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
						<TextField
							className={clsx(classes.inputTextField, classes.marginRight)}
							value={+this.state.rowData.businessLevel.min}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('min', evt.target.value, 'businessLevel')(evt) }}
							label={TEXT.REWARD_TABLE_HEADER_MIN}
						/>
						<TextField
							className={clsx(classes.inputTextField)}
							value={+this.state.rowData.businessLevel.max}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('max', evt.target.value, 'businessLevel')(evt) }}
							label={TEXT.REWARD_TABLE_HEADER_MAX}
						/>
					</div>
				</div>
				
			</div>
		)
	}

	renderDeleteRestorePacks = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'pack_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.REWARD_MESSAGE_DELETE_PACKS, this.state.rowData.length) : TEXT.REWARD_MESSAGE_DELETE_PACK) ||
						this.state.dialogType === 'pack_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.REWARD_MESSAGE_RESTORE_PACKS, this.state.rowData.length) : TEXT.REWARD_MESSAGE_RESTORE_PACK) ||
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
									{`${data.name} - ${data.item} - ${data.status}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.item} - ${this.state.rowData.status}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderImportReward = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<Typography>{TEXT.REWARD_REWARD_FILE}</Typography>
				<CmsInputFile 
					name={'file'}
					value={this.state.rowData.file || []} 
					onChange={(file) => { this.handleAction('file', file)(null) }} 
					acceptFile={'.xlsx'}
				/>
			</div>
		)
	}

	renderAddEditSettings = () =>
	{
		const { classes, STATUSES, rewardTypes} = this.props;
		let initType = _.find(rewardTypes, ({name}) => name === this.state.rowData.type);
		let requirement = _.map(initType?.requirement || [], requirement => ({requirement:requirement}))
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.TABLE_HEADER_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.type}
						options={this.duplicatedTypesName || []}
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
					<Typography>{TEXT.TABLE_HEADER_ITEM}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.item}
						options={this.duplicatedItemsName || []}
						onChange={(evt, value) => {
							this.handleAction('item', value)(evt)
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
					<Typography>{TEXT.REWARD_TABLE_HEADER_REQUIREMENT}</Typography>
					{
						requirement 
						&& 
						_.map(requirement, ({requirement},index) =>
						(
							<TextField
								key={index}
								className={clsx(classes.inputTextField, classes.inputText)}
								value={this.state.rowData.requirement[requirement] || ''}
								style={{marginTop:'10px'}}
								margin="normal"
								fullWidth
								variant={'outlined'}
								label={requirement}
								onChange={(evt) => { this.handleAction('requirement', evt.target.value, requirement)(evt) }}
							/>	
						))	
					}		
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.REWARD_TABLE_HEADER_CHANCE_PERCENTAGE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={+this.state.rowData.chancePercentage}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('chancePercentage', evt.target.value)(evt) }}
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
					<Typography>{TEXT.REWARD_TABLE_HEADER_QUANTITY}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.marginRight)}
						value={this.state.rowData.quantity}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('quantity', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.REWARD_TABLE_HEADER_STADIUM_LEVEL}</Typography>
					<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
						<TextField
							className={clsx(classes.inputTextField, classes.marginRight)}
							value={+this.state.rowData.stadiumLevel.min}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('min', evt.target.value, 'stadiumLevel')(evt) }}
							label={TEXT.REWARD_TABLE_HEADER_MIN}
						/>
						<TextField
							className={clsx(classes.inputTextField)}
							value={+this.state.rowData.stadiumLevel.max}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('max', evt.target.value, 'stadiumLevel')(evt) }}
							label={TEXT.REWARD_TABLE_HEADER_MAX}
						/>
					</div>
				</div>
				
			</div>
		)
	}

	renderDeleteRestoreSettings = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'setting_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.REWARD_MESSAGE_DELETE_SETTINGS, this.state.rowData.length) : TEXT.REWARD_MESSAGE_DELETE_SETTING) ||
						this.state.dialogType === 'setting_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.REWARD_MESSAGE_DELETE_SETTINGS, this.state.rowData.length) : TEXT.REWARD_MESSAGE_RESTORE_SETTING) ||
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
									{`${data.type} - ${data.item} - ${data.status}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.type} - ${this.state.rowData.item} - ${this.state.rowData.status}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderSendGift = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.table, classes.divColumn)}>
				<div className={clsx(classes.divColumn)}>
						<Typography>{TEXT.REWARD_TABLE_HEADER_ITEMS}</Typography>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.marginTop)}>
							<div className={clsx(classes.divRow)}>
								<Autocomplete
									autoComplete
									autoSelect
									filterSelectedOptions
									value={this.state.rowData.item || ''}
									options={this.singleItems}
									onChange={(evt, value) => {
										this.handleAction('item', value)(evt)
									}}
									disableClearable={true}
									renderInput={(params) => (
										<TextField {...params}
											variant="outlined"
											label={TEXT.TABLE_HEADER_NAME}
										/>
									)}
									classes={{
										root: classes.autoComplete,
										input: classes.autoCompleteInput,
										inputRoot: classes.autoCompleteInputRoot
									}}
									fullWidth
								/>
								<TextField
									label={TEXT.REWARD_TABLE_HEADER_AMOUNT}
									className={clsx(classes.inputTextField, classes.inputText, classes.marginLeft)}
									value={this.state.rowData.itemAmount || 0}
									margin="normal"
									variant={'outlined'}
									onChange={(evt) => { this.handleAction('itemAmount', evt.target.value)(evt) }}
									fullWidth
								/>
							</div>
							<Button
								variant='outlined'
								color={'default'}
								startIcon={<Icons.IconAdd />}
								onClick={this.handleAction('add_item', '')}
								className={clsx(classes.buttonLeft)}
								disabled={this.validateGift('item')}
							>
								{TEXT.REWARD_BUTTON_ADD_ITEM}
							</Button>
						</div>
					</div>
					{
						/* _.isEmpty(this.playerCards)
						?
						<div className={clsx(classes.divColumn, classes.marginTop)}>
							<div className={clsx(classes.alignCenter,classes.divRow)}>
								<WarningRounded className={classes.warningIcon} fontSize={'large'} />
								<Typography>{TEXT.REWARD_MESSAGE_ERROR_LOAD_PLAYER_CARD}</Typography>
							</div>
						</div>
						:
						<div className={clsx(classes.divColumn)}>
							<Typography>{TEXT.REWARD_TABLE_HEADER_CARDS}</Typography>
							<div className={clsx(classes.divRow, classes.justifyBetween, classes.marginTop)}>
								<div className={clsx(classes.divRow)}>
									<Autocomplete
										autoComplete
										autoSelect
										filterSelectedOptions
										value={this.state.rowData.card || ''}
										options={this.playerCards}
										getOptionLabel={option => (option.name || '')}
										onChange={(evt, value) => {
											this.handleAction('card', value)(evt)
										}}
										disableClearable={true}
										renderInput={(params) => (
											<TextField {...params}
												variant="outlined"
												label={TEXT.TABLE_HEADER_NAME}
											/>
										)}
										classes={{
											root: classes.autoComplete,
											input: classes.autoCompleteInput,
											inputRoot: classes.autoCompleteInputRoot
										}}
										size={'small'}
										
									/>
									<TextField
										label={TEXT.REWARD_TABLE_HEADER_AMOUNT}
										className={clsx(classes.inputTextField, classes.inputText, classes.marginLeft)}
										value={this.state.rowData.cardAmount || 0}
										margin="normal"
										variant={'outlined'}
										onChange={(evt) => { this.handleAction('cardAmount', evt.target.value)(evt) }}
										fullWidth
									/>
								</div>
								<Button
									variant='outlined'
									color={'default'}
									startIcon={<Icons.IconAdd />}
									onClick={this.handleAction('add_card', '')}
									className={clsx(classes.buttonLeft)}
									disabled={this.validateGift('card')}
								>
									{TEXT.REWARD_BUTTON_ADD_CARD}
								</Button>
							</div>
						</div> */
					}
					<Typography className={clsx(classes.title)}>{TEXT.REWARD_TABLE_HEADER_GIFTS}</Typography>
					<CmsTable
						columns={[
							{
								title: TEXT.TABLE_HEADER_NAME, field: 'name', width: 101,
								render: rowData =>
								{
									return rowData.type === 'item' ? rowData.name : rowData.name.name
								}	
							},
							{
								title: TEXT.REWARD_TABLE_HEADER_AMOUNT, field: 'amount', width: 101,
							},
							{
								title: TEXT.TABLE_HEADER_TYPE, field: 'type', width: 101,
							},
							{
								title: TEXT.TABLE_HEADER_BLANK, field: 'blank', sorting: false, nofilter: true, width: 50,
								render: rowData =>
								{
									return (
										<CmsControlPermission
											control={
												<Tooltip 
													title={TEXT.REWARD_TOOLTIP_DELETE_ITEM}
													classes={{
														tooltip: classes.toolTip,
													}}
													placement={'top'}
												>
													<IconButton
														onClick={(event) => {
															this.handleAction('delete_gift', rowData)(event)
														}}
													>
														<Icons.IconRemove />
													</IconButton>
												</Tooltip>
											}
											link={''}
											attribute={''}
										/>
									)
								}
							},
						]}

						data={this.state.rowData.gifts || []}

						options={{
							actionsColumnIndex: -1,
							showTitle: false,
							search: false,
							filtering: false,
							sorting: true,
							pageSize: DIALOG_PAGE_SIZE,
							tableMaxHeight: DIALOG_TABLE_HEIGHT,
							selection: false,
							cellStyle: { ...defaultCellStyle, textAlign: 'center', height: 40 },
							headerStyle: { ...defaultHeaderStyle, textAlign: 'center', height: 40, borderTop: `1px ${defaultBorderColor} solid` },
						}}
					/>
				</div>
				<div className={clsx(classes.divColumn, classes.marginTop)}>
					<div className={clsx(classes.divRow, classes.alignCenter, classes.justifyBetween)}>
						<Typography>{TEXT.REWARD_TABLE_HEADER_PROFILE_ID}</Typography>
						<FormControlLabel
							control={
								<Checkbox
									color={'primary'}
									checked={this.state.rowData.fromExcel || false}
									onChange={(evt, checked) => {
										this.handleAction('fromExcel', checked)(evt)
									}}
								/>
							}
							label={TEXT.REWARD_TITLE_FROM_EXCEL_FILE}
							labelPlacement={'end'}
						/>
					</div>
					{
						!!this.state.rowData.fromExcel
						?
						<div className={clsx(classes.divColumn)}>
							<CmsInputFile 
								name={'file'}
								value={this.state.rowData.file || []} 
								onChange={(file) => { this.handleAction('file', file)(null) }} 
								acceptFile={'.xlsx'}
								helperText={TEXT.REWARD_TOOLTIP_SEND_GIFT_LIMIT}
							/>
						</div>
						:
						<TextField
							className={clsx(classes.inputTextField, classes.inputText)}
							value={this.state.rowData.profileId || ''}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('profileId', evt.target.value)(evt) }}
						/>	
					}
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.REWARD_TABLE_HEADER_EXTRA_INFO}</Typography>
					<TextField
						minRows={3}	
						maxRows={3}
						multiline={true}
						size={'small'}
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.extraInfo}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('extraInfo', evt.target.value)(evt) }}
						error={!Utils.isJSON(this.state.rowData.extraInfo)}
						helperText={!Utils.isJSON(this.state.rowData.extraInfo) ? TEXT.JSON_INVALID : TEXT.TABLE_HEADER_BLANK}
					/>	
				</div>
			</div>
		)
	}

}

Reward.propTypes =
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
	RewardTypeLoad: () =>
	{
		dispatch(ActionCMS.RewardTypeLoad())
	},
	RewardTypeAdd: (reward_type_data) =>
	{
		dispatch(ActionCMS.RewardTypeAdd(reward_type_data))
	},
	RewardTypeEdit: (reward_type_data, manual) =>
	{
		dispatch(ActionCMS.RewardTypeEdit(reward_type_data, manual))
	},
	RewardTypeDelete: (reward_type_data) =>
	{
		dispatch(ActionCMS.RewardTypeDelete(reward_type_data))
	},
	RewardTypeRestore: (reward_type_data) =>
	{
		dispatch(ActionCMS.RewardTypeRestore(reward_type_data))
	},
	RewardItemLoad: () =>
	{
		dispatch(ActionCMS.RewardItemLoad())
	},
	RewardItemAdd: (reward_item_data) =>
	{
		dispatch(ActionCMS.RewardItemAdd(reward_item_data))
	},
	RewardItemEdit: (reward_item_data, manual) =>
	{
		dispatch(ActionCMS.RewardItemEdit(reward_item_data, manual))
	},
	RewardItemDelete: (reward_item_data) =>
	{
		dispatch(ActionCMS.RewardItemDelete(reward_item_data))
	},
	RewardItemRestore: (reward_item_data) =>
	{
		dispatch(ActionCMS.RewardItemRestore(reward_item_data))
	},
	RewardPackLoad: (reward_pack_data) =>
	{
		dispatch(ActionCMS.RewardPackLoad(reward_pack_data))
	},
	RewardPackAdd: (reward_pack_data) =>
	{
		dispatch(ActionCMS.RewardPackAdd(reward_pack_data))
	},
	RewardPackEdit: (reward_pack_data, manual) =>
	{
		dispatch(ActionCMS.RewardPackEdit(reward_pack_data, manual))
	},
	RewardPackDelete: (reward_pack_data) =>
	{
		dispatch(ActionCMS.RewardPackDelete(reward_pack_data))
	},
	RewardPackRestore: (reward_pack_data) =>
	{
		dispatch(ActionCMS.RewardPackRestore(reward_pack_data))
	},
	RewardSettingLoad: (reward_setting_data) =>
	{
		dispatch(ActionCMS.RewardSettingLoad(reward_setting_data))
	},
	RewardSettingAdd: (reward_setting_data) =>
	{
		dispatch(ActionCMS.RewardSettingAdd(reward_setting_data))
	},
	RewardSettingEdit: (reward_setting_data) =>
	{
		dispatch(ActionCMS.RewardSettingEdit(reward_setting_data))
	},
	RewardSettingDelete: (reward_setting_data) =>
	{
		dispatch(ActionCMS.RewardSettingDelete(reward_setting_data))
	},
	RewardSettingRestore: (reward_setting_data) =>
	{
		dispatch(ActionCMS.RewardSettingRestore(reward_setting_data))
	},
	RewardLoad: (reward_data) =>
	{
		dispatch(ActionCMS.RewardLoad(reward_data))
	},
	ResourcesExport: (service) =>
	{
		dispatch(ActionCMS.ResourcesExport(service))
	},
	ResourcesImport: (service, data) =>
	{
		dispatch(ActionCMS.ResourcesImport(service, data))
	},
	PlayerCardsLoad: () =>
	{
		dispatch(ActionCMS.PlayerCardsLoad())
	},
	RewardSendGift: (reward_gift) =>
	{
		dispatch(ActionCMS.RewardSendGift(reward_gift))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle)
)(Reward);

