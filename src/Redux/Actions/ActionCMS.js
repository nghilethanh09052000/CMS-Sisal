import API from '../../Api/API'
import { DEFINE_ALL, DEFAULT_ACTIONS, DEFINE_SERVICES } from '../../Defines'
import * as ActionGlobal from './ActionGlobal'

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- RESOURCES -------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const ResourcesLoad = (service) => ({
    type: 'CMS_LOAD_RESOURCES',
    payload: service === 'all'
            ?
            new Promise((resolve, reject) => {
                setTimeout(() => {
                resolve({ items: [{ resource: DEFINE_ALL, actions: DEFAULT_ACTIONS }] })
                }, 100)
            })
            :
            API.ResourcesLoad(service)
})

export const ResourcesExport = (service) => ({
    type: 'CMS_DOWNLOAD',
    payload: API.ResourcesExport(service)
})

export const ResourcesImport = (service, data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ResourcesImport(service, data)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- LOGIN -----------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const Login = (email, password) => ({
    type: 'CMS_LOGIN',
    payload: API.UserLogin(email, password)
})

export const LoginSSO = (msData) => ({
    type: 'CMS_LOGIN_SSO',
    payload: msData
})

export const ChooseGroup = (group) => ({
    type: 'CMS_CHOOSE_GROUP',
    payload: {
        promise: API.ChooseGroup(group.id),
        data: group.name
    }
})

export const ResetPassword = (email) => ({
    type: 'CMS_RESET_PASSWORD',
    payload: API.ResetPassword(email)
})

export const Authen = () => ({
    type: 'CMS_LOGIN',
    payload: API.Authen()
})

export const Logout = () =>
{
    return (dispatch) =>
    {
        dispatch(ActionGlobal.SelectProject(''))

        return dispatch({
            type: 'CMS_LOGOUT',
            payload: API.Logout()
                .then(response =>
                {
                    return Promise.resolve(response)
                })
                .catch(err =>
                {
                    return Promise.reject(err)
                })
        })
    }
}

export const LogoutSSO = (msData) =>
{
    return (dispatch) =>
    {
        dispatch(ActionGlobal.SelectProject(''))

        return dispatch({
            type: 'CMS_LOGOUT_SSO',
            payload: msData
        })
    }
}

export const SessionExpired = () => ({
    type: 'CMS_SESSION_EXPIRED',
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- ACCOUNTS --------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const ChangePassword = (old_password, new_password) => ({
    type: 'CMS_CHANGE_PASSWORD',
    payload: API.ChangePassword(old_password, new_password)
})

export const ChangeUsername = (username) => ({
    type: 'CMS_CHANGE_USERNAME',
    payload: API.ChangeUsername(username)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- USER ROLES ------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const RolesLoad = () => ({
    type: 'CMS_LOAD_ROLES',
    payload: API.RolesLoad()
})

export const RolesPermissionsLoad = () => ({
    type: 'CMS_LOAD_ROLES_PERMISSIONS',
    payload: API.RolesPermissionsLoad()
})

export const RoleAdd = (role_data) => ({
    type: 'CMS_ADD_ROLE',
    payload: API.RoleAdd(role_data)
})

export const  RoleEdit = (role_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.RoleEdit(role_data)
})

export const RoleDelete = (role_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.RoleDelete(role_data),
        data: `${role_data.name}`
    }
})

export const RoleRestore = (role_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.RoleRestore(role_data),
        data: `${role_data.name}`
    }
})

export const  RolePermissionsAdd = (role_data, batch) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.RolePermissionsAdd(role_data, batch)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- USER GROUP ------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const GroupsLoad = () => ({
    type: 'CMS_LOAD_GROUPS',
    payload: API.GroupsLoad()
})

export const GroupsRolesLoad = () => ({
    type: 'CMS_LOAD_GROUPS_ROLES',
    payload: API.GroupsRolesLoad()
})

export const GroupAdd = (group_data) => ({
    type: 'CMS_ADD_GROUP',
    payload: API.GroupAdd(group_data)
})

export const  GroupEdit = (group_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.GroupEdit(group_data)
})

export const GroupDelete = (group_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.GroupDelete(group_data),
        data: `${group_data.name}`
    }
})

export const GroupRestore = (group_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.GroupRestore(group_data),
        data: `${group_data.name}`
    }
})

export const GroupRolesAdd = (group_data, batch) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.GroupRolesAdd(group_data, batch)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- CMS USERS -------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const UsersLoad = () => ({
    type: 'CMS_LOAD_USERS',
    payload: API.UsersLoad()
})

export const UserAdd = (user_data) => ({
    type: 'CMS_ADD_USER',
    payload: API.UserAdd(user_data)
})

export const UserEdit = (user_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.UserEdit(user_data)
})

export const UserDelete = (user_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.UserDelete(user_data),
        data: `${user_data.email}`
    }
})

export const UserRestore = (user_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.UserRestore(user_data),
        data: `${user_data.email}`
    }
})

export const RevokePassword = (user_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.RevokePassword(user_data)
})

export const UserGroupsAdd = (user_data, batch) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.UserGroupsAdd(user_data, batch)
})

export const UserConfigsLoad = () => ({
    type: 'CMS_LOAD_USER_CONFIGS',
    payload: API.UserConfigsLoad()
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- BUILDINGS -------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const BuildingsLoad = (type) => ({
    type: 'CMS_LOAD_BUILDINGS',
    payload: API.BuildingsLoad(type)
})

export const BuildingAdd = (building_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.BuildingAdd(building_data),
        data: `${building_data.type} - ${building_data.paramName} - ${building_data.level}: ${building_data.value}`
    }
})

