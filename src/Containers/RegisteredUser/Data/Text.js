const TEXT = {
    MODAL_OK: 'Ok',
    MODAL_CANCEL: 'Cancel',
    MODAL_CLOSE: 'Close',
    MODAL_BACK: 'Back',

    TABLE_HEADER_ID: 'Id',
    TABLE_HEADER_STATUS: 'Status',
    TABLE_HEADER_NAME:'Name',
    TABLE_HEADER_DELETED_AT: 'Deleted At',
    TABLE_HEADER_DATE: 'Date',
    TABLE_HEADER_CREATED_DATE: 'Created Date',
    TABLE_HEADER_MODIFIED_DATE: 'Modified Date',
    TABLE_HEADER_OWNER: 'Owners',
    TABLE_HEADER_CREATED_BY: 'Created By',
    TABLE_HEADER_MODIFIED_BY: 'Modified By',
    TABLE_HEADER_TYPE:'Type',
    TABLE_HEADER_BLANK: ' ',

    REMIND_TITLE: 'We remind you!',

    MESSAGE_COPY_TO_CLIPBOARD: 'Copy To Clipboard Successfully',

    JSON_INVALID: 'Invalid Json',

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- USER ------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    USER_MANAGEMENT_TITLE: 'User Management',

    USER_MANAGEMENT_NEW_VALUE_TITLE: 'New Value',
    USER_MANAGEMENT_CURRENT_VALUE_TITLE: 'Current Value',

    USER_MANAGEMENT_TABLE_HEADER_USER_ID: 'User Id',
    USER_MANAGEMENT_TABLE_HEADER_EMAIL: 'Email',
    USER_MANAGEMENT_TABLE_HEADER_SURNAME: 'First Name',
    USER_MANAGEMENT_TABLE_HEADER_USERNAME: 'Last Name',
    USER_MANAGEMENT_TABLE_HEADER_DATE_OF_BIRTH: 'Date of Birth',
    USER_MANAGEMENT_TABLE_HEADER_PHONE_NUMBER: 'Phone Number',
    USER_MANAGEMENT_TABLE_HEADER_LINKED_ACCOUNT: 'Linked Account',

    USER_MANAGEMENT_TOOLTIP_DELETE_USER: 'Delete User',
    USER_MANAGEMENT_TOOLTIP_EDIT_USER: 'Edit User',
    USER_MANAGEMENT_TOOLTIP_REWARD: 'Reward',
    USER_MANAGEMENT_TOOLTIP_QUEST: 'Quest',
    USER_MANAGEMENT_TOOLTIP_CURRENCY: 'Currency',
    USER_MANAGEMENT_TOOLTIP_INSTANT_WIN: 'Instant Win',
    USER_MANAGEMENT_TOOLTIP_EDIT_USER: 'Edit User',
    USER_MANAGEMENT_TOOLTIP_COPY_TO_CLIPBOARD: 'Copy the value to Clipboard',

    USER_MANAGEMENT_MESSAGE_INVALID_EMAIL: "Invalid Email!",
    USER_MANAGEMENT_MESSAGE_DELETE_USER: 'Do you want to Delete this User?',
    USER_MANAGEMENT_MESSAGE_DELETE_USERS: 'Do you want to Delete these Users ({%s} items)?',
    USER_MANAGEMENT_MESSAGE_EDIT_USER: "You are changing the user's information. Please make sure that you followed the correct procedure by typing 'understood' in the Textbox below!",

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- CONSENT TRACKING ------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    CONSENT_TRACKING_TITLE: 'Consent Tracking',


    CONSENT_TRACKING_TABLE_HEADER_USER_ID: 'User Id',
    CONSENT_TRACKING_TABLE_HEADER_TYPE: 'Type',
    CONSENT_TRACKING_TABLE_HEADER_DATA: 'Data',
    
    CONSENT_TRACKING_TOOLTIP_COPY_TO_CLIPBOARD: 'Copy the value to Clipboard',
    CONSENT_TRACKING_TOOLTIP_VIEW_DATA: 'View Data',

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- PROFILE ---------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    PROFILE_MANAGEMENT_TITLE: 'Profile Management',
    PROFILE_USER_XP_CONFIG_TITLE: 'User XP Config',
    PROFILE_PROFILES_TITLE: 'Profiles',
    PROFILE_BADWORD_TITLE: 'Bad Word',
    PROFILE_SEARCH_TITLE: 'Search',
    PROFILE_GENERAL_TITLE: 'General',

    PROFILE_BUTTON_NEW_XP_CONFIG: 'New User XP Config',
    PROFILE_BUTTON_EDIT_XP_CONFIG: 'Edit User XP Config',
    PROFILE_BUTTON_DELETE_XP_CONFIG: 'Delete User XP Configs',
    PROFILE_BUTTON_RESTORE_XP_CONFIG: 'Restore User XP Configs',
    PROFILE_BUTTON_SEARCH: 'Search',
    PROFILE_BUTTON_NEW_BADWORD: 'New Bad Word',
    PROFILE_BUTTON_DOWNLOAD_ALL_DATA: 'Download All Data',

    PROFILE_MESSAGE_DELETE_XP_CONFIG: 'Do you want to Delete this User XP Config?',
    PROFILE_MESSAGE_DELETE_XP_CONFIGS: 'Do you want to Delete these User XP Configs ({%s} items)?',
    PROFILE_MESSAGE_RESTORE_XP_CONFIG: 'Do you want to Restore this User XP Config?',
    PROFILE_MESSAGE_RESTORE_XP_CONFIGS: 'Do you want to Restore these User XP Configs ({%s} items)?',

    PROFILE_MESSAGE_BAN_USER: 'Do you want to Ban this User?',
    PROFILE_MESSAGE_BAN_USERS: 'Do you want to Ban these Users ({%s} items)?',
    PROFILE_MESSAGE_UNBAN_USER: 'Do you want to Unban this User?',
    PROFILE_MESSAGE_UNBAN_USERS: 'Do you want to Unban these Users ({%s} items)?',

    PROFILE_TABLE_HEADER_LEVEL: 'Level',
    PROFILE_TABLE_HEADER_USER_XP: 'User XP',
    PROFILE_TABLE_HEADER_COIN: 'Coin',
    PROFILE_TABLE_HEADER_GEM: 'Gem',
    PROFILE_TABLE_HEADER_PROFILE_ID: 'Profile Id',
    PROFILE_TABLE_HEADER_PLAYER_NAME: 'Player Name',
    PROFILE_TABLE_HEADER_CLUB_NAME: 'Club Name',
    PROFILE_TABLE_HEADER_TROPHY_SCORE: 'Trophy Score',
    PROFILE_TABLE_HEADER_USER_LEVEL: 'User Level',
    PROFILE_TABLE_HEADER_USER_XP: 'User Xp',
    PROFILE_TABLE_HEADER_BADWORD_FILE: 'Bad Word File',
    PROFILE_TABLE_HEADER_VERSION: 'Version',
    PROFILE_TABLE_HEADER_EMAIL: 'Email',

    REWARD_TABLE_HEADER_PACKAGE:'Package',
    REWARD_TABLE_HEADER_ITEMS:'Items',
    REWARD_TABLE_HEADER_CARDS:'Cards',
    REWARD_TABLE_HEADER_AMOUNT:'Amount',
    REWARD_TABLE_HEADER_GIFTS:'Gifts',
    REWARD_TABLE_HEADER_EXTRA_INFO:'Extra Info',
    REWARD_TABLE_HEADER_RECEIVED:'Received',
    REWARD_TABLE_HEADER_AVAILABLE_ONLY:'Available Only',
    REWARD_BUTTON_ADD_TYPE:'Add Type',
    REWARD_BUTTON_ADD_ITEM:'Add Item',
    REWARD_BUTTON_ADD_PACK:'Add Pack',
    REWARD_BUTTON_ADD_SETTING:'Add Setting',
    REWARD_BUTTON_SEND_GIFT:'Send Gift',
    REWARD_BUTTON_ADD_CARD:'Add Card',
    REWARD_TITLE_FROM_EXCEL_FILE:'From Excel File',
    REWARD_TOOLTIP_SEND_GIFT_LIMIT:' - Limit of 1000 Profile Id per Transaction.',
    REWARD_TOOLTIP_DELETE_ITEM:'Delete Item',

    CURRENCY_TABLE_HEADER_QUANTITY: 'Quantity',
    CURRENCY_TOOLTIP_EDIT_CURRENCY: 'Edit Currency',
    CURRENCY_BUTTON_EDIT_PROFILE_CURRENCY: 'Edit Profile Currency',

    QUEST_SYSTEM_TABLE_HEADER_PROCESS: 'Process',
    QUEST_SYSTEM_TABLE_HEADER_REROLL_SLOT: 'Reroll Slot',
    QUEST_SYSTEM_TABLE_HEADER_IS_CLAIMED: 'Is Claimed',
    QUEST_SYSTEM_TABLE_HEADER_REFRESH_TIME_REMAINING: 'Refresh Time Remaining',

    INSTANT_WIN_TABLE_HEADER_TITLE: 'Title',
    INSTANT_WIN_TABLE_HEADER_SUBTITLE: 'Subtitle',
    INSTANT_WIN_TABLE_HEADER_DESCRIPTION: 'Description',
    INSTANT_WIN_TABLE_HEADER_CODE: 'Code',
    INSTANT_WIN_TABLE_HEADER_IMAGE: 'Image',
    INSTANT_WIN_BUTTON_SEARCH: 'Search',
    INSTANT_WIN_BUTTON_EXPORT_JSON: 'Export Json',
    INSTANT_WIN_TABLE_HEADER_USER_ID: 'User Id',
    INSTANT_WIN_TABLE_HEADER_PROFILE_ID: 'Profile Id',
    INSTANT_WIN_TABLE_HEADER_IS_USER_WIN: 'Is User Win',
    INSTANT_WIN_TABLE_HEADER_REQUEST_TIME: 'Requested Time',
    
    PROFILE_TOOLTIP_EDIT_XP_CONFIG: 'Edit User XP Config',
    PROFILE_TOOLTIP_DELETE_XP_CONFIG: 'Delete User XP Config',
    PROFILE_TOOLTIP_RESTORE_XP_CONFIG: 'Restore User XP Config',
    PROFILE_TOOLTIP_LEVEL: 'The level value must be greater than 0',
    PROFILE_TOOLTIP_COPY_TO_CLIPBOARD: 'Copy Profile Id to Clipboard',
    PROFILE_TOOLTIP_DOWNLOAD_BADWORD_FILE: 'Download Bad Word File',
    PROFILE_TOOLTIP_STATUS: 'The latest settings will be the only one active',
    PROFILE_TOOLTIP_BAN_USER: 'Ban User',
    PROFILE_TOOLTIP_UNBAN_USER: 'Unban User',
}

export default TEXT