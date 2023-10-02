import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import copy from "copy-to-clipboard"

import { Tooltip, IconButton } from '@material-ui/core'

import TEXT from './Data/Text'
import { withMultipleStyles, customStyle } from '../../Styles'
import API from '../../Api/API'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import CmsTable from '../../Components/CmsTable'
import * as Icons from '../../Components/CmsIcons'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import { JsonEditor } from '../../3rdParty/jsoneditor-react-master/src'
import CmsControlPermission from '../../Components/CmsControlPermission'
import CmsDate from '../../Components/CmsDate'

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
const TABLE_HEIGHT = 750
const FULLTIME_FORMAT = 'MMM DD YYYY HH:mm'
const CONSENT_DATA = { userId: '', type: '', data: '' }

class ConsentTracking extends React.Component
{
	constructor(props)
	{
		super(props)

		this.state = {
			dialogType: '',
            isDialogOpen: false,
			pageSize: PAGE_SIZE,
			rowData: {},
		}

		this.tableRef = React.createRef()
	}

    componentDidMount()
	{
		this.props.SetTitle(TEXT.CONSENT_TRACKING_TITLE)
	}

	componentWillUnmount() 
	{
		
	}

	componentDidUpdate(prevProps, prevState)
	{

	}

	static getDerivedStateFromProps(props, state)
	{
        return null; // No change to state
    }

    render()
    {
        const { classes } = this.props

		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderConsentTrackingTable()}
				{this.renderDialog()}
			</div>
		)
    }

	handleAction = (name, data) => (evt) =>
	{
		evt && evt.preventDefault && evt.preventDefault()
		switch (name)
		{
			case 'close':
				this.setState({
					isDialogOpen: false,
					dialogType: '',
					rowData: {},
				})

				break
			case 'submit':
				break
			case 'data_view':			
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: data
				})

				break	
			case 'copy_clipboard':
				copy(data)
				this.props.ShowMessage(TEXT.MESSAGE_COPY_TO_CLIPBOARD)

				break	
			case 'pageSize':
				this.setState({
					[name]: data
				})
				
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
			default:
				this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: data
					}
                })
				
				break
		}
	}			

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={TEXT.CONSENT_TRACKING_TABLE_HEADER_DATA}
				confirmText={this.state.dialogType === 'data_view' ? TEXT.MODAL_CLOSE : TEXT.MODAL_OK}
				cancelText={this.state.dialogType === 'data_view' ? null : TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction(this.state.dialogType === 'data_view' ? 'close' : 'submit')}
				handleCancelClick={this.handleAction('close')}
			>
			{
				this.state.dialogType === 'data_view' && this.renderViewData()
			}
			</ModalDialog>
		)
	}

	renderViewData = () =>
	{
		const { classes } = this.props
		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				<JsonEditor
					key={'text'}
					value={this.state.rowData.data}
					mode={'text'}
				/>
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
				</div>
			</div>	
		)	
	}

	renderConsentTrackingTable = () =>
	{
		const { classes } = this.props
	
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderSearchBar()}
                <CmsTable
                    columns={[
						{
                            title: TEXT.CONSENT_TRACKING_TABLE_HEADER_USER_ID, field: 'userId', width: 150,
							disableClick: false,
							cellTooltip: TEXT.CONSENT_TRACKING_TOOLTIP_COPY_TO_CLIPBOARD
                        },
						{
                            title: TEXT.CONSENT_TRACKING_TABLE_HEADER_TYPE, field: 'type', width: 150,
							disableClick: false,
							cellTooltip: TEXT.CONSENT_TRACKING_TOOLTIP_COPY_TO_CLIPBOARD
                        },
						{
                            title: TEXT.CONSENT_TRACKING_TABLE_HEADER_DATA, field: 'data', width: 150,
							render: rowData =>
                            {
								return (
									<CmsControlPermission
										control={
											<Tooltip 
												title={TEXT.CONSENT_TRACKING_TOOLTIP_VIEW_DATA}
												placement={'top'}
											>
												<IconButton
													onClick={(event) => {
														this.handleAction('data_view', { data: rowData.data })(event)
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
                            title: TEXT.TABLE_HEADER_CREATED_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 150,
							filtering: false,
							disableClick: true,
							render: rowData => this.renderCustomDateColumn(rowData.createdAt),
                        },
                    ]}

                    data={query =>
					{
						const { filters, page, pageSize } = query
						let consent_data = _.reduce(filters, (consent_data, filter) =>
						{
							return {...consent_data, [filter.column.field]: filter.value}
						}, {})

						consent_data = {
							...CONSENT_DATA, 
							...consent_data, 
							...this.state.search_date,
							page: page + 1, 
							pageSize
						}

						return new Promise((resolve) =>
						{
							this.props.SetLoading('')
							API.ConsentTrackingLoad(consent_data)
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

					onClickCell={(event, rowData, columnDef) =>
					{
						if (rowData.hasOwnProperty(columnDef.field))
						{
							this.handleAction('copy_clipboard', rowData[columnDef.field])(event)
						}
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

	renderCustomDateColumn = (rowData) =>
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

ConsentTracking.propTypes =
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
	ShowMessage: (msg) =>
    {
        dispatch(ActionCMS.ShowMessage(msg))
    },
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(ConsentTracking);

