import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography, Button, Tooltip, Icon } from '@material-ui/core'
import { WarningRounded } from '@material-ui/icons'

import Utils from '../../Utils'
import TEXT from './Data/Text'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import * as Icons from '../../Components/CmsIcons'
import CmsControlPermission from '../../Components/CmsControlPermission'
import CmsTable from '../../Components/CmsTable'
import CmsExcel from '../../Components/CmsExcel'
import ModalDialog from '../../Components/Dialogs/ModalDialog'

const styles = theme => ({
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

class Detail extends React.Component
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

				return (
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<div className={clsx(classes.divRow)}>
                                <Button
                                    variant={'contained'}
                                    color={'primary'}
                                    onClick={this.handleAction('detail_back', {})}
                                    className={clsx(classes.buttonLeft, classes.buttonRight)}
                                >
                                    { TEXT.MODAL_BACK }
                                </Button>
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
									this.state.isMultiSelectMode &&
                                    <>
									{
										_.filter(this.selectedRows, data => (data.deletedAt > 0)).length > 0 &&
										<CmsControlPermission
											control={
												<Button
													variant={'contained'}
													color={'primary'}
													onClick={this.handleAction('version_restore')}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
													{ TEXT.OVERVIEW_BUTTON_RESTORE_VERSION }
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
													onClick={this.handleAction('version_delete')}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
													{ TEXT.OVERVIEW_BUTTON_DELETE_VERSION }
												</Button>
											}
											link={''}
											attribute={''}
										/>
									}	
									</>
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
	        props.DetailsLoad(state.versionData)
		
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
		this.props.SetTitle(TEXT.OVERVIEW_DETAIL_TITLE)
		this.props.DetailsLoad(this.state.versionData)
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
				{this.renderDetailTable()}
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
		let result = this.props.details
		
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
	}

	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.OVERVIEW_TABLE_HEADER_VERSION, field: 'version'},
			{ title: TEXT.OVERVIEW_TABLE_HEADER_CLIENT, field: 'client' },
			{ title: TEXT.OVERVIEW_TABLE_HEADER_ENVIRONMENT, field: 'env' },
			{ title: TEXT.OVERVIEW_TABLE_HEADER_GOLIVE, field: 'goLive' },
			{ title: TEXT.OVERVIEW_TABLE_HEADER_BEHAVIOUR, field: 'behaviour'},
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
			{ title: TEXT.OVERVIEW_TABLE_HEADER_VERSION, field: 'version'},
			{ title: TEXT.OVERVIEW_TABLE_HEADER_CLIENT, field: 'client' },
			{ title: TEXT.OVERVIEW_TABLE_HEADER_ENVIRONMENT, field: 'env' },
			{ title: TEXT.OVERVIEW_TABLE_HEADER_GOLIVE, field: 'goLive' },
		]

		return columns
	}

	handleAction = (name, data) => (evt) =>
	{
		switch (name)
		{
            case 'detail_back':
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
						this.state.dialogType === 'version_delete' && this.props.VersionDelete(row)
						this.state.dialogType === 'version_restore' && this.props.VersionRestore(row)
					})
				}
				else 
				{
					this.state.dialogType === 'version_delete' && this.props.VersionDelete(this.state.rowData)
					this.state.dialogType === 'version_restore' && this.props.VersionRestore(this.state.rowData)
					this.state.dialogType === 'version_set_live' && this.props.VersionSetLive(this.state.rowData)
				}

				break
			case 'version_delete':
			case 'version_restore':
			case 'version_set_live':	
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

	validateSubmit = (submit_data) =>
	{
		const { version, client, env } = submit_data
		let result = _.some(Object.keys({ version, client, env }), key => {
			return _.isEmpty(submit_data[key])
		})

		return result
	}

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
                    this.state.dialogType === 'version_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'version_restore' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'version_set_live' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'version_delete' || this.state.dialogType === 'version_restore' || this.state.dialogType === 'version_set_live') && this.renderDeleteRestoreSetliveVersion()
			}
			</ModalDialog>
		)
	}

	renderDeleteRestoreSetliveVersion = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'version_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.OVERVIEW_MESSAGE_DELETE_VERSIONS, this.state.rowData.length) : TEXT.OVERVIEW_MESSAGE_DELETE_VERSION) ||
						this.state.dialogType === 'version_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.OVERVIEW_MESSAGE_RESTORE_VERSIONS, this.state.rowData.length) : TEXT.OVERVIEW_MESSAGE_RESTORE_VERSION) ||
						this.state.dialogType === 'version_set_live' && TEXT.OVERVIEW_MESSAGE_SET_LIVE_VERSION ||
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
									{`${data.client} - ${data.version} - ${data.env}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.client} - ${this.state.rowData.version} - ${this.state.rowData.env}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderDetailTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.OVERVIEW_TABLE_HEADER_CLIENT, field: 'client', width: 250,
                        },
						{
                            title: TEXT.OVERVIEW_TABLE_HEADER_VERSION, field: 'version', width: 150,
                        },
						{
                            title: TEXT.OVERVIEW_TABLE_HEADER_ENVIRONMENT, field: 'env', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData, columnDef, 'env')
                        },
						{
                            title: () => (
                                <div style={{ display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'center' }}>
                                    <span>{TEXT.TABLE_HEADER_STATUS}</span>
                                    <Tooltip 
                                        title={TEXT.OVERVIEW_TOOLTIP_STATUS}
                                        classes={{tooltip: classes.toolTip}}
                                        placement={'top'}
                                    >
                                        <Icon style={{ color: '#AEAEAE', marginLeft: 10 }} >help</Icon>
                                    </Tooltip>
                                </div>
                            ),
							placeholder: TEXT.TABLE_HEADER_STATUS,
                            field: 'status', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData, columnDef, 'status')
                        },
						{
                            title: TEXT.OVERVIEW_TABLE_HEADER_BEHAVIOUR, field: 'behaviour', width: 150,
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
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdAt', width: 350,
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
							icon: (props) => <Icons.IconSetting {...props} />,
							onClick: (event, rowData) =>
							{
								this.props.history.push(`/remote-configuration/configuration/${rowData.id}/${encodeURIComponent(rowData.client)}/${rowData.version}/${rowData.env}/${rowData.status}/${rowData.goLive}`)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.OVERVIEW_TOOLTIP_CONFIGURATION),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
						{
							icon: (props) => <Icons.UpgradeIcon {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('version_set_live', rowData)(event)
							},
							tooltip: (rowData) => ((rowData.goLive || this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.OVERVIEW_TOOLTIP_SET_LIVE_VERSION),
							disabled: (rowData) => (rowData.goLive || this.state.isMultiSelectMode || rowData.deletedAt > 0),
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
								this.handleAction('version_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.OVERVIEW_TOOLTIP_DELETE_VERSION),
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
								this.handleAction('version_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.OVERVIEW_TOOLTIP_RESTORE_VERSION),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.details || []}

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

Detail.propTypes =
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
	DetailsLoad: (version_data) =>
	{
		dispatch(ActionCMS.DetailsLoad(version_data))
	},
	VersionDelete: (version_data) =>
	{
		dispatch(ActionCMS.VersionDelete(version_data))
	},
	VersionRestore: (version_data) =>
	{
		dispatch(ActionCMS.VersionRestore(version_data))
	},
	VersionSetLive: (version_data) =>
	{
		dispatch(ActionCMS.VersionSetLive(version_data))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(Detail);