export const BuildingEdit = (building_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.BuildingEdit(building_data)
})

export const BuildingsEdit = (building_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.BuildingEdit(building_data),
        data: `${building_data.paramName}: ${building_data.value}`
    }
})

export const BuildingsDelete = (building_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.BuildingsDelete(building_data),
        data: `${building_data.type} - ${building_data.level}`
    }
})

export const BuildingsRestore = (building_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.BuildingsRestore(building_data),
        data: `${building_data.type} - ${building_data.level}`
    }
})

export const BuildingTypesLoad = () => ({
    type: 'CMS_LOAD_BUILDING_TYPE',
    payload: API.BuildingTypesLoad()
})

export const BuildingTypeAdd = (type_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.BuildingTypeAdd(type_data)
})

export const BuildingTypeDelete = (type_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.BuildingTypeDelete(type_data),
        data: `${type_data.type}`
    }
})

export const BuildingTypeRestore = (type_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.BuildingTypeRestore(type_data),
        data: `${type_data.type}`
    }
})

export const BuildingParametersLoad = () => ({
    type: 'CMS_LOAD_BUILDING_PARAMETER',
    payload: API.BuildingParametersLoad()
})

export const BuildingParameterAdd = (parameter_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.BuildingParameterAdd(parameter_data)
})

export const BuildingParameterEdit = (parameter_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.BuildingParameterEdit(parameter_data)
})

export const BuildingParameterDelete = (parameter_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.BuildingParameterDelete(parameter_data),
        data: `${parameter_data.type} - ${parameter_data.paramName}`
    }
})

export const BuildingParameterRestore = (parameter_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.BuildingParameterRestore(parameter_data),
        data: `${parameter_data.type} - ${parameter_data.paramName}`
    }
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- MONUMENT -------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const MonumentSettingsLoad = () => ({
    type: 'CMS_LOAD_MONUMENT_SETTING',
    payload: API.MonumentSettingsLoad()
})

export const MonumentSettingsAdd = (setting_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.MonumentSettingsAdd(setting_data)
})

export const MonumentSettingsEdit = (setting_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.MonumentSettingsEdit(setting_data)
})

export const MonumentSettingsDelete = (setting_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise:API.MonumentSettingsDelete(setting_data),
        data: `${setting_data.typeName} - ${setting_data.parameter}`
    }
})

export const MonumentSettingsRestore = (setting_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise:API.MonumentSettingsRestore(setting_data),
        data: `${setting_data.typeName} - ${setting_data.parameter}`
    }
})

export const MonumentParametersLoad = () => ({
    type: 'CMS_LOAD_MONUMENT_PARAMETERS',
    payload: API.MonumentParametersLoad()
})

export const MonumentParametersAdd = (parameter_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.MonumentParametersAdd(parameter_data)
})

export const MonumentParametersDelete = (parameter_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.MonumentParametersDelete(parameter_data),
        data: `${parameter_data.type} - ${parameter_data.name}`
    }
})

export const MonumentParametersRestore = (parameter_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.MonumentParametersRestore(parameter_data),
        data: `${parameter_data.type} - ${parameter_data.name}`
    }
})

export const MonumentTypesLoad = () => ({
    type: 'CMS_LOAD_MONUMENT_TYPES',
    payload: API.MonumentTypesLoad()
})

export const MonumentTypesAdd = (type_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.MonumentTypesAdd(type_data)
})

export const MonumentTypesDelete = (type_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.MonumentTypesDelete(type_data),
        data: `${type_data.name} - ${type_data.groupName}`
    }
})

export const MonumentTypesRestore = (type_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.MonumentTypesRestore(type_data),
        data: `${type_data.name} - ${type_data.groupName}`
    }
})

export const MonumentGroupsLoad = () => ({
    type: 'CMS_LOAD_MONUMENT_GROUP',
    payload: API.MonumentGroupsLoad()
})

export const MonumentGroupsAdd = (group_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.MonumentGroupsAdd(group_data)
})

export const MonumentGroupsDelete = (group_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.MonumentGroupsDelete(group_data),
        data: `${group_data.name}`
    }
})

export const MonumentGroupsRestore = (group_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.MonumentGroupsRestore(group_data),
        data: `${group_data.name}`
    }
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- CURRENCY --------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const CurrencyTypesLoad = () => ({
    type: 'CMS_LOAD_CURRENCY_TYPE',
    payload: API.CurrencyTypesLoad()
})

export const CurrencyTypeAdd = (currency_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.CurrencyTypeAdd(currency_data)
})

export const CurrencyTypeEdit = (currency_data, manual) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.CurrencyTypeEdit(currency_data, manual)
})

export const CurrencyTypeDelete = (currency_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.CurrencyTypeDelete(currency_data),
        data: `${currency_data.name} - ${currency_data.type} - ${currency_data.status}`
    }
})

export const CurrencyTypeRestore = (currency_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.CurrencyTypeRestore(currency_data),
        data: `${currency_data.name} - ${currency_data.type} - ${currency_data.status}`
    }
})

export const CurrenciesLoad = (profileId) => ({
    type: 'CMS_LOAD_CURRENCIES',
    payload: API.CurrenciesLoad(profileId)
})

export const CurrencyProfileEdit = (currency_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.CurrencyProfileEdit(currency_data)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- CURRENCY --------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
export const AchievementLoad = () => ({
    type: 'CMS_LOAD_ACHIEVEMENT',
    payload: API.AchievementLoad()
})

export const AchievementAdd = (achievement_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.AchievementAdd(achievement_data)
})

export const AchievementEdit = (achievement_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.AchievementEdit(achievement_data)
})

