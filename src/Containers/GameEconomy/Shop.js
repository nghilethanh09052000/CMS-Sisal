import React from 'react';
import { connect } from 'react-redux'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'
import { saveAs } from 'file-saver'

import { Typography, Divider ,Tabs, Tab, Button, TextField, Tooltip, IconButton } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { WarningRounded } from '@material-ui/icons'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import Utils from '../../Utils'
import TEXT from './Data/Text'
import { withMultipleStyles, customStyle } from '../../Styles'

import * as Icons from '../../Components/CmsIcons'
import CmsControlPermission from '../../Components/CmsControlPermission'
import CmsTable from '../../Components/CmsTable'
import ModalDialog from '../../Components/Dialogs/ModalDialog'
import CmsTabPanel from '../../Components/CmsTabPanel'
import CmsDate from '../../Components/CmsDate'
import CmsInputFile from '../../Components/CmsInputFile'

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
const TITLE_WIDTH_2 = '20%'


const styles = theme => ({
	tabs: {
		width: '50%'
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
	marginRight: {
		marginRight: 10,
	},
	addRemoveItems: {
		maxHeight:'300px',
		overflowY: 'auto',
		padding:'10px 0px'
	},
	textField: {
		marginBottom: 15,
		marginRight: 15,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
	actionsExtendItemTable: {
		marginLeft: 10,
		minWidth:'300px',
		height:'100%'
    },
	paddingTextField: {
		padding:'10px 10px'
	},
	buttonAdd: {
		marginTop:'10px',
	},
	cmsDate: {
        marginRight: 10,
    },
	importBar: {
		borderBottom: `2px ${defaultBorderColor} solid`,
		paddingBottom: theme.spacing(2),
		marginBottom: theme.spacing(3)
	},
});

class Shop extends React.Component
{
	constructor(props)
	{
		super(props)
		this.state = {
			dialogType: '',
            isDialogOpen: false,
			isPageOpen: false,
			isImportOpen: false,
			isExportOpen: false,
			isMultiSelectMode: false,
			rowData: {},
			tableTab: 0,
			currentType: ''
		}
		this.tableRef = React.createRef();
		this.defaultContentPrice = {type:'',name:'',amount:0};
		this.defaultSetting = {paramName:'',operator:'',value:''};
		this.listType = []

		this.actionsExtendItemTable = {
			createElement: (parentProps) =>
			{
				const { classes } = this.props;
				return (
					<div className={clsx(classes.divColumn)}>
						<div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
							<div className={clsx(classes.divRow)}>
								<Autocomplete
									fullWidth
									autoComplete
									autoSelect
									filterSelectedOptions
									value={this.state.currentType || ''}
									options={Object.keys(this.listType) || []}
									onChange={(evt, value) => {
										this.handleAction('currentType', value)(evt)
									}}
									disableClearable={true}
									renderInput={(params) => (
										<TextField {...params}
											variant="outlined"
											label={TEXT.TABLE_HEADER_TYPE}
										/>
									)}
									classes={{
										root: clsx(classes.actionsExtendItemTable),
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
													this.state.tableTab === 0 && this.handleAction('setting_param_restore') ||
													this.state.tableTab === 1 && this.handleAction('item_restore') || 
													null
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.RefreshIcon/>}
											>
											{
												this.state.tableTab === 0 && TEXT.SHOP_BUTTON_RESTORE_SETTING_PARAM ||
												this.state.tableTab === 1 && TEXT.SHOP_BUTTON_RESTORE_ITEM ||
												''
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
													this.state.tableTab === 0 && this.handleAction('setting_param_delete') ||
													this.state.tableTab === 1 && this.handleAction('item_delete') ||
													''
												}
												className={clsx(classes.buttonLeft)}
												startIcon={<Icons.IconRemove/>}
											>
											{
												this.state.tableTab === 0 && TEXT.SHOP_BUTTON_DELETE_SETTING_PARAM ||
												this.state.tableTab === 1 && TEXT.SHOP_BUTTON_DELETE_ITEM ||
												''
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
												this.state.tableTab === 0 && this.handleAction('setting_param_add', { type:'',paramName:'',description:'' }) ||
												this.state.tableTab === 1 && this.handleAction('item_add', { type:'', name:'', productId: {ios: '', android: ''}, content:[], price:[], imageUrl:'', settings:[]})																										
											}
											className={clsx(classes.buttonLeft)}
											startIcon={<Icons.IconAdd/>}
										>
										{
											this.state.tableTab === 0 && TEXT.SHOP_BUTTON_ADD_SETTING_PARAM ||
											this.state.tableTab === 1 && TEXT.SHOP_BUTTON_ADD_ITEM ||
											''
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
				dialogType: '',
				rowData: {},
			}
		}

        return null;
    }

    componentDidMount()
	{
		this.props.SetTitle(TEXT.SHOP_MANAGEMENT_TITLE)
		this.props.ShopSettingParamsLoad()
	}

	componentWillUnmount() 
	{
		this.props.ClearProps([])
	}

	componentDidUpdate(prevProps, prevState)
	{
		if (this.props !== prevProps)
		{
			this.createTypes()
		}

		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()

			if (prevState.dialogType === 'shop_export')
			{
				saveAs(new Blob([this.props.fileData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `${TEXT.SHOP_TITLE}.xlsx`)
				this.props.ClearProps(['fileData'])
			}
			else
			{
				this.state.tableTab === 0 && this.props.ShopSettingParamsLoad() ||
				this.state.tableTab === 1 && this.props.ShopItemLoad(prevState.currentType)
			}
		}
	}

	createTypes = () =>
	{
		this.listType = _.filter(this.props.shopSettingParams || [], data => _.includes(['Type','SubType'], data['type']) && data.deletedAt === 0 )
		this.listType = _.groupBy(this.listType,data=>data.paramName)
	}

	renderDialog = () =>
	{
		return (
			<ModalDialog
				open={this.state.isDialogOpen}
				titleText={
					this.state.dialogType === 'shop_import' && `${TEXT.BUTTON_IMPORT} ${TEXT.SHOP_TITLE}` ||

                    this.state.dialogType === 'setting_param_add' && TEXT.SHOP_TITLE_NEW_SETTING_PARAM ||
                    this.state.dialogType === 'setting_param_edit' && TEXT.SHOP_TOOLTIP_EDIT_SETTING_PARAM ||
                    this.state.dialogType === 'setting_param_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'setting_param_restore' && TEXT.REMIND_TITLE ||

					this.state.dialogType === 'item_delete' && TEXT.REMIND_TITLE ||
					this.state.dialogType === 'item_restore' && TEXT.REMIND_TITLE ||
                    ''
                }
				confirmText={TEXT.MODAL_OK}
				cancelText={TEXT.MODAL_CANCEL}
				handleConfirmClick={this.handleAction('submit')}
				handleCancelClick={this.handleAction('close')}
                confirmDisable={(_.includes(this.state.dialogType, '_delete') || _.includes(this.state.dialogType, '_restore')) ? false : this.validateSubmit(this.state.rowData)}
			>
			{
				(this.state.dialogType === 'item_delete' || this.state.dialogType === 'item_restore') && this.renderDeleteRestoreItem()
			}
			{
				(this.state.dialogType === 'setting_param_delete' || this.state.dialogType === 'setting_param_restore') && this.renderDeleteRestoreSettingParam()
			}
			{
				(this.state.dialogType === 'setting_param_add' || this.state.dialogType === 'setting_param_edit') && this.renderAddEditSettingParam()
			}
			{
				this.state.dialogType === 'shop_import' && this.renderImportShop()
			}
			</ModalDialog>
		)
	}

	validateSubmit = (data) =>
	{
		if (this.state.dialogType === 'shop_import')
		{
			return _.isEmpty(data.file)
		}

		const {tableTab} = this.state;

		switch(tableTab)
		{
			case 0:
				return _.some(['type','paramName'], name => _.isEmpty(data[name]))
			case 1:
				return (
					_.some(['type','name'], name => _.isEmpty(data[name]))
				)	
			default:
				return true
		}
	}

	renderDeleteRestoreItem = () =>
	{
		const { classes } = this.props
		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'item_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.SHOP_MESSAGE_DELETE_ITEMS, this.state.rowData.length) : TEXT.SHOP_MESSAGE_DELETE_ITEM) ||
						this.state.dialogType === 'item_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.SHOP_MESSAGE_RESTORE_ITEMS, this.state.rowData.length) : TEXT.SHOP_MESSAGE_RESTORE_ITEM) ||
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
									{`${data.name} - ${data.type} - ${data.imageUrl}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.name} - ${this.state.rowData.type} - ${this.state.rowData.imageUrl}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderDeleteRestoreSettingParam = () =>
	{
		const { classes } = this.props

		return (
			<div className={classes.divRow}>
				<WarningRounded className={classes.warningIcon} fontSize={'large'} />
				<div className={clsx(classes.divColumn, classes.divFullWidth)}>
					<Typography style={{ paddingBottom: 20, fontWeight: 500 }}>
					{ 
						this.state.dialogType === 'setting_param_delete' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.SHOP_MESSAGE_DELETE_SETTING_PARAMS, this.state.rowData.length) : TEXT.SHOP_MESSAGE_DELETE_SETTING_PARAM) ||
						this.state.dialogType === 'setting_param_restore' && (this.state.isMultiSelectMode ? Utils.parseString(TEXT.SHOP_MESSAGE_RESTORE_SETTING_PARAMS, this.state.rowData.length) : TEXT.SHOP_MESSAGE_RESTORE_SETTING_PARAM) ||
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
									{`${data.paramName} - ${data.type} - ${data.description}`}
								</Typography>
							)	
						})
						:
						<Typography key={this.state.rowData.id} style={{ paddingBottom: 5 }}>
							{`${this.state.rowData.paramName} - ${this.state.rowData.type} - ${this.state.rowData.description}`}
						</Typography>
					}
					</div>
				</div>
			</div>
		)
	}

	renderImportShop = () =>
	{
		const { classes } = this.props

		return (
			<div className={clsx(classes.divColumn)}>
				<Typography>{TEXT.SHOP_SHOP_FILE}</Typography>
				<CmsInputFile 
					name={'file'}
					value={this.state.rowData.file || []} 
					onChange={(file) => { this.handleAction('file', file)(null) }} 
					acceptFile={'.xlsx'}
				/>
			</div>
		)
	}

	renderAddEditSettingParam = () =>
	{
		const { classes, typesShopSetting } = this.props;
	
		return (
			<div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.SHOP_TABLE_HEADER_PARAM_NAME}</Typography>
					<TextField
						className={clsx(classes.inputTextField, classes.inputText)}
						value={this.state.rowData.paramName || ''}
						margin="normal"
						fullWidth
						variant={'outlined'}
						onChange={(evt) => { this.handleAction('paramName', evt.target.value)(evt) }}
						disabled={this.state.dialogType === 'setting_param_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.TABLE_HEADER_TYPE}</Typography>
					<Autocomplete
						autoComplete
						autoSelect
						filterSelectedOptions
						value={this.state.rowData.type}
						options={typesShopSetting || []}
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
						disabled={this.state.dialogType === 'setting_param_edit'}
					/>
				</div>
				<div className={clsx(classes.divColumn)}>
					<Typography>{TEXT.SHOP_TABLE_HEADER_DESCRIPTION}</Typography>
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
									onClick={
										this.state.dialogType === 'item_view' && this.handleAction('item_edit', this.state.rowData) ||
										this.handleAction('submit')
									}
									className={clsx(classes.buttonLeft)}
									disabled={this.validateSubmit(this.state.rowData)}
								>
								{ 
									this.state.dialogType === 'item_view' && TEXT.MODAL_EDIT ||
									TEXT.MODAL_SAVE 
								}
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

	renderAddEditShopItemPage = () =>
	{
		const { 
			classes,		
			typesShopItem,
			CONTENT_ITEMS, 
			PRICE_ITEMS,
			SETTING_PARAMS,
			OPERATORS
		} = this.props;
	
		return (
			<div style={{ padding:'10px'}}>
				<div className={clsx(classes.table, classes.divColumn)}>
					{this.renderTitle(this.state.dialogType === 'item_add' ? TEXT.SHOP_TITLE_NEW_ITEM : (this.state.dialogType === 'item_view' ? TEXT.SHOP_TABLE_HEADER_ITEM_SETTING : TEXT.SHOP_TOOLTIP_EDIT_ITEM))}
					<div className={clsx(classes.root, classes.divColumn)} style={{maxHeight: 750, marginTop: 20, padding: '0px 20px', overflow: 'auto'}}>
						<div style={{width: '70%'}}>
							<div className={clsx(classes.divRow, classes.alignCenter)}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.TABLE_HEADER_NAME}</Typography>
								<TextField
									variant={'outlined'}
									className={classes.textField}
									value={this.state.rowData.name}
									onChange={(evt) => { this.handleAction('name', evt.target.value)(evt) }}
									fullWidth
									disabled={this.state.dialogType === 'item_view'}
								/>
							</div>
							<div className={clsx(classes.divRow, classes.alignCenter)}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.SHOP_TABLE_HEADER_PRODUCT_ID}</Typography>
								<div className={clsx(classes.root, classes.divRow, classes.alignCenter)}>
									<TextField
										variant={'outlined'}
										className={classes.textField}
										value={this.state.rowData.productId?.ios || ''}
										onChange={(evt) => { this.handleAction('ios', evt.target.value)(evt) }}
										label={TEXT.SHOP_TABLE_HEADER_IOS}
										fullWidth
										disabled={this.state.dialogType === 'item_view'}
									/>
									<TextField
										variant={'outlined'}
										className={classes.textField}
										value={this.state.rowData.productId?.android || ''}
										onChange={(evt) => { this.handleAction('android', evt.target.value)(evt) }}
										label={TEXT.SHOP_TABLE_HEADER_ANDROID}
										fullWidth
										disabled={this.state.dialogType === 'item_view'}
									/>
								</div>
							</div>
							<div className={clsx(classes.divRow, classes.alignCenter)}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.SHOP_TABLE_HEADER_IMAGE_URL}</Typography>
								<TextField
									variant={'outlined'}
									className={classes.textField}
									value={this.state.rowData.imageUrl}
									onChange={(evt) => { this.handleAction('imageUrl', evt.target.value)(evt) }}
									fullWidth
									disabled={this.state.dialogType === 'item_view'}
								/>
							</div>
							<div className={clsx(classes.divRow, classes.alignCenter)} style={{marginBottom:'20px'}}>
								<Typography style={{width: TITLE_WIDTH_2}} >{TEXT.TABLE_HEADER_TYPE}</Typography>
								<Autocomplete
									autoComplete
									autoSelect
									filterSelectedOptions
									value={this.state.rowData.type}
									options={typesShopItem || []}
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
									disabled={this.state.dialogType === 'setting_param_edit' || this.state.dialogType === 'item_view'}
									style={{marginBottom:'0px', marginRight: 15}}
									fullWidth
								/>
							</div>
							<Divider/> 
							<div style={{margin:'10px 0px'}}>
								<div className={clsx(classes.divColumn)}>
										<Typography>{TEXT.SHOP_TABLE_HEADER_CONTENT_ITEMS}</Typography>
								</div>	
								<div className={clsx(classes.divColumn)}>
								{
									_.map(this.state.rowData.content,(data,index)=> 
									{
										return (
											<div className={clsx(classes.justifyBetween,classes.divRow,classes.alignCenter,classes.paddingTextField)} key={index}>	
												<Autocomplete
													autoComplete
													autoSelect
													filterSelectedOptions
													value={data.type}
													options={ Object.keys( _.groupBy(CONTENT_ITEMS,(data) => data.type)) || []}
													onChange={(evt, value) => {
														this.handleAction('type-content', value, index)(evt)
													}}
													disableClearable={true}
													renderInput={(params) => (
														<TextField {...params}
															variant="outlined"
															label={TEXT.TABLE_HEADER_TYPE}
														/>
													)}
													classes={{
														root: classes.autoComplete,
														input: classes.autoCompleteInput,
														inputRoot: classes.autoCompleteInputRoot
													}}
													fullWidth
													style={{marginRight:'10px',marginBottom:'0px'}}
													disabled={this.state.dialogType === 'item_view'}
												/>
												<Autocomplete
													autoComplete
													autoSelect
													filterSelectedOptions
													value={data.name}
													options={ Object.keys( _.groupBy(CONTENT_ITEMS,(data) => data.name)) || []}
													onChange={(evt, value) => {
														this.handleAction('name-content', value, index)(evt)
													}}
													disableClearable={true}
													renderInput={(params) => (
														<TextField {...params}
															variant="outlined"
															label={TEXT.TABLE_HEADER_NAME}
														/>
													)}
													classes={{
														root: classes.autoComplete,
														input: classes.autoCompleteInput,
														inputRoot: classes.autoCompleteInputRoot
													}}
													fullWidth
													style={{marginRight:'10px',marginBottom:'0px'}}
													disabled={this.state.dialogType === 'item_view'}
												/>
												<TextField
														className={clsx(classes.inputTextField, classes.inputText)}
														value={data.amount || '' }
														margin="normal"
														variant={'outlined'}
														label={TEXT.SHOP_TABLE_HEADER_AMOUNT}
														fullWidth
														onChange={(evt) => { this.handleAction('amount-content', evt.target.value, index)(evt) }}
														style={{marginRight:'10px',marginBottom:'0px'}}
														disabled={this.state.dialogType === 'item_view'}
												/>		
												{
													this.state.dialogType !== 'item_view' &&
													<Icons.IconRemove 
														onClick={this.handleAction('removeItem', 'content', index )} 
														style={{cursor:'pointer'}}
													/>	
												}
											</div>
										)
									})
								}
								</div>
								{
									this.state.dialogType !== 'item_view' &&
									<div>
										<Button
											variant='outlined'
											color={'default'}
											className={classes.buttonAdd}
											startIcon={<Icons.IconAdd />}
											onClick={this.handleAction('addItem','content',this.defaultContentPrice)}
										>
											{TEXT.SHOP_BUTTON_ADD_CONTENT_ITEM}
										</Button>
									</div>
								}
							</div>	
						
							<Divider/>
							<div style={{margin:'10px 0px'}}>	
								<div className={clsx(classes.divColumn)}>
									<Typography>{TEXT.SHOP_TABLE_HEADER_PRICE_ITEMS}</Typography>
								</div>
								<div className={clsx(classes.divColumn)}>
									{
									_.map(this.state.rowData.price,(data,index)=> 
										{
											return (
												<div className={clsx(classes.justifyBetween,classes.divRow,classes.alignCenter,classes.paddingTextField)} key={index}>	
													<Autocomplete
														autoComplete
														autoSelect
														filterSelectedOptions
														value={data.type}
														options={ Object.keys( _.groupBy(PRICE_ITEMS,(data) => data.type)) || []}
														onChange={(evt, value) => {
															this.handleAction('type-price', value, index)(evt)
														}}
														disableClearable={true}
														renderInput={(params) => (
															<TextField {...params}
																variant="outlined"
																label={TEXT.TABLE_HEADER_TYPE}
															/>
														)}
														classes={{
															root: classes.autoComplete,
															input: classes.autoCompleteInput,
															inputRoot: classes.autoCompleteInputRoot
														}}
														fullWidth
														style={{marginRight:'10px',marginBottom:'0px'}}
														disabled={this.state.dialogType === 'item_view'}
													/>
													<Autocomplete
														autoComplete
														autoSelect
														filterSelectedOptions
														value={data.name}
														options={ Object.keys( _.groupBy(PRICE_ITEMS,(data) => data.name)) || []}
														onChange={(evt, value) => {
															this.handleAction('name-price', value, index)(evt)
														}}
														disableClearable={true}
														renderInput={(params) => (
															<TextField {...params}
																variant="outlined"
																label={TEXT.TABLE_HEADER_NAME}
															/>
														)}
														classes={{
															root: classes.autoComplete,
															input: classes.autoCompleteInput,
															inputRoot: classes.autoCompleteInputRoot
														}}
														fullWidth
														style={{marginRight:'10px',marginBottom:'0px'}}
														disabled={this.state.dialogType === 'item_view'}
													/>
													<TextField
														className={clsx(classes.inputTextField, classes.inputText)}
														value={data.amount || 0}
														margin="normal"
														variant={'outlined'}
														label={TEXT.SHOP_TABLE_HEADER_AMOUNT}
														onChange={(evt) => { this.handleAction('amount-price', evt.target.value, index)(evt) }}
														fullWidth
														style={{marginRight:'10px', marginBottom:'0px'}}
														type='number'
														inputProps={{
															maxLength: 13,
															step: '0.1'
														}}
														disabled={this.state.dialogType === 'item_view'}
													/>		
													{
														this.state.dialogType !== 'item_view' &&
														<Icons.IconRemove 
															onClick={this.handleAction('removeItem', 'price', index )} 
															style={{cursor:'pointer'}}
														/>		
													}												
												</div>
											)
										})
									}
								</div>
								{
									this.state.dialogType !== 'item_view' &&
									<div>
										<Button
											variant='outlined'
											color={'default'}
											className={classes.buttonAdd}
											startIcon={<Icons.IconAdd />}
											onClick={this.handleAction('addItem','price',this.defaultContentPrice)}
										>
											{TEXT.SHOP_BUTTON_ADD_PRICE_ITEM}
										</Button>
									</div>
								}
							</div>	

							<Divider/>
							<div style={{margin:'10px 0px'}}>	
								<div className={clsx(classes.divColumn)}>
										<Typography>{TEXT.SHOP_TABLE_HEADER_SETTING_PARAMS}</Typography>
								</div>
								<div className={clsx(classes.divColumn)}>
								{
									_.map(this.state.rowData.settings,(data,index)=> 
									{
										return (
											<div className={clsx(classes.justifyBetween,classes.divRow,classes.alignCenter,classes.paddingTextField)} key={index}>	
												<Autocomplete
													autoComplete
													autoSelect
													filterSelectedOptions
													value={data.paramName}
													options={SETTING_PARAMS || []}
													onChange={(evt, value) => {
														this.handleAction('paramName-settings', value, index)(evt)
													}}
													disableClearable={true}
													renderInput={(params) => (
														<TextField {...params}
															variant="outlined"
															label={TEXT.SHOP_TABLE_HEADER_PARAM_NAME}
														/>
													)}
													classes={{
														root: classes.autoComplete,
														input: classes.autoCompleteInput,
														inputRoot: classes.autoCompleteInputRoot
													}}
													fullWidth
													style={{marginRight:'10px',marginBottom:'0px'}}
													disabled={this.state.dialogType === 'item_view'}
												/>
												<Autocomplete
													autoComplete
													autoSelect
													filterSelectedOptions
													value={data.operator}
													options={ OPERATORS || []}
													onChange={(evt, value) => {
														this.handleAction('operator-settings', value, index)(evt)
													}}
													disableClearable={true}
													renderInput={(params) => (
														<TextField {...params}
															variant="outlined"
															label={TEXT.SHOP_TABLE_HEADER_OPERATORS}
														/>
													)}
													classes={{
														root: classes.autoComplete,
														input: classes.autoCompleteInput,
														inputRoot: classes.autoCompleteInputRoot
													}}
													fullWidth
													style={{marginRight:'10px',marginBottom:'0px'}}
													disabled={this.state.dialogType === 'item_view'}
												/>
												{
													_.find(_.filter(this.props.shopSettingParams || [], settingParam => settingParam.deletedAt === 0), shopSettingParam => (shopSettingParam.paramName === data.paramName))?.description?.toLowerCase() === 'date'
													?
													<div className={clsx(classes.divColumn, classes.divHeight, classes.cmsDate)}>
														<CmsDate
															views={['date', 'hours', 'minutes']} 
															raiseSubmitOnMounted={true}
															enableFullTimeFormat={true} 
															disableToolbar={false} 
															disablePast={true} 
															disableCheckMaxRange={true}
															initDate={
																{ 
																	date_begin: parseInt(data.value) ? Utils.convertToLocalTime(parseInt(data.value)) : moment().valueOf()
																}
															}
															onDateSubmit={(data) => {
																this.handleAction('value-settings', data.ms_begin_utc.toString(), index)(null)
															}}
															isSingleChoice={true}
															disabledEndDate={true}
															disabled={this.state.dialogType === 'item_view'}
														/>
														<Typography style={{fontSize: '0.75rem', fontWeight: 500}}>{TEXT.TOOLTIP_DATE}</Typography>
													</div>
													:
													<TextField
														className={clsx(classes.inputTextField, classes.inputText)}
														value={data.value || '' }
														margin="normal"
														variant={'outlined'}
														label={TEXT.SHOP_TABLE_HEADER_VALUE}
														onChange={(evt) => { this.handleAction('value-settings', evt.target.value, index)(evt) }}
														fullWidth
														style={{marginRight:'10px',marginBottom:'0px'}}
														disabled={this.state.dialogType === 'item_view'}
													/>		
												}
												{
													this.state.dialogType !== 'item_view' &&
													<Icons.IconRemove 
														onClick={this.handleAction('removeItem', 'settings', index )} 
														style={{cursor:'pointer'}}
													/>	
												}
											</div>
										)
									})
								}
								</div>
								{
									this.state.dialogType !== 'item_view' &&
									<div>
										<Button
											variant='outlined'
											color={'default'}
											className={classes.buttonAdd}
											startIcon={<Icons.IconAdd />}
											onClick={this.handleAction('addItem','settings',this.defaultSetting)}
										>
											{TEXT.SHOP_BUTTON_ADD_SETTING_PARAM}
										</Button>
									</div>
								}
							</div>	

						</div>
					</div>
				</div>
			</div>
		)
	}

	handleAction = (name, data, index) => (evt) =>
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
			case 'addItem':
				this.setState({
					rowData:{
						...this.state.rowData,
						[data]: [
							...this.state.rowData[data],
							index
						]
					}
				})
				break;
			case 'removeItem':
				this.setState({
					rowData: {
						...this.state.rowData,
						[data]: this.state.rowData[data].filter((name,idx) => index!==idx)
					}
				})
				break;
			case 'submit':
				if (this.state.isMultiSelectMode)
				{
					_.forEach(this.state.rowData, row =>
					{
						this.state.dialogType === 'setting_param_delete' && this.props.ShopSettingParamsDelete(row) ||
						this.state.dialogType === 'item_delete' && this.props.ShopItemDelete(row) ||
						
						this.state.dialogType === 'setting_param_restore' && this.props.ShopSettingParamsRestore(row) ||
						this.state.dialogType === 'item_restore' && this.props.ShopItemRestore(row) 
					})
				}
				else
				{
					this.state.dialogType === 'shop_import' && this.props.ResourcesImport('shop', this.state.rowData) ||

					this.state.dialogType === 'setting_param_add' && this.props.ShopSettingParamsAdd(this.state.rowData) ||
					this.state.dialogType === 'setting_param_edit' && this.props.ShopSettingParamsEdit(this.state.rowData) ||
					this.state.dialogType === 'setting_param_delete' && this.props.ShopSettingParamsDelete(this.state.rowData) ||
					this.state.dialogType === 'setting_param_restore' && this.props.ShopSettingParamsRestore(this.state.rowData) ||
							
					this.state.dialogType === 'item_add' && this.props.ShopItemAdd(this.state.rowData) ||
					this.state.dialogType === 'item_edit' && this.props.ShopItemEdit(this.state.rowData) ||
					this.state.dialogType === 'item_delete' && this.props.ShopItemDelete(this.state.rowData,this.state.currentType) ||
					this.state.dialogType === 'item_restore' && this.props.ShopItemRestore(this.state.rowData) 
				}
				break

			case 'tableTab':
				(data !== this.state.tableTab) && this.setState(
					{
						tableTab: data,
						isMultiSelectMode: false, 
						currentType: _.isEmpty(this.state.currentType) ? (Object.keys(this.listType)[0] || '') : this.state.currentType
					},
					() =>
					{
						if (this.state.tableTab === 0)
						{
							this.props.ShopSettingParamsLoad()
						}
						else if (this.state.tableTab === 1)
						{
							!_.isEmpty(this.state.currentType) && this.props.ShopItemLoad(this.state.currentType)
						}
					}
				)
				break
			case 'currentType':
				this.setState(
					{
						currentType: data,
						isMultiSelectMode: false,
					},
					() =>
					{
						this.selectedRows = []
						this.props.ShopItemLoad(this.state.currentType)
					}
				)
				break
			case 'shop_import':	
			case 'setting_param_add':
			case 'setting_param_edit':
			case 'setting_param_delete':
			case 'setting_param_restore':	
			case 'item_delete':
			case 'item_restore':
				this.setState({
					isDialogOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})
				break
			case 'item_add':
			case 'item_edit':
			case 'item_view':
				this.setState({
					isPageOpen: true,
					dialogType: name,
					rowData: this.state.isMultiSelectMode ? _.filter(this.selectedRows, row => (_.includes(name, '_delete') ? row.deletedAt === 0 : row.deletedAt > 0)) : data
				})
				break
			case 'type-content':
			case 'name-content':
			case 'amount-content':
			case 'type-price':
			case 'name-price':
			case 'amount-price':
			case 'paramName-settings':
			case 'operator-settings':
			case 'value-settings':
				let key = name.split('-')[1];
				let value = name.split('-')[0];
				this.setState({
					rowData: {
						...this.state.rowData,
						[key]: _.map(this.state.rowData[key],(item,idx)=>{
							return index === idx
									? {
										...item,
										[value]: (key === 'content' && value === 'amount') ? +data : ((key === 'price' && value === 'amount') ? (data === '' ? 0 : parseFloat(data)) : data)
									} 
									: item
						})
					}
				})
				break	

			case 'ios':
			case 'android':
				this.setState({
                    rowData: {
						...this.state.rowData,
						productId: { ...this.state.rowData.productId, [name]: data }
					}
                })
				break
			case 'shop_export':
				this.setState(
					{
						dialogType: name,
						rowData: data
					},
					() =>
					{
						this.props.ResourcesExport('shop')
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

    render()
    {
        const { classes } = this.props;
        
        return (
            <div className={classes.root}>
				{this.state.isPageOpen ? this.renderAddEditShopItemPage() : this.renderTableTabs()}
				{
					(
						_.includes(this.state.dialogType,'setting_param_') 
						|| this.state.dialogType === 'item_delete' 
						|| this.state.dialogType === 'item_restore'
						|| this.state.dialogType === 'shop_import'
					)
					&& this.renderDialog()
				}
			</div>
        );
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
								onClick={this.handleAction('shop_import', {})}
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
								onClick={this.handleAction('shop_export', {})}
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
						classes={{
							root: clsx(classes.tabs),
						}}
					>
						<Tab label={TEXT.SHOP_TABLE_TAB_SETTING_PARAM}/>
						<Tab label={TEXT.SHOP_TABLE_TAB_ITEM} />
					</Tabs>
					{this.actionsExtend.createElement(this.actionsExtend)}
				</div>
				<CmsTabPanel value={this.state.tableTab} index={0}>
				{
					this.renderShopSettingParamsTable()
				}
				</CmsTabPanel>
				<CmsTabPanel value={this.state.tableTab} index={1}>
				{
					this.renderItemsTable()
				}
				</CmsTabPanel>
			</>	
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

	renderShopSettingParamsTable = () =>
	{
		const {shopSettingParams, classes } = this.props;
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.SHOP_TABLE_HEADER_PARAM_NAME, field: 'paramName', width: 300,
                        },
						{
                            title: TEXT.TABLE_HEADER_TYPE, field: 'type', width: 250,
                        },
						{
                            title: TEXT.SHOP_TABLE_HEADER_DESCRIPTION, field: 'description', width: 250,
                        },
                        {
                            title: TEXT.TABLE_HEADER_DATE, 
							placeholder: TEXT.TABLE_HEADER_CREATED_DATE, 
							field: 'createdAt', width: 260,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'createdAt'),
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'modifiedAt'),
						},
						{
                            title: TEXT.TABLE_HEADER_OWNER, 
							placeholder: TEXT.TABLE_HEADER_CREATED_BY, 
							field: 'createdBy', width: 350,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, 
							field: 'modifiedBy', 
							hidden: true,
                        },
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt', 
							width: 150,
                            render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'deletedAt'),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('setting_param_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.REWARD_TOOLTIP_EDIT_ITEM),
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
								this.handleAction('setting_param_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.REWARD_TOOLTIP_DELETE_ITEM),
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
								this.handleAction('setting_param_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.REWARD_TOOLTIP_RESTORE_ITEM),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={shopSettingParams || []}

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

	renderItemsTable = () =>
	{
		const {shopItems, classes } = this.props
		
		return (
            <div className={clsx(classes.table, classes.divColumn)}>
                <CmsTable
                    columns={[
                        {
                            title: TEXT.TABLE_HEADER_NAME, field: 'name', width: 150,
                        },
						{
                            title: TEXT.SHOP_TABLE_HEADER_IMAGE_URL, field: 'imageUrl', width: 150,
                        },
						{
                            title: TEXT.TABLE_HEADER_TYPE, field: 'type', width: 250,
                        },
						{
                            title: TEXT.SHOP_TABLE_HEADER_SETTINGS, field: 'type', width: 150,
							render: rowData =>
                            {
								return (
									<CmsControlPermission
										control={
											<Tooltip 
												title={TEXT.SHOP_TOOLTIP_VIEW_SETTING_ITEM}
												placement={'top'}
											>
												<IconButton
													onClick={(event) => {
														this.handleAction('item_view', rowData)(event)
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
                            title: TEXT.TABLE_HEADER_DATE, 
							placeholder: TEXT.TABLE_HEADER_CREATED_DATE, 
							field: 'createdAt', width: 260,
							render: rowData => this.renderDateColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'createdAt'),
                        },
						{
							title: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							placeholder: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							field: 'modifiedAt', hidden: true,
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'modifiedAt'),
						},
						{
                            title: TEXT.TABLE_HEADER_OWNER, 
							placeholder: TEXT.TABLE_HEADER_CREATED_BY, 
							field: 'createdBy', width: 350,
							render: rowData => this.renderOwnersColumn(rowData)
                        },
						{
                            title: TEXT.TABLE_HEADER_MODIFIED_DATE, 
							placeholder: TEXT.TABLE_HEADER_MODIFIED_BY, 
							field: 'modifiedBy', 
							hidden: true,
                        },
						{
                            title: TEXT.TABLE_HEADER_DELETED_AT, field: 'deletedAt',
							width: 150,
                            render: rowData => this.renderDeletedAtColumn(rowData),
							customFilterAndSearch: (term, rowData, columnDef) => this.dateFilterAndSearch(term, rowData, columnDef, 'deletedAt'),
                        },
                    ]}

					actions={[
						{
							icon: (props) => <Icons.IconEdit {...props} />,
							onClick: (event, rowData) =>
							{
								this.handleAction('item_edit', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.REWARD_TOOLTIP_EDIT_ITEM),
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
								this.handleAction('item_delete', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt > 0) ? '' : TEXT.REWARD_TOOLTIP_DELETE_ITEM),
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
								this.handleAction('item_restore', rowData)(event)
							},
							tooltip: (rowData) => ((this.state.isMultiSelectMode || rowData.deletedAt === 0) ? '' : TEXT.REWARD_TOOLTIP_RESTORE_ITEM),
							disabled: (rowData) => (this.state.isMultiSelectMode || rowData.deletedAt === 0),
							iconProps: { color: 'inherit' },
							position: 'row',
							controlPermission: {
								link: '',
								attribute: ''
							}
						},
					]}

                    data={shopItems || []}

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
						cellAction: true,
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
					actionsExtend={this.actionsExtendItemTable}
                />
            </div>		
		)
	}

}

Shop.propTypes =
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
	ShopSettingParamsLoad: () =>
	{
		dispatch(ActionCMS.ShopSettingParamsLoad())
	},
	ShopSettingParamsAdd: (setting_param_data) =>
	{
		dispatch(ActionCMS.ShopSettingParamsAdd(setting_param_data))
	},
	ShopSettingParamsEdit: (setting_param_data) =>
	{
		dispatch(ActionCMS.ShopSettingParamsEdit(setting_param_data))
	},
	ShopSettingParamsDelete: (setting_param_data) =>
	{
		dispatch(ActionCMS.ShopSettingParamsDelete(setting_param_data))
	},
	ShopSettingParamsRestore: (setting_param_data) =>
	{
		dispatch(ActionCMS.ShopSettingParamsRestore(setting_param_data))
	},
	ShopItemLoad: (type) =>
	{
		dispatch(ActionCMS.ShopItemLoad(type))
	},
	ShopItemAdd: (shop_item_data) =>
	{
		dispatch(ActionCMS.ShopItemAdd(shop_item_data))
	},
	ShopItemEdit: (shop_item_data) =>
	{
		dispatch(ActionCMS.ShopItemEdit(shop_item_data))
	},
	ShopItemDelete: (shop_item_data, type) =>
	{
		dispatch(ActionCMS.ShopItemDelete(shop_item_data, type))
	},
	ShopItemRestore: (shop_item_data) =>
	{
		dispatch(ActionCMS.ShopItemRestore(shop_item_data))
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
    withMultipleStyles(styles, customStyle)
)(Shop);

