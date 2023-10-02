import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import { Button, Typography, TextField, IconButton, Tooltip } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { saveAs } from 'file-saver'

import Utils from '../../Utils';
import TEXT from './Data/Text'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import CmsTable from '../../Components/CmsTable'
import * as Icons from '../../Components/CmsIcons'
import CmsControlPermission from '../../Components/CmsControlPermission'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsInputFile from '../../Components/CmsInputFile'

import API from '../../Api/API'

const styles = theme => ({
	table: {
        flexGrow: 0,
        flexShrink: 0,
        marginTop: 0,
    },
	searchBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(2),
		marginBottom: theme.spacing(3)
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
	height: 40, // auto ajustment by table
	padding: 0,
	...defaultBorderStyle,
	userSelect: 'none'
}

const PAGE_SIZE = 10
const TABLE_HEIGHT = 650
const FULLTIME_FORMAT = 'MMM DD YYYY HH:mm'
const DLC_DATA = { dlcCode: '', platform: '' }

class Downloadable extends React.Component
{
	constructor(props)
	{
		super(props)

		this.state = {
			dialogType: '',
            isDialogOpen: false,
			isExportOpen: false,
			isMultiSelectMode: false,
			pageSize: PAGE_SIZE,
			rowData: {},
			inProgress: false
		}

		this.tableRef = React.createRef()
	}

    componentDidMount()
	{
		this.props.SetTitle(TEXT.DOWNLOADABLE_CONTENT_TITLE)
	}

	componentWillUnmount() 
	{
		
	}

	componentDidUpdate(prevProps, prevState)
	{
		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()
			if (prevState.dialogType === 'dlc_add' || prevState.dialogType === 'dlc_edit')
			{
				this.tableRef.current.onQueryChange(prevState.query, null)
			}
			else if (prevState.inProgress)
			{
				saveAs(this.props.fileData?.asset?.hostURL || '')
				this.props.ClearProps(['fileData'])
			}
		}
	}

	static getDerivedStateFromProps(props, state)
	{
        if (props.needRefresh)
		{
			if (state.dialogType === 'dlc_detail')
			{
				return {
					isDialogOpen: true,
				}
			}
			else if (state.inProgress)
			{
				return {
					inProgress: false,
					rowData: {},
				}
			}
			else
			{
				return {
					isDialogOpen: false,
					isMultiSelectMode: false,
					dialogType: '',
					rowData: {},
				}
			}
		}

        return null; // No change to state
    }

    render()
    {
        const { classes } = this.props

		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderDLCTable()}
				{this.renderDialog()}
			</div>
		)
    }

	validateSubmit = (submit_data) =>
	{
		if ( 
			_.isEmpty(submit_data.dlcCode) ||
			_.isEmpty(submit_data.platform) ||
			_.isEmpty(submit_data.file) ||
			Utils.getFilesSizeInput(submit_data.file) >= 50*1024 // 50MB
		) return true
		
		return false
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
				this.state.dialogType === 'dlc_add' && this.props.DLCAdd(this.state.rowData) ||
				this.state.dialogType === 'dlc_edit' && this.props.DLCEdit(this.state.rowData)

				break
			case 'search_date':
				this.setState(
					{
						search_date: data,
					},
					() =>
					{
						this.tableRef.current && this.tableRef.current.onQueryChange(this.state.query, null)
					}
				)
				
				break
			case 'dlc_add':
			case 'dlc_edit':	
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})

				break
			case 'pageSize':
				this.setState({
					pageSize: data
				})
				
				break	
			case 'dlc_detail':			
				this.setState(
					{
						inProgress: false,
						dialogType: name,
						rowData: data
					},
					() =>
					{
						this.props.DLCDetailsLoad(data)
					}
				)

				break		
			case 'dlc_download':
				this.setState(
					{
						inProgress: true,
						rowData: data
					},
					() =>
					{
						this.props.DLCGetUrl(data)
					}
				)

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
                    this.state.dialogType === 'dlc_add' && TEXT.DOWNLOADABLE_CONTENT_BUTTON_ADD_DLC ||
                    this.state.dialogType === 'dlc_edit' && TEXT.DOWNLOADABLE_CONTENT_TOOLTIP_EDIT_DLC ||
					this.state.dialogType === 'dlc_detail' && `${TEXT.DOWNLOADABLE_CONTENT_TOOLTIP_LOAD_DLC} - ${this.state.rowData.dlcCode}` ||
        			''
                }
				confirmText={this.state.dialogType === 'dlc_detail' ? TEXT.MODAL_CLOSE : TEXT.MODAL_OK}
				cancelText={this.state.dialogType === 'dlc_detail' ? null : TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction(this.state.dialogType === 'dlc_detail' ? 'close' : 'submit')}
				handleCancelClick={this.handleAction('close')}
				confirmDisable={this.state.dialogType === 'dlc_detail' ? false : this.validateSubmit(this.state.rowData)}
				width={this.state.dialogType === 'dlc_detail'  ? '40%' : null}
			>
			{
				(this.state.dialogType === 'dlc_add' || this.state.dialogType === 'dlc_edit') && this.renderAddEditDLC()
			}
			{
				this.state.dialogType === 'dlc_detail' && this.renderHistoryDLC()
			}
			</ModalDialog>
		)
	}

	renderAddEditDLC = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.DOWNLOADABLE_CONTENT_TABLE_HEADER_DLC_CODE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.dlcCode}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('dlcCode', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'dlc_edit'}
					/>
				</div>
				{
					this.state.dialogType === 'dlc_edit' &&
					<div className={clsx(classes.divColumn)}>
						<Typography>{TEXT.DOWNLOADABLE_CONTENT_TABLE_HEADER_VERSION}</Typography>
						<TextField
							className={clsx(classes.inputTextField, classes.inputText)}
							value={this.state.rowData.version}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('version', evt.target.value)(evt) }}
							disabled={true}
						/>
					</div>
				}
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.DOWNLOADABLE_CONTENT_TABLE_HEADER_PLATFORM}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.platform}
						options={this.props.platformList}
						onChange={(evt, value) => {
							this.handleAction('platform', value)(evt)
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
					<Typography>{TEXT.DOWNLOADABLE_CONTENT_TABLE_HEADER_FILE}</Typography>
					<Typography style={{fontSize: '0.75rem', fontWeight: 500}}>{TEXT.DOWNLOADABLE_CONTENT_TOOLTIP_FILE}</Typography>
					<CmsInputFile 
						name={'file'}
						value={this.state.rowData.file || []} 
						onChange={(file) => { this.handleAction('file', file)(null) }} 
						acceptFile={'.html, .m4a, .mp3, .mp4, .json, .txt, .csv, .zip, image/jpeg, image/png, image/jpg'}
					/>
				</div>
			</div>
		)
	}	

	renderHistoryDLC = () =>
	{
		const { classes } = this.props

		return (
			<CmsTable
				columns={[
					{
						title: TEXT.DOWNLOADABLE_CONTENT_TABLE_HEADER_NAME, field: 'name', width: 150,
						filtering: false,
					},
					{
						title: TEXT.DOWNLOADABLE_CONTENT_TABLE_HEADER_PLATFORM, field: 'platform', width: 101,
					},
					{
						title: TEXT.DOWNLOADABLE_CONTENT_TABLE_HEADER_VERSION, field: 'version', width: 101,
						filtering: false,
					},
					{
						title: TEXT.DOWNLOADABLE_CONTENT_TABLE_HEADER_SIZE, field: 'size', width: 101,
						filtering: false,
					},
					{
						title: TEXT.TABLE_HEADER_CREATED_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', filtering: false, width: 150,
						render: rowData => this.renderCustomDateColumn(rowData.createdAt),
					},
					{
						title: TEXT.TABLE_HEADER_BLANK, field: 'blank', sorting: false, nofilter: true, width: 50,
						render: rowData =>
						{
							return (
								<CmsControlPermission
									control={
										<Tooltip 
											title={TEXT.DOWNLOADABLE_CONTENT_TOOLTIP_DOWNLOAD_DLC}
											classes={{
												tooltip: classes.toolTip,
											}}
											placement={'top'}
										>
											<IconButton
												onClick={(event) => {
													this.handleAction('dlc_download', rowData)(event)
												}}
											>
												<Icons.IconDownload />
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

				data={this.props.dlcs || []}

				options={{
					actionsColumnIndex: -1,
					fixedColumns: {
						left: 1,
						right: -100
					},
					showTitle: false,
					search: false,
					filtering: false,
					sorting: true,
					selection: false,
					paging: true,
					cellStyle: { ...defaultCellStyle, textAlign: 'center', height: 40 },
					headerStyle: { ...defaultHeaderStyle, textAlign: 'center', height: 40, borderTop: `1px ${defaultBorderColor} solid` },
				}}

				ignoredRender={this.state.isDialogOpen}
			/>
		)
	}

	renderSearchBar = () =>
	{
		const { classes } = this.props
		
		return (
			<div className={clsx(classes.divColumn, classes.searchBar)}>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.divHeight, classes.alignCenter)}>
					<div/>		
					<CmsControlPermission
						control={
							<Button
								variant={'contained'}
								color={'primary'}
								onClick={this.handleAction('dlc_add', {dlcCode: '', platform: '', file: []})}
								className={clsx(classes.buttonLeft)}
								startIcon={<Icons.IconAdd/>}
							>
								{TEXT.DOWNLOADABLE_CONTENT_BUTTON_ADD_DLC}	
							</Button>
						}
						link={''}
						attribute={''}
					/>
				</div>
			</div>	
		)	
	}

	renderDLCTable = () =>
	{
		const { classes } = this.props
	
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderSearchBar()}
                <CmsTable
                    columns={[
						{
                            title: TEXT.DOWNLOADABLE_CONTENT_TABLE_HEADER_DLC_CODE, field: 'dlcCode', width: 150,
						},
						{
                            title: TEXT.DOWNLOADABLE_CONTENT_TABLE_HEADER_PLATFORM, field: 'platform', width: 150,
						},
						{
                            title: TEXT.DOWNLOADABLE_CONTENT_TABLE_HEADER_NAME, field: 'name', width: 250,
							filtering: false,
                        },
						{
                            title: TEXT.DOWNLOADABLE_CONTENT_TABLE_HEADER_VERSION, field: 'version', width: 150,
							filtering: false,
						},
						{
                            title: TEXT.DOWNLOADABLE_CONTENT_TABLE_HEADER_SIZE, field: 'size', width: 150,
							filtering: false,
                        },
                        {
                            title: TEXT.TABLE_HEADER_CREATED_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', filtering: false, width: 150,
							render: rowData => this.renderCustomDateColumn(rowData.createdAt),
                        },
                    ]}

                    data={query =>
					{
						const { filters, page, pageSize } = query
						let dlc_data = _.reduce(filters, (dlc_data, filter) =>
						{
							return {...dlc_data, [filter.column.field]: filter.value}
						}, {})

						dlc_data = {
							...DLC_DATA, 
							...dlc_data, 
							...this.state.search_date,
							page: page + 1, 
							pageSize
						}

						return new Promise((resolve) =>
						{
							this.props.SetLoading('')
							API.DLCLoad(dlc_data)
							.then(result =>
							{
								resolve({
									data: result.items,
									page: _.isEmpty(result.items) ? 0 : result.pagination.page - 1,
									totalCount: result.pagination.totalItems,
								})

								this.props.SetProps([{ key: 'platformList', value: result.platformList }])
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

					actions={[
						{
							icon: (props) => <Icons.IconView {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('dlc_detail', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.DOWNLOADABLE_CONTENT_TOOLTIP_LOAD_DLC),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('dlc_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.DOWNLOADABLE_CONTENT_TOOLTIP_EDIT_DLC),
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
								this.handleAction('dlc_download', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.DOWNLOADABLE_CONTENT_TOOLTIP_DOWNLOAD_DLC),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

					onRowsPerPageChange={(pageSize) =>
					{
						this.handleAction('pageSize', pageSize)(null)
					}}

                    options={{
						actionsColumnIndex: -1,
                        showTitle: false,
                        search: false,
                        filtering: true,
						sorting: false,
                        pageSize: this.state.pageSize,
						tableMaxHeight: TABLE_HEIGHT,
                        selection: false,
						cellStyle: { ...defaultCellStyle, textAlign: 'center' },
						headerStyle: { ...defaultHeaderStyle, textAlign: 'center', borderTop: `1px ${defaultBorderColor} solid` },
                    }}

					ignoredRender={ this.state.isDialogOpen }

					tableRef={this.tableRef}
                />
            </div>		
		)
	}

	renderCustomDateColumn = (rowData, field) =>
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

Downloadable.propTypes =
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
	SetProps: (prop) =>
	{
		dispatch(ActionCMS.SetProps(prop))
	},
	ClearProps: (keys) =>
	{
		dispatch(ActionCMS.ClearProps(keys))
	},
	SetLoading: (msg) =>
	{
		dispatch(ActionCMS.SetLoading(msg))
	},
	ClearLoading: () =>
	{
		dispatch(ActionCMS.ClearLoading())
	},
	DLCAdd: (dlc_data) =>
	{
		dispatch(ActionCMS.DLCAdd(dlc_data))
	},
	DLCEdit: (dlc_data) =>
	{
		dispatch(ActionCMS.DLCEdit(dlc_data))
	},
	DLCGetUrl: (dlc_data) =>
	{
		dispatch(ActionCMS.DLCGetUrl(dlc_data))
	},
	DLCDetailsLoad: (dlc_data) =>
	{
		dispatch(ActionCMS.DLCDetailsLoad(dlc_data))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(Downloadable);

