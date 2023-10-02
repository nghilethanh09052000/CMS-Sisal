import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import { saveAs } from 'file-saver'

import { Typography, Tabs, Tab, Button, TextField, IconButton, Tooltip, Chip } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { WarningRounded } from '@material-ui/icons'

import { DEBOUCE_WAITING_TIME } from '../../Defines'
import Utils from '../../Utils'
import TEXT from './Data/Text'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import * as Icons from '../../Components/CmsIcons'
import CmsControlPermission from '../../Components/CmsControlPermission'
import CmsTable from '../../Components/CmsTable'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsTabPanel from '../../Components/CmsTabPanel'
import CmsInputFile from '../../Components/CmsInputFile'

const styles = theme => ({
	tabs: {
		width: '63%'
	},
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
	tableMaxWidth:{
		maxWidth:'1000px',
		overflow:'scroll'
	},
	actionsExtendTable: {
		marginBottom: 0,
		marginLeft: 10,
    },
	textField: {
		marginBottom: 15,
		marginRight: 15,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	container: {
		width: '100%',
		overflowY: 'auto',
        maxHeight: '80vh',
		marginTop: 20,
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

const TITLE_WIDTH_3 = '50%'
const CURRENT_WIDTH = '60%'
const NEW_WIDTH = '35%'

const PAGE_SIZE = 10
const TABLE_HEIGHT = 640
const FULLTIME_FORMAT = 'MMM DD YYYY HH:mm'

const BUILDING_PAGE_SIZE = 5
const BUILDING_TABLE_HEIGHT = 290

class Building extends React.Component
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
			isPageOpen: false,
			rowData: {},
			tableTab: 0,
			currentBuildingType: ''
		}

		this.tableRef = React.createRef()
		this.selectedRows = []
		this.buildingTypes = null
		this.buildingParameters = null
		this.buildingParametersFetched = null

		this.monumentGroups = null
		this.monumentParameters = null
		this.monumentTypes = null
        this.monumentSettings = null
		this.fixedType = ['use','unlock']
		this.actionsExtendTable = {
			createElement: (parentProps) =>
			{
				const { classes } = this.props
				return (
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<div className={clsx(classes.divRow)}>
								<Autocomplete
									fullWidth
									autoComplete
									autoSelect
									filterSelectedOptions
									value={this.state.currentBuildingType}
									options={Object.keys(this.buildingTypes || {})}
									onChange={(evt, value) => {
										this.handleAction('currentBuildingType', value)(evt)
									}}
									disableClearable={true}
									renderInput={(params) => (
										<TextField {...params}
											variant="outlined"
											label={TEXT.BUILDING_TYPE_TITLE}
										/>
									)}
									classes={{
										root: clsx(classes.autoComplete, classes.actionsExtendTable),
										input: classes.autoCompleteInput,
										inputRoot: classes.autoCompleteInputRoot
									}}
								/>
							</div>
						</div>
					</div>
				)
			}
		}
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
													this.state.tableTab === 0 && this.handleAction('building_restore') ||
													this.state.tableTab === 1 && this.handleAction('parameter_restore') ||
													this.state.tableTab === 2 && this.handleAction('type_restore') || 
													this.state.tableTab === 3 && this.handleAction('monument_setting_restore') ||
													this.state.tableTab === 4 && this.handleAction('monument_parameter_restore') ||
													this.state.tableTab === 5 && this.handleAction('monument_type_restore') || 
													this.state.tableTab === 6 && this.handleAction('monument_group_restore') || null
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.RefreshIcon/>}
											>
											{
												this.state.tableTab === 0 && TEXT.BUILDING_BUTTON_RESTORE_BUILDING ||
												this.state.tableTab === 1 && TEXT.BUILDING_BUTTON_RESTORE_PARAM ||
												this.state.tableTab === 2 && TEXT.BUILDING_BUTTON_RESTORE_TYPE ||
												this.state.tableTab === 3 && TEXT.MONUMENT_BUTTON_RESTORE_SETTING ||
												this.state.tableTab === 4 && TEXT.MONUMENT_BUTTON_RESTORE_PARAM ||
												this.state.tableTab === 5 && TEXT.MONUMENT_BUTTON_RESTORE_TYPE || 
												this.state.tableTab === 6 && TEXT.MONUMENT_BUTTON_RESTORE_GROUP || ''
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
													this.state.tableTab === 0 && this.handleAction('building_delete') ||
													this.state.tableTab === 1 && this.handleAction('parameter_delete') ||
													this.state.tableTab === 2 && this.handleAction('type_delete') || 
													this.state.tableTab === 3 && this.handleAction('monument_setting_delete') ||
													this.state.tableTab === 4 && this.handleAction('monument_parameter_delete') ||
													this.state.tableTab === 5 && this.handleAction('monument_type_delete') || 
													this.state.tableTab === 6 && this.handleAction('monument_group_delete') || ''
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconRemove/>}
											>
											{
												this.state.tableTab === 0 && TEXT.BUILDING_BUTTON_DELETE_BUILDING ||
												this.state.tableTab === 1 && TEXT.BUILDING_BUTTON_DELETE_PARAM ||
												this.state.tableTab === 2 && TEXT.BUILDING_BUTTON_DELETE_TYPE || 
												this.state.tableTab === 3 && TEXT.MONUMENT_BUTTON_DELETE_SETTING ||
												this.state.tableTab === 4 && TEXT.MONUMENT_BUTTON_DELETE_PARAM ||
												this.state.tableTab === 5 && TEXT.MONUMENT_BUTTON_DELETE_TYPE || 
												this.state.tableTab === 6 && TEXT.MONUMENT_BUTTON_DELETE_GROUP || ''
											}
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
												this.state.tableTab === 0 && this.handleAction('building_add', { buildings: [], type: this.state.currentBuildingType, paramName: '', level: 0, value: 0 }) ||
												this.state.tableTab === 1 && this.handleAction('parameter_add', { type: '', paramName: '', valueType: '', description: '' }) ||
												this.state.tableTab === 2 && this.handleAction('type_add', { type: '' }) ||
												this.state.tableTab === 3 && this.handleAction('monument_setting_add', { typeName: '' , value: 0 , parameter:'' }) ||
												this.state.tableTab === 4 && this.handleAction('monument_parameter_add', { type: '', name: '' }) ||
												this.state.tableTab === 5 && this.handleAction('monument_type_add', { name: '' , groupName: ''}) ||
												this.state.tableTab === 6 && this.handleAction('monument_group_add', { name: ''}) 
											}
											className={clsx(classes.buttonLeft)}
											startIcon={<Icons.IconAdd/>}
											disabled={this.state.tableTab === 0 && _.isEmpty(this.state.currentBuildingType)}
										>
										{
											this.state.tableTab === 0 && TEXT.BUILDING_BUTTON_NEW_BUILDING ||
											this.state.tableTab === 1 && TEXT.BUILDING_BUTTON_NEW_PARAM ||
											this.state.tableTab === 2 && TEXT.BUILDING_BUTTON_NEW_TYPE || 
											this.state.tableTab === 3 && TEXT.MONUMENT_BUTTON_NEW_SETTING ||
											this.state.tableTab === 4 && TEXT.MONUMENT_BUTTON_NEW_PARAM ||
											this.state.tableTab === 5 && TEXT.MONUMENT_BUTTON_NEW_TYPE ||
											this.state.tableTab === 6 && TEXT.MONUMENT_BUTTON_NEW_GROUP || ''
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
			props.ClearRefresh()
			
			if (state.dialogType === 'building_export')
			{
				saveAs(new Blob([props.fileData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${TEXT.BUILDING_BUILDING_TITLE}.xlsx`)
				props.ClearProps(['fileData'])
			}
			else
			{
				state.tableTab === 0 && props.BuildingsLoad(state.currentBuildingType) ||
				state.tableTab === 1 && props.BuildingParametersLoad() ||
				state.tableTab === 2 && props.BuildingTypesLoad() ||

				state.tableTab === 3 && props.MonumentSettingsLoad() ||
				state.tableTab === 4 && props.MonumentParametersLoad() ||
				state.tableTab === 5 && props.MonumentTypesLoad() ||
				state.tableTab === 6 && props.MonumentGroupsLoad()
			}

			return {
				isDialogOpen: false,
				isMultiSelectMode: false,
				isPageOpen: false,
				dialogType: '',
				rowData: {},
			}
		}

        return null; // No change to state
    }

	componentDidMount()
	{
		this.props.SetTitle(TEXT.BUILDING_MANAGEMENT_TITLE)
		
		// Building:
		this.props.BuildingTypesLoad()
		this.props.BuildingParametersLoad()
	}

	componentWillUnmount() 
	{
		this.props.ClearProps(['buildings'])
	}

	componentDidUpdate(prevProps, prevState)
	{
		if (this.props !== prevProps)
		{
			(this.state.tableTab === 0 || this.state.tableTab === 1) && this.formatBuildingParameters()
			// Nghi kiểm tra đk
			this.formatMonumentProperty()
		}
	}

	render()
	{
		const { classes } = this.props
		
		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.state.isPageOpen ?  this.renderEditBuildings() : this.renderTableTabs()}
				{this.renderDialog()}
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
				return isNaN(strData) ? (columnDef.searchAlgorithm === 'includes' ? _.includes(strData, value) : _.startsWith(strData, value)) : (strData == value)
			}

			return false
		})
	}

	formatBuildingParameters = () =>
	{
		if (this.buildingParametersFetched !== this.props.buildingParameters)
		{
			this.buildingParametersFetched = this.props.buildingParameters

			const buildingParameters = _.reduce(this.props.buildingParameters, (buildingParameters, row) => {
				return row.deletedAt === 0 ? [...buildingParameters, row] : buildingParameters
			}, [])

			this.buildingTypes = _.reduce(_.groupBy(buildingParameters || [], type => type.type), (result, value, key) =>
			{
				return {...result, [key]: _.map(value, param => (param.paramName))}
			}, {})

			// console.log('formatBuildingTypes', this.buildingTypes)

			this.buildingParameters = _.reduce(_.groupBy(buildingParameters || [], paramName => paramName.paramName), (result, value, key) =>
			{
				return {...result, [key]: _.map(value, type => (type.type))}
			},{})

			// console.log('formatBuildingParameters', this.buildingParameters)

			if (this.state.currentBuildingType === '' && !_.isEmpty(this.buildingTypes))
			{
				const currentBuildingType = Object.keys(this.buildingTypes)[0] || ''

				this.setState(
					{
						currentBuildingType
					},
					() =>
					{
						this.props.BuildingsLoad(currentBuildingType)
					}
				)
			}
		}
	}

	formatMonumentProperty = () =>
	{
		const monumentTypes = _.reduce(this.props.monumentTypes || [],(result,currentValue)=>{
			return currentValue.deletedAt === 0 ? [...result,currentValue] : result
		},[])
		this.monumentTypes = _.reduce(_.groupBy(monumentTypes  || [],({name})=>name), (result,value,key) =>{
			return {...result,[key]: _.map(value,currentName=>(currentName.name)) }
		},{})
		
		const monumentParameters = _.reduce(this.props.monumentParameters || [],(result,currentValue)=>{
			return currentValue.deletedAt === 0 ? [...result,currentValue] : result
		},[])
		this.monumentParameters = _.reduce(_.groupBy(monumentParameters  || [],({name})=>name), (result,value,key) =>{
			return {...result,[key]: _.map(value,currentName=>(currentName.name)) }
		},{})


		const monumentGroups = _.reduce(this.props.monumentGroups || [],(result,currentValue)=>{
			return currentValue.deletedAt === 0 ? [...result,currentValue] : result
		},[])
		this.monumentGroups = _.reduce(_.groupBy(monumentGroups  || [],({name})=>name), (result,value,key) =>{
			return {...result,[key]: _.map(value,currentName=>(currentName.name)) }
		},{})
	
		
	}

	handleAction = (name, data) => (evt) =>
	{
		switch (name)
		{
			case 'close':
				this.setState({
					isDialogOpen: false,
					isPageOpen: false,
					dialogType: '',
					rowData: {}
				})

				break
			case 'submit':
				if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						if (this.state.dialogType === 'building_delete')
						{
							const { tableData, type, level, ...others } = row
							let items = _.reduce(Object.values(others), (items, value) => {
								return typeof value === 'object' ? [...items, { id: value.id }] : items
							}, [])

							this.props.BuildingsDelete({ type, level, items })
						}
						else if (this.state.dialogType === 'building_restore')
						{
							const { tableData, type, level, ...others } = row
							let items = _.reduce(Object.values(others), (items, value) => {
								return typeof value === 'object' ? [...items, { id: value.id }] : items
							}, [])

							this.props.BuildingsRestore({ type, level, items })
						}
						else
						{	
							this.state.dialogType === 'parameter_delete' && this.props.BuildingParameterDelete(row) ||
							this.state.dialogType === 'parameter_restore' && this.props.BuildingParameterRestore(row) ||

							this.state.dialogType === 'type_delete' && this.props.BuildingTypeDelete(row) ||
							this.state.dialogType === 'type_restore' && this.props.BuildingTypeRestore(row) ||

							this.state.dialogType === 'monument_setting_delete' && this.props.MonumentSettingsDelete(row) ||
							this.state.dialogType === 'monument_setting_restore' && this.props.MonumentSettingsRestore(row) ||

							this.state.dialogType === 'monument_parameter_delete' && this.props.MonumentParametersDelete(row) ||
							this.state.dialogType === 'monument_parameter_restore' && this.props.MonumentParametersRestore(row) ||

							this.state.dialogType === 'monument_type_delete' && this.props.MonumentTypesDelete(row) ||
							this.state.dialogType === 'monument_type_restore' && this.props.MonumentTypesRestore(row) || 

							this.state.dialogType === 'monument_group_delete' && this.props.MonumentGroupsDelete(row) ||
							this.state.dialogType === 'monument_group_restore' && this.props.MonumentGroupsRestore(row)
						}	
					})
				}
				else
				{
					if (this.state.dialogType === 'building_add')
					{
						_.forEach(this.state.rowData.buildings, row => {
							this.props.BuildingAdd(row)
						})
					}
					else if (this.state.dialogType === 'building_multi_edit')
					{
						const { buildings, ...others} = this.state.rowData
						_.forEach(Object.keys(others), key => {
							let row = _.find(buildings, building => (key === building.id && this.state.rowData[key] !== building.value))
							if (row)
							{
								row = {...row, value: this.state.rowData[key]}
								this.props.BuildingsEdit(row)
							}
						})
					}
					else if (this.state.dialogType === 'building_delete')
					{
						const { tableData, type, level, ...others } = this.state.rowData
						let items = _.reduce(Object.values(others), (items, value) => {
							return typeof value === 'object' ? [...items, { id: value.id }] : items
						}, [])

						this.props.BuildingsDelete({ type, level, items })
					}
					else if (this.state.dialogType === 'building_restore')
					{
						const { tableData, type, level, ...others } = this.state.rowData
						let items = _.reduce(Object.values(others), (items, value) => {
							return typeof value === 'object' ? [...items, { id: value.id }] : items
						}, [])

						this.props.BuildingsRestore({ type, level, items })
					}
					else
					{
						this.state.dialogType === 'building_edit' && this.props.BuildingEdit(this.state.rowData) ||
						this.state.dialogType === 'building_import' && this.props.ResourcesImport('building', this.state.rowData)

						this.state.dialogType === 'parameter_add' && this.props.BuildingParameterAdd(this.state.rowData) ||
						this.state.dialogType === 'parameter_edit' && this.props.BuildingParameterEdit(this.state.rowData) ||
						this.state.dialogType === 'parameter_delete' && this.props.BuildingParameterDelete(this.state.rowData) ||
						this.state.dialogType === 'parameter_restore' && this.props.BuildingParameterRestore(this.state.rowData) ||

						this.state.dialogType === 'type_add' && this.props.BuildingTypeAdd(this.state.rowData) ||
						this.state.dialogType === 'type_delete' && this.props.BuildingTypeDelete(this.state.rowData) ||
						this.state.dialogType === 'type_restore' && this.props.BuildingTypeRestore(this.state.rowData) ||

						this.state.dialogType === 'monument_setting_add' && this.props.MonumentSettingsAdd(this.state.rowData) ||
						this.state.dialogType === 'monument_setting_edit' && this.props.MonumentSettingsEdit(this.state.rowData) ||
						this.state.dialogType === 'monument_setting_delete' && this.props.MonumentSettingsDelete(this.state.rowData) ||
						this.state.dialogType === 'monument_setting_restore' && this.props.MonumentSettingsRestore(this.state.rowData) ||

						this.state.dialogType === 'monument_parameter_add' && this.props.MonumentParametersAdd(this.state.rowData) ||
						this.state.dialogType === 'monument_parameter_delete' && this.props.MonumentParametersDelete(this.state.rowData) ||
						this.state.dialogType === 'monument_parameter_restore' && this.props.MonumentParametersRestore(this.state.rowData) ||

						this.state.dialogType === 'monument_type_add' && this.props.MonumentTypesAdd(this.state.rowData) ||
						this.state.dialogType === 'monument_type_delete' && this.props.MonumentTypesDelete(this.state.rowData) ||
						this.state.dialogType === 'monument_type_restore' && this.props.MonumentTypesRestore(this.state.rowData)
						
						this.state.dialogType === 'monument_group_add' && this.props.MonumentGroupsAdd(this.state.rowData) ||
						this.state.dialogType === 'monument_group_delete' && this.props.MonumentGroupsDelete(this.state.rowData) ||
						this.state.dialogType === 'monument_group_restore' && this.props.MonumentGroupsRestore(this.state.rowData) 
					}
				}

				break
			case 'type_add':
			case 'type_delete':
			case 'type_restore':
			case 'parameter_add':
			case 'parameter_edit':
			case 'parameter_delete':
			case 'parameter_restore':
			case 'building_add':
			case 'building_edit':
			case 'building_delete':
			case 'building_restore':
			case 'building_import':
			case 'monument_type_add':
			case 'monument_type_delete':
			case 'monument_type_restore':
			case 'monument_parameter_add':
			case 'monument_parameter_delete':
			case 'monument_parameter_restore':
			case 'monument_group_add':
			case 'monument_group_delete':
			case 'monument_group_restore':
            case 'monument_setting_add':
			case 'monument_setting_edit':
			case 'monument_setting_delete':
			case 'monument_setting_restore':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})

				break
			case 'building_multi_add':
				this.setState({
                    rowData: {
						...this.state.rowData, 
						buildings: [...this.state.rowData.buildings, { type: this.state.currentBuildingType, paramName: this.state.rowData.paramName, level: this.state.rowData.level, value: this.state.rowData.value }]
					}
                })

				break	
			case 'building_multi_edit':
				this.rowData = data
				this.setState({
					isPageOpen: true,
					dialogType: name,
					rowData: data
				})

				break
			case 'building_multi_delete':
				this.setState({
					rowData: {
						...this.state.rowData, 
						buildings: _.reject(this.state.rowData.buildings, building => _.isEqual(building, data))
					}
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
						if (this.state.tableTab === 0)
						{
							this.props.BuildingTypesLoad()
							this.props.BuildingParametersLoad()
							this.props.BuildingsLoad(this.state.currentBuildingType)
						}
						else if (this.state.tableTab === 1)
						{
							this.props.BuildingParametersLoad()
							this.props.BuildingTypesLoad()
						}
						else if (this.state.tableTab === 2)
						{
							this.props.BuildingTypesLoad()
						}
						else if (this.state.tableTab === 3)
						{
							this.props.MonumentSettingsLoad()
							this.props.MonumentParametersLoad()
							this.props.MonumentTypesLoad()
						}
						else if (this.state.tableTab === 4)
						{
							this.props.MonumentParametersLoad()
							this.props.MonumentTypesLoad()
						}
						else if (this.state.tableTab === 5)
						{
							this.props.MonumentTypesLoad()
							this.props.MonumentGroupsLoad()
						}
						else if (this.state.tableTab === 6)
						{
							this.props.MonumentGroupsLoad()
						}
					}
				)

				break
			case 'currentBuildingType':
				this.setState(
					{
						currentBuildingType: data,
						isMultiSelectMode: false,
					},
					() =>
					{
						this.selectedRows = []
						this.props.ClearProps(['buildings'])
						this.props.BuildingsLoad(data)
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
			case 'building_value':
				this.setState({
                    rowData: {
						...this.state.rowData, 
						[data.id]: data.valueType === this.props.buildingValueTypes[0] ? (data.value === '' ? 0 : (isNaN(data.value) ? this.state.rowData[data.id] || 0 : parseInt(data.value))) : data.value
					}
                })

				break
			case 'building_export':
				this.setState(
					{
						dialogType: name,
						rowData: data
					},
					() =>
					{
						this.props.ResourcesExport('building')
					}
				)

				break
			case 'paramName':
				const valueType = _.find(this.props.buildingParameters, param => (param.paramName === data))?.valueType || ''

				this.setState({
                    rowData: {
						...this.state.rowData, 
						paramName: data,
						valueType,
						value: valueType === this.props.buildingValueTypes[0] ? 0 : (valueType === this.props.buildingValueTypes[2] ? [] : '')
					}
                })

				break	
            default:
                this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: (name === 'level' || (name === 'value' && this.state.rowData.valueType === this.props.buildingValueTypes[0])) ? (data === '' ? 0 : (isNaN(data) ? this.state.rowData[name] : parseInt(data))) : data
					}
                })
		}		
	}

	validateBuilding = () =>
	{
		const { buildings, paramName, level, value, valueType } = this.state.rowData
		return _.isEmpty(paramName) || (_.isEmpty(value) && valueType !== this.props.buildingValueTypes[0]) || _.find(buildings, building => _.isEqual({ paramName: building.paramName, level: building.level }, { paramName, level })) !== undefined
	}

    validateSubmit = (submit_data) =>
	{
		if (this.state.dialogType === 'building_import')
		{
			return _.isEmpty(submit_data.file)
		}

		if (this.state.tableTab === 2 || this.state.tableTab === 6)
		{
			return _.isEmpty(submit_data.type || submit_data.name)
		}
		if(this.state.tableTab === 4 || this.state.tableTab === 5)
		{
			return _.isEmpty(submit_data.name) && 
					(_.isEmpty(submit_data.type) || 
					_.isEmpty(submit_data.groupName))
		}

		const { 
			type, 
			paramName,
			typeName,
			parameter,
			valueType,
			buildings,
			...others
		} = submit_data;

		if(this.state.tableTab === 0)
		{
			if (this.state.dialogType === 'building_delete' || this.state.dialogType === 'building_add')
			{
				return _.isEmpty(buildings)
			}

			if (this.state.dialogType === 'building_multi_edit')
			{
				let result = _.isEmpty(others)
				if (!result)
				{
					_.some(Object.keys(others), key => {
						result = _.find(buildings, building => (key === building.id && building.value === submit_data[key])) === undefined
						return result
					})

					return !result
				}

				return result
			}
		}

		if(this.state.tableTab === 1)
		{
			let result = _.some(Object.keys({type, paramName, valueType}), key => {
				return _.isEmpty(submit_data[key])
			})

			return result
		}

		if(this.state.tableTab === 3)
		{
			let result = _.some(Object.keys({typeName,parameter}), key => {
				return _.isEmpty(submit_data[key])
			})

			return result
		}
		
	}

	getAvailableValues = (src, param, deletedAt = 0) =>
	{
		return _.reduce(src, (result, row) => {
			return row.deletedAt === deletedAt ? [...result, row[param]] : result
		}, [])
	}

	getTableColumns = () =>
	{
		let columns = [
			{ 
				title: TEXT.BUILDING_TABLE_HEADER_TYPE, field: 'type', disableClick: true, width: 150,
				defaultFilter: this.state[`default_filter_type`] || '', 
			},
			{ 
				title: TEXT.BUILDING_TABLE_HEADER_LEVEL, field: 'level', disableClick: true, width: 150,
				defaultFilter: this.state[`default_filter_level`] || '',
				customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.level, columnDef), 
			},
		]

		_.forEach(this.buildingTypes[this.state.currentBuildingType] || [], field => {
			columns = [
				...columns, 
				{
					title: Utils.convertCamelcaseToNormal(field), field: field, width: 150,
					defaultFilter: this.state[`default_filter_${field}`] || '',
					disableClick: false,
					customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, typeof rowData[field] == 'object' ? rowData[field].value : rowData[field], columnDef),
					render: rowData =>
					{
						return (
							typeof rowData[field] == 'object' 
							?	Array.isArray(rowData[field].value)
								?	this.renderChipsColumn(rowData[field].value, 1)
								: 	rowData[field].value 
							: 	rowData[field]
						)
					}
				}
			]
		})

		columns = [
			...columns,
			{
				title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', filtering: false, disableClick: true, width: 250,
				render: rowData => this.renderDateColumn(rowData),
				customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true),
			},
			{
				title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', filtering: false, hidden: true, disableClick: true,
				customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true),
			},
			{
				title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy', filtering: false, disableClick: true, width: 350,
				render: rowData => this.renderOwnersColumn(rowData)
			},
			{
				title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy', filtering: false, hidden: true, disableClick: true,
			},
			{
				title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', filtering: false, disableClick: true, width: 150,
				render: rowData => this.renderDeletedAtColumn(rowData),
				customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true),
			},
		]

		// console.log('getTableColumns', columns)
		return columns
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
								onClick={this.handleAction('building_import', {})}
								className={clsx(classes.buttonLeft)}
								startIcon={<Icons.IconAdd/>}
							>
								{ TEXT.BUILDING_BUTTON_IMPORT }
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
								onClick={this.handleAction('building_export', {})}
								className={clsx(classes.buttonLeft)}
								startIcon={<Icons.ExportIcon/>}
							>
								{ TEXT.BUILDING_BUTTON_EXPORT }
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
						{/* Building */}
						<Tab label={TEXT.BUILDING_TAB_BUILDING}/>
						<Tab label={TEXT.BUILDING_TAB_PARAM} />
						<Tab label={TEXT.BUILDING_TAB_TYPE} />
						{/* Monument */}
						<Tab label={TEXT.MONUMENT_TAB_SETTING} />
						<Tab label={TEXT.MONUMENT_TAB_PARAM} />
						<Tab label={TEXT.MONUMENT_TAB_TYPE} />
                        <Tab label={TEXT.MONUMENT_TAB_GROUP}/>
					</Tabs>
					{
						this.actionsExtend.createElement(this.actionsExtend)
					}
				</div>
				<CmsTabPanel value={this.state.tableTab} index={0}>
				{
					this.renderBuildingsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={1}>
				{
					this.renderParametersTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={2} >
				{
					this.renderTypesTable()
				}
				</CmsTabPanel>
				{/* Monument */}
				<CmsTabPanel value={this.state.tableTab} index={3} >
				{
					this.renderMonumentSettingsTable()
				}
				</CmsTabPanel> 
				<CmsTabPanel value={this.state.tableTab} index={4} >
				{
					this.renderMonumentParametersTable()
				}
				</CmsTabPanel>  
				<CmsTabPanel value={this.state.tableTab} index={5} >
				{
					this.renderMonumentTypesTable()
				}
				</CmsTabPanel> 
				<CmsTabPanel value={this.state.tableTab} index={6} >
				{
					this.renderMonumentGroupsTable()
				}
				</CmsTabPanel>
			</>	
		)	
	}

	renderBuildingsTable = () =>
	{
		const { classes } = this.props
		
		if (this.buildingTypes === null || this.props.isLoading !== 0) return null

		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={this.getTableColumns()}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								let { type, level, createdAt, createdBy, tableData, modifiedAt, modifiedBy, deletedAt, ...buildings} = rowData
								rowData = { 
									buildings: _.map(Object.keys(buildings), key => {
										const valueType = _.find(this.props.buildingParameters, param => (param.paramName === key))?.valueType || ''
										return {...buildings[key], paramName: key, type, level, valueType}
									})
								}

								this.handleAction('building_multi_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.BUILDING_TOOLTIP_EDIT_BUILDINGS),
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
								this.handleAction('building_delete', rowData)(event)
							},
							tooltip: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.BUILDING_TOOLTIP_DELETE_BUILDING,
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt > 0) ? true : false,
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
								this.handleAction('building_restore', rowData)(event)
							},
							tooltip: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.BUILDING_TOOLTIP_RESTORE_BUILDING,
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0) ? true : false,	
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.buildingParameters ? this.props.buildings || [] : []}

                    options={{
						actionsColumnIndex: -1,
						fixedColumns: {
							left: 2,
							right: -100
						},
						tableStickyHeader: false,
                        showTitle: false,
                        search: true,
                        filtering: true,
						sorting: true,
						cellAction: true,
                        pageSize: (PAGE_SIZE - 2),
						tableMaxHeight: TABLE_HEIGHT,
                        selection: true,
						cellStyle: { ...defaultCellStyle, textAlign: 'center' },
						headerStyle: { ...defaultHeaderStyle, textAlign: 'center', borderTop: `1px ${defaultBorderColor} solid` },
                    }}

					onClickCell={(event, rowData, columnDef) =>
					{
						if (rowData.hasOwnProperty(columnDef.field))
						{
							const { type, level, [columnDef.field]: { id, value }} = rowData
							const valueType = _.find(this.props.buildingParameters, param => (param.paramName === columnDef.field))?.valueType || ''
							this.handleAction('building_edit', { id, type, paramName: columnDef.field, level, value, valueType })(event)
						}
					}}

					onSelectionChange={(selectedRows, dataClicked) =>
					{
						this.selectedRows = selectedRows
						const isMultiSelectMode = selectedRows.length > 1
						isMultiSelectMode !== this.state.isMultiSelectMode && this.setState({ isMultiSelectMode })
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

					ignoredRender={this.state.isDialogOpen || this.state.isImportOpen || this.state.isExportOpen}

					tableRef={this.tableRef}

					actionsExtend={this.actionsExtendTable}
                />
            </div>		
		)
	}

	renderParametersTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.BUILDING_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: TEXT.BUILDING_TABLE_HEADER_PARAM, field: 'paramName', width: 250,
                        },
						{
                            title: TEXT.BUILDING_TABLE_HEADER_VALUE_TYPE, field: 'valueType', width: 150,
                        },
						{
                            title: TEXT.BUILDING_TABLE_HEADER_DESCRIPTION, field: 'description', sorting: false, width: 150,
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 260,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true),
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true),
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
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('parameter_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.BUILDING_TOOLTIP_EDIT_BUILDING),
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
								this.handleAction('parameter_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.BUILDING_TOOLTIP_DELETE_BUILDING),
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
								this.handleAction('parameter_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.BUILDING_TOOLTIP_RESTORE_BUILDING),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.buildingParameters || []}

                    options={{
						actionsColumnIndex: -1,
						fixedColumns: {
							left: 2,
							right: -100
						},
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

	renderTypesTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.BUILDING_TABLE_HEADER_TYPE, field: 'type', width: 101,
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 230,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true),
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true),
						},
						{
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdAt', width: 260,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, field: 'modifiedBy', hidden: true,
                        },
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', width: 150,
                            render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconRemove {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('type_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.BUILDING_TOOLTIP_DELETE_BUILDING),
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.BUILDING_TOOLTIP_RESTORE_BUILDING),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.buildingTypes || []}

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

	renderMonumentSettingsTable = () =>
    {
        const { classes, monumentSettings } = this.props;
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_TYPE, field: 'typeName', width: 101,
                        },
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_PARAM, field: 'parameter', width: 101,
                        },
                        {
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_VALUE, field: 'value', width: 101,
                        },
                        {
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_DATE, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_CREATED_DATE, field: 'createdAt', width: 230,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true),
                        },
						{
							title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_MODIFIED_DATE, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true),
						},
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_OWNER, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_CREATED_BY, field: 'createdBy', width: 260,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_OWNER, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_MODIFIED_BY, field: 'modifiedBy', hidden: true,
                        },
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_DELETED_AT, field: 'deletedAt', width: 150,
                            render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('monument_setting_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.MONUMENT_TOOLTIP_EDIT_MONUMENT),
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
								this.handleAction('monument_setting_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.MONUMENT_TOOLTIP_DELETE_MONUMENT),
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
								this.handleAction('monument_setting_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.MONUMENT_TOOLTIP_RESTORE_MONUMENT),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={monumentSettings || []}

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
						headerStyle: { ...defaultHeaderStyle, textAlign: 'center', borderTop: `1px ${defaultBorderColor} solid`},
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

	renderMonumentParametersTable = () =>
	{
		const { classes , monumentParameters  } = this.props
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_NAME, field: 'name', width: 101,
                        },
                        {
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_TYPE, field: 'type', width: 101,
                        },
                        {
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_DATE, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_CREATED_DATE, field: 'createdAt', width: 230,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true),
                        },
						{
							title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_MODIFIED_DATE, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true),
						},
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_OWNER, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_CREATED_BY, field: 'createdBy', width: 260,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_OWNER, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_MODIFIED_BY, field: 'modifiedBy', hidden: true,
                        },
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_DELETED_AT, field: 'deletedAt', width: 150,
                            render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconRemove {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('monument_parameter_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.MONUMENT_TOOLTIP_DELETE_MONUMENT),
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
								this.handleAction('monument_parameter_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.MONUMENT_TOOLTIP_RESTORE_MONUMENT),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.monumentParameters || []}

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

	renderMonumentTypesTable = () =>
	{
		const { classes, monumentTypes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_NAME, field: 'name', width: 101,
                        },
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_GROUP, field: 'groupName', width: 101,
                        },
                        {
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_DATE, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_CREATED_DATE, field: 'createdAt', width: 230,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true),
                        },
						{
							title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_MODIFIED_DATE, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true),
						},
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_OWNER, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_CREATED_BY, field: 'createdAt', width: 260,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_OWNER, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_MODIFIED_BY, field: 'modifiedBy', hidden: true,
                        },
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_DELETED_AT, field: 'deletedAt', width: 150,
                            render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconRemove {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('monument_type_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.MONUMENT_TOOLTIP_DELETE_MONUMENT),
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
								this.handleAction('monument_type_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.MONUMENT_TOOLTIP_RESTORE_MONUMENT),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={monumentTypes || []}

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

	renderMonumentGroupsTable = () =>
	{
		const { classes, monumentGroups } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_NAME, field: 'name', width: 101,
                        },
                        {
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_DATE, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_CREATED_DATE, field: 'createdAt', width: 230,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true),
                        },
						{
							title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_MODIFIED_DATE, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true),
						},
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_OWNER, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_CREATED_BY, field: 'createdBy', width: 260,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_OWNER, placeholder: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_MODIFIED_BY, field: 'modifiedBy', hidden: true,
                        },
						{
                            title: TEXT.MONUMENT_TABLE_HEADER_MONUMENT_DELETED_AT, field: 'deletedAt', width: 150,
                            render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconRemove {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('monument_group_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.MONUMENT_TOOLTIP_DELETE_MONUMENT),
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
								this.handleAction('monument_group_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.MONUMENT_TOOLTIP_RESTORE_MONUMENT),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={monumentGroups || []}

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

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
					this.state.dialogType === 'building_add' && `${TEXT.BUILDING_BUTTON_NEW_BUILDING} - ${this.state.currentBuildingType}` ||
					this.state.dialogType === 'building_edit' && `${TEXT.BUILDING_BUTTON_EDIT_BUILDING} - ${this.state.currentBuildingType}` ||
                    this.state.dialogType === 'building_multi_edit' && TEXT.BUILDING_BUTTON_EDIT_BUILDING ||
					this.state.dialogType === 'building_import' && `${TEXT.BUILDING_BUTTON_IMPORT} ${TEXT.BUILDING_BUILDING_TITLE}` ||
                    this.state.dialogType === 'building_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'building_restore' && TEXT.REMIND_TITLE ||
					
					this.state.dialogType === 'parameter_add' && TEXT.BUILDING_BUTTON_NEW_PARAM ||
                    this.state.dialogType === 'parameter_edit' && TEXT.BUILDING_BUTTON_EDIT_PARAM ||
                    this.state.dialogType === 'parameter_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'parameter_restore' && TEXT.REMIND_TITLE ||

					this.state.dialogType === 'type_add' && TEXT.BUILDING_BUTTON_NEW_TYPE ||
                    this.state.dialogType === 'type_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'type_restore' && TEXT.REMIND_TITLE ||

					this.state.dialogType === 'monument_setting_add' && TEXT.MONUMENT_BUTTON_NEW_SETTING ||
					this.state.dialogType === 'monument_setting_edit' && TEXT.MONUMENT_BUTTON_EDIT_SETTING ||
                    this.state.dialogType === 'monument_setting_delete' && TEXT.MONUMENT_REMIND_TITLE ||
					this.state.dialogType === 'monument_setting_restore' && TEXT.MONUMENT_REMIND_TITLE || 

                    this.state.dialogType === 'monument_group_add' && TEXT.MONUMENT_BUTTON_NEW_GROUP ||
                    this.state.dialogType === 'monument_group_delete' && TEXT.MONUMENT_REMIND_TITLE ||
					this.state.dialogType === 'monument_group_restore' && TEXT.MONUMENT_REMIND_TITLE ||
					
					this.state.dialogType === 'monument_parameter_add' && TEXT.MONUMENT_BUTTON_NEW_PARAM ||
                    this.state.dialogType === 'monument_parameter_delete' && TEXT.MONUMENT_REMIND_TITLE ||
					this.state.dialogType === 'monument_parameter_restore' && TEXT.MONUMENT_REMIND_TITLE ||

					this.state.dialogType === 'monument_type_add' && TEXT.MONUMENT_BUTTON_NEW_TYPE ||
                    this.state.dialogType === 'monument_type_delete' && TEXT.MONUMENT_REMIND_TITLE ||
					this.state.dialogType === 'monument_type_restore' && TEXT.MONUMENT_REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={
					(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore'))
					? false 
					: this.validateSubmit(this.state.rowData)
				}
			>
			{
				(this.state.dialogType === 'building_delete' || this.state.dialogType === 'building_restore') && this.renderDeleteRestoreBuilding()
			}
			{
				(this.state.dialogType === 'building_add' || this.state.dialogType === 'building_edit') && this.renderAddEditBuilding()
			}
			{
				this.state.dialogType === 'building_import' && this.renderImportBuilding()
			}
			{
				(this.state.dialogType === 'parameter_delete' || this.state.dialogType === 'parameter_restore') && this.renderDeleteRestoreParameter()
			}
			{
				(this.state.dialogType === 'parameter_add' || this.state.dialogType === 'parameter_edit') && this.renderAddEditParameter()
			}
			{
				(this.state.dialogType === 'type_delete' || this.state.dialogType === 'type_restore') && this.renderDeleteRestoreType()
			}
			{
				this.state.dialogType === 'type_add' && this.renderAddType()
			}

			{
				(this.state.dialogType === 'monument_setting_add' || this.state.dialogType === 'monument_setting_edit') && this.renderMonumentAddEditSetting()
			}
			{
				(this.state.dialogType === 'monument_setting_delete' || this.state.dialogType === 'monument_setting_restore') && this.renderMonumentDeleteRestoreSetting()
			}
			{
				(this.state.dialogType === 'monument_parameter_delete' || this.state.dialogType === 'monument_parameter_restore') && this.renderMonumentDeleteRestoreParameter()
			}
			{
				(this.state.dialogType === 'monument_parameter_add' || this.state.dialogType === 'monument_parameter_edit') && this.renderMonumentAddParameter()
			}
			{
				(this.state.dialogType === 'monument_type_delete' || this.state.dialogType === 'monument_type_restore') && this.renderMonumentDeleteRestoreType()
			}
			{
				this.state.dialogType === 'monument_type_add' && this.renderMonumentAddType()
			} 
			{
				(this.state.dialogType === 'monument_group_delete' || this.state.dialogType === 'monument_group_restore') && this.renderMonumentDeleteRestoreGroup()
			}
			{
				(this.state.dialogType === 'monument_group_add') && this.renderMonumentAddGroup()
			}
			</ModalDialog>
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
						this.state.dialogType === 'type_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.BUILDING_MESSAGE_DELETE_TYPES, this.state.rowData.length) : TEXT.BUILDING_MESSAGE_DELETE_TYPE) ||
						this.state.dialogType === 'type_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.BUILDING_MESSAGE_RESTORE_TYPES, this.state.rowData.length) : TEXT.BUILDING_MESSAGE_RESTORE_TYPE) ||
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

	renderAddType = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.BUILDING_TABLE_HEADER_TYPE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.type || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('type', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'parameter_edit'}
					/>
				</div>
			</div>
		)
	}	

	renderDeleteRestoreParameter = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'parameter_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.BUILDING_MESSAGE_DELETE_PARAMS, this.state.rowData.length) : TEXT.BUILDING_MESSAGE_DELETE_PARAM) ||
						this.state.dialogType === 'parameter_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.BUILDING_MESSAGE_RESTORE_PARAMS, this.state.rowData.length) : TEXT.BUILDING_MESSAGE_RESTORE_PARAM) ||
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
									{`${data.type} - ${data.paramName}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.type} - ${this.state.rowData.paramName}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderAddEditParameter = () =>
	{
		const { classes, buildingValueTypes } = this.props

		let buildingTypes = this.getAvailableValues(this.props.buildingTypes, 'type')
		if (this.buildingParameters.hasOwnProperty(this.state.rowData.paramName))
		{
			buildingTypes = _.xor(buildingTypes, this.buildingParameters[this.state.rowData.paramName])
		}

		let buildingParameters = Object.keys(this.buildingParameters)
		if (this.buildingTypes.hasOwnProperty(this.state.rowData.type))
		{
			buildingParameters = _.xor(buildingParameters, this.buildingTypes[this.state.rowData.type])
		}

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.BUILDING_TABLE_HEADER_PARAM}</Typography>
					<Autocomplete
						freeSolo
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.paramName}
						options={buildingParameters || []}
						onChange={(evt, value) => {
							this.handleAction('paramName', value)(evt)
						}}
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
						disabled={this.state.dialogType === 'parameter_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.BUILDING_TABLE_HEADER_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.type}
						options={buildingTypes || []}
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
						disabled={this.state.dialogType === 'parameter_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.BUILDING_TABLE_HEADER_VALUE_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.valueType}
						options={buildingValueTypes || []}
						onChange={(evt, value) => {
							this.handleAction('valueType', value)(evt)
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
						disabled={this.state.dialogType === 'parameter_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.BUILDING_TABLE_HEADER_DESCRIPTION}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.description || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('description', evt.target.value)(evt) }}
					/>
				</div>
			</div>
		)
	}	

	renderDeleteRestoreBuilding = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'building_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.BUILDING_MESSAGE_DELETE_BUILDINGS, this.state.rowData.length) : TEXT.BUILDING_MESSAGE_DELETE_BUILDING) ||
						this.state.dialogType === 'building_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.BUILDING_MESSAGE_RESTORE_BUILDINGS, this.state.rowData.length) : TEXT.BUILDING_MESSAGE_RESTORE_BUILDING) ||
						''
					}
					</Typography>
					<div className={clsx(classes.divColumn, classes.divMaxHeight)}>
					{
						this.state.isMultiSelectMode
						?
						_.map(this.state.rowData, data => {
							return (
								<Typography key={data.level} style={{ paddingBottom: 5 }}>
									{`${data.type} (${TEXT.BUILDING_TABLE_HEADER_BUILDING_LEVEL}: ${data.level})`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.type} (${TEXT.BUILDING_TABLE_HEADER_BUILDING_LEVEL}: ${this.state.rowData.level})`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}		

	renderImportBuilding = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<Typography>{TEXT.BUILDING_BUILDING_FILE}</Typography>
				<CmsInputFile 
					name={'file'}
					value={this.state.rowData.file || []} 
					onChange={(file) => { this.handleAction('file', file)(null) }} 
					acceptFile={'.xlsx'}
				/>
			</div>
		)
	}

	renderAddEditBuilding = () =>
	{
		const { classes } = this.props;

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.BUILDING_TABLE_HEADER_PARAM}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.paramName}
						options={this.buildingTypes[this.state.rowData.type] || []}
						onChange={(evt, value) => {
							this.handleAction('paramName', value)(evt)
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
						disabled={this.state.dialogType === 'building_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.BUILDING_TABLE_HEADER_LEVEL}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.level || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('level', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'building_edit'}
					/>
				</div>
				{
					this.state.rowData.valueType === this.props.buildingValueTypes[0] && // Number
					<div className={clsx(classes.divColumn)}>
						<Typography>{`${TEXT.BUILDING_TABLE_HEADER_VALUE} (${this.props.buildingValueTypes[0]})`}</Typography>
						<TextField
							className={clsx(classes.inputTextField, classes.inputText)}
							value={this.state.rowData.value}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('value', evt.target.value)(evt) }}
						/>
					</div>
				}
				{
					this.state.rowData.valueType === this.props.buildingValueTypes[1] && // String
					<div className={clsx(classes.divColumn)}>
						<Typography>{`${TEXT.BUILDING_TABLE_HEADER_VALUE} (${this.props.buildingValueTypes[1]})`}</Typography>
						<TextField
							className={clsx(classes.inputTextField, classes.inputText)}
							value={this.state.rowData.value}
							margin="normal"
							fullWidth
							variant={'outlined'}
							onChange={(evt) => { this.handleAction('value', evt.target.value)(evt) }}
						/>
					</div>
				}
				{
					this.state.rowData.valueType === this.props.buildingValueTypes[2] && // ArrayString
					<div className={clsx(classes.divColumn)}>
						<Typography>{`${TEXT.BUILDING_TABLE_HEADER_VALUE} (${this.props.buildingValueTypes[2]})`}</Typography>
						<Autocomplete
							multiple
							freeSolo
							autoSelect
							filterSelectedOptions
							value={this.state.rowData.value}
							options={[]}
							onChange={(evt, value) => {
								this.handleAction('value', value)(evt)
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
							size={'small'}
						/>
					</div>
				}
				{
					this.state.dialogType === 'building_add' &&
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<Typography className={clsx(classes.title)}>{TEXT.BUILDING_BUILDING_TITLE}</Typography>
							<Button
								variant='outlined'
								color={'default'}
								startIcon={<Icons.IconAdd />}
								onClick={this.handleAction('building_multi_add', '')}
								disabled={this.validateBuilding()}
							>
								{TEXT.BUILDING_BUTTON_ADD_BUILDING}
							</Button>
						</div>
						<CmsTable
							columns={[
								{
									title: TEXT.BUILDING_TABLE_HEADER_PARAM, field: 'paramName', width: 250,
								},
								{
									title: TEXT.BUILDING_TABLE_HEADER_LEVEL, field: 'level', width: 101,
								},
								{
									title: TEXT.BUILDING_TABLE_HEADER_VALUE, field: 'value', nofilter: true, width: 200,
									render: rowData =>
									{
										return (
											Array.isArray(rowData.value)
											? this.renderChipsColumn(rowData.value)
											: rowData.value
										)
									}
								},
								{
									title: TEXT.TABLE_HEADER_BLANK, field: 'blank', sorting: false, nofilter: true, width: 50,
									render: rowData =>
									{
										return (
											<CmsControlPermission
												control={
													<Tooltip 
														title={TEXT.BUILDING_TOOLTIP_DELETE_BUILDING}
														classes={{
															tooltip: classes.toolTip,
														}}
														placement={'top'}
													>
														<IconButton
															onClick={(event) => {
																this.handleAction('building_multi_delete', rowData)(event)
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

							data={this.state.rowData.buildings || []}

							options={{
								actionsColumnIndex: -1,
								showTitle: false,
								search: true,
								filtering: false,
								sorting: true,
								pageSize: BUILDING_PAGE_SIZE,
								tableMaxHeight: BUILDING_TABLE_HEIGHT,
								selection: false,
								cellStyle: { ...defaultCellStyle, textAlign: 'center', height: 40 },
								headerStyle: { ...defaultHeaderStyle, textAlign: 'center', height: 40, borderTop: `1px ${defaultBorderColor} solid` },
							}}
						/>
					</div>
				}
			</div>
		)
	}
	
	renderTitle = (title) =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn, classes.marginBottom)}>
				<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
					<Typography className={clsx(classes.title)}>{title}</Typography>
					<div className={clsx(classes.divRow)} >
						<div className={clsx(classes.divRow)}>
							<Button
								variant={'contained'}
								color={'primary'}
								onClick={this.handleAction('close')}
								className={clsx(classes.buttonLeft)}
							>
								{ TEXT.MODAL_BACK }
							</Button>
						</div>
						<CmsControlPermission
							control={
								<Button
									variant={'contained'}
									color={'primary'}
									onClick={this.handleAction('submit')}
									className={clsx(classes.buttonLeft)}
									disabled={this.validateSubmit(this.state.rowData)}
								>
									{ TEXT.MODAL_SAVE }
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

	renderEditBuildings = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderTitle(`${TEXT.BUILDING_TOOLTIP_EDIT_BUILDINGS} (${TEXT.BUILDING_TABLE_HEADER_BUILDING_TYPE}: ${this.state.rowData.buildings[0].type}; ${TEXT.BUILDING_TABLE_HEADER_BUILDING_LEVEL}: ${this.state.rowData.buildings[0].level})`)}
				<div className={clsx(classes.divColumn, classes.container)}>
					<div style={{width: '70%'}}>
						<div className={clsx(classes.divRow)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}}/>
							<Typography className={classes.textField} style={{width: CURRENT_WIDTH, fontWeight: 'bold'}}>{TEXT.BUILDING_CURRENT_VALUE_TITLE}</Typography>
							<Typography className={classes.textField} style={{width: NEW_WIDTH, fontWeight: 'bold'}}>{TEXT.BUILDING_NEW_VALUE_TITLE}</Typography>
						</div>
						{
							_.map(this.state.rowData.buildings, (building, index) => {
								return (
									<div key={building.id} className={clsx(classes.divRow, classes.alignCenter)}>
										<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}} >{`${Utils.convertCamelcaseToNormal(building.paramName)}`}</Typography>
										{
											building.valueType === this.props.buildingValueTypes[0] &&
											<>
												<TextField
													variant={'outlined'}
													className={classes.textField}
													value={building.value}
													fullWidth
													label={this.props.buildingValueTypes[0]}
													disabled={true}
												/>
												<TextField
													variant={'outlined'}
													className={classes.textField}
													value={this.state.rowData[building.id] === undefined ? building.value : (this.state.rowData[building.id] || 0)}
													onChange={(evt) => { this.handleAction('building_value', { id: building.id, value: evt.target.value, valueType: building.valueType })(evt) }}
													fullWidth
													label={this.props.buildingValueTypes[0]}
													error={this.state.rowData[building.id] !== undefined && building.value !== ((isNaN(this.state.rowData[building.id]) ? 0 : this.state.rowData[building.id]))}
												/>
											</>
										}
										{
											building.valueType === this.props.buildingValueTypes[1] &&
											<>
												<TextField
													variant={'outlined'}
													className={classes.textField}
													value={building.value}
													fullWidth
													label={this.props.buildingValueTypes[1]}
													disabled={true}
												/>
												<TextField
													variant={'outlined'}
													className={classes.textField}
													value={this.state.rowData[building.id] === undefined ? building.value : (this.state.rowData[building.id] || '')}
													onChange={(evt) => { this.handleAction('building_value', { id: building.id, value: evt.target.value, valueType: building.valueType })(evt) }}
													fullWidth
													label={this.props.buildingValueTypes[1]}
													error={this.state.rowData[building.id] !== undefined && building.value !== this.state.rowData[building.id]}
												/>
											</>
										}
										{
											building.valueType === this.props.buildingValueTypes[2] &&
											<>
												<Autocomplete
													multiple
													freeSolo
													autoSelect
													limitTags={3}
													filterSelectedOptions
													value={building.value}
													options={[]}
													disableClearable
													renderInput={(params) => (
														<TextField {...params}
															variant="outlined"
															label={this.props.buildingValueTypes[2]}
														/>
													)}
													classes={{
														root: clsx(classes.autoComplete, classes.textField),
														input: classes.autoCompleteInput,
														inputRoot: classes.autoCompleteInputRoot
													}}
													size={'small'}
													fullWidth
												/>
												<Autocomplete
													multiple
													freeSolo
													autoSelect
													limitTags={3}
													filterSelectedOptions
													value={this.state.rowData[building.id] === undefined ? building.value : (this.state.rowData[building.id] || [])}
													options={[]}
													onChange={(evt, value) => {
														this.handleAction('building_value', { id: building.id, value, valueType: building.valueType })(evt)
													}}
													renderInput={(params) => (
														<TextField {...params}
															variant="outlined"
															label={this.props.buildingValueTypes[2]}
															error={this.state.rowData[building.id] !== undefined && !_.isEqual(building.value, this.state.rowData[building.id])}
														/>
													)}
													classes={{
														root: clsx(classes.autoComplete, classes.textField),
														input: classes.autoCompleteInput,
														inputRoot: classes.autoCompleteInputRoot
													}}
													size={'small'}
													fullWidth
												/>
											</>
										}
									</div>
								)
							})
						}	
					</div>    
				</div>
			</div>
		)
	}

	renderMonumentAddEditSetting = () =>
	{
		const { classes } = this.props;
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.MONUMENT_TABLE_HEADER_MONUMENT_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.typeName}
						options={Object.keys(this.monumentTypes || []) || []}
						onChange={(evt, value) => {
							this.handleAction('typeName', value)(evt)
						}}
						disableClearable={true}
						disabled={this.state.dialogType === 'monument_setting_edit'}
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
					<Typography>{TEXT.MONUMENT_TABLE_HEADER_MONUMENT_PARAM}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.parameter}
						options={Object.keys(this.monumentParameters) || []}
						onChange={(evt, value) => {
							this.handleAction('parameter', value)(evt)
						}}
						disableClearable={true}
						disabled={this.state.dialogType === 'monument_setting_edit'}
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
					<Typography>{TEXT.MONUMENT_TABLE_HEADER_MONUMENT_VALUE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.value || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('value', evt.target.value)(evt) }}
						type='number'
					/>
				</div>
			</div>
		)
	}	

	renderMonumentDeleteRestoreSetting = () =>
	{
		const {classes} = this.props;
	
		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'monument_setting_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.MONUMENT_MESSAGE_DELETE_SETTINGS, this.state.rowData.length) : TEXT.MONUMENT_MESSAGE_DELETE_SETTING) ||
						this.state.dialogType === 'monument_setting_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.MONUMENT_MESSAGE_RESTORE_SETTINGS, this.state.rowData.length) : TEXT.MONUMENT_MESSAGE_RESTORE_SETTING) ||
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
								{`${data.typeName} - ${data.parameter} - ${data.value}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
						{`${this.state.rowData.typeName} - ${this.state.rowData.parameter} - ${this.state.rowData.value}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderMonumentAddParameter = () =>
	{
		const { classes } = this.props
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.MONUMENT_TABLE_HEADER_MONUMENT_PARAM}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.MONUMENT_TABLE_HEADER_MONUMENT_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.type}
						options={this.fixedType || []}
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
						disabled={this.state.dialogType === 'monument_parameter_edit'}
					/>
				</div>
			</div>
		)
	}

	renderMonumentDeleteRestoreParameter = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'monument_parameter_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.MONUMENT_MESSAGE_DELETE_PARAMS, this.state.rowData.length) : TEXT.MONUMENT_MESSAGE_DELETE_PARAM) ||
						this.state.dialogType === 'monument_parameter_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.MONUMENT_MESSAGE_RESTORE_PARAMS, this.state.rowData.length) : TEXT.MONUMENT_MESSAGE_RESTORE_PARAM) ||
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
									{`${data.type} - ${data.name}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.type} - ${this.state.rowData.name}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderMonumentAddType = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.MONUMENT_TABLE_HEADER_MONUMENT_TYPE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.MONUMENT_TABLE_HEADER_MONUMENT_GROUP}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						value={this.state.rowData.groupName}
						filterSelectedOptions
						options={Object.keys(this.monumentGroups || []) || []}
						onChange={(evt, value) => {
							this.handleAction('groupName', value)(evt)
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
			</div>
		)
	}	

	renderMonumentDeleteRestoreType = () =>
	{
		const { classes } = this.props;
		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'monument_type_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.MONUMENT_MESSAGE_DELETE_TYPES, this.state.rowData.length) : TEXT.MONUMENT_MESSAGE_DELETE_TYPE) ||
						this.state.dialogType === 'monument_type_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.MONUMENT_MESSAGE_RESTORE_TYPES, this.state.rowData.length) : TEXT.MONUMENT_MESSAGE_RESTORE_TYPE) ||
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
									{`${data.name} - ${data.groupName}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.groupName}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderMonumentAddGroup = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.MONUMENT_TABLE_HEADER_MONUMENT_GROUP}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.name || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
					/>
				</div>
			</div>
		)
	}

	renderMonumentDeleteRestoreGroup = () =>
	{
		const { classes } = this.props
		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'monument_group_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.MONUMENT_MESSAGE_DELETE_GROUPS, this.state.rowData.length) : TEXT.MONUMENT_MESSAGE_DELETE_GROUP) ||
						this.state.dialogType === 'monument_group_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.MONUMENT_MESSAGE_RESTORE_GROUPS, this.state.rowData.length) : TEXT.MONUMENT_MESSAGE_RESTORE_GROUP) ||
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
									{data.name}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{this.state.rowData.name}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
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

	renderChipsColumn = (fieldData, NUMBER_CHIPS = 1) =>
	{
		const { classes } = this.props
		
		const chips = fieldData.slice(0, NUMBER_CHIPS)
		const hidden = (fieldData.length - chips.length > 0)
		let isOpen = false

		return (
			<Autocomplete
				// key={rowData.id}
				fullWidth
				multiple
				disableClearable
				filterSelectedOptions
				limitTags={NUMBER_CHIPS}
				size={'small'}
				value={chips}
				options={fieldData}
				// getOptionLabel={(option) => (option?.name || '')}
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
				renderTags={(value, getTagProps) =>
					value.map((option, index) => (
						<div key={index} className={clsx(classes.divRow, classes.justifyStart)}>
							<Chip
								variant={'outlined'}
								style={{marginRight: 5}}
								size={'small'} 
								// label={option?.name || ''}
								label={option}
							/>
							{
								hidden && (index === NUMBER_CHIPS - 1) &&
								(
									!isOpen
									?
									<Chip 
										color="primary"
										size={'small'} 
										label={`+${fieldData.length - chips.length}`}
									/>
									:
									<div style={{ minWidth: 30}}/>
								)
							}
						</div>
				))}
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
}

Building.propTypes =
{
	classes: PropTypes.object.isRequired,
}

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
	// Building:
	BuildingTypesLoad: () =>
	{
		dispatch(ActionCMS.BuildingTypesLoad())
	},
	BuildingTypeAdd: (type_data) =>
	{
		dispatch(ActionCMS.BuildingTypeAdd(type_data))
	},
	BuildingTypeDelete: (type_data) =>
	{
		dispatch(ActionCMS.BuildingTypeDelete(type_data))
	},
	BuildingTypeRestore: (type_data) =>
	{
		dispatch(ActionCMS.BuildingTypeRestore(type_data))
	},
	BuildingParametersLoad: () =>
	{
		dispatch(ActionCMS.BuildingParametersLoad())
	},
	BuildingParameterAdd: (parameter_data) =>
	{
		dispatch(ActionCMS.BuildingParameterAdd(parameter_data))
	},
	BuildingParameterEdit: (parameter_data) =>
	{
		dispatch(ActionCMS.BuildingParameterEdit(parameter_data))
	},
	BuildingParameterDelete: (parameter_data) =>
	{
		dispatch(ActionCMS.BuildingParameterDelete(parameter_data))
	},
	BuildingParameterRestore: (parameter_data) =>
	{
		dispatch(ActionCMS.BuildingParameterRestore(parameter_data))
	},
	BuildingsLoad: (type) =>
	{
		dispatch(ActionCMS.BuildingsLoad(type))
	},
	BuildingAdd: (building_data) =>
	{
		dispatch(ActionCMS.BuildingAdd(building_data))
	},
	BuildingEdit: (building_data) =>
	{
		dispatch(ActionCMS.BuildingEdit(building_data))
	},
	BuildingsEdit: (building_data) =>
	{
		dispatch(ActionCMS.BuildingsEdit(building_data))
	},
	BuildingsDelete: (building_data) =>
	{
		dispatch(ActionCMS.BuildingsDelete(building_data))
	},
	BuildingsRestore: (building_data) =>
	{
		dispatch(ActionCMS.BuildingsRestore(building_data))
	},
	// Monument
	MonumentSettingsLoad: () =>
    {
        dispatch(ActionCMS.MonumentSettingsLoad())
    },
    MonumentSettingsAdd: (setting_data) =>
    {
        dispatch(ActionCMS.MonumentSettingsAdd(setting_data))
    },
	MonumentSettingsEdit: (setting_data) =>
    {
        dispatch(ActionCMS.MonumentSettingsEdit(setting_data))
    },
    MonumentSettingsDelete: (setting_data) =>
    {
        dispatch(ActionCMS.MonumentSettingsDelete(setting_data))
    },
    MonumentSettingsRestore: (setting_data) =>
    {
        dispatch(ActionCMS.MonumentSettingsRestore(setting_data))
    },
    MonumentParametersLoad: () =>
	{
		dispatch(ActionCMS.MonumentParametersLoad())
	},
    MonumentParametersAdd: (parameter_data) =>
	{
		dispatch(ActionCMS.MonumentParametersAdd(parameter_data))
	},
	MonumentParametersDelete: (parameter_data) =>
	{
		dispatch(ActionCMS.MonumentParametersDelete(parameter_data))
	},
    MonumentParametersRestore: (parameter_data) =>
	{
		dispatch(ActionCMS.MonumentParametersRestore(parameter_data))
	},
    MonumentTypesLoad: () =>
	{
		dispatch(ActionCMS.MonumentTypesLoad())
	},
    MonumentTypesAdd: (type_data) =>
	{
		dispatch(ActionCMS.MonumentTypesAdd(type_data))
	},
	MonumentTypesDelete: (type_data) =>
	{
		dispatch(ActionCMS.MonumentTypesDelete(type_data))
	},
    MonumentTypesRestore: (type_data) =>
	{
		dispatch(ActionCMS.MonumentTypesRestore(type_data))
	},
	MonumentGroupsLoad: () =>
	{
		dispatch(ActionCMS.MonumentGroupsLoad())
	},
	MonumentGroupsAdd: (group_data) =>
	{
		dispatch(ActionCMS.MonumentGroupsAdd(group_data))
	},
	MonumentGroupsDelete: (group_data) =>
	{
		dispatch(ActionCMS.MonumentGroupsDelete(group_data))
	},
	MonumentGroupsRestore: (group_data) =>
	{
		dispatch(ActionCMS.MonumentGroupsRestore(group_data))
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
	withMultipleStyles(customStyle, styles),
	withRouter
)(Building);
