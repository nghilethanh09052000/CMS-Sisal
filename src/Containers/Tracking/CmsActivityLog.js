import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import { saveAs } from 'file-saver'

import { TextField, Tooltip, IconButton, Button } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'

import TEXT from './Data/Text'
import { DEFINE_ALL } from '../../Defines'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import CmsTable from '../../Components/CmsTable'
import CmsDate from '../../Components/CmsDate'
import * as Icons from '../../Components/CmsIcons'
import CmsControlPermission from '../../Components/CmsControlPermission'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import { JsonEditor } from '../../3rdParty/jsoneditor-react-master/src'

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
	jsoneditor: {
		maxHeight: '480px !important'
	},
	marginRight: {
		marginRight: 15,
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
const ACTIVITY_DATA = { email: '', serviceName: '', resource: '', action: '', data: '', message: '', ms_begin_utc: 0, ms_end_utc: 0 }

class CmsActivityLog extends React.Component
{
	constructor(props)
	{
		super(props)

		this.state = {
			dialogType: '',
            isDialogOpen: false,
			pageSize: PAGE_SIZE,
			serviceName: DEFINE_ALL,
			resource: DEFINE_ALL,
			action: DEFINE_ALL,
			query: {},
		}

		this.tableRef = React.createRef()
	}

	static getDerivedStateFromProps(props, state)
	{
        if (props.needRefresh)
		{
			props.ClearRefresh()
			if (state.dialogType === 'activity_logs_export')
			{
				saveAs(new Blob([props.fileData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${TEXT.TRACKING_CMS_ACTIVITY_LOG_TITLE}.xlsx`)
				props.ClearProps(['fileData'])
			}
			else if (state.dialogType === 'json_editor')
			{
				return {
					isDialogOpen: true,
				}
			}
		}

        return null; // No change to state
    }

    componentDidMount()
	{
		this.props.SetTitle(TEXT.TRACKING_CMS_ACTIVITY_LOG_TITLE)
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
				{this.renderCmsActivityLogsTable()}
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
				})

				this.props.ClearProps(['activityLogData'])

				break
			case 'json_editor':
				this.setState(
					{
						dialogType: name,
					},
					() =>
					{
						this.props.CmsActivityLogDataLoad(data)
					}
				)
				
				break
			case 'activity_logs_export':
				this.setState(
					{
						dialogType: name,
					},
					() =>
					{
						this.props.CmsActivityLogsExport(this.state.query)
					}
				)

				break	
			case 'search_date':
				this.setState(
					{
						search_date: data,
					},
					() =>
					{
						this.tableRef.current && this.tableRef.current.onQueryChange({...this.state.query, page: 0}, null)
					}
				)
				
				break
			case 'serviceName':
				this.setState(
					{
						serviceName: data,
						resource: DEFINE_ALL,
						action: DEFINE_ALL
					},
					() =>
					{
						this.tableRef.current && this.tableRef.current.onQueryChange({...this.state.query, page: 0}, null)
						this.props.ResourcesLoad(data)
					}
				)
				
				break		
			case 'resource':
				this.setState(
					{
						resource: data,
						action: DEFINE_ALL
					},
					() =>
					{
						this.tableRef.current && this.tableRef.current.onQueryChange({...this.state.query, page: 0}, null)
					}
				)
				
				break
			case 'action':
				this.setState(
					{
						action: data,
					},
					() =>
					{
						this.tableRef.current && this.tableRef.current.onQueryChange({...this.state.query, page: 0}, null)
					}
				)
				
				break
			case 'pageSize':
				this.setState({
					pageSize: data
				})
				
				break			
			default:
				this.setState({
                    [name]: data
                })
				
				break
		}
	}			

	renderDialog = () =>
	{
		const { classes } = this.props

		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={TEXT.TRACKING_CMS_ACTIVITY_LOG_TABLE_HEADER_DATA}
				confirmText={TEXT.MODAL_OK}
				handleConfirmClick={this.handleAction('close')}
			>
				<div className={clsx(classes.root, classes.divColumn)}>
					<JsonEditor
						key={'text'}
						value={this.props.activityLogData || {}}
						mode={'text'}
					/>
				</div>
			</ModalDialog>
		)
	}

	renderSearchBar = () =>
	{
		const { classes } = this.props
		
		return (
			<div className={clsx(classes.divColumn, classes.searchBar)}>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.divHeight, classes.alignCenter)}>
					<div className={clsx(classes.divRow, classes.divHeight, classes.justifyCenter)}>
						<div className={clsx(classes.divColumn, classes.divHeight, classes.cmsDate)}>
							<CmsDate
								views={['date', 'hours', 'minutes']}
								enableFullTimeFormat={true}
								disableFuture={true} 
								raiseSubmitOnMounted={true}
								disableToolbar={false}
								onDateSubmit={(data) => {
									this.handleAction('search_date', data)(null)
								}}
							/>
						</div>
						<div className={clsx(classes.divColumn, classes.cmsDate)}>
							<Autocomplete
								autoComplete
								autoSelect
								filterSelectedOptions
								value={this.state.serviceName}
								options={[...this.props.services, DEFINE_ALL]}
								onChange={(evt, value) => {
									this.handleAction('serviceName', value)(evt)
								}}
								disableClearable={true}
								renderInput={(params) => (
									<TextField {...params}
										variant="outlined"
										label={TEXT.TRACKING_CMS_ACTIVITY_LOG_TABLE_HEADER_SERVICE}
									/>
								)}
								classes={{
									root: classes.autoComplete,
									input: classes.autoCompleteInput,
									inputRoot: classes.autoCompleteInputRoot
								}}
							/>
						</div>
						<div className={clsx(classes.divColumn, classes.cmsDate)}>
							<Autocomplete
								autoComplete
								autoSelect
								filterSelectedOptions
								value={this.state.resource}
								options={this.props.resources || []}
								getOptionLabel={option => (option.resource || DEFINE_ALL)}
								onChange={(evt, value) => {
									this.handleAction('resource', value)(evt)
								}}
								disableClearable={true}
								renderInput={(params) => (
									<TextField {...params}
										variant="outlined"
										label={TEXT.TRACKING_CMS_ACTIVITY_LOG_TABLE_HEADER_RESOURCE}
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
							<Autocomplete
								autoComplete
								autoSelect
								filterSelectedOptions
								value={this.state.action}
								options={this.state.resource.actions || []}
								onChange={(evt, value) => {
									this.handleAction('action', value)(evt)
								}}
								disableClearable={true}
								renderInput={(params) => (
									<TextField {...params}
										variant="outlined"
										label={TEXT.TRACKING_CMS_ACTIVITY_LOG_TABLE_HEADER_ACTION}
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
					<CmsControlPermission
						control={
							<Button
								variant={'contained'}
								color={'primary'}
								onClick={this.handleAction('activity_logs_export', {})}
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
			</div>	
		)	
	}

	renderCmsActivityLogsTable = () =>
	{
		const { classes } = this.props
	
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderSearchBar()}
                <CmsTable
                    columns={[
						{
                            title: TEXT.TRACKING_CMS_ACTIVITY_LOG_TABLE_HEADER_SERVICE, field: 'serviceName', width: 150,
							filtering: false,
                        },
						{
                            title: TEXT.TRACKING_CMS_ACTIVITY_LOG_TABLE_HEADER_RESOURCE, field: 'resource', width: 150,
							filtering: false,
                        },
						{
                            title: TEXT.TRACKING_CMS_ACTIVITY_LOG_TABLE_HEADER_ACTION, field: 'action', width: 150,
							filtering: false,
                        },
						{
                            title: TEXT.TRACKING_CMS_ACTIVITY_LOG_TABLE_HEADER_EMAIL, field: 'email', width: 200,
                        },
						{
                            title: TEXT.TRACKING_CMS_ACTIVITY_LOG_TABLE_HEADER_MESSAGE, field: 'message', width: 200,
							render: rowData =>
                            {
								const MAX_CHARS = 30
                                return (
									rowData.message.length > MAX_CHARS
									?
                                    <div>
                                        <Tooltip title={rowData.message} placement={'top'}>
											<div>
												{`${rowData.message.substring(0, MAX_CHARS)} ...`}
											</div>
                                        </Tooltip>
                                    </div>
									:
									rowData.message
                                )
                            }
                        },
						{
                            title: TEXT.TRACKING_CMS_ACTIVITY_LOG_TABLE_HEADER_DATA, field: 'data', width: 150,
							render: rowData =>
                            {
								return (
									<CmsControlPermission
										control={
											<Tooltip 
												title={TEXT.TRACKING_CMS_ACTIVITY_LOG_TOOLTIP_VIEW_DATA}
												placement={'top'}
											>
												<IconButton
													onClick={(event) => {
														this.handleAction('json_editor', rowData)(event)
													}}
												>
													<Icons.IconEyeShow />
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
                            title: TEXT.TABLE_HEADER_CREATED_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', filtering: false, width: 150,
							render: rowData => this.renderCustomDateColumn(rowData.createdAt),
                        },
                    ]}

                    data={query =>
					{
						const { filters, page, pageSize } = query
						let activity_data = _.reduce(filters, (activity_data, filter) =>
						{
							return {...activity_data, [filter.column.field]: filter.value}
						}, {})

						activity_data = {
							...ACTIVITY_DATA, 
							...activity_data, 
							...this.state.search_date, 
							serviceName: this.state.serviceName,
							resource: this.state.resource.resource || DEFINE_ALL,
							action: this.state.action,
							page: page + 1, 
							pageSize
						}

						this.setState({
							query: activity_data
						})

						return new Promise((resolve) =>
						{
							this.props.SetLoading('')
							API.CmsActivityLogsLoad(activity_data)
							.then(result =>
							{
								resolve({
									data: result.items,
									page: _.isEmpty(result.items) ? 0 : result.pagination.page - 1,
									totalCount: result.pagination.totalItems,
								})

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

					ignoredRender={this.state.isDialogOpen}
					
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

CmsActivityLog.propTypes =
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
	SetProps: (prop) =>
	{
		dispatch(ActionCMS.SetProps(prop))
	},
	SetLoading: (msg) =>
	{
		dispatch(ActionCMS.SetLoading(msg))
	},
	ClearLoading: () =>
	{
		dispatch(ActionCMS.ClearLoading())
	},
	ResourcesLoad: (service) =>
	{
		dispatch(ActionCMS.ResourcesLoad(service))
	},
	CmsActivityLogDataLoad: (activity_data) =>
	{
		dispatch(ActionCMS.CmsActivityLogDataLoad(activity_data))
	},
	CmsActivityLogsExport: (activity_data) =>
	{
		dispatch(ActionCMS.CmsActivityLogsExport(activity_data))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(CmsActivityLog);

