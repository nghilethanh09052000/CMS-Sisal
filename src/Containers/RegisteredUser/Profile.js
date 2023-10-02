import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import copy from "copy-to-clipboard"
import { saveAs } from 'file-saver'

import { Typography, Tabs, Tab, Button, TextField, Tooltip, Icon } from '@material-ui/core'
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
import CmsTabPanel from '../../Components/CmsTabPanel'
import CmsSearchV2 from '../../Components/CmsSearchV2'
import CmsInputFile from '../../Components/CmsInputFile'

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
	searchBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(2),
		marginBottom: theme.spacing(3)
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
const PAGE_SIZE_1 = 5
const TABLE_HEIGHT_1 = 500
const FULLTIME_FORMAT = 'MMM DD YYYY HH:mm'

class Profile extends React.Component
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

		this.tableRef = React.createRef()
		this.selectedRows = []
		this.searchText = {}
		this.actionsExtend = {
			createElement: (parentProps) =>
			{
				const { classes } = this.props

				const columns = this.getExcelColumns()
				const importColumns = this.getImportColumns()

				// Use "API" instead of Redux, as I don't want to refresh render
				// Use "bind" because of these functions will be pass as component property
				// to fixed: "this" keyword is undefined

				const apiAdd = API.ProfileUserXPConfigsAdd.bind(API)
				const apiUpdate = API.ProfileUserXPConfigsEdit.bind(API)
				const apiDelete = API.ProfileUserXPConfigsDelete.bind(API)

				return (
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<div className={clsx(classes.divRow)}>
							{
								this.state.tableTab === 1 &&
								<>
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
										fileNameExtend={`/${TEXT.PROFILE_USER_XP_CONFIG_TITLE}`}
									/>
								</>
							}
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
												onClick={this.handleAction('xp_config_restore')}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.RefreshIcon/>}
											>
												{ TEXT.PROFILE_BUTTON_RESTORE_XP_CONFIG }
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
												onClick={this.handleAction('xp_config_delete')}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconRemove/>}
											>
												{ TEXT.PROFILE_BUTTON_DELETE_XP_CONFIG }
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
												this.state.tableTab === 1 && this.handleAction('xp_config_add', {level: 0, userXp: 0, coin: 0, gem: 0}) ||
												this.state.tableTab === 2 && this.handleAction('badword_add', { file: [] })
											}
											className={clsx(classes.buttonLeft)}
											startIcon={<Icons.IconAdd/>}
										>
										{ 
											this.state.tableTab === 1 && TEXT.PROFILE_BUTTON_NEW_XP_CONFIG ||
											this.state.tableTab === 2 && TEXT.PROFILE_BUTTON_NEW_BADWORD
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

        return null; // No change to state
    }

    componentDidMount()
	{
		this.props.SetTitle(TEXT.PROFILE_MANAGEMENT_TITLE)
		// this.props.ProfileUserXPConfigsLoad()
	}

	componentWillUnmount() 
	{
		this.props.ClearProps(['profiles'])
	}

	componentDidUpdate(prevProps, prevState)
	{
		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()

			if (prevState.tableTab === 0)
			{
				this.props.ProfilesHistoryLoad(this.searchText)
			}
			if (prevState.tableTab === 1)
			{
				this.props.ProfileUserXPConfigsLoad()
			}
			else if (prevState.tableTab === 2)
			{
				if (prevState.dialogType === 'badword_download')
				{
					saveAs(new Blob([this.props.fileData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `sisal_censor_words_list_${prevState.rowData.version}.xlsx`)
					this.props.ClearProps(['fileData'])
				}
				else
				{
					this.props.ProfileBadWordsLoad()
				}
			}
		}
	}

    render()
    {
        const { classes } = this.props

		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderTableTabs()}
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
            let { createdAt, modifiedAt, deletedAt, config: { reward: { coin, gem } }, ...others} = value
            createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
			modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
			deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
            return {...others, coin, gem, createdAt, modifiedAt, deletedAt}
        })
        
        console.log('formatExcelData:', result)
		return result
	}

	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.PROFILE_TABLE_HEADER_LEVEL, field: 'level'},
			{ title: TEXT.PROFILE_TABLE_HEADER_USER_XP, field: 'userXp' },
			{ title: TEXT.PROFILE_TABLE_HEADER_COIN, field: 'coin'},
			{ title: TEXT.PROFILE_TABLE_HEADER_GEM, field: 'gem' },
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
			{ title: TEXT.PROFILE_TABLE_HEADER_LEVEL, field: 'level'},
			{ title: TEXT.PROFILE_TABLE_HEADER_USER_XP, field: 'userXp' },
			{ title: TEXT.PROFILE_TABLE_HEADER_COIN, field: 'coin'},
			{ title: TEXT.PROFILE_TABLE_HEADER_GEM, field: 'gem' },
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
			case 'level': 
				data = rawData
				if (isNaN(data) || data <= 0)
				{
					throw new Error(`Can not parse ${column}: ${rawData} at row ${rowData[DEBUG_FIELD]}`)
				}

				break
			case 'userXp':
			case 'coin':
			case 'gem':		   
				data = rawData
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
			this.props.ProfileUserXPConfigsLoad()
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
						this.state.dialogType === 'xp_config_delete' && this.props.ProfileUserXPConfigsDelete(row) ||
						this.state.dialogType === 'xp_config_restore' && this.props.ProfileUserXPConfigsRestore(row)
					})
				}
				else
				{
					this.state.dialogType === 'xp_config_add' && this.props.ProfileUserXPConfigsAdd(this.state.rowData) ||
					this.state.dialogType === 'xp_config_edit' && this.props.ProfileUserXPConfigsEdit(this.state.rowData) ||
					this.state.dialogType === 'xp_config_delete' && this.props.ProfileUserXPConfigsDelete(this.state.rowData) ||
					this.state.dialogType === 'xp_config_restore' && this.props.ProfileUserXPConfigsRestore(this.state.rowData) ||

					this.state.dialogType === 'badword_add' && this.props.ProfileBadWordAdd(this.state.rowData) ||

					this.state.dialogType === 'user_delete' && this.props.ProfileEdit({...this.state.rowData, action: 'ban'}) ||
					this.state.dialogType === 'user_restore' && this.props.ProfileEdit({...this.state.rowData, action: 'unban'})
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
						if (this.state.tableTab === 1)
						{
							this.props.ProfileUserXPConfigsLoad()
						}
						else if (this.state.tableTab === 2)
						{
							this.props.ProfileBadWordsLoad()
						}

						this.searchText = {}
						this.props.ClearProps(['profiles'])
					}
				)

				break	
			case 'xp_config_add':
			case 'xp_config_edit':
			case 'xp_config_delete':
			case 'xp_config_restore':
			case 'badword_add':
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
			case 'badword_download':
				this.setState(
					{
						dialogType: name,
						rowData: data
					},
					() =>
					{
						this.props.ProfileBadWordGet(data)
					}
				)

				break		
            default:
                this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: _.includes(['level', 'userXp', 'coin', 'gem'], name) ? (data === '' ? 0 : (isNaN(data) ? this.state.rowData[name] : parseInt(data))) : data
					}
                })
		}		
	}

	validateSubmit = (submit_data) =>
	{
		return submit_data.level === 0
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
						<Tab label={TEXT.PROFILE_PROFILES_TITLE} />
						<Tab label={TEXT.PROFILE_USER_XP_CONFIG_TITLE}/>
						<Tab label={TEXT.PROFILE_BADWORD_TITLE} />
					</Tabs>
					{
						this.state.tableTab !== 0 && this.actionsExtend.createElement(this.actionsExtend)
					}
				</div>
				<CmsTabPanel value={this.state.tableTab} index={0} >
				{
					this.renderProfileTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={1} >
				{
					this.renderUserXPConfigsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={2} >
				{
					this.renderBadWordsTable()
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
                    this.state.dialogType === 'xp_config_add' && TEXT.PROFILE_BUTTON_NEW_XP_CONFIG ||
                    this.state.dialogType === 'xp_config_edit' && TEXT.PROFILE_BUTTON_EDIT_XP_CONFIG ||
                    this.state.dialogType === 'xp_config_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'xp_config_restore' && TEXT.REMIND_TITLE ||

					this.state.dialogType === 'badword_add' && TEXT.PROFILE_BUTTON_NEW_BADWORD ||

					this.state.dialogType === 'user_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'user_restore' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'xp_config_delete' || this.state.dialogType === 'xp_config_restore') && this.renderDeleteRestoreXPConfig()
			}
			{
				(this.state.dialogType === 'xp_config_add' || this.state.dialogType === 'xp_config_edit') && this.renderAddEditXPConfig()
			}
			{
				this.state.dialogType === 'badword_add'  && this.renderAddBadWord()
			}
			{
				(this.state.dialogType === 'user_delete' || this.state.dialogType === 'user_restore') && this.renderBanUnbanUser()
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
						<CmsSearchV2
							textFields={[
								{
									placeholder: TEXT.USER_MANAGEMENT_TABLE_HEADER_USER_ID,
									name: 'userId'
								},
								{
									placeholder: TEXT.PROFILE_TABLE_HEADER_EMAIL,
									name: 'email'
								}
							]}
							buttonTitle={TEXT.PROFILE_BUTTON_SEARCH}
							onSearchClick={(searchText) => {
								this.searchText = searchText
								this.props.ProfilesHistoryLoad(searchText)
							}}
						/>
					</div>
				</div>
			</div>	
		)	
	}

	renderProfileTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderSearchBar()}
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
                        pageSize: PAGE_SIZE_1,
						tableMaxHeight: TABLE_HEIGHT_1,
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

					tableRef={this.tableRef}
                />
            </div>		
		)
	}

	renderBadWordsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.PROFILE_TABLE_HEADER_VERSION, field: 'version', width: 150,
                        },
						{
                            title: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 150,
                            render: rowData => this.renderSingleDateColumn(rowData.createdAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'createdAt'),
                        },
						{
                            title: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy', width: 350,
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconDownload {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('badword_download', rowData)(event)
							},
							tooltip: TEXT.PROFILE_TOOLTIP_DOWNLOAD_BADWORD_FILE,
							disabled: false,
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.badwords || []}

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

	renderAddBadWord = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<Typography>{TEXT.PROFILE_TABLE_HEADER_BADWORD_FILE}</Typography>
				<CmsInputFile 
					name={'file'}
					value={this.state.rowData.file || []} 
					onChange={(file) => { this.handleAction('file', file)(null) }} 
					acceptFile={'.xlsx'}
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

	renderDeleteRestoreXPConfig = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'xp_config_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.PROFILE_MESSAGE_DELETE_XP_CONFIGS, this.state.rowData.length) : TEXT.PROFILE_MESSAGE_DELETE_XP_CONFIG) ||
						this.state.dialogType === 'xp_config_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.PROFILE_MESSAGE_RESTORE_XP_CONFIGS, this.state.rowData.length) : TEXT.PROFILE_MESSAGE_RESTORE_XP_CONFIG) ||
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
									{`${TEXT.PROFILE_TABLE_HEADER_LEVEL}: ${data.level} - ${TEXT.PROFILE_TABLE_HEADER_USER_XP}: ${data.userXp} - ${TEXT.PROFILE_TABLE_HEADER_COIN}: ${data.coin} - ${TEXT.PROFILE_TABLE_HEADER_GEM}: ${data.gem}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${TEXT.PROFILE_TABLE_HEADER_LEVEL}: ${this.state.rowData.level} - ${TEXT.PROFILE_TABLE_HEADER_USER_XP}: ${this.state.rowData.userXp} - ${TEXT.PROFILE_TABLE_HEADER_COIN}: ${this.state.rowData.coin} - ${TEXT.PROFILE_TABLE_HEADER_GEM}: ${this.state.rowData.gem}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderAddEditXPConfig = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PROFILE_TABLE_HEADER_LEVEL}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.level || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('level', evt.target.value)(evt) }}
						helperText={TEXT.PROFILE_TOOLTIP_LEVEL}
						disabled={this.state.dialogType === 'xp_config_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PROFILE_TABLE_HEADER_USER_XP}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.userXp || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('userXp', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PROFILE_TABLE_HEADER_COIN}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.coin || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('coin', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PROFILE_TABLE_HEADER_GEM}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.gem || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('gem', evt.target.value)(evt) }}
					/>
				</div>
			</div>
		)
	}	

	renderUserXPConfigsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.PROFILE_TABLE_HEADER_LEVEL, field: 'level', width: 150,
							
                        },
						{
                            title: TEXT.PROFILE_TABLE_HEADER_USER_XP, field: 'userXp', width: 150,
							
                        },
						{
                            title: TEXT.PROFILE_TABLE_HEADER_COIN, field: 'coin', width: 150,
							render: rowData => rowData.config.reward.coin || 0
                        },
						{
                            title: TEXT.PROFILE_TABLE_HEADER_GEM, field: 'gem', width: 150,
							render: rowData => rowData.config.reward.gem || 0
							
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
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'deletedAt'),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								const { config: { reward: { coin, gem } }, ...others} = rowData
								rowData = { ...others, coin, gem }
								this.handleAction('xp_config_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.PROFILE_TOOLTIP_EDIT_XP_CONFIG),
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
								const { config: { reward: { coin, gem } }, ...others} = rowData
								rowData = { ...others, coin, gem }
								this.handleAction('xp_config_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.PROFILE_TOOLTIP_DELETE_XP_CONFIG),
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
								const { config: { reward: { coin, gem } }, ...others} = rowData
								rowData = { ...others, coin, gem }
								this.handleAction('xp_config_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.PROFILE_TOOLTIP_RESTORE_XP_CONFIG),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.userXPConfigs || []}

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
}

Profile.propTypes =
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
	ProfileUserXPConfigsLoad: () =>
	{
		dispatch(ActionCMS.ProfileUserXPConfigsLoad())
	},
	ProfileUserXPConfigsAdd: (profile_data) =>
	{
		dispatch(ActionCMS.ProfileUserXPConfigsAdd(profile_data))
	},
	ProfileUserXPConfigsEdit: (profile_data) =>
	{
		dispatch(ActionCMS.ProfileUserXPConfigsEdit(profile_data))
	},
	ProfileUserXPConfigsDelete: (profile_data) =>
	{
		dispatch(ActionCMS.ProfileUserXPConfigsDelete(profile_data))
	},
	ProfileUserXPConfigsRestore: (profile_data) =>
	{
		dispatch(ActionCMS.ProfileUserXPConfigsRestore(profile_data))
	},
	ProfilesHistoryLoad: (profile_data) =>
	{
		dispatch(ActionCMS.ProfilesHistoryLoad(profile_data))
	},
	ProfileEdit: (profile_data) =>
	{
		dispatch(ActionCMS.ProfileEdit(profile_data))
	},
	ProfileBadWordsLoad: () =>
	{
		dispatch(ActionCMS.ProfileBadWordsLoad())
	},
	ProfileBadWordAdd: (profile_data) =>
	{
		dispatch(ActionCMS.ProfileBadWordAdd(profile_data))
	},
	ProfileBadWordGet: (profile_data) =>
	{
		dispatch(ActionCMS.ProfileBadWordGet(profile_data))
	},
	ShowMessage: (msg) =>
    {
        dispatch(ActionCMS.ShowMessage(msg))
    },
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(Profile);

