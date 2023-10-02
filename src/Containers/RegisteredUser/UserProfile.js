import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import copy from "copy-to-clipboard"
// import { saveAs } from 'file-saver'

import { Typography, Tabs, Tab, Button, TextField, Tooltip, Icon, Chip, FormControlLabel, Checkbox, IconButton } from '@material-ui/core'
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
// import CmsExcel from '../../Components/CmsExcel'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsTabPanel from '../../Components/CmsTabPanel'
import CmsInputFile from '../../Components/CmsInputFile'
import CmsDate from '../../Components/CmsDate'
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
	inputText: {
		marginTop: 0,
	},
	divMaxHeight: {
		maxHeight: '20vh',
		overflowY: 'auto'
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
	searchBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(2),
		marginBottom: theme.spacing(1)
	},
	cmsDate: {
		marginRight: theme.spacing(1),
	},
})

const defaultBorderColor = '#D6D6D6'

const defaultBorderStyle = {
	borderLeft: `1px ${defaultBorderColor} solid`,
}

const defaultHeaderStyle = {
	height: 40, // auto ajustment by table
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
const REWARD_DATA = { type: '', received: false }
const DIALOG_PAGE_SIZE = 5
const DIALOG_TABLE_HEIGHT = 290

class UserProfile extends React.Component
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
			tableTab: parseInt(props.match.params.action),
			profileId: 'profileId',
			searchText: '',
			pageSize: PAGE_SIZE,
		}

		this.excelRef = React.createRef()
		this.tableRef = React.createRef()
		this.playerCards = [];
		this.singleItems = [];
		this.selectedRows = []
		this.actionsExtend = {
			createElement: (parentProps) =>
			{
				const { classes } = this.props

				// const columns = this.getExcelColumns()

				return (
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<div className={clsx(classes.divRow)}>
							{/* <CmsExcel
								excelRef={this.excelRef}
								multiSheetData={this.formatExcelData}
								columns={columns}
								controlPermission={{
									link: '',
									attribute: ''
								}}
								onProgress={this.handleExportDialog}
								fileNameExtend={
									this.state.tableTab === 0 && `/${TEXT.USER_MANAGEMENT_TOOLTIP_REWARD}` ||
									this.state.tableTab === 1 && `/${TEXT.USER_MANAGEMENT_TOOLTIP_QUEST}` ||
									this.state.tableTab === 2 && `/${TEXT.USER_MANAGEMENT_TOOLTIP_CURRENCY}` ||
									''
								}
							/> */}
							{
								this.state.tableTab === 0 &&
								<CmsControlPermission
									control={
										<Button
											variant={'contained'}
											color={'primary'}
											onClick={this.handleAction('gift_send',  { profileId: this.state.profileId,  extraInfo: '{}', gifts: [], item: '', itemAmount: 0, card: {}, cardAmount: 0, fromExcel: false, file: null })}
											className={clsx(classes.buttonLeft)}
											startIcon={<Icons.IconAdd/>}
										>
										{
											TEXT.REWARD_BUTTON_SEND_GIFT
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

		this.actionsTableExtend = {
			createElement: (parentProps) =>
			{
				const { classes } = this.props

				return (
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<div className={clsx(classes.divRow)}>
								<CmsControlPermission
									control={
										<Button
											variant={'contained'}
											color={'primary'}
											onClick={this.handleAction('export_json', this.formatExportData())}
											className={clsx(classes.buttonLeft)}
											startIcon={<Icons.ExportIcon/>}
										>
											{ TEXT.INSTANT_WIN_BUTTON_EXPORT_JSON }
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
		this.props.SetTitle(`${TEXT.USER_MANAGEMENT_TITLE} | ${TEXT.PROFILE_MANAGEMENT_TITLE}`)
		this.props.ProfilesLoad({ id: '', userId: this.props.match.params.userId, email: '', search: '' })
		this.props.RewardItemLoad()
		this.props.PlayerCardsLoad()
	}

	componentWillUnmount() 
	{
		this.props.ClearProps(['profiles'])
	}

	componentDidUpdate(prevProps, prevState)
	{
		this.props !== prevProps && this.getSendGiftData()
		if (!_.isEmpty(this.props.profiles) && this.props.profiles != prevProps.profiles)
		{
			this.setState(
				{
					profileId: this.props.profiles[0]?.id || 'profileId'
				},
				() =>
				{
					this.state.tableTab === 0 && this.tableRef.current.onQueryChange({}, null) ||
					this.state.tableTab === 1 && this.props.QuestsLoad(this.state.profileId) ||
					this.state.tableTab === 2 && this.props.CurrenciesLoad(this.state.profileId)
				}
			)
		}

		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()
			
			if (prevState.dialogType === 'user_delete' || prevState.dialogType === 'user_restore')
			{
				this.props.ProfilesLoad({ id: '', userId: this.props.match.params.userId, email: '', search: '' })
			}
			else if (prevState.dialogType === 'currency_profile_edit')
			{
				this.props.CurrenciesLoad(this.state.profileId)
			}
			else if (prevState.dialogType === 'gift_send')
			{
				this.tableRef.current.onQueryChange({}, null)
			}
		}
	}

    render()
    {
        const { classes } = this.props

		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderProfileTable()}
				{this.renderTableTabs()}
				{this.renderDialog()}
			</div>
		)
    }

	/* handleExportDialog = (isOpen) =>
	{
		this.setState({
			isExportOpen: isOpen
		})
	} */

	/* formatExcelData = () =>
	{
		let result = this.props.userXPConfigs
		
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
            let { createdAt, modifiedAt, deletedAt, ...others} = value
            createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
			modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
			deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
            return {...others, createdAt, modifiedAt, deletedAt}
        })
        
        console.log('formatExcelData:', result)
		return result
	} */

	/* getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt' },
			{ title: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt' },
			{ title: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy' },
			{ title: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy' },
			{ title: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt' },
		]

		return columns
	} */

	formatExportData = () =>
	{
		let result = this.props.instantWinHistories
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
		
        // console.log('formatExportData:', result)
		return result
	}

	getSendGiftData = () =>
	{
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

	handleAction = (name, data) => (evt) =>
	{
		switch (name)
		{
			case 'user_back':
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
				/* if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						
					})
				}
				else */
				{
					this.state.dialogType === 'user_delete' && this.props.ProfileEdit({...this.state.rowData, action: 'ban'}) ||
					this.state.dialogType === 'user_restore' && this.props.ProfileEdit({...this.state.rowData, action: 'unban'}) ||
					this.state.dialogType === 'currency_profile_edit' && this.props.CurrencyProfileEdit(this.state.rowData) ||
					this.state.dialogType === 'gift_send' && this.props.RewardSendGift(this.state.rowData) ||
					this.state.tableTab === 3 && this.props.InstantWinHistoriesLoad({...this.state.rowData.search_date, userId: this.props.match.params.userId, code: data})
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
						if (this.state.tableTab === 0)
						{
							this.tableRef.current.onQueryChange({}, null)
							this.props.RewardItemLoad()
							this.props.PlayerCardsLoad()
						}
						else if (this.state.tableTab === 1)
						{
							this.props.QuestsLoad(this.state.profileId)
						}
						else if (this.state.tableTab === 2)
						{
							this.props.CurrenciesLoad(this.state.profileId)
						}
						else if (this.state.tableTab === 3)
						{
							this.props.InstantWinHistoriesLoad({...this.state.rowData.search_date, userId: this.props.match.params.userId, code: this.state.searchText})
						}
					}
				)

				break
			case 'currency_profile_edit':			
			case 'gift_send':
			case 'user_delete':
			case 'user_restore':		
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})

				break
			case 'copy_clipboard':
				copy(data)
        		this.props.ShowMessage(TEXT.MESSAGE_COPY_TO_CLIPBOARD)

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
			case 'pageSize':
			case 'selectedFilter':	
				this.setState({
					[name]: data
				})
				
				break
			case 'search_date':
				this.setState(
					{
						rowData: {
							...this.state.rowData, 
							search_date: data
						}
					},
					() =>
					{
						this.props.InstantWinHistoriesLoad({...data, userId: this.props.match.params.userId, code: this.state.searchText})
					}
				)

				break
			case 'export_json':
				const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data))}`
				const link = document.createElement("a");
				link.href = jsonString;
				link.download = "instant_win_histories.json"
				link.click();

				break				
            default:
                this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: _.includes(['itemAmount', 'cardAmount', 'quantity'], name) 
								? 
								(data === '' ? 0 : (isNaN(data) ? this.state.rowData[name] : (parseInt(data) > 2147483648 ? 0 : parseInt(data)))) 
								: 
								name === 'extraInfo' && data === '' ? '{}' : data
					}
                })
		}		
	}
	
	validateSubmit = () =>
	{
		const { tableTab, rowData } = this.state

		switch(tableTab)
		{
			case 0:
				return (
					(!!rowData.fromExcel ? _.isEmpty(rowData.file) : _.isEmpty(rowData.profileId))
					|| _.isEmpty(rowData.gifts)
					|| !Utils.isJSON(rowData.extraInfo)
				)
			case 2:
				return false
			default:
				return true
		}
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
						<Tab label={TEXT.USER_MANAGEMENT_TOOLTIP_REWARD} />
						<Tab label={TEXT.USER_MANAGEMENT_TOOLTIP_QUEST}/>
						<Tab label={TEXT.USER_MANAGEMENT_TOOLTIP_CURRENCY} />
						<Tab label={TEXT.USER_MANAGEMENT_TOOLTIP_INSTANT_WIN} />
					</Tabs>
					{
						this.actionsExtend.createElement(this.actionsExtend)
					}
				</div>
				<CmsTabPanel value={this.state.tableTab} index={0} >
				{
					this.renderRewardsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={1} >
				{
					this.renderQuestsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={2} >
				{
					this.renderCurrencysProfileTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={3} >
				{
					this.renderInstantWinHistoriesTable()
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
                    this.state.dialogType === 'gift_send' && TEXT.REWARD_BUTTON_SEND_GIFT ||

					this.state.dialogType === 'currency_profile_edit' && TEXT.CURRENCY_BUTTON_EDIT_PROFILE_CURRENCY ||

					this.state.dialogType === 'user_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'user_restore' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit()}
			>
			{
				(this.state.dialogType === 'user_delete' || this.state.dialogType === 'user_restore') && this.renderBanUnbanUser()
			}
			{
				this.state.dialogType === 'gift_send' && this.renderSendGift()
			}
			{
				this.state.dialogType === 'currency_profile_edit' && this.renderAddEditProfileCurrency()
			}
			</ModalDialog>
		)
	}

	renderGeneralTableTitle = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter, classes.generalTitle)}>
					<Typography className={clsx(classes.title)}>{TEXT.PROFILE_GENERAL_TITLE}</Typography>
					<div className={clsx(classes.divRow)}>
						<Button
							variant={'contained'}
							color={'primary'}
							onClick={this.handleAction('user_back', {})}
							className={clsx(classes.buttonLeft)}
						>
							{ TEXT.MODAL_BACK }
						</Button>
						{/* <CmsControlPermission
							control={
								<Button
									variant={'contained'}
									color={'primary'}
									onClick={this.handleAction('download_data', {})}
									className={clsx(classes.buttonLeft)}
									startIcon={<Icons.IconDownload/>}
								>
									{ TEXT.PROFILE_BUTTON_DOWNLOAD_ALL_DATA }
								</Button>
							}
							link={''}
							attribute={''}
						/> */}
					</div>
				</div>
			</div>
		)
	}

	renderProfileTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn, classes.generalTitle)}>
				{this.renderGeneralTableTitle()}
                <CmsTable
                    columns={[
						{
                            title: TEXT.USER_MANAGEMENT_TABLE_HEADER_USER_ID, field: 'userId', width: 150,
							disableClick: false,
							cellTooltip: TEXT.USER_MANAGEMENT_TOOLTIP_COPY_TO_CLIPBOARD
                        },
						{
                            title: TEXT.PROFILE_TABLE_HEADER_PROFILE_ID, field: 'id', width: 150,
							disableClick: false,
							cellTooltip: TEXT.USER_MANAGEMENT_TOOLTIP_COPY_TO_CLIPBOARD
                        },
						{
                            title: TEXT.PROFILE_TABLE_HEADER_PLAYER_NAME, field: 'playerName', width: 150,
							disableClick: true
                        },
						{
                            title: TEXT.PROFILE_TABLE_HEADER_CLUB_NAME, field: 'clubName', width: 150,
							disableClick: true
                        },
						{
                            title: TEXT.PROFILE_TABLE_HEADER_TROPHY_SCORE, field: 'trophyScore', width: 150,
							disableClick: true
                        },
						{
                            title: TEXT.PROFILE_TABLE_HEADER_USER_LEVEL, field: 'userLevel', width: 150,
							disableClick: true
                        },
						{
                            title: TEXT.PROFILE_TABLE_HEADER_USER_XP, field: 'userXp', width: 150,
							disableClick: true
                        },
						{
                            title: () => (
                                <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
                                    <span>{TEXT.TABLE_HEADER_STATUS}</span>
                                    <Tooltip 
                                        title={TEXT.PROFILE_TOOLTIP_STATUS}
                                        classes={{tooltip: classes.toolTip}}
                                        placement={'top'}
                                    >
                                        <Icon style={{ color: '#AEAEAE', marginLeft: 10 }} >help</Icon>
                                    </Tooltip>
                                </div>
                            ),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							disableClick: true
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconBanUser {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('user_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.status === 'Banned') ? '' : TEXT.PROFILE_TOOLTIP_BAN_USER),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.status === 'Banned'),
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
								this.handleAction('user_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.status !== 'Banned') ? '' : TEXT.PROFILE_TOOLTIP_UNBAN_USER),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.status !== 'Banned'),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.profiles || []}

                    options={{
						actionsColumnIndex: -1,
						fixedColumns: {
							left: 2,
							right: -100
						},
						tableStickyHeader: false,
                        showTitle: false,
                        search: false,
                        filtering: false,
						sorting: true,
                        paging: false,
                        selection: false,
						cellStyle: { ...defaultCellStyle, textAlign: 'center' },
						headerStyle: { ...defaultHeaderStyle, textAlign: 'center', borderTop: `1px ${defaultBorderColor} solid` },
                    }}

					onClickCell={(event, rowData, columnDef) =>
					{
						if (rowData.hasOwnProperty(columnDef.field))
						{
							this.handleAction('copy_clipboard', rowData[columnDef.field])(event)
						}
					}}

					ignoredRender={this.state.isExportOpen}
                />
            </div>		
		)
	}

	renderRewardsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						/* {
                            title: TEXT.PROFILE_TABLE_HEADER_PROFILE_ID, field: 'profileId', width: 150,
							filtering: false,
							render: rowData =>
                            {
								return (
									<div style={{ width: 130, marginLeft: 10, wordWrap: 'break-word' }}>
										{rowData.profileId}
									</div>
								)
							}	
                        }, */
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
                            title: TEXT.TABLE_HEADER_DATE, 
							placeholder: TEXT.TABLE_HEADER_CREATED_DATE, 
							field: 'createdAt', width: 260,
							filtering: false,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true)
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							field: 'modifiedAt', hidden: true,
							filtering: false,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true)
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
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true)
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
							profileId: this.state.profileId,
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
						// fixedColumns: {
						// 	left: 2,
						// 	right: 1
						// },
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

	renderQuestsTable = () =>
	{
		const { classes } = this.props
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						/* {
                            title: TEXT.PROFILE_TABLE_HEADER_PROFILE_ID, field: 'profileId', width: 150,
                        }, */
						{
                            title: TEXT.TABLE_HEADER_TYPE, field: 'type', width: 150,
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
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', width: 150,
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true)
                        },
			
                    ]}

                    data={this.props.quests || []}

					detailPanel={({items}) => {
							return (
								<CmsTable
									columns={[
										{
											title: TEXT.QUEST_SYSTEM_TABLE_HEADER_PROCESS, 
											field: 'process', 
											width: 100,
										},
										{
											title: TEXT.QUEST_SYSTEM_TABLE_HEADER_REROLL_SLOT, 
											field: 'rerollSlot', 
											width: 100,
										},
										{
											title: TEXT.QUEST_SYSTEM_TABLE_HEADER_IS_CLAIMED, 
											field: 'isClaimed', 
											width: 100,
										},
										{
											title: TEXT.QUEST_SYSTEM_TABLE_HEADER_REFRESH_TIME_REMAINING, 
											field: 'refreshTimeRemaining', 
											width: 100,
										}
									]}
									data={items}
									options={{
											showTitle: false,
											search: false,
											filtering: false,
											sorting: false,
											emptyRowsWhenPaging: false, 
											tableMaxHeight: 290,
											selection: false,
											cellStyle: { ...defaultCellStyle, textAlign: 'center', height: 40 },
											headerStyle: { ...defaultHeaderStyle, textAlign: 'center', height: 40, borderTop: `1px ${defaultBorderColor} solid` },
										}}
								/>
							)
						}}
                    options={{
						actionsColumnIndex: -1,
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

					ignoredRender={this.state.isExportOpen}

					tableRef={this.tableRef}
                />
            </div>		
		)
	}

	renderCurrencysProfileTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						/* {
                            title: TEXT.PROFILE_TABLE_HEADER_PROFILE_ID, field: 'profileId', width: 150,
                        }, */
						{
                            title: TEXT.CURRENCY_TABLE_HEADER_QUANTITY, field: 'quantity', width: 150,
                        },
						{
                            title: TEXT.TABLE_HEADER_TYPE, field: 'type', width: 150,
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
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', width: 150,
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true)
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
                        pageSize: PAGE_SIZE,
						tableMaxHeight: TABLE_HEIGHT,
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

	renderBanUnbanUser = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'user_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.PROFILE_MESSAGE_BAN_USERS, this.state.rowData.length) : TEXT.PROFILE_MESSAGE_BAN_USER) ||
						this.state.dialogType === 'user_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.PROFILE_MESSAGE_UNBAN_USERS, this.state.rowData.length) : TEXT.PROFILE_MESSAGE_UNBAN_USER) ||
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
									{`${data.playerName} - ${data.clubName}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.playerName} - ${this.state.rowData.clubName}`}
						</Typography>
					}
					</div>
				</div>
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

	renderAddEditProfileCurrency = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PROFILE_TABLE_HEADER_PROFILE_ID}</Typography>
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
					<Typography>{TEXT.TABLE_HEADER_TYPE}</Typography>
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
						<Typography>{TEXT.PROFILE_TABLE_HEADER_PROFILE_ID}</Typography>
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
						rows={3}	
						rowsMax={3}
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

	renderSearchBar = () =>
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.divColumn, classes.searchBar)}>
				<div className={clsx(classes.divRow, classes.divHeight, classes.alignCenter)}>
					<div className={clsx(classes.divColumn, classes.divHeight, classes.cmsDate)}>
						<CmsDate
							views={['date', 'hours', 'minutes']}
							enableFullTimeFormat={true}
							disableFuture={true} 
							raiseSubmitOnMounted={true}
							disableToolbar={false} 
							dateRange={-30}
							onDateSubmit={(data) => {
								this.handleAction('search_date', data)(null)
							}}
						/>
					</div>
					<div className={clsx(classes.divColumn, classes.divFullWidth)}>
						<CmsSearch
							searchText={this.state.searchText}
							key={'cronId'}
							onSearchClick={(searchText) => {
								this.handleAction('submit', searchText)(null)
							}}
							textFieldPlaceholder={TEXT.INSTANT_WIN_TABLE_HEADER_CODE}
						/>
					</div>
				</div>
			</div>	
		)	
	}

	renderInstantWinHistoriesTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderSearchBar()}
                <CmsTable
                    columns={[
                        {
                            title: TEXT.TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: TEXT.INSTANT_WIN_TABLE_HEADER_CODE, field: 'code', width: 150,
                        },
						{
                            title: TEXT.INSTANT_WIN_TABLE_HEADER_IS_USER_WIN, field: 'isUserWin', width: 150,
                        },
						/* {
                            title: TEXT.INSTANT_WIN_TABLE_HEADER_PROFILE_ID, field: 'profileId', filtering: false, width: 150,
                        },
						{
                            title: TEXT.INSTANT_WIN_TABLE_HEADER_USER_ID, field: 'userId', filtering: false, width: 150,
                        }, */
						{
                            title: TEXT.INSTANT_WIN_TABLE_HEADER_REQUEST_TIME, field: 'requestedTime', filtering: false, width: 150,
                            render: rowData => this.renderSingleDateColumn(rowData.requestedTime),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.requestedTime, columnDef, true),
                        },
                    ]}

                    data={this.props.instantWinHistories || []}

                    options={{
						actionsColumnIndex: -1,
						/* fixedColumns: {
							left: 1,
							right: -100
						}, */
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

					ignoredRender={this.state.isDialogOpen}

					tableRef={this.tableRef}

					actionsExtend={this.actionsTableExtend}
                />
            </div>		
		)
	}
}

UserProfile.propTypes =
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
	ShowMessage: (msg) =>
    {
        dispatch(ActionCMS.ShowMessage(msg))
    },
	ProfilesLoad: (profile_data) =>
	{
		dispatch(ActionCMS.ProfilesLoad(profile_data))
	},
	ProfileEdit: (profile_data) =>
	{
		dispatch(ActionCMS.ProfileEdit(profile_data))
	},
	PlayerCardsLoad: () =>
	{
		dispatch(ActionCMS.PlayerCardsLoad())
	},
	RewardItemLoad: () =>
	{
		dispatch(ActionCMS.RewardItemLoad())
	},
	RewardSendGift: (reward_gift) =>
	{
		dispatch(ActionCMS.RewardSendGift(reward_gift))
	},
	QuestsLoad: (profileId) =>
	{
		dispatch(ActionCMS.QuestsLoad(profileId))
	},
	CurrenciesLoad: (profileId) =>
	{
		dispatch(ActionCMS.CurrenciesLoad(profileId))
	},
	CurrencyProfileEdit: (currency_data) =>
	{
		dispatch(ActionCMS.CurrencyProfileEdit(currency_data))
	},
	InstantWinHistoriesLoad: (instant_win_data) =>
	{
		dispatch(ActionCMS.InstantWinHistoriesLoad(instant_win_data))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(UserProfile);