export const AchievementDelete = (achievement_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.AchievementDelete(achievement_data),
        data: `${achievement_data.name} - ${achievement_data.status} - ${achievement_data.condition}`
    }
})

export const AchievementRestore = (achievement_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.AchievementRestore(achievement_data),
        data: `${achievement_data.name} - ${achievement_data.status} - ${achievement_data.condition}`
    }
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- REWARD MANAGEMENT -----------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const RewardTypeLoad = () => ({
    type: 'CMS_LOAD_REWARD_TYPE',
    payload: API.RewardTypeLoad()
})

export const RewardTypeAdd = (reward_type) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.RewardTypeAdd(reward_type)
})

export const RewardTypeEdit = (reward_type, manual) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.RewardTypeEdit(reward_type, manual)
})

export const RewardTypeDelete = (reward_type) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.RewardTypeDelete(reward_type),
        data: `${reward_type.name} - ${reward_type.status}`
    }
})

export const RewardTypeRestore = (reward_type) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.RewardTypeRestore(reward_type),
        data: `${reward_type.name} - ${reward_type.status}`
    }
})

export const RewardItemLoad = () => ({
    type: 'CMS_LOAD_REWARD_ITEM',
    payload: API.RewardItemLoad()
})

export const RewardItemAdd = (reward_item) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.RewardItemAdd(reward_item)
})

export const RewardItemEdit = (reward_item, manual) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.RewardItemEdit(reward_item, manual)
})

export const RewardItemDelete = (reward_item) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.RewardItemDelete(reward_item),
        data: `${reward_item.name} - ${reward_item.type} - ${reward_item.status}`
    }
})

export const RewardItemRestore = (reward_item) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.RewardItemRestore(reward_item),
        data: `${reward_item.name} - ${reward_item.type} - ${reward_item.status}`
    }
})

export const RewardPackLoad = (reward_pack_data) => ({
    type: 'CMS_LOAD_REWARD_PACK',
    payload: API.RewardPackLoad(reward_pack_data)
})

export const RewardPackAdd = (reward_pack) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.RewardPackAdd(reward_pack)
})

export const RewardPackEdit = (reward_pack, manual) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.RewardPackEdit(reward_pack, manual)
})

export const RewardPackDelete = (reward_pack) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.RewardPackDelete(reward_pack),
        data: `${reward_pack.name} - ${reward_pack.item} - ${reward_pack.status}`
    }
})

export const RewardPackRestore = (reward_pack) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.RewardPackRestore(reward_pack),
        data: `${reward_pack.name} - ${reward_pack.item} - ${reward_pack.status}`
    }
})

export const RewardSettingLoad = (reward_setting) => ({
    type: 'CMS_LOAD_REWARD_SETTING',
    payload: API.RewardSettingLoad(reward_setting)
})

export const RewardSettingAdd = (reward_setting) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.RewardSettingAdd(reward_setting)
})

export const RewardSettingEdit = (reward_setting) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.RewardSettingEdit(reward_setting)
})

export const RewardSettingDelete = (reward_setting) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.RewardSettingDelete(reward_setting),
        data: `${reward_setting.type} - ${reward_setting.item} - ${reward_setting.status}`
    }
})

export const RewardSettingRestore = (reward_setting) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.RewardSettingRestore(reward_setting),
        data: `${reward_setting.type} - ${reward_setting.item} - ${reward_setting.status}`
    }
})

export const RewardLoad = (reward_data) => ({
    type: 'CMS_LOAD_REWARD',
    payload: API.RewardLoad(reward_data)
})

export const RewardSendGift = (reward_gift) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.RewardSendGift(reward_gift)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- SHOP-------------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const ShopSettingParamsLoad = () => ({
    type: 'CMS_LOAD_SHOP_SETTING_PARAM',
    payload: API.ShopSettingParamsLoad()
})

export const ShopSettingParamsAdd = (shop_setting_param_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ShopSettingParamsAdd(shop_setting_param_data)
})

export const ShopSettingParamsEdit = (shop_setting_param_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ShopSettingParamsEdit(shop_setting_param_data)
})

export const ShopSettingParamsDelete = (shop_setting_param_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.ShopSettingParamsDelete(shop_setting_param_data),
        data: `${shop_setting_param_data.paramName} - ${shop_setting_param_data.type}`
    }
})

export const ShopSettingParamsRestore = (shop_setting_param_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.ShopSettingParamsRestore(shop_setting_param_data),
        data: `${shop_setting_param_data.paramName} - ${shop_setting_param_data.type}`
    }
})

export const ShopItemLoad = (type) => ({
    type: 'CMS_LOAD_SHOP_ITEM',
    payload: API.ShopItemLoad(type)
})

export const ShopItemAdd = (shop_item_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ShopItemAdd(shop_item_data)
})

export const ShopItemEdit = (shop_item_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ShopItemEdit(shop_item_data)
})

export const ShopItemDelete = (shop_item_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.ShopItemDelete(shop_item_data),
        data: `${shop_item_data.name} - ${shop_item_data.type} - ${shop_item_data.imageUrl}`
    }
})

export const ShopItemRestore = (shop_item_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.ShopItemRestore(shop_item_data),
        data: `${shop_item_data.name} - ${shop_item_data.type} - ${shop_item_data.imageUrl}`
    }
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- REMOTE CONFIGURATION --------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const EndPointLoad = () =>
{
    return (dispatch) =>
    {
        return dispatch({
            type: 'CMS_LOAD_END_POINT',
            payload: API.EndPointLoad()
                .then(response =>
                {
                    // Hardcode endpoint for importance services
                    const services = [...DEFINE_SERVICES, ...response?.items || []]
                    return {
                        promise: dispatch(ActionGlobal.SetEndPoint(services)),
                        response
                    }
                })
                .catch(err =>
                {
                    return Promise.reject(err)
                })
        })
    }
}

