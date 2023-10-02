import React from 'react';
import { connect } from 'react-redux'
import { withRouter } from 'react-router-dom'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import { saveAs } from 'file-saver'

import { Typography, Tabs, Tab, Button, TextField, Chip } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { WarningRounded } from '@material-ui/icons'

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
import CmsTransferList from '../../Components/CmsTransferList'
import CmsInputFile from '../../Components/CmsInputFile'
import CmsImage from '../../Components/CmsImage'

const styles = theme => ({
	tabs: {
		width: '50%'
	},
	details: {
		marginTop: 15,
        height: 300,
		borderRadius: 25,
        border: '1px solid #A5ABB3',
        backgroundColor: theme.palette.background.paper,
        overflow: 'auto',
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
	textField: {
		marginBottom: 15,
		marginRight: 15,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	marginRight: {
		marginRight: 15,
	},
	marginLeft: {
		marginLeft: 15,
	},
	marginBottom: {
		marginBottom: theme.spacing(2),
	},
	importBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(2),
		marginBottom: theme.spacing(3)
	},
	containerPlayerCard: {
		// marginTop: 15,
        height: 780,
        overflow: 'auto',
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

const TITLE_WIDTH_2 = '20%'
const TITLE_WIDTH_3 = '45%'
const CURRENT_WIDTH = '60%'
const NEW_WIDTH = '35%'
const PAGE_SIZE = 10
const TABLE_HEIGHT = 650
const FULLTIME_FORMAT = 'MMM DD YYYY HH:mm'

class PlayerCard extends React.Component
{
	constructor(props)
	{
		super(props)

		this.state = {
			actionType: '',
            isDialogOpen: false,
			isImportOpen: false,
			isExportOpen: false,
			isMultiSelectMode: false,
			isPageOpen: false,
			rowData: {},
			tableTab: 0,
			left: '',
			right: ''
		}

		this.tableRef = React.createRef()
		this.selectedRows = []
		this.rowData = null
		this.playerCards = null
		this.playerCardsFetched = null
		this.playerCardTypes = null
		this.playerCardParameters = null
		this.playerCardParametersFetched = null
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
														this.state.tableTab === 0 && this.handleAction('playercard_restore') ||
														this.state.tableTab === 1 && this.handleAction('package_restore') ||
														this.state.tableTab === 2 && this.handleAction('setting_restore') ||
														this.state.tableTab === 3 && this.handleAction('parameter_restore') ||
														this.state.tableTab === 4 && this.handleAction('formation_restore') || null
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.RefreshIcon/>}
												>
												{
													this.state.tableTab === 0 && TEXT.PLAYER_CARD_BUTTON_RESTORE_PLAYER_CARDS ||
													this.state.tableTab === 1 && TEXT.PLAYER_CARD_BUTTON_RESTORE_PACKAGES ||
													this.state.tableTab === 2 && TEXT.PLAYER_CARD_BUTTON_RESTORE_SETTINGS ||
													this.state.tableTab === 3 && TEXT.PLAYER_CARD_BUTTON_RESTORE_PARAMETERS ||
													this.state.tableTab === 4 && TEXT.PLAYER_CARD_BUTTON_RESTORE_FORMATIONS || ''
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
														this.state.tableTab === 0 && this.handleAction('playercard_delete') ||
														this.state.tableTab === 1 && this.handleAction('package_delete') ||
														this.state.tableTab === 2 && this.handleAction('setting_delete') ||
														this.state.tableTab === 3 && this.handleAction('parameter_delete') ||
														this.state.tableTab === 4 && this.handleAction('formation_delete') || null
													}
													className={clsx(classes.buttonLeft)}
													startIcon={<Icons.IconRemove/>}
												>
												{
													this.state.tableTab === 0 && TEXT.PLAYER_CARD_BUTTON_DELETE_PLAYER_CARDS ||
													this.state.tableTab === 1 && TEXT.PLAYER_CARD_BUTTON_DELETE_PACKAGES ||
													this.state.tableTab === 2 && TEXT.PLAYER_CARD_BUTTON_DELETE_SETTINGS ||
													this.state.tableTab === 3 && TEXT.PLAYER_CARD_BUTTON_DELETE_PARAMETERS ||
													this.state.tableTab === 4 && TEXT.PLAYER_CARD_BUTTON_DELETE_FORMATIONS || ''
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
													this.state.tableTab === 0 && this.handleAction('playercard_add', { name: '', nationality: '', currentTeam: '', description: '', traits: [], rarity: 0, basePower: 0, baseAttack: 0, basePassing: 0, baseDefense: 0, baseValue: 0, class: 0 }) ||
													this.state.tableTab === 1 && this.handleAction('package_add', { name: '', playerCardIds: [], priority: 0 }) ||
													this.state.tableTab === 2 && this.handleAction('setting_add', { type: '', paramName: '', level: 0, value: 0 }) ||
													this.state.tableTab === 3 && this.handleAction('parameter_add', { type: '', paramName: '', description: '' }) ||
													this.state.tableTab === 4 && this.handleAction('formation_add', { name: '', formationString: '', unitString: '', linkString: '' }) || null
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconAdd/>}
											>
											{
												this.state.tableTab === 0 && TEXT.PLAYER_CARD_BUTTON_NEW_PLAYER_CARD ||
												this.state.tableTab === 1 && TEXT.PLAYER_CARD_BUTTON_NEW_PACKAGE ||
												this.state.tableTab === 2 && TEXT.PLAYER_CARD_BUTTON_NEW_SETTING ||
												this.state.tableTab === 3 && TEXT.PLAYER_CARD_BUTTON_NEW_PARAMETER ||
												this.state.tableTab === 4 && TEXT.PLAYER_CARD_BUTTON_NEW_FORMATION || ''
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
				isPageOpen: false,
				isMultiSelectMode: false,
				actionType: '',
				rowData: {},
			}
		}

        return null; // No change to state
    }

	componentDidMount()
	{
		this.props.SetTitle(TEXT.PLAYER_CARD_MANAGEMENT_TITLE)
		this.props.PlayerCardsLoad()
	}

	componentWillUnmount() 
	{
		
	}

	componentDidUpdate(prevProps, prevState)
	{
		this.props !== prevProps && this.formatPlayerCards()
		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()

			if (prevState.actionType === 'playercard_export')
			{
				saveAs(new Blob([this.props.fileData]), `${TEXT.PLAYER_CARD_PLAYER_CARD_TITLE}.zip`)
				this.props.ClearProps(['fileData'])
			}
			else
			{
				this.state.tableTab === 0 && this.props.PlayerCardsLoad()
				this.state.tableTab === 1 && this.props.PlayerCardPackagesLoad()
				this.state.tableTab === 2 && this.props.PlayerCardSettingsLoad()
				this.state.tableTab === 3 && this.props.PlayerCardParametersLoad()
				this.state.tableTab === 4 && this.props.PlayerCardFormationsLoad()
			}
		}
	}

	render()
	{
		const { classes } = this.props
		
		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.state.isPageOpen ?  this.renderPage() : this.renderTableTabs()}
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
				return columnDef.searchAlgorithm === 'includes' ? _.includes(strData, value) : _.startsWith(strData, value)
			}

			return false
		})
	}

	formatPlayerCards = () =>
	{
		if (this.playerCardsFetched !== this.props.playerCards)
		{
			this.playerCardsFetched = this.props.playerCards

			this.playerCards = _.reduce(this.props.playerCards, (result, value) =>
			{
				return {...result, [value.id]: value}
			}, [])

			// console.log('formatPlayerCards', this.playerCards)
		}

		if (this.playerCardParametersFetched !== this.props.playerCardParameters)
		{
			this.playerCardParametersFetched = this.props.playerCardParameters

			const playerCardParameters = _.reduce(this.props.playerCardParameters, (playerCardParameters, row) => {
				return row.deletedAt === 0 ? [...playerCardParameters, row] : playerCardParameters
			}, [])

			this.playerCardTypes = _.reduce(_.groupBy(playerCardParameters || [], type => type.type), (result, value, key) =>
			{
				return {...result, [key]: _.map(value, param => (param.paramName))}
			}, {})

			// console.log('formatBuildingTypes', this.playerCardTypes)

			this.playerCardParameters = _.reduce(_.groupBy(playerCardParameters || [], paramName => paramName.paramName), (result, value, key) =>
			{
				return {...result, [key]: _.map(value, type => (type.type))}
			},{})

			// console.log('formatBuildingParameters', this.playerCardParameters)
		}
	}

	handleAction = (name, data) => (evt) =>
	{
		switch (name)
		{
			case 'close':
				this.setState({
					isDialogOpen: false,
					isPageOpen: false,
					actionType: '',
					rowData: {}
				})

				break
			case 'submit':
				if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						this.state.actionType === 'playercard_delete' && this.props.PlayerCardDelete(row) ||
						this.state.actionType === 'playercard_restore' && this.props.PlayerCardRestore(row) ||

						this.state.actionType === 'package_delete' && this.props.PlayerCardPackageDelete(row) ||
						this.state.actionType === 'package_restore' && this.props.PlayerCardPackageRestore(row) ||

						this.state.actionType === 'setting_delete' && this.props.PlayerCardSettingDelete(row) ||
						this.state.actionType === 'setting_restore' && this.props.PlayerCardSettingRestore(row) ||

						this.state.actionType === 'parameter_delete' && this.props.PlayerCardParameterDelete(row) ||
						this.state.actionType === 'parameter_restore' && this.props.PlayerCardParameterRestore(row) ||

						this.state.actionType === 'formation_delete' && this.props.PlayerCardFormationDelete(row) ||
						this.state.actionType === 'formation_restore' && this.props.PlayerCardFormationRestore(row)
					})
				}
				else
				{
					this.state.actionType === 'playercard_import' && this.props.ResourcesImport('player-card', this.state.rowData) ||

					this.state.actionType === 'playercard_add' && this.props.PlayerCardAdd(this.state.rowData) ||
					this.state.actionType === 'playercard_edit' && this.props.PlayerCardEdit(this.state.rowData) ||
					this.state.actionType === 'playercard_delete' && this.props.PlayerCardDelete(this.state.rowData) ||
					this.state.actionType === 'playercard_restore' && this.props.PlayerCardRestore(this.state.rowData) ||

					this.state.actionType === 'package_add' && this.props.PlayerCardPackageAdd(this.state.rowData) ||
					this.state.actionType === 'package_edit' && this.props.PlayerCardPackageEdit(this.state.rowData) ||
					this.state.actionType === 'package_delete' && this.props.PlayerCardPackageDelete(this.state.rowData) ||
					this.state.actionType === 'package_restore' && this.props.PlayerCardPackageRestore(this.state.rowData) ||

					this.state.actionType === 'setting_add' && this.props.PlayerCardSettingAdd(this.state.rowData) ||
					this.state.actionType === 'setting_edit' && this.props.PlayerCardSettingEdit(this.state.rowData) ||
					this.state.actionType === 'setting_delete' && this.props.PlayerCardSettingDelete(this.state.rowData) ||
					this.state.actionType === 'setting_restore' && this.props.PlayerCardSettingRestore(this.state.rowData)

					this.state.actionType === 'parameter_add' && this.props.PlayerCardParameterAdd(this.state.rowData) ||
					this.state.actionType === 'parameter_edit' && this.props.PlayerCardParameterEdit(this.state.rowData) ||
					this.state.actionType === 'parameter_delete' && this.props.PlayerCardParameterDelete(this.state.rowData) ||
					this.state.actionType === 'parameter_restore' && this.props.PlayerCardParameterRestore(this.state.rowData) ||

					this.state.actionType === 'formation_add' && this.props.PlayerCardFormationAdd(this.state.rowData) ||
					this.state.actionType === 'formation_edit' && this.props.PlayerCardFormationEdit(this.state.rowData) ||
					this.state.actionType === 'formation_delete' && this.props.PlayerCardFormationDelete(this.state.rowData) ||
					this.state.actionType === 'formation_restore' && this.props.PlayerCardFormationRestore(this.state.rowData)
				}

				break
			case 'playercard_add':
			case 'playercard_edit':
			case 'package_add':
			case 'package_edit':
				this.rowData = data
				this.setState({
					isPageOpen: true,
					actionType: name,
					rowData: data
				})

				break
			case 'playercard_export':
				this.setState(
					{
						actionType: name,
						rowData: data
					},
					() =>
					{
						this.props.ResourcesExport('player-card')
					}
				)

				break	
			case 'playercard_import':	
			case 'setting_add':
			case 'setting_edit':
			case 'setting_delete':
			case 'setting_restore':
			case 'package_delete':
			case 'package_restore':
			case 'playercard_delete':
			case 'playercard_restore':
			case 'parameter_add':
			case 'parameter_edit':
			case 'parameter_delete':
			case 'parameter_restore':
			case 'formation_add':
			case 'formation_edit':
			case 'formation_delete':
			case 'formation_restore':
				this.setState({
					isDialogOpen: true,
					actionType: name,
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
						if (this.state.tableTab === 0)
						{
							this.props.PlayerCardsLoad()
						}
						else if (this.state.tableTab === 1)
						{
							this.props.PlayerCardPackagesLoad()
						}
						else if (this.state.tableTab === 2)
						{
							this.props.PlayerCardSettingsLoad()
							this.props.PlayerCardParametersLoad()
						}
						else if (this.state.tableTab === 3)
						{
							this.props.PlayerCardParametersLoad()
						}
						else if (this.state.tableTab === 4)
						{
							this.props.PlayerCardFormationsLoad()
						}
					}
				)

				break	
			case 'left':
			case 'right':
				this.setState({
                    [name]: data
                })

				break
			case 'value':	
				this.setState({
					rowData: {
						...this.state.rowData, 
						[name]: data === '' ? 0 : parseFloat(data)
					}
				})

				break
            default:
                this.setState({
                    rowData: {
						...this.state.rowData, 
						[name]: !_.includes(['file', 'nationality', 'currentTeam', 'name', 'type', 'paramName', 'description', 'playerCardIds', 'traits', 'formationString', 'unitString', 'linkString', 'imageFileName'], name) ? (data === '' ? 0 : (isNaN(data) ? this.state.rowData[name] : parseInt(data))) : data
					}
                })
		}		
	}

    validateSubmit = (submit_data) =>
	{
		if (this.state.actionType === 'playercard_import')
		{
			return _.isEmpty(submit_data.file)
		}

		const { name, nationality, currentTeam, imageFileName, type, paramName, formationString, unitString, linkString } = submit_data

		let result = true

		if (this.state.tableTab === 0)
		{
			result = _.some(Object.keys({ name, nationality, currentTeam, imageFileName }), key => {
				return _.isEmpty(submit_data[key])
			})
		}
		else if (this.state.tableTab === 1)
		{
			result = _.isEmpty(name)
		}
		else if (this.state.tableTab === 2)
		{
			result = _.some(Object.keys({ type, paramName }), key => {
				return _.isEmpty(submit_data[key])
			})
		}
		else if (this.state.tableTab === 3)
		{
			result = _.some(Object.keys({ type, paramName }), key => {
				return _.isEmpty(submit_data[key])
			})
		}
		else if (this.state.tableTab === 4)
		{
			result = _.some(Object.keys({ name, formationString, unitString, linkString }), key => {
				return _.isEmpty(submit_data[key])
			})
		}
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
								onClick={this.handleAction('playercard_import', {})}
								className={clsx(classes.buttonLeft)}
								startIcon={<Icons.IconAdd/>}
							>
								{ TEXT.PLAYER_CARD_BUTTON_IMPORT }
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
								onClick={this.handleAction('playercard_export', {})}
								className={clsx(classes.buttonLeft)}
								startIcon={<Icons.ExportIcon/>}
							>
								{ TEXT.PLAYER_CARD_BUTTON_EXPORT }
							</Button>
						}
						link={''}
						attribute={''}
					/>
				</div>
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
						<Tab label={TEXT.PLAYER_CARD_PLAYER_CARD_TITLE}/>
						<Tab label={TEXT.PLAYER_CARD_PACKAGE_TITLE} />
						<Tab label={TEXT.PLAYER_CARD_SETTING_TITLE} />
						<Tab label={TEXT.PLAYER_CARD_PARAMETER_TITLE} />
						<Tab label={TEXT.PLAYER_CARD_FORMATION_TITLE} />
					</Tabs>
					{
						this.actionsExtend.createElement(this.actionsExtend)
					}
				</div>
				<CmsTabPanel value={this.state.tableTab} index={0} >
				{
					this.renderPlayerCardsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={1} >
				{
					this.renderPackagesTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={2} >
				{
					this.renderSettingsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={3} >
				{
					this.renderParametersTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={4} >
				{
					this.renderFormationsTable()
				}
				</CmsTabPanel>
			</>	
		)	
	}

	renderPlayerCardsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_NAME, field: 'name', width: 200,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_NATIONALITY, field: 'nationality', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_CURRENT_TEAM, field: 'currentTeam', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_IMAGE_FILE_NAME, field: 'imageFileName', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_IMAGE, field: 'imageUrl', nofilter: true, width: 150,
							render: rowData =>
							{
								return (
									<CmsImage
										fileName={rowData.imageUrl}
										type={'IMAGE'}
									/>
								)
							}
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_CLASS, field: 'class', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_RARITY, field: 'rarity', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_TRAITS, field: 'traits', width: 300,
							render: rowData => 
							{
								const fieldData = _.map(rowData.traits, (value, id) => ({id, name: value}))
								return this.renderChipsColumn(fieldData)
							},
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.traits.join(','), columnDef)
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_BASE_ATTACK, field: 'baseAttack', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_BASE_DEFENSE, field: 'baseDefense', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_BASE_PASSING, field: 'basePassing', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_BASE_POWER, field: 'basePower', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_BASE_VALUE, field: 'baseValue', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_DESCRIPTION, field: 'description', width: 200,
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 250,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true)
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true)
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
                            render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true)
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								rowData = {...rowData, oldRarity: rowData.rarity, oldClass: rowData.class}
								this.handleAction('playercard_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.PLAYER_CARD_BUTTON_EDIT_PLAYER_CARD),
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
								this.handleAction('playercard_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.PLAYER_CARD_BUTTON_DELETE_PLAYER_CARD),
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
								this.handleAction('playercard_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.PLAYER_CARD_BUTTON_RESTORE_PLAYER_CARD),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.playerCards || []}

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

					ignoredRender={this.state.isDialogOpen || this.state.isImportOpen || this.state.isExportOpen}

					tableRef={this.tableRef}
                />
            </div>		
		)
	}

	renderAddEditPlayerCard = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
				{this.renderTitle(this.state.actionType === 'playercard_add' ? TEXT.PLAYER_CARD_BUTTON_NEW_PLAYER_CARD : TEXT.PLAYER_CARD_BUTTON_EDIT_PLAYER_CARD)}
				<div className={clsx(classes.root, classes.divColumn, classes.containerPlayerCard)}>
					<div style={{width: '70%'}}>
						<div className={clsx(classes.divRow)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}}/>
							<Typography className={classes.textField} style={{width: CURRENT_WIDTH, fontWeight: 'bold'}}>{TEXT.PLAYER_CARD_CURRENT_VALUE_TITLE}</Typography>
							<Typography className={classes.textField} style={{width: NEW_WIDTH, fontWeight: 'bold'}}>{TEXT.PLAYER_CARD_NEW_VALUE_TITLE}</Typography>
						</div>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}} >{TEXT.PLAYER_CARD_TABLE_HEADER_NAME}</Typography>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.rowData.name}
								fullWidth
								disabled={true}
							/>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.state.rowData.name}
								onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
								fullWidth
							/>
						</div>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}} >{TEXT.PLAYER_CARD_TABLE_HEADER_NATIONALITY}</Typography>
							<Autocomplete
								autoComplete
								autoSelect
								filterSelectedOptions
								value={this.rowData.nationality}
								options={[]}
								renderInput={(params) => (
									<TextField {...params}
										variant="outlined"
									/>
								)}
								classes={{
									root: clsx(classes.autoComplete, classes.marginRight),
									input: classes.autoCompleteInput,
									inputRoot: classes.autoCompleteInputRoot
								}}
								disabled={true}
								size={'small'}
								fullWidth
							/>
							<Autocomplete
								autoComplete
								autoSelect
								filterSelectedOptions
								value={this.state.rowData.nationality}
								options={this.props.NATIONALITIES || []}
								onChange={(evt, value) => {
									this.handleAction('nationality', value)(evt)
								}}
								renderInput={(params) => (
									<TextField {...params}
										variant="outlined"
									/>
								)}
								classes={{
									root: clsx(classes.autoComplete, classes.marginRight),
									input: classes.autoCompleteInput,
									inputRoot: classes.autoCompleteInputRoot
								}}
								size={'small'}
								fullWidth
							/>
						</div>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}} >{TEXT.PLAYER_CARD_TABLE_HEADER_CURRENT_TEAM}</Typography>
							<Autocomplete
								autoComplete
								autoSelect
								filterSelectedOptions
								value={this.rowData.currentTeam}
								options={[]}
								renderInput={(params) => (
									<TextField {...params}
										variant="outlined"
									/>
								)}
								classes={{
									root: clsx(classes.autoComplete, classes.marginRight),
									input: classes.autoCompleteInput,
									inputRoot: classes.autoCompleteInputRoot
								}}
								disabled={true}
								size={'small'}
								fullWidth
							/>
							<Autocomplete
								autoComplete
								autoSelect
								filterSelectedOptions
								value={this.state.rowData.currentTeam}
								options={this.props.TEAMS || []}
								onChange={(evt, value) => {
									this.handleAction('currentTeam', value)(evt)
								}}
								renderInput={(params) => (
									<TextField {...params}
										variant="outlined"
									/>
								)}
								classes={{
									root: clsx(classes.autoComplete, classes.marginRight),
									input: classes.autoCompleteInput,
									inputRoot: classes.autoCompleteInputRoot
								}}
								size={'small'}
								fullWidth
							/>
						</div>
						<div className={clsx(classes.divRow)}>
							<Typography style={{width: TITLE_WIDTH_3, marginRight: 15, display: 'block'}} >{TEXT.PLAYER_CARD_TABLE_HEADER_IMAGE}</Typography>
							<div className={clsx(classes.root, classes.divColumn)}>
								<CmsImage
									fileName={this.rowData.imageUrl}
									type={'IMAGE'}
								/>
							</div>
							<div className={clsx(classes.root, classes.divColumn, classes.marginLeft, classes.marginRight)}>
								<CmsImage
									fileName={Utils.createLocalFileURL(this.state.rowData.file)}
									type={'IMAGE'}
								/>
								<CmsInputFile 
									name={'imageUrl'}
									value={_.isArray(this.state.rowData.file) ? this.state.rowData.file : []} 
									onChange={(image) => { this.handleAction('file', image)(null) }} 
									acceptFile={'image/*'}
								/>
							</div>
						</div>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}} >{TEXT.PLAYER_CARD_TABLE_HEADER_IMAGE_FILENAME}</Typography>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.rowData.imageFileName}
								fullWidth
								disabled={true}
							/>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.state.rowData.imageFileName}
								onChange={(evt) => { this.handleAction('imageFileName', evt.target.value)(evt) }}
								fullWidth
							/>
						</div>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}} >{TEXT.PLAYER_CARD_TABLE_HEADER_CLASS}</Typography>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.rowData.class || 0}
								fullWidth
								disabled={true}
							/>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.state.rowData.class || 0}
								onChange={(evt) => { this.handleAction('class', evt.target.value)(evt) }}
								fullWidth
							/>
						</div>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}} >{TEXT.PLAYER_CARD_TABLE_HEADER_RARITY}</Typography>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.rowData.rarity || 0}
								fullWidth
								disabled={true}
							/>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.state.rowData.rarity || 0}
								onChange={(evt) => { this.handleAction('rarity', evt.target.value)(evt) }}
								fullWidth
							/>
						</div>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}} >{TEXT.PLAYER_CARD_TABLE_HEADER_BASE_ATTACK}</Typography>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.rowData.baseAttack || 0}
								fullWidth
								disabled={true}
							/>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.state.rowData.baseAttack || 0}
								onChange={(evt) => { this.handleAction('baseAttack', evt.target.value)(evt) }}
								fullWidth
							/>
						</div>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}} >{TEXT.PLAYER_CARD_TABLE_HEADER_BASE_DEFENSE}</Typography>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.rowData.baseDefense || 0}
								fullWidth
								disabled={true}
							/>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.state.rowData.baseDefense || 0}
								onChange={(evt) => { this.handleAction('baseDefense', evt.target.value)(evt) }}
								fullWidth
							/>
						</div>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}} >{TEXT.PLAYER_CARD_TABLE_HEADER_BASE_PASSING}</Typography>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.rowData.basePassing || 0}
								fullWidth
								disabled={true}
							/>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.state.rowData.basePassing || 0}
								onChange={(evt) => { this.handleAction('basePassing', evt.target.value)(evt) }}
								fullWidth
							/>
						</div>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}} >{TEXT.PLAYER_CARD_TABLE_HEADER_BASE_POWER}</Typography>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.rowData.basePower || 0}
								fullWidth
								disabled={true}
							/>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.state.rowData.basePower || 0}
								onChange={(evt) => { this.handleAction('basePower', evt.target.value)(evt) }}
								fullWidth
							/>
						</div>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}} >{TEXT.PLAYER_CARD_TABLE_HEADER_BASE_VALUE}</Typography>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.rowData.baseValue || 0}
								fullWidth
								disabled={true}
							/>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.state.rowData.baseValue || 0}
								onChange={(evt) => { this.handleAction('baseValue', evt.target.value)(evt) }}
								fullWidth
							/>
						</div>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}} >{TEXT.PLAYER_CARD_TABLE_HEADER_TRAITS}</Typography>
							<Autocomplete
								multiple
								freeSolo
								autoSelect
								filterSelectedOptions
								value={this.rowData.traits}
								options={[]}
								renderInput={(params) => (
									<TextField {...params}
										variant="outlined"
									/>
								)}
								classes={{
									root: clsx(classes.autoComplete, classes.marginRight),
									input: classes.autoCompleteInput,
									inputRoot: classes.autoCompleteInputRoot
								}}
								disabled={true}
								size={'small'}
								fullWidth
							/>
							<Autocomplete
								multiple
								freeSolo
								autoSelect
								filterSelectedOptions
								value={this.state.rowData.traits}
								options={[]}
								onChange={(evt, value) => {
									this.handleAction('traits', value)(evt)
								}}
								renderInput={(params) => (
									<TextField {...params}
										variant="outlined"
									/>
								)}
								classes={{
									root: clsx(classes.autoComplete, classes.marginRight),
									input: classes.autoCompleteInput,
									inputRoot: classes.autoCompleteInputRoot
								}}
								size={'small'}
								fullWidth
							/>
						</div>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography className={classes.textField} style={{width: TITLE_WIDTH_3}} >{TEXT.PLAYER_CARD_TABLE_HEADER_DESCRIPTION}</Typography>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.rowData.description}
								fullWidth
								minRows={2}	
								maxRows={2}
								multiline={true}
								size={'small'}
								disabled={true}
							/>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.state.rowData.description}
								onChange={(evt) => { this.handleAction('description', evt.target.value)(evt) }}
								fullWidth
								minRows={2}	
								maxRows={2}
								multiline={true}
								size={'small'}
							/>
						</div>
					</div>    
				</div>
			</div>
		)
	}

	renderDeleteRestorePlayerCard = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.actionType === 'playercard_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.PLAYER_CARD_MESSAGE_DELETE_PLAYER_CARDS, this.state.rowData.length) : TEXT.PLAYER_CARD_MESSAGE_DELETE_PLAYER_CARD) ||
						this.state.actionType === 'playercard_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.PLAYER_CARD_MESSAGE_RESTORE_PLAYER_CARDS, this.state.rowData.length) : TEXT.PLAYER_CARD_MESSAGE_RESTORE_PLAYER_CARD) ||
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
									{`${data.name} - ${data.class}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.class}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderPackagesTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_NAME, field: 'name', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_PLAYER_CARD, field: 'playerCardIds', width: 400,
							render: rowData => 
							{
								const fieldData = _.map(rowData.playerCardIds, (value) => (this.playerCards[value] ? this.playerCards[value] : { id: value, name: value }))
								return this.renderChipsColumn(fieldData)
							},
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.playerCardIds.join(','), columnDef)
						},
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_PRIORITY, field: 'priority', width: 150,
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, placeholder: TEXT.TABLE_HEADER_CREATED_DATE, field: 'createdAt', width: 250,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.createdAt, columnDef, true)
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.modifiedAt, columnDef, true)
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
                            render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.deletedAt, columnDef, true)
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('package_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.PLAYER_CARD_BUTTON_EDIT_PACKAGE),
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.PLAYER_CARD_BUTTON_DELETE_PACKAGE),
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.PLAYER_CARD_BUTTON_RESTORE_PACKAGE),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.playerCardPackages || []}

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

	renderAddEditPackage = () =>
	{
		const { classes } = this.props
		
		return (
			<div className={clsx(classes.table, classes.divColumn)}>
				{this.renderTitle(this.state.actionType === 'package_add' ? TEXT.PLAYER_CARD_BUTTON_NEW_PACKAGE : TEXT.PLAYER_CARD_BUTTON_EDIT_PACKAGE)}
				<div className={clsx(classes.root, classes.divColumn)}>
					<div style={{width: '70%'}}>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.PLAYER_CARD_TABLE_HEADER_NAME}</Typography>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.state.rowData.name}
								onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
								fullWidth
							/>
						</div>
						<div className={clsx(classes.divRow, classes.alignBaseline)}>
							<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.PLAYER_CARD_TABLE_HEADER_PRIORITY}</Typography>
							<TextField
								variant={'outlined'}
								className={classes.textField}
								value={this.state.rowData.priority}
								onChange={(evt) => { this.handleAction('priority', evt.target.value)(evt) }}
								fullWidth
							/>
						</div>
						<div className={clsx(classes.divRow)}>
							<Typography style={{width: TITLE_WIDTH_2, display: 'block'}} >{TEXT.PLAYER_CARD_TABLE_HEADER_PLAYER_CARD}</Typography>
							<div className={clsx(classes.root, classes.marginRight)}>
								<CmsTransferList
									name={'playerCardIds'}
									left={_.map(this.props.playerCards, value => (value.id))}
									right={this.state.rowData.playerCardIds}
									getOptionLabel={(option) => (this.playerCards[option]?.name || 'undefined')}
									onClick={(side, data) => {
										const { name, rarity, description, basePower, baseAttack, basePassing, baseDefense, baseValue, traits, ...other } = this.playerCards[data]
										data = { name, rarity, class: other.class, basePower, baseAttack, basePassing, baseDefense, baseValue, traits, description }
										this.handleAction(side, data)(null)
									}}
									callbackUpdateData={(name, data) => (this.handleAction(name, data)(null))}
								/>
							</div>
						</div>
						<div className={clsx(classes.divRow)}>
							<Typography style={{width: TITLE_WIDTH_2, marginTop: 15, display: 'block'}} >{TEXT.PLAYER_CARD_DETAILS_TITLE}</Typography>
							<div className={clsx(classes.root, classes.divRow, classes.marginRight, classes.details, classes.justifyBetween, classes.alignCenter)}>
								<ul style={{width: '40%'}}>
								{
									_.map(Object.entries(this.state.left), (line, index) =>
									{
										return (
											<li key={index}>
												<div className={classes.divRow}>
													<Typography style={{ fontWeight: 'bold', marginRight: 10 }}>
													{
														`${line[0]}:`
													}
													</Typography>
													<Typography>
													{
														`${line[1]}`
													}
													</Typography>
												</div>
											</li>
										)
									})
								}
								</ul>
								<ul style={{width: '40%', marginRight: 10}}>
								{
									_.map(Object.entries(this.state.right), (line, index) =>
									{
										return (
											<li key={index}>
												<div className={classes.divRow}>
													<Typography style={{ fontWeight: 'bold', marginRight: 10 }}>
													{
														`${line[0]}:`
													}
													</Typography>
													<Typography>
													{
														`${line[1]}`
													}
													</Typography>
												</div>
											</li>
										)
									})
								}
								</ul>
							</div>
						</div>
					</div>
				</div>
			</div>
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
						this.state.actionType === 'package_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.PLAYER_CARD_MESSAGE_DELETE_PACKAGES, this.state.rowData.length) : TEXT.PLAYER_CARD_MESSAGE_DELETE_PACKAGE) ||
						this.state.actionType === 'package_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.PLAYER_CARD_MESSAGE_RESTORE_PACKAGES, this.state.rowData.length) : TEXT.PLAYER_CARD_MESSAGE_RESTORE_PACKAGE) ||
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
									{`${data.name}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderSettingsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_LEVEL, field: 'level', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_BASE_VALUE, field: 'value', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_PARAM, field: 'paramName', width: 200,
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
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy', width: 350,
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
								this.handleAction('setting_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.PLAYER_CARD_BUTTON_EDIT_SETTING),
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.PLAYER_CARD_BUTTON_DELETE_SETTING),
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.PLAYER_CARD_BUTTON_RESTORE_SETTING),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.playerCardSettings || []}

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

	renderAddEditSetting = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PLAYER_CARD_TABLE_HEADER_PARAM}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.paramName}
						options={Object.keys(this.playerCardParameters) || []}
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
						disabled={this.state.actionType === 'setting_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PLAYER_CARD_TABLE_HEADER_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.type}
						options={Object.keys(this.playerCardTypes) || []}
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
						disabled={this.state.actionType === 'setting_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PLAYER_CARD_TABLE_HEADER_LEVEL}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.level || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('level', evt.target.value)(evt) }}
						disabled={this.state.actionType === 'setting_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PLAYER_CARD_TABLE_HEADER_BASE_VALUE}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.value || 0}
						margin="normal"
						fullWidth
						variant={'outlined'}
						type='number'
						inputProps={{
							maxLength: 13,
							step: '0.1'
						}}
						onChange={(evt) => { this.handleAction('value', evt.target.value)(evt) }}
					/>
				</div>
			</div>
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
						this.state.actionType === 'setting_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.PLAYER_CARD_MESSAGE_DELETE_SETTINGS, this.state.rowData.length) : TEXT.PLAYER_CARD_MESSAGE_DELETE_SETTING) ||
						this.state.actionType === 'setting_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.PLAYER_CARD_MESSAGE_RESTORE_SETTINGS, this.state.rowData.length) : TEXT.PLAYER_CARD_MESSAGE_RESTORE_SETTING) ||
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

	renderParametersTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_TYPE, field: 'type', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_PARAM, field: 'paramName', width: 200,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_DESCRIPTION, field: 'description', width: 150,
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
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy', width: 350,
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.PLAYER_CARD_BUTTON_EDIT_PARAMETER),
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.PLAYER_CARD_BUTTON_DELETE_PARAMETER),
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
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.PLAYER_CARD_BUTTON_RESTORE_PARAMETER),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.playerCardParameters || []}

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

	renderDeleteRestoreParameter = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.actionType === 'parameter_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.PLAYER_CARD_MESSAGE_DELETE_PARAMETERS, this.state.rowData.length) : TEXT.PLAYER_CARD_MESSAGE_DELETE_PARAMETER) ||
						this.state.actionType === 'parameter_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.PLAYER_CARD_MESSAGE_RESTORE_PARAMETERS, this.state.rowData.length) : TEXT.PLAYER_CARD_MESSAGE_RESTORE_PARAMETER) ||
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
		const { classes } = this.props

		let playerCardTypes = Object.keys(this.playerCardTypes)
		if (this.playerCardParameters.hasOwnProperty(this.state.rowData.paramName))
		{
			playerCardTypes = _.xor(playerCardTypes, this.playerCardParameters[this.state.rowData.paramName])
		}

		let playerCardParameters = Object.keys(this.playerCardParameters)
		if (this.playerCardTypes.hasOwnProperty(this.state.rowData.type))
		{
			playerCardParameters = _.xor(playerCardParameters, this.playerCardTypes[this.state.rowData.type])
		}

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PLAYER_CARD_TABLE_HEADER_PARAM}</Typography>
					<Autocomplete
						freeSolo
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.paramName}
						options={playerCardParameters || []}
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
						disabled={this.state.actionType === 'parameter_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PLAYER_CARD_TABLE_HEADER_TYPE}</Typography>
					<Autocomplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.type}
						options={playerCardTypes || []}
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
						disabled={this.state.actionType === 'parameter_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PLAYER_CARD_TABLE_HEADER_DESCRIPTION}</Typography>
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

	renderFormationsTable = () =>
	{
		const { classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_NAME, field: 'name', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_FORMATION_STRING, field: 'formationString', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_UNIT_STRING, field: 'unitString', width: 150,
                        },
						{
                            title: TEXT.PLAYER_CARD_TABLE_HEADER_LINK_STRING, field: 'linkString', width: 350,
							customFilterAndSearch: (term, rowData, columnDef) => this.customFilterAndSearch(term, rowData.linkString, columnDef),
							render: rowData =>
							{
								return (
									<div style={{ width: 330, marginLeft: 10, wordWrap: 'break-word' }}>
										{rowData.linkString}
									</div>
								)
							}
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
                            title: TEXT.TABLE_HEADER_OWNER, placeholder: TEXT.TABLE_HEADER_CREATED_BY, field: 'createdBy', width: 350,
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
								this.handleAction('formation_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.PLAYER_CARD_BUTTON_EDIT_FORMATION),
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
								this.handleAction('formation_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.PLAYER_CARD_BUTTON_DELETE_FORMATION),
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
								this.handleAction('formation_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.PLAYER_CARD_BUTTON_RESTORE_FORMATION),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={this.props.playerCardFormations || []}

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

	renderDeleteRestoreFormation = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.actionType === 'formation_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.PLAYER_CARD_MESSAGE_DELETE_FORMATIONS, this.state.rowData.length) : TEXT.PLAYER_CARD_MESSAGE_DELETE_FORMATION) ||
						this.state.actionType === 'formation_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.PLAYER_CARD_MESSAGE_RESTORE_FORMATIONS, this.state.rowData.length) : TEXT.PLAYER_CARD_MESSAGE_RESTORE_FORMATION) ||
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
									{`${data.name}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderImportPlayercard = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<Typography>{TEXT.PLAYER_CARD_PLAYER_CARD_FILE}</Typography>
				<CmsInputFile 
					name={'file'}
					value={this.state.rowData.file || []} 
					onChange={(file) => { this.handleAction('file', file)(null) }} 
					acceptFile={'.zip'}
				/>
			</div>
		)
	}

	renderAddEditFormation = () =>
	{
		const { classes } = this.props

		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PLAYER_CARD_TABLE_HEADER_NAME}</Typography>
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
					<Typography>{TEXT.PLAYER_CARD_TABLE_HEADER_FORMATION_STRING}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.formationString || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('formationString', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PLAYER_CARD_TABLE_HEADER_UNIT_STRING}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.unitString || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('unitString', evt.target.value)(evt) }}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.PLAYER_CARD_TABLE_HEADER_LINK_STRING}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.linkString || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('linkString', evt.target.value)(evt) }}
					/>
				</div>
			</div>
		)
	}

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
					this.state.actionType === 'playercard_import' && `${TEXT.PLAYER_CARD_BUTTON_IMPORT} ${TEXT.PLAYER_CARD_PLAYER_CARD_TITLE}` ||

                    this.state.actionType === 'playercard_delete' && TEXT.REMIND_TITLE ||
					this.state.actionType === 'playercard_restore' && TEXT.REMIND_TITLE ||
					this.state.actionType === 'package_delete' && TEXT.REMIND_TITLE ||
					this.state.actionType === 'package_restore' && TEXT.REMIND_TITLE ||
					this.state.actionType === 'setting_delete' && TEXT.REMIND_TITLE ||
					this.state.actionType === 'setting_restore' && TEXT.REMIND_TITLE ||
					this.state.actionType === 'parameter_delete' && TEXT.REMIND_TITLE ||
					this.state.actionType === 'parameter_restore' && TEXT.REMIND_TITLE ||
					this.state.actionType === 'formation_delete' && TEXT.REMIND_TITLE ||
					this.state.actionType === 'formation_restore' && TEXT.REMIND_TITLE ||
					
					this.state.actionType === 'setting_add' && TEXT.PLAYER_CARD_BUTTON_NEW_SETTING ||
                    this.state.actionType === 'setting_edit' && TEXT.PLAYER_CARD_BUTTON_EDIT_SETTING ||
					this.state.actionType === 'parameter_add' && TEXT.PLAYER_CARD_BUTTON_NEW_PARAMETER ||
                    this.state.actionType === 'parameter_edit' && TEXT.PLAYER_CARD_BUTTON_EDIT_PARAMETER ||
					this.state.actionType === 'formation_add' && TEXT.PLAYER_CARD_BUTTON_NEW_FORMATION ||
                    this.state.actionType === 'formation_edit' && TEXT.PLAYER_CARD_BUTTON_EDIT_FORMATION ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
				confirmDisable={(_.includes(this.state.actionType, '_delete') || _.includes(this.state.actionType, '_restore')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.actionType === 'playercard_delete' || this.state.actionType === 'playercard_restore') && this.renderDeleteRestorePlayerCard()
			}
			{
				(this.state.actionType === 'package_delete' || this.state.actionType === 'package_restore') && this.renderDeleteRestorePackage()
			}
			{
				(this.state.actionType === 'setting_delete' || this.state.actionType === 'setting_restore') && this.renderDeleteRestoreSetting()
			}
			{
				(this.state.actionType === 'parameter_delete' || this.state.actionType === 'parameter_restore') && this.renderDeleteRestoreParameter()
			}
			{
				(this.state.actionType === 'formation_delete' || this.state.actionType === 'formation_restore') && this.renderDeleteRestoreFormation()
			}
			{
				(this.state.actionType === 'setting_add' || this.state.actionType === 'setting_edit') && this.renderAddEditSetting()
			}
			{
				(this.state.actionType === 'parameter_add' || this.state.actionType === 'parameter_edit') && this.renderAddEditParameter()
			}
			{
				(this.state.actionType === 'formation_add' || this.state.actionType === 'formation_edit') && this.renderAddEditFormation()
			}
			{
				this.state.actionType === 'playercard_import' && this.renderImportPlayercard()
			}
			</ModalDialog>
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

	renderPage = () =>
	{
		return (
			<>
			{
				(this.state.actionType === 'playercard_add' || this.state.actionType === 'playercard_edit') && this.renderAddEditPlayerCard()
			}
			{
				(this.state.actionType === 'package_add' || this.state.actionType === 'package_edit') && this.renderAddEditPackage()
			}
			</>
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

	renderChipsColumn = (fieldData, NUMBER_CHIPS = 2) =>
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
				getOptionLabel={(option) => (option?.name || '')}
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
								label={option?.name || ''}
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

PlayerCard.propTypes =
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
	PlayerCardSettingsLoad: () =>
	{
		dispatch(ActionCMS.PlayerCardSettingsLoad())
	},
	PlayerCardSettingAdd: (setting_data) =>
	{
		dispatch(ActionCMS.PlayerCardSettingAdd(setting_data))
	},
	PlayerCardSettingEdit: (setting_data) =>
	{
		dispatch(ActionCMS.PlayerCardSettingEdit(setting_data))
	},
	PlayerCardSettingDelete: (setting_data) =>
	{
		dispatch(ActionCMS.PlayerCardSettingDelete(setting_data))
	},
	PlayerCardSettingRestore: (setting_data) =>
	{
		dispatch(ActionCMS.PlayerCardSettingRestore(setting_data))
	},
	PlayerCardPackagesLoad: () =>
	{
		dispatch(ActionCMS.PlayerCardPackagesLoad())
	},
	PlayerCardPackageAdd: (package_data) =>
	{
		dispatch(ActionCMS.PlayerCardPackageAdd(package_data))
	},
	PlayerCardPackageEdit: (package_data) =>
	{
		dispatch(ActionCMS.PlayerCardPackageEdit(package_data))
	},
	PlayerCardPackageDelete: (package_data) =>
	{
		dispatch(ActionCMS.PlayerCardPackageDelete(package_data))
	},
	PlayerCardPackageRestore: (package_data) =>
	{
		dispatch(ActionCMS.PlayerCardPackageRestore(package_data))
	},
	PlayerCardsLoad: () =>
	{
		dispatch(ActionCMS.PlayerCardsLoad())
	},
	PlayerCardAdd: (player_card_data) =>
	{
		dispatch(ActionCMS.PlayerCardAdd(player_card_data))
	},
	PlayerCardEdit: (player_card_data) =>
	{
		dispatch(ActionCMS.PlayerCardEdit(player_card_data))
	},
	PlayerCardDelete: (player_card_data) =>
	{
		dispatch(ActionCMS.PlayerCardDelete(player_card_data))
	},
	PlayerCardRestore: (player_card_data) =>
	{
		dispatch(ActionCMS.PlayerCardRestore(player_card_data))
	},
	PlayerCardParametersLoad: () =>
	{
		dispatch(ActionCMS.PlayerCardParametersLoad())
	},
	PlayerCardParameterAdd: (parameter_data) =>
	{
		dispatch(ActionCMS.PlayerCardParameterAdd(parameter_data))
	},
	PlayerCardParameterEdit: (parameter_data) =>
	{
		dispatch(ActionCMS.PlayerCardParameterEdit(parameter_data))
	},
	PlayerCardParameterDelete: (parameter_data) =>
	{
		dispatch(ActionCMS.PlayerCardParameterDelete(parameter_data))
	},
	PlayerCardParameterRestore: (parameter_data) =>
	{
		dispatch(ActionCMS.PlayerCardParameterRestore(parameter_data))
	},
	PlayerCardFormationsLoad: () =>
	{
		dispatch(ActionCMS.PlayerCardFormationsLoad())
	},
	PlayerCardFormationAdd: (formation_data) =>
	{
		dispatch(ActionCMS.PlayerCardFormationAdd(formation_data))
	},
	PlayerCardFormationEdit: (formation_data) =>
	{
		dispatch(ActionCMS.PlayerCardFormationEdit(formation_data))
	},
	PlayerCardFormationDelete: (formation_data) =>
	{
		dispatch(ActionCMS.PlayerCardFormationDelete(formation_data))
	},
	PlayerCardFormationRestore: (formation_data) =>
	{
		dispatch(ActionCMS.PlayerCardFormationRestore(formation_data))
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
)(PlayerCard);

