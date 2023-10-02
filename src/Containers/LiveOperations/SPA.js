import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography, Button, TextField } from '@material-ui/core'
import { WarningRounded } from '@material-ui/icons'

import Utils from '../../Utils'
import TEXT from './Data/Text'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import * as Icons from '../../Components/CmsIcons'
import CmsControlPermission from '../../Components/CmsControlPermission'
import CmsTable from '../../Components/CmsTable'
import CmsInputFile from '../../Components/CmsInputFile'
import ModalDialog from '../../Components/Dialogs/ModalDialog'

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

class SPA extends React.Component
{
	constructor(props)
	{
		super(props)

		this.state = {
			dialogType: '',
            isDialogOpen: false,
			isMultiSelectMode: false,
			rowData: {}
		}

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
												onClick={this.handleAction('package_restore')}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.RefreshIcon/>}
											>
												{ TEXT.SPA_BUTTON_RESTORE_PACKAGE }
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
												onClick={this.handleAction('package_delete')}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconRemove/>}
											>
												{ TEXT.SPA_BUTTON_DELETE_PACKAGE }
											</Button>
										}
										link={''}
										attribute={''}
									/>
								}	
								</>
								:
								<>
									<CmsControlPermission
										control={
											<Button
												variant={'contained'}
												color={'primary'}
												onClick={this.handleAction('container_delete')}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconRemove/>}
											>
												{ TEXT.SPA_BUTTON_DELETE_CONTAINER }
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
												onClick={this.handleAction('package_add', {name: '', source: []})}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
												{ TEXT.SPA_BUTTON_NEW_PACKAGE }
											</Button>
										}
										link={''}
										attribute={''}
									/>
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
			if (state.dialogType === 'package_view')
			{
				return {
					isDialogOpen: true,
				}
			}
			else
			{
				props.SPAPackagesLoad()
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

    componentDidMount()
	{
		this.props.SetTitle(TEXT.SPA_MANAGEMENT_TITLE)
		this.props.SPAPackagesLoad()
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
				{this.renderSPAPackagesTable()}
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
			case 'submit':
				if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						this.state.dialogType === 'package_delete' && this.props.SPAPackagesDelete(row) ||
						this.state.dialogType === 'package_restore' && this.props.SPAPackagesRestore(row)
					})
				}
				else
				{
					this.state.dialogType === 'package_add' && this.props.SPAPackageAdd(this.state.rowData) ||
					this.state.dialogType === 'package_edit' && this.props.SPAPackageEdit(this.state.rowData) ||
					this.state.dialogType === 'package_version' && this.props.SPAPackageVersionAdd(this.state.rowData) ||
					this.state.dialogType === 'package_delete' && this.props.SPAPackagesDelete(this.state.rowData) ||
					this.state.dialogType === 'package_restore' && this.props.SPAPackagesRestore(this.state.rowData) ||
					this.state.dialogType === 'container_delete' && this.props.SPAPackagesContainerDelete(this.state.rowData) ||
					this.state.dialogType === 'package_view' && this.props.ClearProps(['spaPackageDetails'])
				}

				break
			case 'package_add':
			case 'package_edit':
			case 'package_delete':
			case 'package_restore':
			case 'package_version':
			case 'container_delete':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})

				break
			case 'package_view':			
				this.setState(
					{
						dialogType: name,
						rowData: data
					},
					() =>
					{
						this.props.SPAPackageDetailsLoad(data)
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

	validateSubmit = (submit_data) =>
	{
		if (_.isEmpty(submit_data.name)) return true
		if (_.isEmpty(submit_data.source) && (this.state.dialogType === 'package_add' || this.state.dialogType === 'package_version')) return true
		
		return false
	}

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
                    this.state.dialogType === 'package_add' && TEXT.SPA_BUTTON_NEW_PACKAGE ||
                    this.state.dialogType === 'package_edit' && TEXT.SPA_TOOLTIP_EDIT_PACKAGE ||
					this.state.dialogType === 'package_version' && TEXT.SPA_TOOLTIP_UPGRADE_PACKAGE ||
					this.state.dialogType === 'package_view' && `${TEXT.SPA_TOOLTIP_VIEW_PACKAGE} - ${this.state.rowData.name}` ||
					this.state.dialogType === 'package_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'package_restore' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'container_delete' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={this.state.dialogType === 'package_view' ? TEXT.MODAL_CLOSE : TEXT.MODAL_OK}
				cancelText={this.state.dialogType === 'package_view' ? null : TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction(this.state.dialogType === 'package_view' ? 'close' : 'submit')}
				handleCancelClick={this.handleAction('close')}
				confirmDisable={(this.state.dialogType === 'package_view' || _.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'package_add' || this.state.dialogType === 'package_edit' || this.state.dialogType === 'package_version') && this.renderAddEditPackage()
			}
			{
				(this.state.dialogType === 'package_delete' || this.state.dialogType === 'package_restore') && this.renderDeleteRestorePackage()
			}
			{
				this.state.dialogType === 'container_delete' && this.renderDeleteContainer()
			}
			{
				this.state.dialogType === 'package_view' && this.renderViewPackage()
			}
			</ModalDialog>
		)
	}

	renderDeleteRestorePackage = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'package_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.SPA_MESSAGE_DELETE_PACKAGES, this.state.rowData.length) : TEXT.SPA_MESSAGE_DELETE_PACKAGE) ||
						this.state.dialogType === 'package_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.SPA_MESSAGE_RESTORE_PACKAGES, this.state.rowData.length) : TEXT.SPA_MESSAGE_RESTORE_PACKAGE) ||
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
									{`${data.name} - ${data.code} - ${data.version}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.code} - ${this.state.rowData.version}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderDeleteContainer = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
						{ TEXT.SPA_MESSAGE_DELETE_CONTAINER }
					</Typography>
				</div>
			</div>
		)
	}

	renderAddEditPackage = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.SPA_TABLE_HEADER_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'package_version'}
					/>
				</div>
				{
					(this.state.dialogType === 'package_add' || this.state.dialogType === 'package_version') &&
					<div className={clsx(classes.divColumn)}>
						<Typography>{TEXT.SPA_TABLE_HEADER_SOURCE}</Typography>
						<CmsInputFile 
							name={'source'}
							value={this.state.rowData.source || []} 
							onChange={(source) => { this.handleAction('source', source)(null) }} 
							acceptFile={'.zip'}
						/>
					</div>
				}
			</div>
		)
	}	

	renderViewPackage = () =>
	{
		return (
			<CmsTable
				columns={[
					{
						title: TEXT.SPA_TABLE_HEADER_VERSION, field: 'version', width: 70,
					},
					{
						title: TEXT.SPA_TABLE_HEADER_HOST_URL, field: 'hostURL', sorting: false, width: 400,
						render: rowData =>
						{
							return (
								<a href={rowData.hostURL} target={'_blank'} >{rowData.hostURL}</a>
							)
						}
					},
				]}

				data={this.props.spaPackageDetails || []}

				options={{
					actionsColumnIndex: -1,
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

	renderSPAPackagesTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.SPA_TABLE_HEADER_NAME, field: 'name', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.name, columnDef)
                        },
						{
                            title: TEXT.SPA_TABLE_HEADER_CODE, field: 'code', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.code, columnDef)
                        },
						{
                            title: TEXT.SPA_TABLE_HEADER_VERSION, field: 'version', width: 150,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.version, columnDef)
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
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy', width: 400,
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
							icon: (props) => <Icons.IconView {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('package_view', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.SPA_TOOLTIP_VIEW_PACKAGE),
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
								this.handleAction('package_version', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.SPA_TOOLTIP_UPGRADE_PACKAGE),
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
								this.handleAction('package_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.SPA_TOOLTIP_EDIT_PACKAGE),
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
								this.handleAction('package_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.SPA_TOOLTIP_DELETE_PACKAGE),
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
								this.handleAction('package_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.SPA_TOOLTIP_RESTORE_PACKAGE),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.spaPackages || []}

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

					ignoredRender={this.state.isDialogOpen}

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

SPA.propTypes =
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
	SPAPackagesLoad: () =>
	{
		dispatch(ActionCMS.SPAPackagesLoad())
	},
	SPAPackageDetailsLoad: (spa_data) =>
	{
		dispatch(ActionCMS.SPAPackageDetailsLoad(spa_data))
	},
	SPAPackageAdd: (spa_data) =>
	{
		dispatch(ActionCMS.SPAPackageAdd(spa_data))
	},
	SPAPackageVersionAdd: (spa_data) =>
	{
		dispatch(ActionCMS.SPAPackageVersionAdd(spa_data))
	},
	SPAPackageEdit: (spa_data) =>
	{
		dispatch(ActionCMS.SPAPackageEdit(spa_data))
	},
	SPAPackagesDelete: (spa_data) =>
	{
		dispatch(ActionCMS.SPAPackagesDelete(spa_data))
	},
	SPAPackagesContainerDelete: () =>
	{
		dispatch(ActionCMS.SPAPackagesContainerDelete())
	},
	SPAPackagesRestore: (spa_data) =>
	{
		dispatch(ActionCMS.SPAPackagesRestore(spa_data))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(SPA);