export const EnvironmentsLoad = () => ({
    type: 'CMS_LOAD_ENVIROMENTS',
    payload: API.EnvironmentsLoad()
})

export const EnvironmentAdd = (environment_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.EnvironmentAdd(environment_data)
})

export const EnvironmentEdit = (environment_data, manual) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.EnvironmentEdit(environment_data, manual)
})

export const EnvironmentDelete = (environment_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.EnvironmentDelete(environment_data),
        data: `${environment_data.env} - ${environment_data.service}`
    }
})

export const EnvironmentRestore = (environment_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.EnvironmentRestore(environment_data),
        data: `${environment_data.env} - ${environment_data.service}`
    }
})

export const ClientsLoad = () => ({
    type: 'CMS_LOAD_CLIENTS',
    payload: API.ClientsLoad()
})

export const VersionsLoad = () => ({
    type: 'CMS_LOAD_VERSIONS',
    payload: API.VersionsLoad()
})

export const VersionAdd = (version_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.VersionAdd(version_data)
})

export const VersionEdit = (version_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.VersionEdit(version_data)
})

export const VersionDelete = (version_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.VersionDelete(version_data),
        data: `${version_data.client} - ${version_data.version} - ${version_data.env}`
    }
})

export const VersionRestore = (version_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.VersionRestore(version_data),
        data: `${version_data.client} - ${version_data.version} - ${version_data.env}`
    }
})

export const VersionSetLive = (version_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.VersionSetLive(version_data)
})

export const DetailsLoad = (version_data) => ({
    type: 'CMS_LOAD_DETAILS',
    payload: API.DetailsLoad(version_data)
})

export const ConfigsLoad = (version_data) => ({
    type: 'CMS_LOAD_CONFIGS',
    payload: API.ConfigsLoad(version_data)
})

export const ConfigAdd = (config_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ConfigAdd(config_data)
})

export const ConfigEdit = (config_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ConfigEdit(config_data)
})

export const ConfigDelete = (config_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.ConfigDelete(config_data),
        data: `${config_data.key} - ${config_data.value}`
    }
})

export const ConfigRestore = (config_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.ConfigRestore(config_data),
        data: `${config_data.key} - ${config_data.value}`
    }
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- SEASON ----------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const SeasonsLoad = () => ({
    type: 'CMS_LOAD_SEASONS',
    payload: API.SeasonsLoad()
})

export const SeasonAdd = (season_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.SeasonAdd(season_data)
})

export const SeasonEdit = (season_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.SeasonEdit(season_data)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- LEADERBOARD -----------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const LeaderboardsLoad = () => ({
    type: 'CMS_LOAD_LEADERBOARDS',
    payload: API.LeaderboardsLoad()
})

export const LeaderboardsAdd = (leaderboards_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.LeaderboardsAdd(leaderboards_data)
})

export const LeaderboardsEdit = (leaderboards_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.LeaderboardsEdit(leaderboards_data)
})

export const LeaderboardsDelete = (leaderboards_data, message = 'Delete') => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.LeaderboardsDelete(leaderboards_data),
        data: `${message}: ${leaderboards_data.name} - ${leaderboards_data.status} - ${leaderboards_data.type}`
    }
})

export const LeaderboardsRestore = (leaderboards_data, message = 'Restore') => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.LeaderboardsRestore(leaderboards_data),
        data: `${message}: ${leaderboards_data.name} - ${leaderboards_data.status} - ${leaderboards_data.type}`
    }
})

export const LeaderboardScoreLoad = (leaderboard_id) => ({
    type: 'CMS_LOAD_LEADERBOARD_SCORE',
    payload: API.LeaderboardScoreLoad(leaderboard_id)
})

export const LeaderboardScoreRecover = (leaderboard_id) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.LeaderboardScoreRecover(leaderboard_id)
})

export const LeaderboardScoreEdit = (leaderboard_score_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.LeaderboardScoreEdit(leaderboard_score_data)
})

export const LeaderboardScoreDelete = (leaderboard_score_data, message = 'Hide') => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.LeaderboardScoreDelete(leaderboard_score_data),
        data: `${message}: ${leaderboard_score_data.userId}`
    }
})

export const LeaderboardScoreRestore = (leaderboard_score_data, message = 'Unhide') => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.LeaderboardScoreRestore(leaderboard_score_data),
        data: `${message}: ${leaderboard_score_data.userId}`
    }
})

export const LeaderboardSettingLoad = (leaderboard_id) => ({
    type: 'CMS_LOAD_LEADERBOARD_SETTING',
    payload: API.LeaderboardSettingLoad(leaderboard_id)
})

export const LeaderboardSettingAdd = (leaderboard_setting_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.LeaderboardSettingAdd(leaderboard_setting_data)
})

export const LeaderboardSettingEdit = (leaderboard_setting_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.LeaderboardSettingEdit(leaderboard_setting_data)
})

export const LeaderboardSettingDelete = (leaderboard_setting_data, message = 'Delete') => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.LeaderboardSettingDelete(leaderboard_setting_data),
        data: `${message}: ${leaderboard_setting_data.key} - ${leaderboard_setting_data.value}`
    }
})

export const LeaderboardSettingRestore = (leaderboard_setting_data, message = 'Restore') => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.LeaderboardSettingRestore(leaderboard_setting_data),
        data: `${message}: ${leaderboard_setting_data.key} - ${leaderboard_setting_data.value}`
    }
})

export const LeaderboardDetailLoad = (leaderboards_data) => ({
    type: 'CMS_LOAD_LEADERBOARD_DETAIL',
    payload: API.LeaderboardDetailLoad(leaderboards_data)
})

