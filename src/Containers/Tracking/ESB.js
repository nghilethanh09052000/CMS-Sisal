import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { Typography, Button, TextField, FormControlLabel, Checkbox } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { WarningRounded } from '@material-ui/icons'

import TEXT from './Data/Text'
import { withMultipleStyles, customStyle } from '../../Styles'
import { COUNTRY_LIST_SERVER } from '../../Defines'
import Utils from '../../Utils'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import * as Icons from '../../Components/CmsIcons'
import CmsTable from '../../Components/CmsTable'
import CmsExcel from '../../Components/CmsExcel'
import CmsDate from '../../Components/CmsDate'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsControlPermission from '../../Components/CmsControlPermission'

const styles = theme => ({
	table: {
        flexGrow: 0,
        flexShrink: 0,
        marginTop: 0,
    },
	searchBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(2),
		marginBottom: theme.spacing(2)
	},
	cmsDate: {
		marginRight: theme.spacing(1),
	},
	marginRight: {
		marginRight: 15,
	},
	marginTop: {
		marginTop: theme.spacing(2),
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
const DATE_FORMAT = 'MMM DD YYYY'
const COUNTRY_ALL = 'All'
const COUNTRY_LIST = [COUNTRY_ALL, ..._.map(COUNTRY_LIST_SERVER, country => (country.code))]

class ESB extends React.Component
{
	constructor(props)
	{
		super(props)

		this.state = {
			dialogType: '',
            isDialogOpen: false,
			isExportOpen: false,
			rowData: {},
		}

		this.tableRef = React.createRef()
	}

    componentDidMount()
	{
		this.props.SetTitle(TEXT.TRACKING_ESB_TITLE)
	}

	componentWillUnmount() 
	{
		
	}

	componentDidUpdate(prevProps, prevState)
	{
		
	}

	static getDerivedStateFromProps(props, state)
	{
        if (props.needRefresh)
		{
			props.ClearRefresh()
			props.ESBLoad(state.search_date)
			
			return {
				isDialogOpen: false,
				dialogType: '',
				rowData: {}
			}
		}

        return null;
    }

    render()
    {
        const { classes } = this.props

		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderESBSTable()}
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
				this.state.dialogType === 'esb_add' && this.props.ESBAdd(this.state.rowData) ||
				this.state.dialogType === 'esb_trigger' && this.props.ESBTrigger(this.state.rowData) 

				break	
			case 'esb_add':
			case 'esb_trigger':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: data
				})

				break	
			case 'search_date':
				this.setState(
					{
						search_date: data,
					},
					() =>
					{
						this.props.ESBLoad({...data})
					}
				)
				
				break		
			default:
				this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: _.includes(['downloads', 'crashes'], name) ? (data === '' ? 0 : (isNaN(data) ? this.state.rowData[name] : parseInt(data))) : data
					}
                })
		}
	}			

	handleExportDialog = (isOpen) =>
	{
		this.setState({
			isExportOpen: isOpen
		})
	}

	formatExcelData = () =>
	{
		let result = []
		
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
            let { createdAt, modifiedAt, deletedAt, country, ...others} = value
			country = Utils.getCountryName(country)
			createdAt = createdAt === 0 ? '' : moment.utc(createdAt).format(FULLTIME_FORMAT)
			modifiedAt = modifiedAt === 0 ? '' : moment.utc(modifiedAt).format(FULLTIME_FORMAT)
			deletedAt = deletedAt === 0 ? '' : moment.utc(deletedAt).format(FULLTIME_FORMAT)
            return {...others, country, createdAt, modifiedAt, deletedAt}
        })
        
        console.log('formatExcelData:', result)
		return result
	}

	getExcelColumns = () =>
	{
		let columns = [
			{ title: TEXT.TABLE_HEADER_ID, field: 'id' },
			{ title: TEXT.TRACKING_ESB_TABLE_HEADER_TIME, field: 'date'},
			{ title: TEXT.TRACKING_ESB_TABLE_HEADER_VERSION, field: 'version' },
			{ title: TEXT.TRACKING_ESB_TABLE_HEADER_COUNTRY, field: 'country' },
			{ title: TEXT.TRACKING_ESB_TABLE_HEADER_STORE, field: 'store' },
			{ title: TEXT.TRACKING_ESB_TABLE_HEADER_DOWNLOADS, field: 'downloads' },
			{ title: TEXT.TRACKING_ESB_TABLE_HEADER_CRASHES, field: 'crashes' },
			{ title: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt' },
			{ title: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy' },
			{ title: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy' },
			{ title: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt' },
			{ title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt' },
		]

		return columns
	}

	validateSubmit = (submit_data) =>
	{
		if (this.state.dialogType === 'esb_add')
		{
			const { type, store, country } = submit_data
			return _.isEmpty(type) || _.isEmpty(store) || _.isEmpty(country)
		}

		return false
	}

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
                    this.state.dialogType === 'esb_add' && `${TEXT.TRACKING_ESB_BUTTON_ADD_ESB} - ${moment.utc(this.state.search_date.ms_begin_utc).format(DATE_FORMAT)}` ||
                    this.state.dialogType === 'esb_trigger' && `${TEXT.TRACKING_ESB_BUTTON_TRIGGER_ESB} - ${moment.utc(this.state.search_date.ms_begin_utc).format(DATE_FORMAT)}` ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'esb_add' || this.state.dialogType === 'esb_trigger') && this.renderAddTriggerESB()
			}
			</ModalDialog>
		)
	}

	renderAddTriggerESB = () =>
	{
		const { classes } = this.props

		return (
			<div>
				{
					this.state.dialogType === 'esb_add'
					?
					<>
						<div className={clsx(classes.divColumn)}>
							<Typography>{TEXT.TRACKING_ESB_TABLE_HEADER_COUNTRY}</Typography>
							<Autocomplete
								autoComplete
								autoSelect
								filterSelectedOptions
								value={this.state.rowData.country}
								options={COUNTRY_LIST}
								getOptionLabel={option => Utils.getCountryName(option)}
								onChange={(evt, value) => {
									this.handleAction('country', value)(evt)
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
							<Typography>{TEXT.TRACKING_ESB_TABLE_HEADER_STORE}</Typography>
							<Autocomplete
								autoComplete
								autoSelect
								filterSelectedOptions
								value={this.state.rowData.store}
								options={this.props.STORES}
								onChange={(evt, value) => {
									this.handleAction('store', value)(evt)
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
							<Typography>{TEXT.TRACKING_ESB_TABLE_HEADER_TYPE}</Typography>
							<Autocomplete
								autoComplete
								autoSelect
								filterSelectedOptions
								value={this.state.rowData.type}
								options={this.props.TYPES}
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
						{
							this.state.rowData.type && _.includes(this.state.rowData.type.toLowerCase(), 'download') &&
							<div className={clsx(classes.divColumn)}>
								<Typography>{TEXT.TRACKING_ESB_TABLE_HEADER_DOWNLOADS}</Typography>
								<TextField
									className={clsx(classes.inputTextField, classes.inputText)}
									value={this.state.rowData.downloads || 0}
									margin="normal"
									fullWidth
									variant={'outlined'}
									onChange={(evt) => { this.handleAction('downloads', evt.target.value)(evt) }}
								/>
							</div>
						}
						{	
							this.state.rowData.type && _.includes(this.state.rowData.type.toLowerCase(), 'crashes') &&
							<div className={clsx(classes.divColumn)}>
								<Typography>{TEXT.TRACKING_ESB_TABLE_HEADER_CRASHES}</Typography>
								<TextField
									className={clsx(classes.inputTextField, classes.inputText)}
									value={this.state.rowData.crashes || 0}
									margin="normal"
									fullWidth
									variant={'outlined'}
									onChange={(evt) => { this.handleAction('crashes', evt.target.value)(evt) }}
								/>
							</div>
						}
						<FormControlLabel
							control={
								<Checkbox
									color={'primary'}
									checked={this.state.rowData.newVersion || false}
									onChange={(evt, checked) => {
										this.handleAction('newVersion', checked)(evt)
									}}
								/>
							}
							label={TEXT.TRACKING_ESB_TABLE_HEADER_NEW_VERSION}
							labelPlacement={'end'}
						/>
					</>
					:
					<div className={classes.divRow}>
						<WarningRounded className={classes.warningIcon} fontSize={'large'} />
						<div className={clsx(classes.divColumn, classes.divFullWidth)}>
							<Typography>{TEXT.TRACKING_ESB_MESSAGE_TRIGGER_ESB}</Typography>
						</div>
					</div>
					
				}	
			</div>
		)
	}

	renderSearchBar = () =>
	{
		const { classes } = this.props
		const columns = this.getExcelColumns()
		return (
			<div className={clsx(classes.divColumn, classes.searchBar)}>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.divHeight, classes.alignCenter)}>
					<div className={clsx(classes.divRow, classes.divHeight, classes.justifyCenter)}>
						<div className={clsx(classes.divColumn, classes.divHeight, classes.cmsDate)}>
							<CmsDate
								views={['date']}
								enableFullTimeFormat={true}
								raiseSubmitOnMounted={true}
								disableToolbar={false}
								disableCheckMaxRange={true}
								onDateSubmit={(data) => {
									this.handleAction('search_date', data)(null)
								}}
								isSingleChoice={true}
								disabledEndDate={true}
							/>
						</div>
					</div>		
					<div className={clsx(classes.divRow)}>
						<CmsExcel
							classes={{ button: clsx(classes.buttonLeft) }}
							multiSheetData={this.formatExcelData}
							columns={columns}
							controlPermission={{
								link: '',
								attribute: ''
							}}
							onProgress={this.handleExportDialog}
						/>
						<CmsControlPermission
							control={
								<Button
									variant={'contained'}
									color={'primary'}
									onClick={this.handleAction('esb_trigger', { time: this.state.search_date })}
									className={clsx(classes.buttonLeft)}
									startIcon={<Icons.IconAdd/>}
								>
									{TEXT.TRACKING_ESB_BUTTON_TRIGGER_ESB}	
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
									onClick={this.handleAction('esb_add', { time: this.state.search_date, country: '', store: '', downloads: 0, crashes: 0, type: '', newVersion: false })}
									className={clsx(classes.buttonLeft)}
									startIcon={<Icons.IconAdd/>}
								>
									{TEXT.TRACKING_ESB_BUTTON_ADD_ESB}	
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

	renderESBSTable = () =>
	{
		const { classes } = this.props
	
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderSearchBar()}
                <CmsTable
                    columns={[
						{
                            title: TEXT.TRACKING_ESB_TABLE_HEADER_STORE, field: 'store', width: 150,
                        },
						{
                            title: TEXT.TRACKING_ESB_TABLE_HEADER_COUNTRY, field: 'country', width: 150,
							render: rowData => (Utils.getCountryName(rowData.country))
                        },
						{
                            title: TEXT.TRACKING_ESB_TABLE_HEADER_VERSION, field: 'version', width: 150,
                        },
						{
                            title: TEXT.TRACKING_ESB_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: TEXT.TRACKING_ESB_TABLE_HEADER_DOWNLOADS, field: 'downloads', width: 150,
                        },
						{
                            title: TEXT.TRACKING_ESB_TABLE_HEADER_CRASHES, field: 'crashes', width: 150,
                        },
						{
                            title: TEXT.TRACKING_ESB_TABLE_HEADER_TIME, field: 'date', width: 150,
							sorting: false
                        },
						{
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 250,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'createdAt'),
							sorting: false
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'modifiedAt'),
							sorting: false
						},
						{
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy', width: 350,
							render: rowData => this.renderOwnersColumn(rowData),
							sorting: false
                        },
						{
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy', hidden: true,
							sorting: false
                        },
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', width: 150,
                            render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'deletedAt'),
							sorting: false
                        },
                    ]}

                    data={this.props.esbs}

                    options={{
						actionsColumnIndex: -1,
						fixedColumns: {
							left: 1,
							right: 0
						},
                        showTitle: false,
                        search: true,
                        filtering: false,
						sorting: true,
                        pageSize: PAGE_SIZE,
						tableMaxHeight: TABLE_HEIGHT,
                        selection: false,
						cellStyle: { ...defaultCellStyle, textAlign: 'center' },
						headerStyle: { ...defaultHeaderStyle, textAlign: 'center', borderTop: `1px ${defaultBorderColor} solid` },
                    }}

					ignoredRender={this.state.isExportOpen}

					tableRef={this.tableRef}
                />
				<div className={clsx(classes.divColumn, classes.marginTop)}>
					<div className={clsx(classes.alignCenter,classes.divRow)}>
						<WarningRounded className={classes.warningIcon} fontSize={'large'} />
						<Typography>{TEXT.TRACKING_ESB_MESSAGE_ESB}</Typography>
					</div>
				</div>
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

ESB.propTypes =
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
	ESBLoad: (esb_data) =>
	{
		dispatch(ActionCMS.ESBLoad(esb_data))
	},
	ESBAdd: (esb_data) =>
	{
		dispatch(ActionCMS.ESBAdd(esb_data))
	},
	ESBTrigger: (esb_data) =>
	{
		dispatch(ActionCMS.ESBTrigger(esb_data))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle),
	withRouter
)(ESB);

