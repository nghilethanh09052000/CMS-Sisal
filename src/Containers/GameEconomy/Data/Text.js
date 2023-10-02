const TEXT = {
    MODAL_OK: 'Ok',
    MODAL_CANCEL: 'Cancel',
    MODAL_BACK: 'Back',
    MODAL_SAVE: 'Save',
    MODAL_CLOSE: 'Close',
    MODAL_EDIT: 'Edit',

    TABLE_HEADER_ID: 'Id',
    TABLE_HEADER_STATUS: 'Status',
    TABLE_HEADER_NAME:'Name',
    TABLE_HEADER_TYPE:'Type',
    TABLE_HEADER_ITEM:'Item',
    TABLE_HEADER_DELETED_AT: 'Deleted At',
    TABLE_HEADER_DATE: 'Date',
    TABLE_HEADER_CREATED_DATE: 'Created Date',
    TABLE_HEADER_MODIFIED_DATE: 'Modified Date',
    TABLE_HEADER_OWNER: 'Owners',
    TABLE_HEADER_CREATED_BY: 'Created By',
    TABLE_HEADER_MODIFIED_BY: 'Modified By', 
    TABLE_HEADER_BLANK: ' ',
    TABLE_HEADER_IGNORE_DELETE: 'Ignore Deleted',
    
    TOOLTIP_DATE:'All the times are in UTC+0',
    REMIND_TITLE: 'We remind you!',
    CONTENT_TOOLTIP_STATUS: 'The latest settings will be the only one active',

    JSON_INVALID: 'Invalid Json',

    BUTTON_IMPORT: 'Import',
    BUTTON_EXPORT: 'Export',
    
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- REWARD ----------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    REWARD_TABLE_HEADER_DESCRIPTION:'Description',
    REWARD_TABLE_HEADER_REQUIREMENTS:'Requirements',
    REWARD_TABLE_HEADER_REQUIREMENT:'Requirement',
    REWARD_TABLE_HEADER_CROSS_SEASON:'Cross Season',

    REWARD_TABLE_HEADER_QUANTITY:'Quantity',
    REWARD_TABLE_HEADER_BUSINESS_LEVEL:'Business Level',
    REWARD_TABLE_HEADER_STADIUM_LEVEL:'Stadium Level',
    REWARD_TABLE_HEADER_MAX:'Max',
    REWARD_TABLE_HEADER_MIN:'Min',
    REWARD_TABLE_HEADER_MAX_SCORE:'Max Score',
    REWARD_TABLE_HEADER_MIN_SCORE:'Min Score',
    REWARD_TABLE_HEADER_MAX_RANK:'Max Rank',
    REWARD_TABLE_HEADER_MIN_RANK:'Min Rank',
    REWARD_TABLE_HEADER_CHANCE_PERCENTAGE:'Chance Percentage',
    REWARD_TABLE_HEADER_QUEST:'Quest',
    REWARD_TABLE_HEADER_MINIGAME:'Minigame',
    REWARD_TABLE_HEADER_LEADERBOARD:'Leaderboard',
    REWARD_TABLE_HEADER_ACHIEVEMENT:'Achievement',
    REWARD_TABLE_HEADER_DIFFICULTY:'Difficulty',
    REWARD_TABLE_HEADER_TIER:'Tier',
    REWARD_TABLE_HEADER_PROFILE_ID: 'Profile Id',
    REWARD_TABLE_HEADER_PACKAGE:'Package',
    REWARD_TABLE_HEADER_ITEMS:'Items',
    REWARD_TABLE_HEADER_CARDS:'Cards',
    REWARD_TABLE_HEADER_REMAINING_ITEMS:'Remaining Items',
    REWARD_TABLE_HEADER_REMAINING_CARDS:'Remaining Cards', 
    REWARD_TABLE_HEADER_AMOUNT:'Amount',
    REWARD_TABLE_HEADER_GIFTS:'Gifts',
    REWARD_TABLE_HEADER_EXTRA_INFO:'Extra Info',
    REWARD_TABLE_HEADER_RECEIVED:'Received',
    REWARD_TABLE_HEADER_AVAILABLE_ONLY:'Available Only',
    REWARD_TABLE_HEADER_GIFTABLE:'Giftable',

    REWARD_MANAGEMENT_TITLE: 'Reward Management',
    REWARD_WARNING_DUPLICATE_NAME:'You have provided a duplicated name',
    REWARD_WARNING_DUPLICATE_REQUIREMENT:'Requirement can not be duplicated',
    REWARD_REWARD_FILE: 'Reward File',

    REWARD_TABLE_TAB_TYPE:'Type',
    REWARD_TABLE_TAB_ITEM:'Item',
    REWARD_TABLE_TAB_PACK:'Pack',
    REWARD_TABLE_TAB_SETTING:'Setting',
    REWARD_TABLE_TAB_REWARD:'Reward',

    REWARD_BUTTON_ADD_TYPE:'Add Type',
    REWARD_BUTTON_ADD_ITEM:'Add Item',
    REWARD_BUTTON_ADD_PACK:'Add Pack',
    REWARD_BUTTON_ADD_SETTING:'Add Setting',
    REWARD_BUTTON_SEND_GIFT:'Send Gift',
    REWARD_BUTTON_ADD_CARD:'Add Card',

    REWARD_BUTTON_RESTORE_TYPES:'Restore Types',
    REWARD_BUTTON_RESTORE_ITEMS:'Restore Items',
    REWARD_BUTTON_RESTORE_PACKS:'Restore Packs',
    REWARD_BUTTON_RESTORE_SETTINGS:'Restore Settings',

    REWARD_BUTTON_DELETE_TYPES:'Delete Types',
    REWARD_BUTTON_DELETE_ITEMS:'Delete Items',
    REWARD_BUTTON_DELETE_PACKS:'Delete Packs',
    REWARD_BUTTON_DELETE_SETTINGS:'Delete Settings',
    
    REWARD_BUTTON_ADD_REQUIREMENT:'Add Requirement',
    
    REWARD_TITLE_NEW_TYPE:'New Type',
    REWARD_TITLE_NEW_ITEM:'New Item',
    REWARD_TITLE_NEW_PACK:'New Pack',
    REWARD_TITLE_NEW_SETTING:'New Setting',
    REWARD_TITLE_EDIT_TYPE:'Edit Type',
    REWARD_TITLE_EDIT_ITEM:'Edit Item',
    REWARD_TITLE_EDIT_PACK:'Edit Pack',
    REWARD_TITLE_EDIT_SETTING:'Edit Setting',
    REWARD_TITLE_FROM_EXCEL_FILE:'From Excel File',

    REWARD_MESSAGE_DELETE_TYPE: 'Do you want to Delete this Type?',
    REWARD_MESSAGE_DELETE_TYPES: 'Do you want to Delete these Types ({%s} items)?',
    REWARD_MESSAGE_RESTORE_TYPE: 'Do you want to Restore this Type?',
    REWARD_MESSAGE_RESTORE_TYPES: 'Do you want to Restore these Types ({%s} items)?',
    REWARD_MESSAGE_DELETE_ITEM: 'Do you want to Delete this Item?',
    REWARD_MESSAGE_DELETE_ITEMS: 'Do you want to Delete these Items ({%s} items)?',
    REWARD_MESSAGE_RESTORE_ITEM: 'Do you want to Restore this Item?',
    REWARD_MESSAGE_RESTORE_ITEMS: 'Do you want to Restore these Items ({%s} items)?',
    REWARD_MESSAGE_DELETE_PACK: 'Do you want to Delete this Pack?',
    REWARD_MESSAGE_DELETE_PACKS: 'Do you want to Delete these Packs ({%s} items)?',
    REWARD_MESSAGE_RESTORE_PACK: 'Do you want to Restore this Pack?',
    REWARD_MESSAGE_RESTORE_PACKS: 'Do you want to Restore these Packs ({%s} items)?',
    REWARD_MESSAGE_DELETE_SETTING: 'Do you want to Delete this Setting?',
    REWARD_MESSAGE_DELETE_SETTINGS: 'Do you want to Delete these Settings ({%s} items)?',
    REWARD_MESSAGE_RESTORE_SETTING: 'Do you want to Restore this Setting?',
    REWARD_MESSAGE_RESTORE_SETTINGS: 'Do you want to Restore these Settings ({%s} items)?',
    REWARD_MESSAGE_ERROR_LOAD_PLAYER_CARD: 'Unable to load player card list',

    REWARD_TOOLTIP_VIEW_ITEMS:'View Item',
    REWARD_TOOLTIP_EDIT_TYPE:'Edit Type',
    REWARD_TOOLTIP_DELETE_TYPE:'Delete Type',
    REWARD_TOOLTIP_RESTORE_TYPE:'Restore Type',

    REWARD_TOOLTIP_EDIT_ITEM:'Edit Item',
    REWARD_TOOLTIP_DELETE_ITEM:'Delete Item',
    REWARD_TOOLTIP_RESTORE_ITEM:'Restore Item',

    REWARD_TOOLTIP_EDIT_PACK:'Edit Pack',
    REWARD_TOOLTIP_DELETE_PACK:'Delete Pack',
    REWARD_TOOLTIP_RESTORE_PACK:'Restore Pack',

    REWARD_TOOLTIP_EDIT_Setting:'Edit Setting',
    REWARD_TOOLTIP_DELETE_Setting:'Delete Setting',
    REWARD_TOOLTIP_RESTORE_Setting:'Restore Setting',

    REWARD_TOOLTIP_SEND_GIFT_LIMIT:' - Limit of 1000 Profile Id per Transaction.',

    REWARD_FILE_NAME_TITLE_TYPE:'Reward Type',
    REWARD_FILE_NAME_TITLE_ITEM:'Reward Item',
    REWARD_FILE_NAME_TITLE_PACK:'Reward Pack',
    REWARD_FILE_NAME_TITLE_SETTING:'Reward Setting',

    
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- SHOP ------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    SHOP_MANAGEMENT_TITLE: 'Shop Management',
    SHOP_TITLE: 'Shop',

    SHOP_TABLE_HEADER_DESCRIPTION:'Description',
    SHOP_TABLE_HEADER_PARAM_NAME:'Param Name',
    SHOP_TABLE_HEADER_CONTENT_ITEMS:'Content Items',
    SHOP_TABLE_HEADER_PRICE_ITEMS:'Price Items',
    SHOP_TABLE_HEADER_SETTING_PARAMS:'Setting Params',
    SHOP_TABLE_HEADER_OPERATORS: 'Opeators',
    SHOP_TABLE_HEADER_AMOUNT: 'Amount',
    SHOP_TABLE_HEADER_CONTENT:'Content',
    SHOP_TABLE_HEADER_PRICE:'Price',
    SHOP_TABLE_HEADER_IMAGE_URL:'Image Url',
    SHOP_TABLE_HEADER_SETTINGS:'Settings',
    SHOP_TABLE_HEADER_VALUE:'Value',
    SHOP_TABLE_HEADER_PRODUCT_ID: 'Produce Id',
    SHOP_TABLE_HEADER_IOS: 'IOS',
    SHOP_TABLE_HEADER_ANDROID: 'Android',
    SHOP_TABLE_HEADER_ITEM_SETTING:'Item Setting',

    SHOP_TABLE_TAB_SETTING_PARAM:'Setting Params',
    SHOP_TABLE_TAB_ITEM:'Items',

    SHOP_BUTTON_ADD_SETTING_PARAM:'Add Setting Param',
    SHOP_BUTTON_ADD_ITEM:'Add Item',
    SHOP_BUTTON_RESTORE_SETTING_PARAM:'Restore Setting Param',
    SHOP_BUTTON_RESTORE_SETTING_PARAMS:'Restore Setting Params',
    SHOP_BUTTON_RESTORE_ITEM:'Restore Item',
    SHOP_BUTTON_RESTORE_ITEMS:'Restore Items',
    SHOP_BUTTON_DELETE_SETTING_PARAM:'Delete Setting Param',
    SHOP_BUTTON_DELETE_SETTING_PARAMS:'Delete Setting Params',
    SHOP_BUTTON_DELETE_ITEM:'Delete Item',
    SHOP_BUTTON_DELETE_ITEMS:'Delete Items',
    SHOP_BUTTON_ADD_CONTENT_ITEM:'Add Content',
    SHOP_BUTTON_ADD_PRICE_ITEM:'Add Price',
    SHOP_BUTTON_ADD_SETTING:'Add Setting',

    SHOP_TITLE_NEW_SETTING_PARAM:'New Setting Param',
    SHOP_TITLE_NEW_ITEM:'New Item',
    
    SHOP_MESSAGE_DELETE_SETTING_PARAM: 'Do you want to Delete this Setting Param?',
    SHOP_MESSAGE_DELETE_SETTING_PARAMS: 'Do you want to Delete these Setting Params ({%s} items)?',
    SHOP_MESSAGE_RESTORE_SETTING_PARAM: 'Do you want to Restore this Setting Param?',
    SHOP_MESSAGE_RESTORE_SETTING_PARAMS: 'Do you want to Restore these Setting Params ({%s} items)?',
    SHOP_MESSAGE_DELETE_ITEM: 'Do you want to Delete this Item?',
    SHOP_MESSAGE_DELETE_ITEMS: 'Do you want to Delete these Items ({%s} items)?',
    SHOP_MESSAGE_RESTORE_ITEM: 'Do you want to Restore this Item?',
    SHOP_MESSAGE_RESTORE_ITEMS: 'Do you want to Restore these Items ({%s} items)?',
    
    SHOP_TOOLTIP_EDIT_SETTING_PARAM:'Edit Setting Param',
    SHOP_TOOLTIP_DELETE_SETTING_PARAM:'Delete Setting Param',
    SHOP_TOOLTIP_RESTORE_SETTING_PARAM:'Restore Setting Param',
    SHOP_TOOLTIP_VIEW_SETTING_ITEM:'View Settings',

    SHOP_TOOLTIP_EDIT_ITEM:'Edit Item',
    SHOP_TOOLTIP_DELETE_ITEM:'Delete Item',
    SHOP_TOOLTIP_RESTORE_ITEM:'Restore Item',
  
    SHOP_FILE_NAME_TITLE_SETTING_PARAM:'Shop Setting Param',
    SHOP_FILE_NAME_TITLE_ITEM:'Shop Item',
    SHOP_SHOP_FILE: 'Shop File',

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- IAP -------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    IAP_TITLE: 'IAP',

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- ITEM ------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    ITEM_MANAGEMENT_TITLE: 'Item Management',

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- PRIZE -----------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    PRIZE_MANAGEMENT_TITLE: 'Prize Management',

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- INSTANT WIN -----------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    INSTANT_WIN_TITLE: 'Instant Win',
    INSTANT_WIN_SETTING_TITLE: 'Setting',
    INSTANT_WIN_TYPE_TITLE: 'Type',
    INSTANT_WIN_HISTORY_TITLE: 'History',

    INSTANT_WIN_BUTTON_NEW_SETTING: 'New Setting',
    INSTANT_WIN_BUTTON_DELETE_SETTING: 'Delete Settings',
    INSTANT_WIN_BUTTON_RESTORE_SETTING: 'Restore Settings',
    INSTANT_WIN_BUTTON_NEW_TYPE: 'New Type',
    INSTANT_WIN_BUTTON_DELETE_TYPE: 'Delete Types',
    INSTANT_WIN_BUTTON_RESTORE_TYPE: 'Restore Types',
    INSTANT_WIN_BUTTON_SEARCH: 'Search',
    INSTANT_WIN_BUTTON_EXPORT_JSON: 'Export Json',

    INSTANT_WIN_MESSAGE_DELETE_SETTING: 'Do you want to Delete this Setting?',
    INSTANT_WIN_MESSAGE_DELETE_SETTINGS: 'Do you want to Delete these Settings ({%s} items)?',
    INSTANT_WIN_MESSAGE_RESTORE_SETTING: 'Do you want to Restore this Setting?',
    INSTANT_WIN_MESSAGE_RESTORE_SETTINGS: 'Do you want to Restore these Settings ({%s} items)?',
    INSTANT_WIN_MESSAGE_DELETE_TYPE: 'Do you want to Delete this Type?',
    INSTANT_WIN_MESSAGE_DELETE_TYPES: 'Do you want to Delete these Types ({%s} items)?',
    INSTANT_WIN_MESSAGE_RESTORE_TYPE: 'Do you want to Restore this Type?',
    INSTANT_WIN_MESSAGE_RESTORE_TYPES: 'Do you want to Restore these Types ({%s} items)?',
    INSTANT_WIN_MESSAGE_USER_UNVALID: 'The User Id is not valid!',

    INSTANT_WIN_TABLE_HEADER_TITLE: 'Title',
    INSTANT_WIN_TABLE_HEADER_SUBTITLE: 'Subtitle',
    INSTANT_WIN_TABLE_HEADER_DESCRIPTION: 'Description',
    INSTANT_WIN_TABLE_HEADER_CODE: 'Code',
    INSTANT_WIN_TABLE_HEADER_IMAGE: 'Image',

    INSTANT_WIN_TABLE_HEADER_USER_ID: 'User Id',
    INSTANT_WIN_TABLE_HEADER_PROFILE_ID: 'Profile Id',
    INSTANT_WIN_TABLE_HEADER_IS_USER_WIN: 'Is User Win',
    INSTANT_WIN_TABLE_HEADER_REQUEST_TIME: 'Requested Time',

    INSTANT_WIN_TOOLTIP_EDIT_SETTING: 'Edit Setting',
    INSTANT_WIN_TOOLTIP_DELETE_SETTING: 'Delete Setting',
    INSTANT_WIN_TOOLTIP_RESTORE_SETTING: 'Restore Setting',
    INSTANT_WIN_TOOLTIP_EDIT_TYPE: 'Edit Type',
    INSTANT_WIN_TOOLTIP_DELETE_TYPE: 'Delete Type',
    INSTANT_WIN_TOOLTIP_RESTORE_TYPE: 'Restore Type',
}

export default TEXT