export const LeaderboardsExport = () => ({
    type: 'CMS_DOWNLOAD',
    payload: API.LeaderboardsExport()
})

export const LeaderboardsImport = (leaderboards_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.LeaderboardsImport(leaderboards_data)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- PLAYER CARD -----------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const PlayerCardsLoad = () => ({
    type: 'CMS_LOAD_PLAYER_CARDS',
    payload: API.PlayerCardsLoad()
})

export const PlayerCardAdd = (player_card_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.PlayerCardAdd(player_card_data)
})

export const PlayerCardEdit = (player_card_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.PlayerCardEdit(player_card_data)
})

export const PlayerCardDelete = (player_card_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.PlayerCardDelete(player_card_data),
        data: `${player_card_data.name} - ${player_card_data.class}`
    }
})

export const PlayerCardRestore = (player_card_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.PlayerCardRestore(player_card_data),
        data: `${player_card_data.name} - ${player_card_data.class}`
    }
})

export const PlayerCardPackagesLoad = () => ({
    type: 'CMS_LOAD_PLAYER_CARDS_PACKAGES',
    payload: API.PlayerCardPackagesLoad()
})

export const PlayerCardPackageAdd = (package_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.PlayerCardPackageAdd(package_data)
})

export const PlayerCardPackageEdit = (package_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.PlayerCardPackageEdit(package_data)
})

export const PlayerCardPackageDelete = (package_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.PlayerCardPackageDelete(package_data),
        data: `${package_data.name} - ${package_data.priority}`
    }
})

export const PlayerCardPackageRestore = (package_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.PlayerCardPackageRestore(package_data),
        data: `${package_data.name} - ${package_data.priority}`
    }
})

export const PlayerCardSettingsLoad = () => ({
    type: 'CMS_LOAD_PLAYER_CARDS_SETTINGS',
    payload: API.PlayerCardSettingsLoad()
})

export const PlayerCardSettingAdd = (setting_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.PlayerCardSettingAdd(setting_data)
})

export const PlayerCardSettingEdit = (setting_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.PlayerCardSettingEdit(setting_data)
})

export const PlayerCardSettingDelete = (setting_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.PlayerCardSettingDelete(setting_data),
        data: `${setting_data.type} - ${setting_data.paramName} - ${setting_data.level}: ${setting_data.value}`
    }
})

export const PlayerCardSettingRestore = (setting_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.PlayerCardSettingRestore(setting_data),
        data: `${setting_data.type} - ${setting_data.paramName} - ${setting_data.level}: ${setting_data.value}`
    }
})

export const PlayerCardParametersLoad = () => ({
    type: 'CMS_LOAD_PLAYER_CARDS_PARAMETERS',
    payload: API.PlayerCardParametersLoad()
})

export const PlayerCardParameterAdd = (parameter_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.PlayerCardParameterAdd(parameter_data)
})

export const PlayerCardParameterEdit = (parameter_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.PlayerCardParameterEdit(parameter_data)
})

export const PlayerCardParameterDelete = (parameter_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.PlayerCardParameterDelete(parameter_data),
        data: `${parameter_data.type} - ${parameter_data.paramName}`
    }
})

export const PlayerCardParameterRestore = (parameter_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.PlayerCardParameterRestore(parameter_data),
        data: `${parameter_data.type} - ${parameter_data.paramName}`
    }
})

export const PlayerCardFormationsLoad = () => ({
    type: 'CMS_LOAD_PLAYER_CARDS_FORMATIONS',
    payload: API.PlayerCardFormationsLoad()
})

export const PlayerCardFormationAdd = (formation_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.PlayerCardFormationAdd(formation_data)
})

export const PlayerCardFormationEdit = (formation_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.PlayerCardFormationEdit(formation_data)
})

export const PlayerCardFormationDelete = (formation_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.PlayerCardFormationDelete(formation_data),
        data: `${formation_data.name}`
    }
})

export const PlayerCardFormationRestore = (formation_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.PlayerCardFormationRestore(formation_data),
        data: `${formation_data.name}`
    }
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- QUIZ -----------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const TypesLoad = () => ({
    type: 'CMS_LOAD_TYPES',
    payload: API.TypesLoad()
})

export const TypesAdd = (type_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.TypesAdd(type_data)
})

export const TypesEdit = (type_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.TypesEdit(type_data)
})

export const TypesDelete = (type_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.TypesDelete(type_data),
        data: `${type_data.name} - ${type_data.status} - ${type_data.maxAnswers} - ${type_data.answerType}`
    }
})

export const TypesRestore = (type_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.TypesRestore(type_data),
        data: `${type_data.name} - ${type_data.status} - ${type_data.maxAnswers} - ${type_data.answerType}`
    }
})

export const ThemesLoad = () => ({
    type: 'CMS_LOAD_THEMES',
    payload: API.ThemesLoad()
})

export const ThemesAdd = (theme_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ThemesAdd(theme_data)
})

export const ThemesEdit = (theme_data, manual) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ThemesEdit(theme_data, manual)
})

export const ThemesDelete = (theme_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.ThemesDelete(theme_data),
        data: `${theme_data.name} - ${theme_data.status} - ${theme_data.description}- ${theme_data.language}`
    }
})

export const ThemesRestore = (theme_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.ThemesRestore(theme_data),
        data: `${theme_data.name} - ${theme_data.status} - ${theme_data.description}- ${theme_data.language}`
    }
})

export const QuizzesLoad = (quiz_data) => ({
    type: 'CMS_LOAD_QUIZZES',
    payload: API.QuizzesLoad(quiz_data)
})

