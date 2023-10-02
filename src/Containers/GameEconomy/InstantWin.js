import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import { saveAs } from 'file-saver'

import { Typography, Button, TextField, Tabs, Tab } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { WarningRounded } from '@material-ui/icons'

import Utils from '../../Utils'
import TEXT from './Data/Text'
import { DEBOUCE_WAITING_TIME } from '../../Defines'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import * as Icons from '../../Components/CmsIcons'
import CmsControlPermission from '../../Components/CmsControlPermission'
import CmsTable from '../../Components/CmsTable'
import CmsInputFile from '../../Components/CmsInputFile'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsImage from '../../Components/CmsImage'
import CmsTabPanel from '../../Components/CmsTabPanel'
import CmsSearchV2 from '../../Components/CmsSearchV2'
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
	searchBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(2),
		marginBottom: theme.spacing(3)
	},
	cmsDate: {
		marginRight: theme.spacing(1),
	},
	importBar: {
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
const PAGE_SIZE_1 = 5
const TABLE_HEIGHT = 640
const FULLTIME_FORMAT = 'MMM DD YYYY HH:mm'

class InstantWin extends React.Component
{
	constructor(props)
	{
		super(props)

		this.state = {
			dialogType: '',
            isDialogOpen: false,
			isMultiSelectMode: false,
			rowData: {},
			tableTab: 0,
		}

		this.searchText = {}
		this.tableRef = React.createRef()
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
													this.state.tableTab === 1 && this.handleAction('setting_restore') ||
													this.state.tableTab === 2 && this.handleAction('type_restore') ||
													null
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.RefreshIcon/>}
											>
											{
												this.state.tableTab === 1 && `${TEXT.INSTANT_WIN_BUTTON_RESTORE_SETTING}` ||
												this.state.tableTab === 2 && `${TEXT.INSTANT_WIN_BUTTON_RESTORE_TYPE}` || ''
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
													this.state.tableTab === 1 && this.handleAction('setting_delete') ||
													this.state.tableTab === 2 && this.handleAction('type_delete') ||
													null
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconRemove/>}
											>
											{
												this.state.tableTab === 1 && `${TEXT.INSTANT_WIN_BUTTON_DELETE_SETTING}` ||
												this.state.tableTab === 2 && `${TEXT.INSTANT_WIN_BUTTON_DELETE_TYPE}` || ''
											}
											</Button>
										}
										link={''}
										attribute={''}
									/>
								}	
								</>
								:
								this.state.tableTab !== 0 &&
								<CmsControlPermission
									control={
										<Button
											variant={'contained'}
											color={'primary'}
											onClick={
												this.state.tableTab === 1 && this.handleAction('setting_add', {type: {}, code: '', status: '', description: '', image: [], title: '', subtitle: ''}) ||
												this.state.tableTab === 2 && this.handleAction('type_add', {type: ''}) ||
												null
											}
											className={clsx(classes.buttonLeft)}
											startIcon={<Icons.IconAdd/>}
										>
										{
											this.state.tableTab === 1 && `${TEXT.INSTANT_WIN_BUTTON_NEW_SETTING}` ||
											this.state.tableTab === 2 && `${TEXT.INSTANT_WIN_BUTTON_NEW_TYPE}` || ''							
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
		this.props.SetTitle(TEXT.INSTANT_WIN_TITLE)
		this.props.InstantWinSettingsLoad()
		this.props.InstantWinTypesLoad()
	}

	componentWillUnmount() 
	{
		
	}

	componentDidUpdate(prevProps, prevState)
	{
		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()

			if (prevState.dialogType === 'service_export')
			{
				saveAs(new Blob([this.props.fileData]), `${TEXT.INSTANT_WIN_TITLE}.zip`)
				this.props.ClearProps(['fileData'])
			}
			else
			{
				_.includes(prevState.dialogType, 'setting_') && this.props.InstantWinSettingsLoad()
				_.includes(prevState.dialogType, 'type_') && this.props.InstantWinTypesLoad()
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

	handleAction = (name, data) => (evt) =>
	{
		switch (name)
		{
			case 'close':
				this.setState({
					isDialogOpen: false,
					dialogType: '',
					rowData: this.state.dialogType === 'warrning_userId' ? this.state.rowData : {}
				})

				break
			case 'submit':
				if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						this.state.dialogType === 'setting_delete' && this.props.InstantWinSettingDelete(row) ||
						this.state.dialogType === 'setting_restore' && this.props.InstantWinSettingRestore(row) ||

						this.state.dialogType === 'type_delete' && this.props.InstantWinTypeDelete(row) ||
						this.state.dialogType === 'type_restore' && this.props.InstantWinTypeRestore(row)
					})
				}
				else
				{
					if (this.state.tableTab === 0 && this.state.dialogType !== 'service_import')
					{
						data?.userId === ''
						? this.handleAction('warrning_userId', this.state.rowData)(null) 
						: this.props.InstantWinHistoriesLoad({...this.state.rowData.search_date, ...data})
					}
					else
					{
						this.state.dialogType === 'service_import' && this.props.ResourcesImport('instant-win', this.state.rowData) ||

						this.state.dialogType === 'setting_add' && this.props.InstantWinSettingAdd(this.state.rowData) ||
						this.state.dialogType === 'setting_edit' && this.props.InstantWinSettingEdit(this.state.rowData) ||
						this.state.dialogType === 'setting_delete' && this.props.InstantWinSettingDelete(this.state.rowData) ||
						this.state.dialogType === 'setting_restore' && this.props.InstantWinSettingRestore(this.state.rowData) ||

						this.state.dialogType === 'type_add' && this.props.InstantWinTypeAdd(this.state.rowData) ||
						this.state.dialogType === 'type_edit' && this.props.InstantWinTypeEdit(this.state.rowData) ||
						this.state.dialogType === 'type_delete' && this.props.InstantWinTypeDelete(this.state.rowData) ||
						this.state.dialogType === 'type_restore' && this.props.InstantWinTypeRestore(this.state.rowData)
					}
				}

				break
			case 'service_export':
				this.setState(
					{
						dialogType: name,
						rowData: data
					},
					() =>
					{
						this.props.ResourcesExport('instant-win')
					}
				)

				break	
			case 'service_import':
			case 'setting_add':
			case 'setting_edit':
			case 'setting_delete':
			case 'setting_restore':
			case 'type_add':
			case 'type_edit':
			case 'type_delete':
			case 'type_restore':
			case 'warrning_userId':	
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})

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
							this.props.InstantWinSettingsLoad()
						}
						else if (this.state.tableTab === 2)
						{
							this.props.InstantWinTypesLoad()
						}

						this.searchText = {}
						this.props.ClearProps(['instantWinHistories'])
					}
				)

				break
			case 'column_filter':
				this.setState(
					{
						[`default_filter_${data.columnField}`]: data.filterText,
					},
					() =>
					{
						let filterElement = document.querySelector(`[aria-label="filter data by ${data.columnTitle}"]`)
						if (filterElement)
						{
							filterElement.focus()
						}
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
						[name]: data
					}
                })
		}		
	}

	validateSubmit = (submit_data) =>
	{
		if (this.state.dialogType === 'service_import')
		{
			return _.isEmpty(submit_data.file)
		}

		const { type, code, status, title, description, image } = submit_data
		if (this.state.dialogType === 'setting_add')
		{
			return _.isEmpty(type) || _.isEmpty(code) || _.isEmpty(status) || _.isEmpty(title) || _.isEmpty(description) || !(image && image[0] instanceof File)
		}
		else if (this.state.dialogType === 'setting_edit')
		{
			return _.isEmpty(title) || _.isEmpty(description)
		}
		else if (this.state.dialogType === 'type_add' || this.state.dialogType === 'type_edit')
		{
			return _.isEmpty(type)
		}
		
		return false
	}

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
								onClick={this.handleAction('service_import', {})}
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
								onClick={this.handleAction('service_export', {})}
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
						<Tab label={TEXT.INSTANT_WIN_HISTORY_TITLE} />
						<Tab label={TEXT.INSTANT_WIN_SETTING_TITLE}/>
						<Tab label={TEXT.INSTANT_WIN_TYPE_TITLE} />
					</Tabs>
					{this.actionsExtend.createElement(this.actionsExtend)}
				</div>
				<CmsTabPanel value={this.state.tableTab} index={0}>
				{
					this.renderInstantWinHistoriesTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={1}>
				{
					this.renderInstantWinSettingsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={2}>
				{
					this.renderInstantWinTypesTable()
				}
				</CmsTabPanel>
			</>	
		)	
	}

	renderImportService = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<Typography>{TEXT.INSTANT_WIN_TITLE}</Typography>
				<CmsInputFile 
					name={'file'}
					value={this.state.rowData.file || []} 
					onChange={(file) => { this.handleAction('file', file)(null) }} 
					acceptFile={'.zip'}
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
					this.state.dialogType === 'service_import' && `${TEXT.BUTTON_IMPORT} ${TEXT.INSTANT_WIN_TITLE}` ||

                    this.state.dialogType === 'setting_add' && TEXT.INSTANT_WIN_BUTTON_NEW_SETTING ||
                    this.state.dialogType === 'setting_edit' && TEXT.INSTANT_WIN_TOOLTIP_EDIT_SETTING ||
					this.state.dialogType === 'setting_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'setting_restore' && TEXT.REMIND_TITLE ||

					this.state.dialogType === 'type_add' && TEXT.INSTANT_WIN_BUTTON_NEW_TYPE ||
                    this.state.dialogType === 'type_edit' && TEXT.INSTANT_WIN_TOOLTIP_EDIT_TYPE ||
					this.state.dialogType === 'type_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'type_restore' && TEXT.REMIND_TITLE ||

					this.state.dialogType === 'warrning_userId' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={this.state.dialogType === 'warrning_userId' ? null : TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction(this.state.dialogType === 'warrning_userId' ? 'close' : 'submit')}
				handleCancelClick={this.handleAction('close')}
				confirmDisable={(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'setting_add' || this.state.dialogType === 'setting_edit') && this.renderAddEditSetting()
			}
			{
				(this.state.dialogType === 'setting_delete' || this.state.dialogType === 'setting_restore') && this.renderDeleteRestoreSetting()
			}
			{
				(this.state.dialogType === 'type_add' || this.state.dialogType === 'type_edit') && this.renderAddEditType()
			}
			{
				(this.state.dialogType === 'type_delete' || this.state.dialogType === 'type_restore') && this.renderDeleteRestoreType()
			}
			{
				this.state.dialogType === 'warrning_userId' && this.renderWarning()
			}
			{
				this.state.dialogType === 'service_import' && this.renderImportService()
			}
			</ModalDialog>
		)
	}

	renderDeleteRestoreSetting = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'setting_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.INSTANT_WIN_MESSAGE_DELETE_SETTINGS, this.state.rowData.length) : TEXT.INSTANT_WIN_MESSAGE_DELETE_SETTING) ||
						this.state.dialogType === 'setting_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.INSTANT_WIN_MESSAGE_RESTORE_SETTINGS, this.state.rowData.length) : TEXT.INSTANT_WIN_MESSAGE_RESTORE_SETTING) ||
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
									{`${data.type.type} - ${data.code} - ${data.status}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.type.type} - ${this.state.rowData.code} - ${this.state.rowData.status}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderAddEditSetting = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.root, classes.divColumn)}>
					<Typography>{TEXT.TABLE_HEADER_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.type}
						options={_.map(this.props.instantWinTypes, type => ({ type: type.type, id: type.id })) || []}
						getOptionLabel={option => (option.type || '')}
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
						fullWidth
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.INSTANT_WIN_TABLE_HEADER_CODE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.code}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('code', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'setting_edit'}
					/>
				</div>
				<div className={clsx(classes.root, classes.divColumn)}>
					<Typography>{TEXT.TABLE_HEADER_STATUS}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.status}
						options={this.props.STATUSES || []}
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
						fullWidth
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.INSTANT_WIN_TABLE_HEADER_TITLE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.title || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('title', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.INSTANT_WIN_TABLE_HEADER_SUBTITLE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.subtitle || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('subtitle', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.INSTANT_WIN_TABLE_HEADER_DESCRIPTION}</Typography>
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
					<Typography>{TEXT.INSTANT_WIN_TABLE_HEADER_IMAGE}</Typography>
					<CmsImage
						fileName={Utils.createLocalFileURL(this.state.rowData.image)}
						type={'IMAGE'}
					/>
					<CmsInputFile 
						name={'image'}
						value={_.isArray(this.state.rowData.image) ? this.state.rowData.image : []} 
						onChange={(image) => { this.handleAction('image', image)(null) }} 
						acceptFile={'image/*'}
					/>
				</div>
			</div>
		)
	}

	renderInstantWinSettingsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.TABLE_HEADER_TYPE, field: 'type', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.type.type, columnDef),
							render: rowData => (rowData.type?.type || ''),
                        },
						{
                            title: TEXT.INSTANT_WIN_TABLE_HEADER_CODE, field: 'code', width: 150,
                        },
						{
                            title: TEXT.INSTANT_WIN_TABLE_HEADER_IMAGE, field: 'image', nofilter: true, width: 150,
							render: rowData =>
							{
								return (
									<CmsImage
										fileName={rowData.image}
										type={'IMAGE'}
									/>
								)
							}
                        },
						{
                            title: TEXT.TABLE_HEADER_STATUS, field: 'status', width: 150,
                        },
						{
                            title: TEXT.INSTANT_WIN_TABLE_HEADER_TITLE, field: 'title', width: 150,
                        },
						{
                            title: TEXT.INSTANT_WIN_TABLE_HEADER_SUBTITLE, field: 'subtitle', width: 150,
                        },
						{
                            title: TEXT.INSTANT_WIN_TABLE_HEADER_DESCRIPTION, field: 'description', width: 150,
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 250,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true),
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true),
						},
						{
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy', width: 400,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy', hidden: true,
                        },
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', width: 150,
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('setting_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.INSTANT_WIN_TOOLTIP_EDIT_SETTING),
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.INSTANT_WIN_TOOLTIP_DELETE_SETTING),
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.INSTANT_WIN_TOOLTIP_RESTORE_SETTING),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.instantWinSettings || []}

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

					ignoredRender={this.state.isDialogOpen}

					tableRef={this.tableRef}
                />
            </div>		
		)
	}

	renderInstantWinTypesTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 250,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true),
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true),
						},
						{
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy', width: 400,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy', hidden: true,
                        },
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', width: 150,
                            render: rowData => this.renderSingleDateColumn(rowData.deletedAt),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('type_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.INSTANT_WIN_TOOLTIP_EDIT_SETTING),
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.INSTANT_WIN_TOOLTIP_DELETE_SETTING),
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.INSTANT_WIN_TOOLTIP_RESTORE_SETTING),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.instantWinTypes || []}

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

					onSelectionChange={(selectedRows, dataClicked) =>
					{
						this.selectedRows = selectedRows
						const isMultiSelectMode = selectedRows.length > 1
						isMultiSelectMode !== this.state.isMultiSelectMode && this.setState({ isMultiSelectMode })
					}}

					ignoredRender={this.state.isDialogOpen}

					tableRef={this.tableRef}
                />
            </div>		
		)
	}

	renderDeleteRestoreType = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'type_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.INSTANT_WIN_MESSAGE_DELETE_TYPES, this.state.rowData.length) : TEXT.INSTANT_WIN_MESSAGE_DELETE_TYPE) ||
						this.state.dialogType === 'type_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.INSTANT_WIN_MESSAGE_RESTORE_TYPES, this.state.rowData.length) : TEXT.INSTANT_WIN_MESSAGE_RESTORE_TYPE) ||
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
									{`${data.type}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.type}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderAddEditType = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.TABLE_HEADER_TYPE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.type}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('type', evt.target.value)(evt) }}
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
						<CmsSearchV2
							textFields={[
								{
									placeholder: TEXT.INSTANT_WIN_TABLE_HEADER_USER_ID,
									name: 'userId'
								},
								{
									placeholder: TEXT.INSTANT_WIN_TABLE_HEADER_CODE,
									name: 'code'
								}
							]}
							buttonTitle={TEXT.INSTANT_WIN_BUTTON_SEARCH}
							onSearchClick={(searchText) => {
								this.searchText = searchText
								this.handleAction('submit', searchText)(null)
							}}
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
							defaultFilter: this.state[`default_filter_type`] || '',
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.type, columnDef)
                        },
						{
                            title: TEXT.INSTANT_WIN_TABLE_HEADER_CODE, field: 'code', width: 150,
							defaultFilter: this.state[`default_filter_code`] || '',
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.code, columnDef)
                        },
						{
                            title: TEXT.INSTANT_WIN_TABLE_HEADER_IS_USER_WIN, field: 'isUserWin', width: 150,
							defaultFilter: this.state[`default_filter_isUserWin`] || '',
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.isUserWin, columnDef)
                        },
						{
                            title: TEXT.INSTANT_WIN_TABLE_HEADER_PROFILE_ID, field: 'profileId', filtering: false, width: 150,
                        },
						{
                            title: TEXT.INSTANT_WIN_TABLE_HEADER_USER_ID, field: 'userId', filtering: false, width: 150,
                        },
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
                        filtering: true,
						sorting: true,
                        pageSize: PAGE_SIZE_1,
						tableMaxHeight: TABLE_HEIGHT,
                        selection: true,
						cellStyle: { ...defaultCellStyle, textAlign: 'center' },
						headerStyle: { ...defaultHeaderStyle, textAlign: 'center', borderTop: `1px ${defaultBorderColor} solid` },
                    }}

					onSearchChange={(searchText) =>
					{
						_.debounce(() =>
						{
							if (searchText === this.tableRef.current.dataManager.searchText)
							{
								this.handleAction('column_filter', {})(null)
							}
						}, DEBOUCE_WAITING_TIME)()
					}}
		
					onFilterChange={(data) =>
					{
						let filterValue = _.reduce(data, (value, element) =>
						{
							if (element.editing)
							{
								let tableData = element.column.tableData
								value.filterText = element.value
								value.index = tableData.id
								value.columnTitle = element.column.title
								value.columnField = element.column.field
							}
							return value
						}, { filterText: '', index: -1, columnTitle: '', columnField: '' })
	
						_.debounce(() =>
						{
							if (filterValue.filterText === this.tableRef.current.dataManager.columns[filterValue.index].tableData.filterValue)
							{
								this.handleAction('column_filter', filterValue)(null)
							}
						}, DEBOUCE_WAITING_TIME)()
					}}

					ignoredRender={this.state.isDialogOpen}

					tableRef={this.tableRef}

					actionsExtend={this.actionsTableExtend}
                />
            </div>		
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
						TEXT.INSTANT_WIN_MESSAGE_USER_UNVALID
					}
					</Typography>
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
}

