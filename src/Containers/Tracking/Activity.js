import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import { TextField, Tooltip, IconButton, Button } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { saveAs } from 'file-saver'

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
const ACTIVITY_DATA = { profileId: '', serviceName: '', type: '', metadata: '', data: '', ms_begin_utc: 0, ms_end_utc: 0 }

class Activity extends React.Component
{
	constructor(props)
	{
		super(props)

		this.state = {
			dialogType: '',
            isDialogOpen: false,
			pageSize: PAGE_SIZE,
			serviceName: DEFINE_ALL,
			rowData: {},
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
				saveAs(new Blob([props.fileData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${TEXT.TRACKING_ACTIVITY_TITLE}.xlsx`)
				props.ClearProps(['fileData'])
			}
		}

        return null; // No change to state
    }

    componentDidMount()
	{
		this.props.SetTitle(TEXT.TRACKING_ACTIVITY_TITLE)
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
					rowData: {}
				})

				break
			case 'json_editor':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: data
				})
				
				break	
			case 'activity_logs_export':
				this.setState(
					{
						dialogType: name,
					},
					() =>
					{
						this.props.ActivityLogsExport(this.state.query)
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
						value={this.state.rowData.data}
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
                            title: TEXT.TRACKING_ACTIVITY_TABLE_HEADER_SERVICE, field: 'serviceName', width: 150,
							filtering: false,
                        },
						{
                            title: TEXT.TRACKING_ACTIVITY_TABLE_HEADER_EMAIL, field: 'profileId', width: 150,
                        },
						{
                            title: TEXT.TRACKING_ACTIVITY_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: TEXT.TRACKING_ACTIVITY_TABLE_HEADER_METADATA, field: 'metadata', width: 150,
							render: rowData =>
                            {
								return (
									<CmsControlPermission
										control={
											<Tooltip 
												title={TEXT.TRACKING_ACTIVITY_TOOLTIP_VIEW_METADATA}
												placement={'top'}
											>
												<IconButton
													onClick={(event) => {
														this.handleAction('json_editor', { data: rowData.metadata })(event)
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
                            title: TEXT.TRACKING_ACTIVITY_TABLE_HEADER_DATA, field: 'data', width: 150,
							render: rowData =>
                            {
								return (
									<CmsControlPermission
										control={
											<Tooltip 
												title={TEXT.TRACKING_ACTIVITY_TOOLTIP_VIEW_DATA}
												placement={'top'}
											>
												<IconButton
													onClick={(event) => {
														this.handleAction('json_editor', { data: rowData.data })(event)
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
							page: page + 1, 
							pageSize
						}

						this.setState({
							query: activity_data
						})

						return new Promise((resolve) =>
						{
							this.props.SetLoading('')
							API.ActivitiesLoad(activity_data)
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

					/* onFilterChange={(query) =>
					{
						let filterValue = _.reduce(query.filters, (value, element) =>
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
						
						if (filterValue.filterText === this.tableRef.current.dataManager.columns[filterValue.index].tableData.filterValue)
						{
							this.handleAction('column_filter', { filterValue, query })(null)
						}
					}} */

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

Activity.propTypes =
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
	SetLoading: (msg) =>
	{
		dispatch(ActionCMS.SetLoading(msg))
	},
	ClearRefresh: () =>
	{
		dispatch(ActionCMS.ClearRefresh())
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
	ActivityLogsExport: (activity_data) =>
	{
		dispatch(ActionCMS.ActivityLogsExport(activity_data))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(Activity);