export const QuizzesAdd = (quiz_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.QuizzesAdd(quiz_data)
})

export const QuizzesEdit = (quiz_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.QuizzesEdit(quiz_data)
})

export const QuizzesDelete = (quiz_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.QuizzesDelete(quiz_data),
        data: `${quiz_data.question} - ${quiz_data.type} - ${quiz_data.status}`
    }
})

export const QuizzesRestore = (quiz_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.QuizzesRestore(quiz_data),
        data: `${quiz_data.question} - ${quiz_data.type} - ${quiz_data.status}`
    }
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- QUEST SYSTEM ----------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const QuestItemsLoad = () => ({
    type: 'CMS_LOAD_QUEST_ITEMS',
    payload: API.QuestItemsLoad()
})

export const QuestItemAdd = (item_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.QuestItemAdd(item_data)
})

export const QuestItemEdit = (item_data, manual) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.QuestItemEdit(item_data, manual)
})

export const QuestItemDelete = (item_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.QuestItemDelete(item_data),
        data: `${item_data.code} - ${item_data.type} - ${item_data.difficulty}`
    }
})

export const QuestItemRestore = (item_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.QuestItemRestore(item_data),
        data: `${item_data.code} - ${item_data.type} - ${item_data.difficulty}`
    }
})

export const QuestConfigLoad = (profileId) => ({
    type: 'CMS_LOAD_QUEST_CONFIGS',
    payload: API.QuestConfigLoad(profileId)
})

export const QuestConfigAdd = (config_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.QuestConfigAdd(config_data)
})

export const QuestConfigEdit = (config_data, manual) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.QuestConfigEdit(config_data, manual)
})

export const QuestConfigDelete = (config_data, message = '') => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.QuestConfigDelete(config_data),
        data: `${message}: ${config_data.level} - ${config_data.status}`
    }
})

export const QuestConfigRestore = (config_data, message = '') => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.QuestConfigRestore(config_data),
        data: `${message}: ${config_data.level} - ${config_data.status}`
    }
})

export const QuestsLoad = (profileId) => ({
    type: 'CMS_LOAD_QUESTS',
    payload: API.QuestsLoad(profileId)
})

export const QuestLocalizationsLoadAll = (item_data) => ({
    type: 'CMS_DOWNLOAD',
    payload: API.QuestLocalizationsLoadAll(item_data)
})

export const QuestLocalizationsLoad = (item_data) => ({
    type: 'CMS_LOAD_QUEST_LOCALIZATIONS',
    payload: API.QuestLocalizationsLoad(item_data)
})

export const QuestLocalizationAdd = (item_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.QuestLocalizationAdd(item_data)
})

export const QuestLocalizationEdit = (item_data, manual) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.QuestLocalizationEdit(item_data, manual)
})

export const QuestLocalizationDelete = (item_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.QuestLocalizationDelete(item_data),
        data: `${item_data.lang} - ${item_data.title}`
    }
})

export const QuestLocalizationRestore = (item_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.QuestLocalizationRestore(item_data),
        data: `${item_data.lang} - ${item_data.title}`
    }
})

export const QuestRequirementsLoad = () => ({
    type: 'CMS_LOAD_QUEST_REQUIREMENTS',
    payload: API.QuestRequirementsLoad()
})

export const QuestRequirementAdd = (requirement_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.QuestRequirementAdd(requirement_data)
})

export const QuestRequirementEdit = (requirement_data, manual) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.QuestRequirementEdit(requirement_data, manual)
})

export const QuestRequirementDelete = (requirement_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.QuestRequirementDelete(requirement_data),
        data: `${requirement_data.name} - ${requirement_data.type}`
    }
})

export const QuestRequirementRestore = (requirement_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.QuestRequirementRestore(requirement_data),
        data: `${requirement_data.name} - ${requirement_data.type}`
    }
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- PROFILE ---------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const ProfileUserXPConfigsLoad = () => ({
    type: 'CMS_LOAD_PROFILE_USER_XP_CONFIGS',
    payload: API.ProfileUserXPConfigsLoad()
})

export const ProfileUserXPConfigsAdd = (profile_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ProfileUserXPConfigsAdd(profile_data)
})

export const ProfileUserXPConfigsEdit = (profile_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ProfileUserXPConfigsEdit(profile_data)
})

export const ProfileUserXPConfigsDelete = (profile_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.ProfileUserXPConfigsDelete(profile_data),
        data: `${profile_data.level} - ${profile_data.userXp} - ${profile_data.coin} - ${profile_data.gem}`
    }
})

export const ProfileUserXPConfigsRestore = (profile_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.ProfileUserXPConfigsRestore(profile_data),
        data: `${profile_data.level} - ${profile_data.userXp} - ${profile_data.coin} - ${profile_data.gem}`
    }
})

export const ProfilesLoad = (profile_data) => ({
    type: 'CMS_LOAD_PROFILES',
    payload: API.ProfilesLoad(profile_data)
})

export const ProfilesHistoryLoad = (profile_data) => ({
    type: 'CMS_LOAD_PROFILES',
    payload: API.ProfilesHistoryLoad(profile_data)
})

export const ProfileEdit = (profile_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ProfileEdit(profile_data)
})

export const ProfileBadWordsLoad = () => ({
    type: 'CMS_LOAD_PROFILE_BADWORDS',
    payload: API.ProfileBadWordsLoad()
})

export const ProfileBadWordAdd = (profile_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ProfileBadWordAdd(profile_data)
})

