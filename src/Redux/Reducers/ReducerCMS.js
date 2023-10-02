import { ActionType } from 'redux-promise-middleware'
import Utils from '../../Utils'
import { DEFINE_SERVICES } from '../../Defines'
import * as _ from 'lodash'

const defaultState = {
    isLoading: 0,
    loadingMessage: '',
    hiddenMessage: '',
    notifyMessage: '',
    notifyErrorMessage: '',
    autoHideDuration: 3000,
    error: null,
    isLoggedIn: false,
    needRefresh: false,

    // CMS_LOGIN
    email: '',
    username: '',
    expire_warning: -1,
    status: '',
    privilege: '',
    provider: ''
}

const ReducerCMS = (state = defaultState, action) =>
{
    switch (action.type)
    {
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- COMMON --------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_QUESTS_${ActionType.Pending}`:
        case `CMS_LOAD_QUEST_CONFIGS_${ActionType.Pending}`:   
        case `CMS_LOAD_QUEST_ITEMS_${ActionType.Pending}`:    
        case `CMS_LOAD_QUEST_LOCALIZATIONS_${ActionType.Pending}`:
        case `CMS_LOAD_QUEST_REQUIREMENTS_${ActionType.Pending}`:
        case `CMS_LOAD_TYPES_${ActionType.Pending}`:  
        case `CMS_LOAD_THEMES_${ActionType.Pending}`: 
        case `CMS_LOAD_QUIZZES_${ActionType.Pending}`: 
        case `CMS_LOAD_CONFIGS_${ActionType.Pending}`: 
        case `CMS_LOAD_PLAYER_CARDS_SETTINGS_${ActionType.Pending}`:
        case `CMS_LOAD_PLAYER_CARDS_PACKAGES_${ActionType.Pending}`:
        case `CMS_LOAD_PLAYER_CARDS_${ActionType.Pending}`:
        case `CMS_LOAD_PLAYER_CARDS_PARAMETERS_${ActionType.Pending}`:
        case `CMS_LOAD_PLAYER_CARDS_FORMATIONS_${ActionType.Pending}`:               
        case `CMS_LOAD_SEASONS_${ActionType.Pending}`:
        case `CMS_LOAD_DETAILS_${ActionType.Pending}`:
        case `CMS_LOAD_VERSIONS_${ActionType.Pending}`:    
        case `CMS_LOAD_CLIENTS_${ActionType.Pending}`:
        case `CMS_LOAD_ENVIROMENTS_${ActionType.Pending}`:
        case `CMS_LOAD_END_POINT_${ActionType.Pending}`:
        case `CMS_LOAD_ACHIEVEMENT_${ActionType.Pending}`:
        case `CMS_LOAD_CURRENCIES_${ActionType.Pending}`:
        case `CMS_LOAD_CURRENCY_TYPE_${ActionType.Pending}`:
        case `CMS_LOAD_REWARD_TYPE_${ActionType.Pending}`:
        case `CMS_LOAD_REWARD_ITEM_${ActionType.Pending}`:
        case `CMS_LOAD_REWARD_PACK_${ActionType.Pending}`:
        case `CMS_LOAD_REWARD_SETTING_${ActionType.Pending}`: 
        case `CMS_LOAD_REWARD_${ActionType.Pending}`:      
        case `CMS_LOAD_SHOP_SETTING_PARAM_${ActionType.Pending}`:   
        case `CMS_LOAD_SHOP_ITEM_${ActionType.Pending}`:       
        case `CMS_LOAD_BUILDING_PARAMETER_${ActionType.Pending}`:
        case `CMS_LOAD_BUILDING_TYPE_${ActionType.Pending}`:    
        case `CMS_LOAD_BUILDINGS_${ActionType.Pending}`: 
        case `CMS_LOAD_MONUMENT_SETTING_${ActionType.Pending}`:
        case `CMS_LOAD_MONUMENT_PARAMETERS_${ActionType.Pending}`:    
        case `CMS_LOAD_MONUMENT_TYPES_${ActionType.Pending}`:
        case `CMS_LOAD_LEADERBOARDS_${ActionType.Pending}`:
        case `CMS_LOAD_LEADERBOARD_SCORE_${ActionType.Pending}`:
        case `CMS_LOAD_LEADERBOARD_SETTING_${ActionType.Pending}`:
        case `CMS_LOAD_LEADERBOARD_DETAIL_${ActionType.Pending}`:
        case `CMS_LOAD_MONUMENT_GROUP_${ActionType.Pending}`:
        case `CMS_LOAD_USERS_${ActionType.Pending}`:    
        case `CMS_LOAD_ROLES_${ActionType.Pending}`:
        case `CMS_LOAD_ROLES_PERMISSIONS_${ActionType.Pending}`:
        case `CMS_LOAD_GROUPS_${ActionType.Pending}`:
        case `CMS_LOAD_GROUPS_ROLES_${ActionType.Pending}`:    
        case `CMS_LOAD_RESOURCES_${ActionType.Pending}`:
        case `CMS_LOAD_USER_CONFIGS_${ActionType.Pending}`:
        case `CMS_LOAD_PROFILE_USER_XP_CONFIGS_${ActionType.Pending}`:
        case `CMS_LOAD_PROFILES_${ActionType.Pending}`: 
        case `CMS_LOAD_PROFILE_BADWORDS_${ActionType.Pending}`:
        case `CMS_LOAD_CAMPAIGNS_${ActionType.Pending}`:  
        case `CMS_LOAD_CAMPAIGNS_CONTENTS_${ActionType.Pending}`:  
        case `CMS_LOAD_CAMPAIGNS_POINTCUTS_${ActionType.Pending}`:  
        case `CMS_LOAD_SPA_PACKAGES_${ActionType.Pending}`:  
        case `CMS_LOAD_SPA_PACKAGE_DETAILS_${ActionType.Pending}`:
        case `CMS_LOAD_INSTANT_WIN_SETTINGS_${ActionType.Pending}`:
        case `CMS_LOAD_INSTANT_WIN_TYPES_${ActionType.Pending}`:
        case `CMS_LOAD_INSTANT_WIN_HISTORIES_${ActionType.Pending}`:
        case `CMS_LOAD_CRON_${ActionType.Pending}`:
        case `CMS_LOAD_CRON_HISTORIES_${ActionType.Pending}`:
        case `CMS_LOAD_ACTIVITY_LOG_DATA_${ActionType.Pending}`:   
        case `CMS_LOAD_NOTIFICATIONS_${ActionType.Pending}`:
        case `CMS_LOAD_NOTIFICATION_SCHEDULES_${ActionType.Pending}`:
        case `CMS_LOAD_NOTIFICATION_TEMPLATES_${ActionType.Pending}`:   
        case `CMS_LOAD_ESBS_${ActionType.Pending}`:
        case `CMS_LOAD_DLC_DETAILS_${ActionType.Pending}`:    

        case `CMS_ADD_USER_${ActionType.Pending}`:
        case `CMS_ADD_GROUP_${ActionType.Pending}`:
        case `CMS_ADD_ROLE_${ActionType.Pending}`:
        case `CMS_CHANGE_USERNAME_${ActionType.Pending}`:
        case `CMS_CHANGE_PASSWORD_${ActionType.Pending}`:
        case `CMS_RESET_PASSWORD_${ActionType.Pending}`:
        case `CMS_LOGIN_${ActionType.Pending}`:
        case `CMS_LOGOUT_${ActionType.Pending}`:
        case `CMS_SHOW_MESSAGE_${ActionType.Pending}`:
        case `CMS_DOWNLOAD_${ActionType.Pending}`:

        case `CMS_ACTION_REGULAR_${ActionType.Pending}`:
        {
            return {
                ...state,
                error: null,
                loadingMessage: '',
                isLoading: state.isLoading + 1
            }
        }

        case `CMS_ACTION_REGULAR_${ActionType.Fulfilled}`:
        {
            return {
                ...state,
                notifyMessage: action.payload.code,
                isLoading: state.isLoading - 1,
                needRefresh: true
            }
        }

        case `CMS_LOAD_QUESTS_${ActionType.Rejected}`:
        case `CMS_LOAD_TYPES_${ActionType.Rejected}`: 
        case `CMS_LOAD_THEMES_${ActionType.Rejected}`: 
        case `CMS_LOAD_QUIZZES_${ActionType.Rejected}`: 
        case `CMS_LOAD_CONFIGS_${ActionType.Rejected}`: 
        case `CMS_LOAD_QUEST_CONFIGS_${ActionType.Rejected}`:
        case `CMS_LOAD_QUEST_ITEMS_${ActionType.Rejected}`:
        case `CMS_LOAD_QUEST_LOCALIZATIONS_${ActionType.Rejected}`:
        case `CMS_LOAD_QUEST_REQUIREMENTS_${ActionType.Rejected}`:
        case `CMS_LOAD_PLAYER_CARDS_SETTINGS_${ActionType.Rejected}`:
        case `CMS_LOAD_PLAYER_CARDS_PACKAGES_${ActionType.Rejected}`:
        case `CMS_LOAD_PLAYER_CARDS_${ActionType.Rejected}`:
        case `CMS_LOAD_PLAYER_CARDS_PARAMETERS_${ActionType.Rejected}`:
        case `CMS_LOAD_PLAYER_CARDS_FORMATIONS_${ActionType.Rejected}`:              
        case `CMS_LOAD_SEASONS_${ActionType.Rejected}`:
        case `CMS_LOAD_DETAILS_${ActionType.Rejected}`:
        case `CMS_LOAD_VERSIONS_${ActionType.Rejected}`:
        case `CMS_LOAD_CLIENTS_${ActionType.Rejected}`:
        case `CMS_LOAD_ENVIROMENTS_${ActionType.Rejected}`:
        case `CMS_LOAD_END_POINT_${ActionType.Rejected}`:
        case `CMS_LOAD_ACHIEVEMENT_${ActionType.Rejected}`:
        case `CMS_LOAD_CURRENCIES_${ActionType.Rejected}`:
        case `CMS_LOAD_CURRENCY_TYPE_${ActionType.Rejected}`:
        case `CMS_LOAD_REWARD_TYPE_${ActionType.Rejected}`:
        case `CMS_LOAD_REWARD_ITEM_${ActionType.Rejected}`:
        case `CMS_LOAD_REWARD_PACK_${ActionType.Rejected}`:
        case `CMS_LOAD_REWARD_SETTING_${ActionType.Rejected}`: 
        case `CMS_LOAD_REWARD_${ActionType.Rejected}`:      
        case `CMS_LOAD_SHOP_SETTING_PARAM_${ActionType.Rejected}`:     
        case `CMS_LOAD_SHOP_ITEM_${ActionType.Rejected}`: 
        case `CMS_LOAD_BUILDING_PARAMETER_${ActionType.Rejected}`:
        case `CMS_LOAD_BUILDING_TYPE_${ActionType.Rejected}`:    
        case `CMS_LOAD_BUILDINGS_${ActionType.Rejected}`:
        case `CMS_LOAD_MONUMENT_SETTING_${ActionType.Rejected}`:
        case `CMS_LOAD_MONUMENT_PARAMETERS_${ActionType.Rejected}`:    
        case `CMS_LOAD_MONUMENT_TYPES_${ActionType.Rejected}`:
        case `CMS_LOAD_LEADERBOARDS_${ActionType.Rejected}`:
        case `CMS_LOAD_LEADERBOARD_SCORE_${ActionType.Rejected}`:
        case `CMS_LOAD_LEADERBOARD_SETTING_${ActionType.Rejected}`:
        case `CMS_LOAD_LEADERBOARD_DETAIL_${ActionType.Rejected}`:
        case `CMS_LOAD_MONUMENT_GROUP_${ActionType.Rejected}`: 
        case `CMS_LOAD_USERS_${ActionType.Rejected}`:           
        case `CMS_LOAD_ROLES_${ActionType.Rejected}`:
        case `CMS_LOAD_ROLES_PERMISSIONS_${ActionType.Rejected}`:
        case `CMS_LOAD_GROUPS_${ActionType.Rejected}`:
        case `CMS_LOAD_GROUPS_ROLES_${ActionType.Rejected}`:    
        case `CMS_LOAD_RESOURCES_${ActionType.Rejected}`:
        case `CMS_LOAD_USER_CONFIGS_${ActionType.Rejected}`:
        case `CMS_LOAD_PROFILE_USER_XP_CONFIGS_${ActionType.Rejected}`:    
        case `CMS_LOAD_PROFILES_${ActionType.Rejected}`:
        case `CMS_LOAD_PROFILE_BADWORDS_${ActionType.Rejected}`:   
        case `CMS_LOAD_CAMPAIGNS_${ActionType.Rejected}`:  
        case `CMS_LOAD_CAMPAIGNS_CONTENTS_${ActionType.Rejected}`:  
        case `CMS_LOAD_CAMPAIGNS_POINTCUTS_${ActionType.Rejected}`:  
        case `CMS_LOAD_SPA_PACKAGES_${ActionType.Rejected}`:
        case `CMS_LOAD_SPA_PACKAGE_DETAILS_${ActionType.Rejected}`:
        case `CMS_LOAD_INSTANT_WIN_SETTINGS_${ActionType.Rejected}`:
        case `CMS_LOAD_INSTANT_WIN_TYPES_${ActionType.Rejected}`:
        case `CMS_LOAD_INSTANT_WIN_HISTORIES_${ActionType.Rejected}`:
        case `CMS_LOAD_CRON_${ActionType.Rejected}`:
        case `CMS_LOAD_CRON_HISTORIES_${ActionType.Rejected}`:
        case `CMS_LOAD_ACTIVITY_LOG_DATA_${ActionType.Rejected}`:
        case `CMS_LOAD_NOTIFICATIONS_${ActionType.Rejected}`:
        case `CMS_LOAD_NOTIFICATION_SCHEDULES_${ActionType.Rejected}`:
        case `CMS_LOAD_NOTIFICATION_TEMPLATES_${ActionType.Rejected}`:
        case `CMS_LOAD_ESBS_${ActionType.Rejected}`:
        case `CMS_LOAD_DLC_DETAILS_${ActionType.Rejected}`:
        {
            const { message: { code } } = action.payload
            const error = _.includes(code, 'IMPORT_') || code === "USER_NOT_HAVE_PERMISSION" || code === "USER_LOGIN_SESSION_EXPIRED" || code === "ACCESS_TOKEN_EXPIRED" ? { error: action.payload } : { notifyErrorMessage: action.payload }
            if (code === "USER_NOT_HAVE_PERMISSION" || code === "USER_LOGIN_SESSION_EXPIRED" || code === "ACCESS_TOKEN_EXPIRED")
            {
                _.forEach(Object.keys(state), key => {
                    if (!defaultState.hasOwnProperty(key))
                    {
                        state[key] = null
                    }
                })
            }

            return {
                ...state,
                isLoading: state.isLoading - 1,
                ...error
            }
        }              

        case `CMS_ADD_USER_${ActionType.Rejected}`:
        case `CMS_ADD_GROUP_${ActionType.Rejected}`:
        case `CMS_ADD_ROLE_${ActionType.Rejected}`:
        case `CMS_CHANGE_USERNAME_${ActionType.Rejected}`:
        case `CMS_CHANGE_PASSWORD_${ActionType.Rejected}`: 
        case `CMS_RESET_PASSWORD_${ActionType.Rejected}`:
        case `CMS_LOGIN_${ActionType.Rejected}`:
        case `CMS_LOGOUT_${ActionType.Rejected}`:
        case `CMS_SHOW_MESSAGE_${ActionType.Rejected}`:
        case `CMS_DOWNLOAD_${ActionType.Rejected}`:    

        case `CMS_ACTION_REGULAR_${ActionType.Rejected}`:       
        {
            const { message: { code } } = action.payload
            const error = _.includes(code, 'IMPORT_') || code === "USER_NOT_HAVE_PERMISSION" || code === "USER_LOGIN_SESSION_EXPIRED" || code === "ACCESS_TOKEN_EXPIRED" ? { error: action.payload } : { notifyErrorMessage: action.payload }
            return {
                ...state,
                isLoading: state.isLoading - 1,
                ...error
            }
        }

        case `CMS_ACTION_REGULAR_MULTI_${ActionType.Pending}`:  
        {
            return {
                ...state,
                error: null,
                isLoading: state.isLoading + 1,
                loadingMessage: (Array.isArray(state.loadingMessage) ? state.loadingMessage : []).concat(action.payload)
            }
        }

        case `CMS_ACTION_REGULAR_MULTI_${ActionType.Fulfilled}`: 
        {
            return {
                ...state,
                notifyMessage: action.payload.code,
                isLoading: state.isLoading - 1,
                loadingMessage: state.loadingMessage.slice(1),
                needRefresh: state.isLoading === 1
            }
        }

        case `CMS_ACTION_REGULAR_MULTI_${ActionType.Rejected}`:
        {
            const { message: { code } } = action.payload
            const error = code === "USER_NOT_HAVE_PERMISSION" || code === "USER_LOGIN_SESSION_EXPIRED" || code === "ACCESS_TOKEN_EXPIRED" ? { error: action.payload } : { notifyErrorMessage: action.payload }
            return {
                ...state,
                isLoading: state.isLoading - 1,
                loadingMessage: state.loadingMessage.slice(1),
                ...error
            }
        }

        case `CMS_CHOOSE_GROUP_${ActionType.Pending}`:
        {
            Utils.setItem(Utils.PRIVILEGE, action.payload)
            return {
                ...state,
                error: null,
                isLoading: state.isLoading + 1,
                privilege: action.payload
            }
        }

        case `CMS_CHOOSE_GROUP_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                isLoggedIn: true,
            }
        }

        case `CMS_CHOOSE_GROUP_${ActionType.Rejected}`:
        {
            Utils.setItem(Utils.PRIVILEGE, '')
            return {
                ...state,
                isLoading: state.isLoading - 1,
                notifyErrorMessage: action.payload,
                privilege: ''
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- OTHERS ----------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case 'CMS_SESSION_EXPIRED': {
            return {
                ...state,
                error: null,
                isLoggedIn: false,
                // clear user info
                email: '',
                username: '',
                expire_warning: -1,
                status: '',
            }
        }
        
        case `CMS_SHOW_MESSAGE_${ActionType.Fulfilled}`: {
            return {
                ...state,
                notifyMessage: action.payload,
                isLoading: state.isLoading - 1
            }
        }
        
        case 'CMS_CLEAR_PROPS': {
            action.payload.forEach(key => {
                state = {
                    ...state,
                    [key]: null,
                }
            })

            return state
        }

        case `CMS_SET_PROPS`:
        {
            action.payload.forEach(prop => {
                state = {
                    ...state,
                    [prop.key]: prop.value,
                }
            })

            return state
        }

        case 'CMS_CLEAR_ERROR': {
            return {
                ...state,
                error: null,
            }
        }

        case 'CMS_CLEAR_REFRESH': {
            return {
                ...state,
                needRefresh: false,
            }
        }

        case 'CMS_CLEAR_NOTIFY': {
            return {
                ...state,
                notifyMessage: '',
                notifyErrorMessage: '',
                autoHideDuration: 3000
            }
        }

        case 'CMS_SET_LOADING': {
            return {
                ...state,
                isLoading: state.isLoading + 1,
                loadingMessage: action.payload !== undefined ? action.payload : state.loadingMessage
            }
        }

        case 'CMS_CLEAR_LOADING': {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                loadingMessage: state.isLoading === 1 ? '' : state.loadingMessage
            }
        }

        case `CMS_LOGIN_SSO`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                email: action.payload.email,
                expire_warning: action.payload.expire_warning,
                status: action.payload.status,
                username: action.payload.username,
                assignedGroups: action.payload.groups,
                provider: action.payload.provider,
                needRefresh: true,
            }
        }

        case `CMS_LOGOUT_SSO`: {
            Utils.clearAllItems()
            _.forEach(Object.keys(state), key => {
                if (!defaultState.hasOwnProperty(key))
                {
                    state[key] = null
                }
            })

            return {
                ...state,
                isLoading: state.isLoading - 1,
                notifyMessage: action.payload.code,
                isLoggedIn: false,
                // clear user info
                email: '',
                username: '',
                expire_warning: -1,
                status: '',
            }
        }

        case `CMS_DOWNLOAD_${ActionType.Fulfilled}`:
        {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                fileData: action.payload,
                needRefresh: true
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- RESOURCES -------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_RESOURCES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                resources: action.payload.items
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- LOGIN -----------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOGOUT_${ActionType.Fulfilled}`: {
            Utils.clearAllItems()
            _.forEach(Object.keys(state), key => {
                if (!defaultState.hasOwnProperty(key))
                {
                    state[key] = null
                }
            })
            
            return {
                ...state,
                isLoading: state.isLoading - 1,
                notifyMessage: action.payload.code,
                isLoggedIn: false,
                // clear user info
                email: '',
                username: '',
                expire_warning: -1,
                status: '',
            }
        }

        case `CMS_LOGIN_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                email: action.payload.email,
                expire_warning: action.payload.expire_warning,
                status: action.payload.status,
                username: action.payload.username,
                assignedGroups: action.payload.groups,
                provider: action.payload.provider,
                needRefresh: true,
            }
        }

        case `CMS_RESET_PASSWORD_${ActionType.Fulfilled}`: {
            return {
                ...state,
                notifyMessage: action.payload.code,
                isLoading: state.isLoading - 1,
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- ACCOUNTS --------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_CHANGE_PASSWORD_${ActionType.Fulfilled}`: {
            return {
                ...state,
                // Fixed: 1st change password
                status: 'active',
                notifyMessage: action.payload.code,
                isLoading: state.isLoading - 1,
                needRefresh: true
            }
        }

        case `CMS_CHANGE_USERNAME_${ActionType.Fulfilled}`: {
            return {
                ...state,
                notifyMessage: action.payload.code,
                isLoading: state.isLoading - 1,
                username: action.payload.username
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- USER GROUP ------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_GROUPS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                groups: action.payload.items
            }
        }

        case `CMS_LOAD_GROUPS_ROLES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                groupsRoles: action.payload.items
            }
        }

        case `CMS_ADD_GROUP_${ActionType.Fulfilled}`: {
            return {
                ...state,
                notifyMessage: action.payload.code,
                isLoading: state.isLoading - 1,
                group: action.payload,
                needRefresh: true
            }
        }
       
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- USER ROLES ------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_ROLES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                roles: action.payload.items
            }
        }

        case `CMS_LOAD_ROLES_PERMISSIONS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                rolesPermissions: action.payload.items
            }
        }

        case `CMS_ADD_ROLE_${ActionType.Fulfilled}`: {
            return {
                ...state,
                notifyMessage: action.payload.code,
                isLoading: state.isLoading - 1,
                role: action.payload,
                needRefresh: true
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- CMS USERS -------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_USERS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                users: action.payload.items,
            }
        }

        case `CMS_ADD_USER_${ActionType.Fulfilled}`: {
            return {
                ...state,
                notifyMessage: action.payload.code,
                isLoading: state.isLoading - 1,
                user: action.payload,
                needRefresh: true
            }
        }

        case `CMS_LOAD_USER_CONFIGS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                listStatus: action.payload.listStatus,
                listProvider: action.payload.listProvider,
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- BUILDINGS -------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_BUILDINGS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                buildings: action.payload.items
            }
        }

        case `CMS_LOAD_BUILDING_TYPE_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                buildingTypes: action.payload.items
            }
        }

        case `CMS_LOAD_BUILDING_PARAMETER_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                buildingParameters: action.payload.items,
                buildingValueTypes: action.payload.VALUE_TYPES
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- MONUMENT -------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        
        case `CMS_LOAD_MONUMENT_SETTING_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                monumentSettings: action.payload.items
            }
        }

        case `CMS_LOAD_MONUMENT_PARAMETERS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                monumentParameters: action.payload.items
            }
        }

        case `CMS_LOAD_MONUMENT_TYPES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                monumentTypes: action.payload.items
            }
        }

        case `CMS_LOAD_MONUMENT_GROUP_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                monumentGroups: action.payload.items
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- CURRENCY --------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_CURRENCY_TYPE_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                currencyTypes: action.payload.items,
                STATUSES: action.payload.STATUSES
            }
        }

        case `CMS_LOAD_CURRENCIES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                currencies: action.payload.items,
                STATUSES: action.payload.STATUSES
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- ACHIEVEMENT --------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------


        case `CMS_LOAD_ACHIEVEMENT_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                achievements: action.payload.items,
                STATUSES: action.payload.STATUSES
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- REWARD MANAGEMENT --------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        
        case `CMS_LOAD_REWARD_TYPE_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                rewardTypes: action.payload.items,
                STATUSES: action.payload.STATUSES
            }
        }

        case `CMS_LOAD_REWARD_ITEM_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                rewardItems: action.payload.items,
                STATUSES: action.payload.STATUSES,
                TYPES: action.payload.TYPES
            }
        }
        case `CMS_LOAD_REWARD_PACK_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                rewardPacks: action.payload.items,
                STATUSES: action.payload.STATUSES
            }
        }

        case `CMS_LOAD_REWARD_SETTING_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                rewardSettings: action.payload.items,
                STATUSES: action.payload.STATUSES
            }
        }

        case `CMS_LOAD_REWARD_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                rewards: action.payload.items,
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- SHOP --------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        
        case `CMS_LOAD_SHOP_SETTING_PARAM_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                shopSettingParams: action.payload.items,
                typesShopSetting: action.payload.TYPES,
            }
        }

        case `CMS_LOAD_SHOP_ITEM_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                shopItems: action.payload.items,
                CONTENT_ITEMS:  action.payload.CONTENT_ITEMS,
                PRICE_ITEMS:  action.payload.PRICE_ITEMS,
                SETTING_PARAMS:  action.payload.SETTING_PARAMS,
                OPERATORS:  action.payload.OPERATORS,
                typesShopItem: action.payload.TYPES,
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- REMOTE CONFIGURATION --------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_END_POINT_${ActionType.Fulfilled}`: {
            // Hardcode endpoint for importance services
            const services = [...DEFINE_SERVICES, ...action.payload.response.items]
            return {
                ...state,
                // The API maybe interrupted 
                // So let check and make sure that isLoading value >= 0
                isLoading: state.isLoading - 1 < 0 ? 0 : state.isLoading - 1,
                services: _.map(services, service => (service.name)).sort(),
            }
        }

        case `CMS_LOAD_ENVIROMENTS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                environments: action.payload.items,
                ENVS: action.payload.ENVS
            }
        }

        case `CMS_LOAD_CLIENTS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                clients: _.map(action.payload.items, client => (client.client)),
            }
        }

        case `CMS_LOAD_VERSIONS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                versions: action.payload.items,
                ENVS: action.payload.ENVS
            }
        }

        case `CMS_LOAD_DETAILS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                details: action.payload.items,
            }
        }

        case `CMS_LOAD_CONFIGS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                configs: action.payload.items,
                ENVS: action.payload.ENVS
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- SEASON ----------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_SEASONS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                seasons: action.payload.items,
                STATUSES: action.payload.STATUSES
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- LEADERBOARD ----------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        
        case `CMS_LOAD_LEADERBOARDS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                leaderboardItems: action.payload.items,
                leaderboardNextCursor: action.payload.next_cursor,
                statuses: action.payload.STATUSES,
                types: action.payload.TYPES,
            }
        }

        case `CMS_LOAD_LEADERBOARD_SCORE_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                leaderboardScoreItems: action.payload.items,
                leaderboardNextCursor: action.payload.next_cursor,
            }
        }

        case `CMS_LOAD_LEADERBOARD_SETTING_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                leaderboardSettingItems: action.payload.items,
                leaderboardNextCursor: action.payload.next_cursor,
            }
        }

        case `CMS_LOAD_LEADERBOARD_DETAIL_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                leaderboardFileData: action.payload,
                needRefresh: true
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- PLAYER CARD -----------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_PLAYER_CARDS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                playerCards: action.payload.items,
                NATIONALITIES: action.payload.NATIONALITIES,
                TEAMS: action.payload.TEAMS
            }
        }

        case `CMS_LOAD_PLAYER_CARDS_PACKAGES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                playerCardPackages: action.payload.items,
            }
        }

        case `CMS_LOAD_PLAYER_CARDS_SETTINGS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                playerCardSettings: action.payload.items,
            }
        }

        case `CMS_LOAD_PLAYER_CARDS_PARAMETERS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                playerCardParameters: action.payload.items
            }
        }

        case `CMS_LOAD_PLAYER_CARDS_FORMATIONS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                playerCardFormations: action.payload.items
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- QUIZ -----------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        case `CMS_LOAD_TYPES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                typeItems: action.payload.items,
                answerTypes: action.payload.ANSWER_TYPES,
                statusTypes: action.payload.STATUSES,
            }
        }
        case `CMS_LOAD_THEMES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                themeItems: action.payload.items,
                statusThemes: action.payload.STATUSES,
            }
        }
        case `CMS_LOAD_QUIZZES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                quizzesItems: action.payload.items,
                statusQuizzes: action.payload.STATUSES,
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- QUEST SYSTEM ----------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_QUEST_ITEMS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                questItems: action.payload.items,
                DIFFICULTIES: action.payload.DIFFICULTIES,
                STATUSES: action.payload.STATUSES,
                TYPES: action.payload.TYPES,
            }
        }

        case `CMS_LOAD_QUEST_CONFIGS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                questExps: action.payload.items,
            }
        }

        case `CMS_LOAD_QUESTS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                quests: action.payload.items,
            }
        }

        case `CMS_LOAD_QUEST_LOCALIZATIONS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                questLocalizations: action.payload.items,
            }
        }

        case `CMS_LOAD_QUEST_REQUIREMENTS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                questRequirements: action.payload.items,
                TYPES: action.payload.TYPES,
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- PROFILE ---------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_PROFILE_USER_XP_CONFIGS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                userXPConfigs: action.payload.items,
            }
        }

        case `CMS_LOAD_PROFILES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                profiles: action.payload.items,
            }
        }

        case `CMS_LOAD_PROFILE_BADWORDS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                badwords: action.payload.items,
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- CAMPAIGN MANAGEMENT -------------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        
        case `CMS_LOAD_CAMPAIGNS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                campaigns: action.payload.items,
                TYPES: action.payload.TYPES,
                STATUSES: action.payload.STATUSES,
                GENDERS: action.payload.GENDERS,
                PLATFORMS: action.payload.PLATFORMS
            }
        }

        case `CMS_LOAD_CAMPAIGNS_CONTENTS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                contents: action.payload.items,
                STATUSES: action.payload.STATUSES,
            }
        }

        case `CMS_LOAD_CAMPAIGNS_POINTCUTS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                pointcuts: action.payload.items
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- SPA -------------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_SPA_PACKAGES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                spaPackages: action.payload.items
            }
        }

        case `CMS_LOAD_SPA_PACKAGE_DETAILS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                spaPackageDetails: action.payload.items,
                needRefresh: true
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- INSTANT WIN -----------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_INSTANT_WIN_SETTINGS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                instantWinSettings: action.payload.items,
                STATUSES: action.payload.STATUSES,
            }
        }

        case `CMS_LOAD_INSTANT_WIN_TYPES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                instantWinTypes: action.payload.items,
            }
        }

        case `CMS_LOAD_INSTANT_WIN_HISTORIES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                instantWinHistories: action.payload.items,
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- CRON ------------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_CRON_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                crons: action.payload.items,
                STATUSES: action.payload.STATUSES,
                METHODS: action.payload.METHODS,
                TIME_REGEX: action.payload.TIME_REGEX,
                FARM_HANDLERS: action.payload.FARM_HANDLERS,
            }
        }

        case `CMS_LOAD_CRON_HISTORIES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                cronHistories: action.payload.items,
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- ACTIVITY LOGS ---------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_ACTIVITY_LOG_DATA_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                activityLogData: action.payload,
                needRefresh: true
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- NOTIFICATION ----------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_NOTIFICATIONS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                notifications: action.payload,
            }
        }

        case `CMS_LOAD_NOTIFICATION_SCHEDULES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                notificationSchedules: action.payload.items,
                SELECTIONS: action.payload.CONFIGS.Weekly.selection,
                STATUSES: action.payload.STATUSES,
                TYPES: action.payload.TYPES,
            }
        }

        case `CMS_LOAD_NOTIFICATION_TEMPLATES_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                notificationTemplates: action.payload.items,
                ATTRIBUTES_OPERATORS: action.payload.ATTRIBUTES_OPERATORS,
                STATUSES: action.payload.STATUSES
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- ESB -------------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_ESBS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                esbs: action.payload.items,
                STORES: action.payload.STORES,
                TYPES: action.payload.TYPES
            }
        }

        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
        //----- DLC -------------------------------------------------------------------------------------------------------------------------------------------------------------
        //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

        case `CMS_LOAD_DLC_DETAILS_${ActionType.Fulfilled}`: {
            return {
                ...state,
                isLoading: state.isLoading - 1,
                dlcs: action.payload.items,
                needRefresh: true
            }
        }

        default:
            return state
    }
}

export default ReducerCMS