InstantWin.propTypes =
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
	InstantWinSettingsLoad: () =>
	{
		dispatch(ActionCMS.InstantWinSettingsLoad())
	},
	InstantWinSettingAdd: (instant_win_data) =>
	{
		dispatch(ActionCMS.InstantWinSettingAdd(instant_win_data))
	},
	InstantWinSettingEdit: (instant_win_data) =>
	{
		dispatch(ActionCMS.InstantWinSettingEdit(instant_win_data))
	},
	InstantWinSettingDelete: (instant_win_data) =>
	{
		dispatch(ActionCMS.InstantWinSettingDelete(instant_win_data))
	},
	InstantWinSettingRestore: (instant_win_data) =>
	{
		dispatch(ActionCMS.InstantWinSettingRestore(instant_win_data))
	},
	InstantWinTypesLoad: () =>
	{
		dispatch(ActionCMS.InstantWinTypesLoad())
	},
	InstantWinTypeAdd: (instant_win_data) =>
	{
		dispatch(ActionCMS.InstantWinTypeAdd(instant_win_data))
	},
	InstantWinTypeEdit: (instant_win_data) =>
	{
		dispatch(ActionCMS.InstantWinTypeEdit(instant_win_data))
	},
	InstantWinTypeDelete: (instant_win_data) =>
	{
		dispatch(ActionCMS.InstantWinTypeDelete(instant_win_data))
	},
	InstantWinTypeRestore: (instant_win_data) =>
	{
		dispatch(ActionCMS.InstantWinTypeRestore(instant_win_data))
	},
	InstantWinHistoriesLoad: (instant_win_data) =>
	{
		dispatch(ActionCMS.InstantWinHistoriesLoad(instant_win_data))
	},
	ResourcesExport: (service) =>
	{
		dispatch(ActionCMS.ResourcesExport(service))
	},
	ResourcesImport: (service, data) =>
	{
		dispatch(ActionCMS.ResourcesImport(service, data))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(InstantWin);