export const ProfileBadWordGet = (profile_data) => ({
    type: 'CMS_DOWNLOAD',
    payload: API.ProfileBadWordGet(profile_data)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- CAMPAIGN MANAGEMENT -------------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------


export const CampaignsLoad = () => ({
    type: 'CMS_LOAD_CAMPAIGNS',
    payload: API.CampaignsLoad()
})

export const CampaignsAdd = (campaign_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.CampaignsAdd(campaign_data)
})

export const CampaignsEdit = (campaign_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.CampaignsEdit(campaign_data)
})

export const CampaignsDelete = (campaign_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.CampaignsDelete(campaign_data),
        data: `${campaign_data.name} - ${campaign_data.status} - ${campaign_data.code}`
    }
})

export const CampaignsRestore = (campaign_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.CampaignsRestore(campaign_data),
        data: `${campaign_data.name} - ${campaign_data.status} - ${campaign_data.code}`
    }
})

export const CampaignsContentLoad = (id) => ({
    type: 'CMS_LOAD_CAMPAIGNS_CONTENTS',
    payload: API.CampaignsContentLoad(id)
})

export const CampaignsContentAdd = (campaign_content_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.CampaignsContentAdd(campaign_content_data)
})

export const CampaignsContentEdit = (campaign_content_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.CampaignsContentEdit(campaign_content_data)
})

export const CampaignsContentDelete = (campaign_content_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.CampaignsContentDelete(campaign_content_data),
        data: `${campaign_content_data.app_code} - ${campaign_content_data.app_name} - ${campaign_content_data.app_version}`
    }
})

export const CampaignsContentRestore = (campaign_content_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.CampaignsContentRestore(campaign_content_data),
        data: `${campaign_content_data.app_code} - ${campaign_content_data.app_name} - ${campaign_content_data.app_version}`
    }
})

export const CampaignsPointcutsLoad = () => ({
    type: 'CMS_LOAD_CAMPAIGNS_POINTCUTS',
    payload: API.CampaignsPointcutsLoad()
})

export const CampaignsPointcutsAdd = (campaign_pointcuts_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.CampaignsPointcutsAdd(campaign_pointcuts_data)
})

export const CampaignsPointcutsEdit = (campaign_pointcuts_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.CampaignsPointcutsEdit(campaign_pointcuts_data)
})

export const CampaignsPointcutsDelete = (campaign_pointcuts_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.CampaignsPointcutsDelete(campaign_pointcuts_data),
        data: `${campaign_pointcuts_data.name} - ${campaign_pointcuts_data.description}`
    }
})

export const CampaignsPointcutsRestore = (campaign_pointcuts_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.CampaignsPointcutsRestore(campaign_pointcuts_data),
        data: `${campaign_pointcuts_data.name} - ${campaign_pointcuts_data.description}`
    }
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- SPA -------------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const SPAPackagesLoad = () => ({
    type: 'CMS_LOAD_SPA_PACKAGES',
    payload: API.SPAPackagesLoad()
})

export const SPAPackageAdd = (spa_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.SPAPackageAdd(spa_data)
})

export const SPAPackageVersionAdd = (spa_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.SPAPackageVersionAdd(spa_data)
})

export const SPAPackageEdit = (spa_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.SPAPackageEdit(spa_data)
})

export const SPAPackagesDelete = (spa_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.SPAPackagesDelete(spa_data),
        data: `${spa_data.name} - ${spa_data.code} - ${spa_data.version}`
    }
})

export const SPAPackagesContainerDelete = () => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.SPAPackagesContainerDelete()
})

export const SPAPackagesRestore = (spa_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.SPAPackagesRestore(spa_data),
        data: `${spa_data.name} - ${spa_data.code} - ${spa_data.version}`
    }
})

export const SPAPackageDetailsLoad = (spa_data) => ({
    type: 'CMS_LOAD_SPA_PACKAGE_DETAILS',
    payload: API.SPAPackageDetailsLoad(spa_data)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- INSTANT WIN -----------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const InstantWinSettingsLoad = () => ({
    type: 'CMS_LOAD_INSTANT_WIN_SETTINGS',
    payload: API.InstantWinSettingsLoad()
})

export const InstantWinSettingAdd = (instant_win_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.InstantWinSettingAdd(instant_win_data)
})

export const InstantWinSettingEdit = (instant_win_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.InstantWinSettingEdit(instant_win_data)
})

export const InstantWinSettingDelete = (instant_win_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.InstantWinSettingDelete(instant_win_data),
        data: `${instant_win_data.type.type} - ${instant_win_data.code} - ${instant_win_data.status}`
    }
})

export const InstantWinSettingRestore = (instant_win_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.InstantWinSettingRestore(instant_win_data),
        data: `${instant_win_data.type.type} - ${instant_win_data.code} - ${instant_win_data.status}`
    }
})

export const InstantWinTypesLoad = () => ({
    type: 'CMS_LOAD_INSTANT_WIN_TYPES',
    payload: API.InstantWinTypesLoad()
})

export const InstantWinTypeAdd = (instant_win_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.InstantWinTypeAdd(instant_win_data)
})

export const InstantWinTypeEdit = (instant_win_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.InstantWinTypeEdit(instant_win_data)
})

export const InstantWinTypeDelete = (instant_win_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.InstantWinTypeDelete(instant_win_data),
        data: `${instant_win_data.type}`
    }
})

export const InstantWinTypeRestore = (instant_win_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.InstantWinTypeRestore(instant_win_data),
        data: `${instant_win_data.type}`
    }
})

export const InstantWinHistoriesLoad = (instant_win_data) => ({
    type: 'CMS_LOAD_INSTANT_WIN_HISTORIES',
    payload: API.InstantWinHistoriesLoad(instant_win_data)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- CRON ------------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const CronsLoad = () => ({
    type: 'CMS_LOAD_CRON',
    payload: API.CronsLoad()
})

export const CronAdd = (cron_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.CronAdd(cron_data)
})

export const CronEdit = (cron_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.CronEdit(cron_data)
})

export const CronDelete = (cron_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.CronDelete(cron_data),
        data: `${cron_data.name} - ${cron_data.status}`
    }
})

export const CronRestore = (cron_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.CronRestore(cron_data),
        data: `${cron_data.name} - ${cron_data.status}`
    }
})

export const CronTrigger = (cron_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.CronTrigger(cron_data)
})

export const CronHistoriesLoad = (cron_data) => ({
    type: 'CMS_LOAD_CRON_HISTORIES',
    payload: API.CronHistoriesLoad(cron_data)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- CMS ACTIVITY LOGS -----------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const CmsActivityLogDataLoad = (activity_data) => ({
    type: 'CMS_LOAD_ACTIVITY_LOG_DATA',
    payload: API.CmsActivityLogDataLoad(activity_data)
})

export const CmsActivityLogsExport = (activity_data) => ({
    type: 'CMS_DOWNLOAD',
    payload: API.CmsActivityLogsExport(activity_data)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- ACTIVITY LOGS ---------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const ActivityLogsExport = (activity_data) => ({
    type: 'CMS_DOWNLOAD',
    payload: API.ActivityLogsExport(activity_data)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- NOTIFICATION ----------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const NotificationsLoad = (notification_data) => ({
    type: 'CMS_LOAD_NOTIFICATIONS',
    payload: API.NotificationsLoad(notification_data)
})

export const NotificationAdd = (notification_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.NotificationAdd(notification_data)
})

export const NotificationDelete = (notification_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.NotificationDelete(notification_data),
        data: `${notification_data.type} - ${notification_data.template} - ${notification_data.schedule}`
    }
})

export const NotificationSchedulesLoad = () => ({
    type: 'CMS_LOAD_NOTIFICATION_SCHEDULES',
    payload: API.NotificationSchedulesLoad()
})

export const NotificationScheduleAdd = (notification_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.NotificationScheduleAdd(notification_data)
})

export const NotificationScheduleEdit = (notification_data, manual) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.NotificationScheduleEdit(notification_data, manual)
})

export const NotificationScheduleDelete = (notification_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.NotificationScheduleDelete(notification_data),
        data: `${notification_data.name} - ${notification_data.type} - ${notification_data.status}`
    }
})

export const NotificationScheduleRestore = (notification_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.NotificationScheduleRestore(notification_data),
        data: `${notification_data.name} - ${notification_data.type} - ${notification_data.status}`
    }
})

export const NotificationTemplatesLoad = () => ({
    type: 'CMS_LOAD_NOTIFICATION_TEMPLATES',
    payload: API.NotificationTemplatesLoad()
})

export const NotificationTemplateAdd = (notification_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.NotificationTemplateAdd(notification_data)
})

export const NotificationTemplateEdit = (notification_data, manual) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.NotificationTemplateEdit(notification_data, manual)
})

export const NotificationTemplateDelete = (notification_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.NotificationTemplateDelete(notification_data),
        data: `${notification_data.type} - ${notification_data.title} - ${notification_data.status}`
    }
})

export const NotificationTemplateRestore = (notification_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.NotificationTemplateRestore(notification_data),
        data: `${notification_data.type} - ${notification_data.title} - ${notification_data.status}`
    }
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- USER ------------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const UserAuthenticationDelete = (user_data) => ({
    type: 'CMS_ACTION_REGULAR_MULTI',
    payload: {
        promise: API.UserAuthenticationDelete(user_data),
        data: `${user_data.email} - ${user_data.phoneNumber}`
    }
})

export const UserAuthenticationEdit = (user_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.UserAuthenticationEdit(user_data)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- ESB -------------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const ESBLoad = (esb_data) => ({
    type: 'CMS_LOAD_ESBS',
    payload: API.ESBLoad(esb_data)
})

export const ESBAdd = (esb_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ESBAdd(esb_data)
})

export const ESBTrigger = (esb_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.ESBTrigger(esb_data)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- DLC -------------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const DLCDetailsLoad = (dlc_data) => ({
    type: 'CMS_LOAD_DLC_DETAILS',
    payload: API.DLCDetailsLoad(dlc_data)
})

export const DLCAdd = (dlc_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.DLCAdd(dlc_data)
})

export const DLCEdit = (dlc_data) => ({
    type: 'CMS_ACTION_REGULAR',
    payload: API.DLCEdit(dlc_data)
})

export const DLCGetUrl = (dlc_data) => ({
    type: 'CMS_DOWNLOAD',
    payload: API.DLCGetUrl(dlc_data)
})

//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
//----- OTHERS ----------------------------------------------------------------------------------------------------------------------------------------------------------
//-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

export const ClearProps = (keys) => ({
    type: 'CMS_CLEAR_PROPS',
    payload: keys
})

export const ClearError = () => ({
    type: 'CMS_CLEAR_ERROR'
})

export const ClearRefresh = () => ({
    type: 'CMS_CLEAR_REFRESH'
})

export const ClearNotify = () => ({
    type: 'CMS_CLEAR_NOTIFY'
})

export const SetLoading = (msg = undefined) => ({
    type: 'CMS_SET_LOADING',
    payload: msg
})

export const ClearLoading = () => ({
    type: 'CMS_CLEAR_LOADING'
})

export const ShowMessage = (msg) => ({
    type: 'CMS_SHOW_MESSAGE',
    payload: new Promise((resolve, reject) => {
        setTimeout(() => {
          resolve(msg)
        }, 100)
    })
})

export const SetProps = (props) => ({
    type: 'CMS_SET_PROPS',
    payload: props
})