import axios from 'axios'
import * as _ from 'lodash'
import { v4 as uuidv4 } from "uuid"

import Utils from '../Utils'
// import JSZip from 'jszip'
import { env } from '../env'
import moment from 'moment'

class API
{
    constructor()
    {
        this.baseURL = {}
        this.TRACER_LENGTH = 30

        axios.interceptors.request.use(
            config =>
            {
                return this.ConfigRequest(config)
            },
            error =>
            {
                return Promise.reject(error)
            }
        )

        axios.interceptors.response.use(
            response =>
            {
                return this.HandleResponse(response)
            },
            error =>
            {
                return this.HandleError(error)
            }
        )
    }

    SetProjects = (proj) =>
    {
        return proj
    }

    SetEndPoint = (end_point) =>
    {
        this.baseURL = _.reduce(end_point, (endPoint, value) => ({...endPoint, [value.name]: value.endpoint}), {})
        return true
    }

    ConfigRequest = (config) =>
    {
        if (config.hasOwnProperty('payload') === false)
        {
            return config
        }

        if (config['headers']['Content-Type'] === 'multipart/form-data')
        {
            let formData = config['payload'].data
            config['data'] = formData
        }
        else
        {
            config['data'] = {
                ...config['payload'].data
            }
        }

        return config
    }

    HandleResponse = (res) =>
    {
        console.log('HandleResponse', res)
        
        if (res.status < 200 || res.status >= 300)
        {
            this.HandleTracer({ tracerId: res.headers['x-tracer-id'], status: res.status })
            return Promise.reject({
                code: res.status || -1,
                title: res.statusText || 'Warning!',
                message: `invalid status ${res.status}`
            })
        }

        if (res.data)
        {
            res.data.accessToken && Utils.setItem(Utils.ACCESS_TOKEN, res.data.accessToken)
            res.data.loginToken && Utils.setItem(Utils.LOGIN_TOKEN, res.data.loginToken)
            // Unzip json data
            /* if (res.headers['content-type'] === 'application/zip')
            {
                let zipData = res.data

                return JSZip.loadAsync(zipData)
                    .then(zipFile =>
                    {
                        // console.log('zipFile', zipFile)
                        return Promise.all(
                            Object.keys(zipFile.files).map(filename =>
                            {
                                return zipFile.file(filename).async('uint8array')
                            })
                        )
                    })
                    .then(allSubFileData =>
                    {
                        console.log('allSubFileData', allSubFileData)
                        return Promise.all(
                            allSubFileData.map(data =>
                            {
                                return JSZip.loadAsync(data)
                            })
                        )
                    })
                    .then(allSubFile =>
                    {
                        // console.log('allSubFile', allSubFile)
                        return Promise.all(
                            allSubFile.reduce((tasks, zip) =>
                            {
                                return tasks.concat(
                                    Object.keys(zip.files).map(filename =>
                                    {
                                        return zip.file(filename).async('string')
                                    })
                                )
                            }, [])
                        )
                    })
                    .then(allFileData =>
                    {
                        // console.log('allFileData', allFileData)
                        return Promise.all(
                            allFileData.map(data =>
                            {
                                return JSON.parse(data)
                            })
                        )
                    })
                    .then(allJsonData =>
                    {
                        // console.log('allJsonData', allJsonData)
                        return allJsonData.reduce((a, v) => [...a, ...v], [])
                    })
                    .then(uncompressData =>
                    {
                        console.log('uncompressData', uncompressData)
                        return { data: uncompressData }
                    })
                    .catch(err =>
                    {
                        return Promise.reject({
                            code: -4,
                            message: `${err.message ? err.message : err}`,
                            title: 'Uncompress data fail !'
                        })
                    })
            } */

            return res.data
        }

        this.HandleTracer({ tracerId: res.headers['x-tracer-id'], status: res.status })
        return Promise.reject({
            code: -2,
            message: `wrong response format ${JSON.stringify(res)}`,
            title: res.statusText || 'Warning!',
        })
    }

    HandleError = (error) =>
    {
        // backend has changed the way throw error
        let response = error.response || {}

        console.log('HandleError', response)

        this.HandleTracer({ tracerId: response.data?.requestId || '', status: response.status || '' })
        return Promise.reject({
            code: response.status || -3,
            title: response.statusText || 'Warning!',
            message: (response.data && response.data.error) || (error.message) || 'unknown reason'
        })
    }

    HandleTracer = (info) =>
    {
        let tracers = Utils.getItem(Utils.TRACER)

        if (_.isEmpty(tracers)) tracers = []
       
        if (tracers.length === this.TRACER_LENGTH)
        {
            tracers = _.dropRight(tracers)
        }

        Utils.setItem(Utils.TRACER, [{ ...info, time: moment().format() }, ...tracers])
    }

    Request(method, url, payload, contentType = 'application/json', responseType = 'json', cmsReponseCode = false)
    {
        let config = {}
        config['baseURL'] = ''
        config['method'] = method
        config['url'] = url
        config['responseType'] = responseType

        config['headers'] = {
            'Content-Type': contentType,
            'x-access-token': Utils.getItem(Utils.ACCESS_TOKEN),
            'x-login-token': Utils.getItem(Utils.LOGIN_TOKEN),
            'x-request-token': Utils.EncryptData(JSON.stringify(uuidv4())),
            'cms-reponse-code': cmsReponseCode
        }

        config['payload'] = payload || {}

        // https://blog.logrocket.com/how-to-make-http-requests-like-a-pro-with-axios/
        return axios(config)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- RESOURCES -------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    ResourcesLoad(service)
    {
        if (service === 'remote-config')
        {
            return this.Request('get', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/resources`)
        }
        else if (service === 'cms-user')
        {
            return this.Request('get', `${env.REACT_APP_CMS_USER_URL}/v1/resources`)
        }
        else
        {
            return this.Request('get', `${this.baseURL[service]}/v1/resources`)
        }
    }

    ResourcesExport(service)
    {
        return this.Request('post', `${this.baseURL[service]}/v1/resources:export`, {}, 'application/json', 'arraybuffer')
    }

    ResourcesImport(service, data)
    {
        const { file } = data
        let formData = new FormData()

        formData.append('file', file[0])

        const payload = {
            data: formData
        }

        return this.Request('post', `${this.baseURL[service]}/v1/resources:import`, payload, 'multipart/form-data', 'json', true)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- LOGIN -----------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    UserLogin(email, password)
    {
        const payload = {
            data: {
                email,
                password: Utils.EncryptData(password)
            }
        }

        return this.Request('post', `${env.REACT_APP_CMS_USER_URL}/v1/users/login`, payload)
    }

    UserSSOLogin()
    {
        return `${env.REACT_APP_CMS_USER_URL}/v1/users/login/saml`
    }

    ChooseGroup(groupId)
    {
        const payload = {
            data: {
                groupId
            }
        }

        return this.Request('post', `${env.REACT_APP_CMS_USER_URL}/v1/users/me/choose-group`, payload)
    }

    ResetPassword(email)
    {
        const payload = {
            data: {
                email,
            },
        }

        return this.Request('post', `${env.REACT_APP_CMS_USER_URL}/v1/users/me/forget-pass`, payload)
    }

    Authen()
    {
        return this.Request('post', `${env.REACT_APP_CMS_USER_URL}/v1/users/me/auth`)
    }

    Logout()
    {
        return this.Request('post', `${env.REACT_APP_CMS_USER_URL}/v1/users/me/logout`)
    }

    SSOLogout()
    {
        const query = {
            loginToken: Utils.getItem(Utils.LOGIN_TOKEN),
            requestToken: uuidv4()
        }

        return `${env.REACT_APP_CMS_USER_URL}/v1/users/me/logout/saml?data=${Utils.EncryptData(JSON.stringify(query))}`
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- ACCOUNTS --------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    ChangePassword(oldPassword, newPassword)
    {
        const payload = {
            data: {
                oldPassword: Utils.EncryptData(oldPassword),
                newPassword: Utils.EncryptData(newPassword)
            }
        }

        return this.Request('put', `${env.REACT_APP_CMS_USER_URL}/v1/users/me/password`, payload)
    }

    ChangeUsername(username)
    {
        const payload = {
            data: {
                username
            }
        }

        return this.Request('put', `${env.REACT_APP_CMS_USER_URL}/v1/users/me`, payload)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- USER GROUPS -----------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    GroupsLoad()
    {
        return this.Request('get', `${env.REACT_APP_CMS_USER_URL}/v1/groups`)
    }

    GroupsRolesLoad()
    {
        return this.Request('get', `${env.REACT_APP_CMS_USER_URL}/v1/groups/-/roles`)
    }

    GroupAdd(group_data)
    {
        const payload = {
            data: {
                name: group_data.name,
            }
        }

        return this.Request('post', `${env.REACT_APP_CMS_USER_URL}/v1/groups`, payload, 'application/json', 'json', true)
    }

    GroupEdit(group_data)
    {
        const { id, name } = group_data

        const payload = {
            data: {
                name,
            }
        }

        return this.Request('put', `${env.REACT_APP_CMS_USER_URL}/v1/groups/${id}`, payload, 'application/json', 'json', true)
    }

    GroupDelete(group_data)
    {
        const { id } = group_data
        return this.Request('delete', `${env.REACT_APP_CMS_USER_URL}/v1/groups/${id}`)
    }

    GroupRestore(group_data)
    {
        const { id } = group_data
        return this.Request('post', `${env.REACT_APP_CMS_USER_URL}/v1/groups/${id}:undelete`)
    }

    GroupRolesAdd(group_data, batch = 'batchCreate')
    {
        const { id, roles } = group_data

        const payload = {
            data: {
                roleIds: roles.map(role => (role.id))
            }
        }

        return this.Request('post', `${env.REACT_APP_CMS_USER_URL}/v1/groups/${id}/roles:${batch}`, payload, 'application/json', 'json', true)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- USER ROLES -----------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    RolesLoad()
    {
        return this.Request('get', `${env.REACT_APP_CMS_USER_URL}/v1/roles`)
    }

    RolesPermissionsLoad()
    {
        return this.Request('get', `${env.REACT_APP_CMS_USER_URL}/v1/roles/-/permissions`)
    }

    RoleAdd(role_data)
    {
        const payload = {
            data: {
                name: role_data.name,                
            }
        }

        return this.Request('post', `${env.REACT_APP_CMS_USER_URL}/v1/roles`, payload, 'application/json', 'json', true)
    }
    
    RoleEdit(role_data)
    {
        const { id, name } = role_data

        const payload = {
            data: {
                name,
            }
        }

        return this.Request('put', `${env.REACT_APP_CMS_USER_URL}/v1/roles/${id}`, payload, 'application/json', 'json', true)
    }

    RoleDelete(role_data)
    {
        const { id } = role_data
        return this.Request('delete', `${env.REACT_APP_CMS_USER_URL}/v1/roles/${id}`)
    }

    RoleRestore(role_data)
    {
        const { id } = role_data
        return this.Request('post', `${env.REACT_APP_CMS_USER_URL}/v1/roles/${id}:undelete`)
    }

    RolePermissionsAdd(role_data, batch = 'batchCreate')
    {
        const { id, permissions } = role_data
        const payload = {
            data: {
                permissions
            }
        }

        return this.Request('post', `${env.REACT_APP_CMS_USER_URL}/v1/roles/${id}/permissions:${batch}`, payload, 'application/json', 'json', true)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- CMS USERS -------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    UsersLoad()
    {
        return this.Request('get', `${env.REACT_APP_CMS_USER_URL}/v1/users/-/groups`)
    }

    UserAdd(user_data)
    {
        const payload = {
            data: {
                email: user_data.email,
                username: user_data.email,
                type: user_data.type
            }
        }

        return this.Request('post', `${env.REACT_APP_CMS_USER_URL}/v1/users`, payload, 'application/json', 'json', true)
    }

    UserEdit(user_data)
    {
        const { id, status } = user_data

        const payload = {
            data: {
                status,
            }
        }

        return this.Request('put', `${env.REACT_APP_CMS_USER_URL}/v1/users/${id}/status`, payload)
    }

    UserDelete(user_data)
    {
        const { id } = user_data
        return this.Request('delete', `${env.REACT_APP_CMS_USER_URL}/v1/users/${id}`)
    }

    UserRestore(user_data)
    {
        const { id } = user_data
        return this.Request('post', `${env.REACT_APP_CMS_USER_URL}/v1/users/${id}:undelete`)
    }

    RevokePassword(user_data)
    {
        const { id } = user_data
        return this.Request('put', `${env.REACT_APP_CMS_USER_URL}/v1/users/${id}/revoke-password`)
    }

    UserGroupsAdd(user_data, batch = 'batchCreate')
    {
        const { id, groups } = user_data

        const payload = {
            data: {
                groupIds: groups.map(group => (group.id))
            }
        }

        return this.Request('post', `${env.REACT_APP_CMS_USER_URL}/v1/users/${id}/groups:${batch}`, payload, 'application/json', 'json', true)
    }

    UserConfigsLoad()
    {
        return this.Request('get', `${env.REACT_APP_CMS_USER_URL}/v1/configs`)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- BUILDINGS -------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    BuildingsLoad(type)
    {
        return this.Request('get', `${this.baseURL['building']}/v1/settings/?type=${type}`)
    }

    BuildingAdd(building_data)
    {
        const payload = {
            data: {
                ...building_data
            }
        }

        return this.Request('post', `${this.baseURL['building']}/v1/settings`, payload, 'application/json', 'json', true)
    }

    BuildingEdit(building_data)
    {
        const { id, value } = building_data

        const payload = {
            data: {
                value,
            }
        }

        return this.Request('put', `${this.baseURL['building']}/v1/settings/${id}`, payload)
    }

    BuildingsEdit(building_data)
    {
        const { type, paramName, level, value } = building_data

        const payload = {
            data: {
                items: [{
                    type,
                    paramName,
                    level,
                    value,
                }]
            }
        }

        return this.Request('post', `${this.baseURL['building']}/v1/settings:batchUpdate`, payload, 'application/json', 'json', true)
    }

    BuildingDelete(building_data)
    {
        const { id } = building_data
        return this.Request('delete', `${this.baseURL['building']}/v1/settings/${id}`)
    }

    BuildingsDelete(building_data)
    {
        const { items } = building_data

        const payload = {
            data: {
                items
            }
        }

        return this.Request('post', `${this.baseURL['building']}/v1/settings:batchDelete`, payload)
    }

    BuildingRestore(building_data)
    {
        const { id } = building_data
        return this.Request('post', `${this.baseURL['building']}/v1/settings/${id}:undelete`)
    }

    BuildingsRestore(building_data)
    {
        const { items } = building_data

        const payload = {
            data: {
                items
            }
        }

        return this.Request('post', `${this.baseURL['building']}/v1/settings:batchUndelete`, payload)
    }

    BuildingTypesLoad()
    {
        return this.Request('get', `${this.baseURL['building']}/v1/types`)
    }

    BuildingTypeAdd(type_data)
    {
        const { type } = type_data

        const payload = {
            data: {
                type
            }
        }

        return this.Request('post', `${this.baseURL['building']}/v1/types`, payload, 'application/json', 'json', true)
    }

    BuildingTypeDelete(type_data)
    {
        const { id } = type_data
        return this.Request('delete', `${this.baseURL['building']}/v1/types/${id}`)
    }

    BuildingTypeRestore(type_data)
    {
        const { id } = type_data
        return this.Request('post', `${this.baseURL['building']}/v1/types/${id}:undelete`)
    }

    BuildingParametersLoad()
    {
        return this.Request('get', `${this.baseURL['building']}/v1/parameters`)
    }

    BuildingParameterAdd(parameter_data)
    {
        const { type, paramName, valueType, description } = parameter_data

        const payload = {
            data: {
                type,
                paramName,
                valueType,
                description
            }
        }

        return this.Request('post', `${this.baseURL['building']}/v1/parameters`, payload, 'application/json', 'json', true)
    }

    BuildingParameterEdit(parameter_data)
    {
        const { id, description } = parameter_data

        const payload = {
            data: {
                description,
            }
        }

        return this.Request('put', `${this.baseURL['building']}/v1/parameters/${id}`, payload)
    }

    BuildingParameterDelete(parameter_data)
    {
        const { id } = parameter_data
        return this.Request('delete', `${this.baseURL['building']}/v1/parameters/${id}`)
    }

    BuildingParameterRestore(parameter_data)
    {
        const { id } = parameter_data
        return this.Request('post', `${this.baseURL['building']}/v1/parameters/${id}:undelete`)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- MONUMENT --------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    MonumentSettingsLoad()
    {
        return this.Request('get', `${this.baseURL['building']}/v1/monuments/settings`)
    }
    
    MonumentSettingsAdd(setting_data)
    {
        const { typeName, parameter, value } = setting_data
    
        let payload = {
            data: {
                typeName,
                parameterName:parameter,
                value: +value
            }
        }
        return this.Request('post', `${this.baseURL['building']}/v1/monuments/settings`, payload, 'application/json', 'json', true)
    }

    MonumentSettingsEdit(setting_data)
    {
        const { id,value } = setting_data
    
        let payload = {
            data: {
                value: +value
            }
        }
        return this.Request('put', `${this.baseURL['building']}/v1/monuments/settings/${id}`, payload, 'application/json', 'json', true)
    }
    
    MonumentSettingsDelete(setting_data)
    {
        let { id } = setting_data
        return this.Request('delete', `${this.baseURL['building']}/v1/monuments/settings/${id}`)
    }
    
    MonumentSettingsRestore(setting_data)
    {
        let { id } = setting_data
        return this.Request('post', `${this.baseURL['building']}/v1/monuments/settings/${id}:undelete`)
    }
    
    MonumentParametersLoad()
    {
        return this.Request('get', `${this.baseURL['building']}/v1/monuments/parameters`)
    }
    
    MonumentParametersAdd(parameter_data)
    {
        const { type, name } = parameter_data
    
        let payload = {
            data: {
                type,
                name
            }
        }
    
        return this.Request('post', `${this.baseURL['building']}/v1/monuments/parameters`, payload, 'application/json', 'json', true)
    }
    
    MonumentParametersDelete(parameter_data)
    {
        let { id } = parameter_data
        return this.Request('delete', `${this.baseURL['building']}/v1/monuments/parameters/${id}`)
    }
    
    MonumentParametersRestore(parameter_data)
    {
        let { id } = parameter_data
        return this.Request('post', `${this.baseURL['building']}/v1/monuments/parameters/${id}:undelete`)
    }
    
    MonumentTypesLoad()
    {
        return this.Request('get', `${this.baseURL['building']}/v1/monuments/types`)
    }
    
    MonumentTypesAdd(types_data)
    {
        const { name,groupName } = types_data
    
        let payload = {
            data: {
                name,
                groupName
            }
        }
    
        return this.Request('post', `${this.baseURL['building']}/v1/monuments/types`, payload, 'application/json', 'json', true)
    }
    
    MonumentTypesDelete(types_data)
    {
        let { id } = types_data
        return this.Request('delete', `${this.baseURL['building']}/v1/monuments/types/${id}`)
    }
    
    MonumentTypesRestore(types_data)
    {
        let { id } = types_data
        return this.Request('post', `${this.baseURL['building']}/v1/monuments/types/${id}:undelete`)
    }
    
    MonumentGroupsLoad()
    {
        return this.Request('get', `${this.baseURL['building']}/v1/monuments/groups`)
    }
    
    MonumentGroupsAdd(group_data)
    {
        const { name } = group_data
    
        let payload = {
            data: {
                name
            }
        }
        return this.Request('post', `${this.baseURL['building']}/v1/monuments/groups`, payload, 'application/json', 'json', true)
    }
    
    MonumentGroupsDelete(group_data)
    {
        let { id } = group_data;
        return this.Request('delete', `${this.baseURL['building']}/v1/monuments/groups/${id}`)
    }
    
    MonumentGroupsRestore(group_data)
    {
        let { id } = group_data
        return this.Request('post', `${this.baseURL['building']}/v1/monuments/groups/${id}:undelete`)

    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- CURRENCY --------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    CurrencyTypesLoad()
    {
        return this.Request('get', `${this.baseURL['currency']}/v1/types`)
    }

    CurrencyTypeAdd(currency_data)
    {
        const { name, type, status, settings, defaultQuantity, crossSeason } = currency_data

        const payload = {
            data: {
                name,
                type,
                status,
                settings,
                defaultQuantity,
                crossSeason
            }
        }

        return this.Request('post', `${this.baseURL['currency']}/v1/types`, payload, 'application/json', 'json', true)
    }
    
    CurrencyTypeEdit(currency_data, manual = false)
    {
        const { id, name, type, status, settings, defaultQuantity, crossSeason } = currency_data

        const payload = {
            data: {
                name,
                type,
                status,
                settings,
                defaultQuantity,
                crossSeason
            }
        }

        return this.Request('put', `${this.baseURL['currency']}/v1/types/${manual ? id : ''}`, payload)
    }

    CurrencyTypeDelete(currency_data)
    {
        const { id } = currency_data
        return this.Request('delete', `${this.baseURL['currency']}/v1/types/${id}`)
    }

    CurrencyTypeRestore(currency_data)
    {
        const { id } = currency_data
        return this.Request('post', `${this.baseURL['currency']}/v1/types/${id}:undelete`)
    }

    CurrenciesLoad(profileId)
    {
        return this.Request('get', `${this.baseURL['currency']}/v1/profiles/${profileId}/currencies`)
    }

    CurrencyProfileEdit(currency_data)
    {
        const { id, quantity } = currency_data

        const payload = {
            data: {
                quantity
            }
        }

        console.log('CurrencyProfileEdit', payload)
        return this.Request('put', `${this.baseURL['currency']}/v1/currencies/${id}`, payload)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- ACHIEVEMENT --------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    AchievementLoad()
    {
        return this.Request('get', `${this.baseURL['achievement']}/v1/achievements`)
    }

    AchievementAdd(achievement_data)
    {
        const { 
            name, 
            description,
            condition,
            condition_tier,
            hidden,
            permanent,
            status, 
        } = achievement_data

        const payload = {
            data: {
                name, 
                description,
                condition,
                condition_tier,
                hidden,
                permanent,
                status,
            }
        }

        return this.Request('post', `${this.baseURL['achievement']}/v1/achievements`, payload, 'application/json', 'json', true)
    }
    
    AchievementEdit(achievement_data)
    {
        const { 
            id, 
            name, 
            description,
            condition,
            condition_tier,
            hidden,
            permanent,
            status
        } = achievement_data

        const payload = {
            data: {
                name, 
                description,
                condition,
                condition_tier,
                hidden,
                permanent,
                status
            }
        }

        return this.Request('put', `${this.baseURL['achievement']}/v1/achievements/${id}`, payload)
    }

    AchievementDelete(achievement_data)
    {
        const { id } = achievement_data
        return this.Request('delete', `${this.baseURL['achievement']}/v1/achievements/${id}`)
    }

    AchievementRestore(achievement_data)
    {
        const { id } = achievement_data
        return this.Request('post', `${this.baseURL['achievement']}/v1/achievements/${id}:undelete`)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- REWARD MANAGEMENT --------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    RewardTypeLoad()
    {
        return this.Request('get', `${this.baseURL['reward']}/v1/types`)
    }

    RewardTypeAdd(reward_type_data)
    {
        const { name, description, status, requirement } = reward_type_data

        const payload = {
            data: {
                name,
                description,
                status,
                requirement
            }
        }
        return this.Request('post', `${this.baseURL['reward']}/v1/types`, payload, 'application/json', 'json', true)
    }
    
    RewardTypeEdit(reward_type_data, manual = false)
    {
        const { id, name, description, requirement, status } = reward_type_data

        const payload = {
            data: {
                name,
                description,
                requirement,
                status
            }
        }

        return this.Request('put', `${this.baseURL['reward']}/v1/types/${manual ? id : ''}`, payload)
    }

    RewardTypeDelete(reward_type_data)
    {
        const { id } = reward_type_data
        return this.Request('delete', `${this.baseURL['reward']}/v1/types/${id}`)
    }

    RewardTypeRestore(reward_type_data)
    {
        const { id } = reward_type_data
        return this.Request('post', `${this.baseURL['reward']}/v1/types/${id}:undelete`)
    }

    RewardItemLoad()
    {
        return this.Request('get', `${this.baseURL['reward']}/v1/items`)
    }

    RewardItemAdd(reward_item_data)
    {
        const { name, description, status, type, giftable } = reward_item_data

        const payload = {
            data: {
                name,
                description,
                status,
                type,
                giftable 
            }
        }

        return this.Request('post', `${this.baseURL['reward']}/v1/items`, payload, 'application/json', 'json', true)
    }
    
    RewardItemEdit(reward_item_data, manual = false)
    {
        const { id, name, description, type, status, giftable } = reward_item_data

        const payload = {
            data: {
                name,
                description,
                type,
                status,
                giftable
            }
        }

        return this.Request('put', `${this.baseURL['reward']}/v1/items/${manual ? id : ''}`, payload)
    }

    RewardItemDelete(reward_item_data)
    {
        const { id } = reward_item_data
        return this.Request('delete', `${this.baseURL['reward']}/v1/items/${id}`)
    }

    RewardItemRestore(reward_item_data)
    {
        const { id } = reward_item_data
        return this.Request('post', `${this.baseURL['reward']}/v1/items/${id}:undelete`)
    }

    RewardPackLoad(reward_pack_data)
    {
        const { name, item, deletedAt, page, pageSize } = reward_pack_data
        return this.Request('get', `${this.baseURL['reward']}/v1/packs/?name=${name}&item=${item}&ignoreDeleted=${deletedAt}&page=${page}&pageSize=${pageSize}`)
    }

    RewardPackAdd(reward_pack_data)
    {
        const { 
            name, 
            item,
            status,
            chancePercentage,
            quantity,
            businessLevel
        } = reward_pack_data

        const payload = {
            data: {
                name, 
                item,
                status,
                chancePercentage,
                quantity,
                businessLevel
            }
        }

        return this.Request('post', `${this.baseURL['reward']}/v1/packs`, payload, 'application/json', 'json', true)
    }
    
    RewardPackEdit(reward_pack_data, manual = true) // Don't support unique key
    {
        const { 
            id,
            name, 
            item,
            status,
            chancePercentage,
            quantity,
            businessLevel
         } = reward_pack_data

        const payload = {
            data: {
                name,
                item,
                status,
                chancePercentage,
                quantity,
                businessLevel
            }
        }

        return this.Request('put', `${this.baseURL['reward']}/v1/packs/${manual ? id : ''}`, payload)
    }

    RewardPackDelete(reward_pack_data)
    {
        const { id } = reward_pack_data
        return this.Request('delete', `${this.baseURL['reward']}/v1/packs/${id}`)
    }

    RewardPackRestore(reward_pack_data)
    {
        const { id } = reward_pack_data
        return this.Request('post', `${this.baseURL['reward']}/v1/packs/${id}:undelete`)
    }

    RewardSettingLoad(reward_setting_data)
    {
        const { type, item, status, deletedAt, page, pageSize } = reward_setting_data
        return this.Request('get', `${this.baseURL['reward']}/v1/settings/?type=${type}&item=${item}&status=${status}&ignoreDeleted=${deletedAt}&page=${page}&pageSize=${pageSize}`)
    }

    RewardSettingAdd(reward_setting_data)
    {
        const { 
            type, 
            item,
            requirement,
            status,
            chancePercentage,
            quantity,
            stadiumLevel 
        } = reward_setting_data

        const payload = {
            data: {
                type, 
                item,
                requirement,
                status,
                chancePercentage,
                quantity,
                stadiumLevel 
            }
        }
        return this.Request('post', `${this.baseURL['reward']}/v1/settings`, payload, 'application/json', 'json', true)
    }
    
    RewardSettingEdit(reward_setting_data)
    {
        const { 
            id,
            type, 
            item,
            requirement,
            status,
            chancePercentage,
            quantity,
            stadiumLevel 
        } = reward_setting_data

        const payload = {
            data: {
                type, 
                item,
                requirement,
                status,
                chancePercentage,
                quantity,
                stadiumLevel 
            }
        }

        return this.Request('put', `${this.baseURL['reward']}/v1/settings/${id}`, payload)
    }

    RewardSettingDelete(reward_setting_data)
    {
        const { id } = reward_setting_data
        return this.Request('delete', `${this.baseURL['reward']}/v1/settings/${id}`)
    }

    RewardSettingRestore(reward_setting_data)
    {
        const { id } = reward_setting_data
        return this.Request('post', `${this.baseURL['reward']}/v1/settings/${id}:undelete`)
    }

    RewardLoad(reward_data)
    {
        let { profileId, received, type, page, pageSize } = reward_data
        return this.Request('get', `${this.baseURL['reward']}/v1/profiles/${profileId}/rewards/?availableOnly=${received}&type=${type}&page=${page}&pageSize=${pageSize}`)
    }

    RewardSendGift(reward_gift)
    {
        let { profileId, gifts, extraInfo, fromExcel, file } = reward_gift
        let payload = {}
        gifts = _.reduce(gifts, (result, gift) => 
        {
            if (gift.type === 'item')
            {
                result.items = {...result.items, [gift.name]: gift.amount}
            }
            else if (gift.type === 'card')
            {
                for (let i = 0; i < gift.amount; i++)
                {
                    result.cards = [...result.cards, gift.name.id]
                }
            }

            return result
        }, { cards: [], items: {} })

        if (fromExcel)
        {
            let formData = new FormData()

            formData.append('items', JSON.stringify(gifts.items))
            formData.append('cards', JSON.stringify(gifts.cards))
            formData.append('extraInfo', extraInfo)
            if (file && file[0])
            {
                formData.append('file', file[0])
            }

            payload = {
                data: formData
            }

            return this.Request('post', `${this.baseURL['reward']}/v1/rewards`, payload, 'multipart/form-data', 'json', true)
        }
        else
        {
            payload = {
                data: {
                    extraInfo: JSON.parse(extraInfo),
                    ...gifts
                }
            }

            return this.Request('post', `${this.baseURL['reward']}/v1/profiles/${profileId}/rewards`, payload)
        }
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- SHOP --------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    ShopSettingParamsLoad()
    {
        return this.Request('get', `${this.baseURL['shop']}/v1/setting-params`)
    }

    ShopSettingParamsAdd(shop_setting_param_data)
    {
        const { 
           type,
           paramName,
           description
        } = shop_setting_param_data

        const payload = {
            data: {
                type,
                paramName,
                description
            }
        }

        return this.Request('post', `${this.baseURL['shop']}/v1/setting-params`, payload, 'application/json', 'json', true)
    }
    
    ShopSettingParamsEdit(shop_setting_param_data)
    {
        const { 
            id, 
            description,
        } = shop_setting_param_data

        const payload = {
            data: {
                description
            }
        }

        return this.Request('put', `${this.baseURL['shop']}/v1/setting-params/${id}`, payload)
    }

    ShopSettingParamsDelete(shop_setting_param_data)
    {
        const { id } = shop_setting_param_data
        return this.Request('delete', `${this.baseURL['shop']}/v1/setting-params/${id}`)
    }

    ShopSettingParamsRestore(shop_setting_param_data)
    {
        const { id } = shop_setting_param_data
        return this.Request('post', `${this.baseURL['shop']}/v1/setting-params/${id}:undelete`)
    }

    ShopItemLoad(type)
    {
        return this.Request('get', `${this.baseURL['shop']}/v1/shop-items/${type}`)
    }

    ShopItemAdd(shop_item_data)
    {
        const { 
            productId,
            type,
            name,
            content,
            price,
            imageUrl,
            settings
        } = shop_item_data

        const payload = {
            data: {
                productId,
                type,
                name,
                content,
                price,
                imageUrl,
                settings
            }
        }

        return this.Request('post', `${this.baseURL['shop']}/v1/shop-items`, payload, 'application/json', 'json', true)
    }
    
    ShopItemEdit(shop_item_data)
    {
        const { 
            id, 
            productId,
            type,
            name,
            content,
            price,
            imageUrl,
            settings
        } = shop_item_data

        const payload = {
            data: {
                productId,
                type,
                name,
                content,
                price,
                imageUrl,
                settings
            }
        }

        return this.Request('put', `${this.baseURL['shop']}/v1/shop-items/${id}`, payload)
    }

    ShopItemDelete(shop_item_data)
    {
        const { id } = shop_item_data
        return this.Request('delete', `${this.baseURL['shop']}/v1/shop-items/${id}`)
    }

    ShopItemRestore(shop_item_data)
    {
        const { id } = shop_item_data
        return this.Request('post', `${this.baseURL['shop']}/v1/shop-items/${id}:undelete`)
    }


    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- REMOTE CONFIGURATION --------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    EndPointLoad()
    {
        return this.Request('get', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/environments:getEndpoints?env=${env.REACT_APP_ENV}`)
    }

    EnvironmentsLoad()
    {
        return this.Request('get', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/environments`)
    }

    EnvironmentAdd(environment_data)
    {
        const { service, endpoint, api, cms, internal } = environment_data

        const payload = {
            data: {
                env: environment_data.env,
                service,
                endpoint: endpoint ? endpoint : {api, cms, internal},
            }
        }

        return this.Request('post', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/environments`, payload, 'application/json', 'json', true)
    }

    EnvironmentEdit(environment_data, manual = false)
    {
        const { id, service, endpoint, api, cms, internal } = environment_data

        const payload = {
            data: {
                env: environment_data.env,
                service,
                endpoint: endpoint ? endpoint : {api, cms, internal},
            }
        }

        return this.Request('put', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/environments/${manual ? id : ''}`, payload)
    }

    EnvironmentDelete(environment_data)
    {
        const { id } = environment_data
        return this.Request('delete', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/environments/${id}`)
    }

    EnvironmentRestore(environment_data)
    {
        const { id } = environment_data
        return this.Request('post', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/environments/${id}:undelete`)
    }

    ClientsLoad()
    {
        return this.Request('get', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/clients`)
    }

    VersionsLoad()
    {
        return this.Request('get', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/versions`)
    }

    VersionAdd(version_data)
    {
        const { version, client, goLive } = version_data

        const payload = {
            data: {
                version,
                client,
                env: version_data.env,
                goLive
            }
        }

        return this.Request('post', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/versions`, payload, 'application/json', 'json', true)
    }

    VersionEdit(version_data)
    {
        const { id, goLive } = version_data

        const payload = {
            data: {
                env: version_data.env,
                goLive
            }
        }

        return this.Request('put', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/versions/${id}`, payload)
    }

    VersionDelete(version_data)
    {
        const { id } = version_data
        return this.Request('delete', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/versions/${id}`)
    }

    VersionRestore(version_data)
    {
        const { id } = version_data
        return this.Request('post', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/versions/${id}:undelete`)
    }

    VersionSetLive(version_data)
    {
        const { id } = version_data
        return this.Request('post', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/versions/${id}:setLive`)
    }

    DetailsLoad(version_data)
    {
        const { versionId } = version_data
        return this.Request('get', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/versions/${versionId}:details`)
    }

    ConfigsLoad(version_data)
    {
        return this.Request('get', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/versions/${version_data.versionId || ''}/configs/?env=${version_data.env || ''}`)
    }

    ConfigAdd(config_data)
    {
        const { versionId, key, value, allowedCountries, deniedCountries } = config_data

        const payload = {
            data: {
                versionId,
                env: config_data.env,
                key,
                value,
                allowedCountries,
                deniedCountries,
            }
        }

        return this.Request('post', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/configs`, payload, 'application/json', 'json', true)
    }

    ConfigEdit(config_data)
    {
        const { id, value, allowedCountries, deniedCountries } = config_data

        const payload = {
            data: {
                value,
                allowedCountries,
                deniedCountries,
            }
        }

        return this.Request('put', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/configs/${id}`, payload)
    }

    ConfigDelete(config_data)
    {
        const { id } = config_data
        return this.Request('delete', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/configs/${id}`)
    }

    ConfigRestore(config_data)
    {
        const { id } = config_data
        return this.Request('post', `${env.REACT_APP_REMOTE_CONFIG_URL}/v1/configs/${id}:undelete`)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- SEASON --------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    SeasonsLoad()
    {
        return this.Request('get', `${this.baseURL['season']}/v1/seasons`)
    }

    SeasonAdd(season_data)
    {
        const { name, goLive, freezeDate, expectedEndDate, configs } = season_data

        const payload = {
            data: {
                name,
                goLive,
                freezeDate: goLive ? freezeDate : 0,
                expectedEndDate: goLive ? expectedEndDate : 0,
                configs
            }
        }

        return this.Request('post', `${this.baseURL['season']}/v1/seasons`, payload, 'application/json', 'json', true)
    }

    SeasonEdit(season_data)
    {
        const { id, status, freezeDate, expectedEndDate, configs } = season_data

        const payload = {
            data: {
                status,
                freezeDate: status === 'Active' ? freezeDate : 0,
                expectedEndDate: status === 'Active' ? expectedEndDate : 0,
                configs
            }
        }

        return this.Request('put', `${this.baseURL['season']}/v1/seasons/${id}`, payload)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- LEADERBOARD -----------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    LeaderboardsLoad()
    {
        return this.Request('get', `${this.baseURL['leaderboard']}/v1/leaderboards`)
    }

    LeaderboardsAdd(leaderboards_data)
    {
        let { 
            name,
            status,
            type,
            description,
            time,
            seasonName,
            autoExport,
            crossSeason,
            freezable,
            configs
        } = leaderboards_data

        crossSeason = type === 'Seasonal' ? false : crossSeason
        freezable = type === 'Seasonal' ? freezable : false

        const payload = {
            data: {
                name,
                status,
                type,
                description,
                time,
                seasonName: crossSeason ? '' : seasonName,
                autoExport,
                crossSeason,
                freezable,
                configs
            }
        }
        return this.Request('post', `${this.baseURL['leaderboard']}/v1/leaderboards`, payload, 'application/json', 'json', true)
    }

    LeaderboardsEdit(leaderboards_data)
    {
        let { 
            id,
            status,
            type,
            description,
            time,
            seasonName,
            autoExport,
            crossSeason,
            freezable,
            configs
        } = leaderboards_data

        crossSeason = type === 'Seasonal' ? false : crossSeason
        freezable = type === 'Seasonal' ? freezable : false

        const payload = {
            data: {
                status,
                type,
                description,
                time,
                seasonName: crossSeason ? '' : seasonName,
                autoExport,
                crossSeason,
                freezable,
                configs
            }
        }

        return this.Request('put', `${this.baseURL['leaderboard']}/v1/leaderboards/${id}`, payload, 'application/json', 'json', true)
    }

    LeaderboardsDelete(leaderboards_data)
    {
        const { id } = leaderboards_data
        return this.Request('delete', `${this.baseURL['leaderboard']}/v1/leaderboards/${id}`)
    }

    LeaderboardsRestore(leaderboards_data)
    {
        const { id } = leaderboards_data
        return this.Request('post', `${this.baseURL['leaderboard']}/v1/leaderboards/${id}:undelete`)
    }

    LeaderboardScoreLoad(leaderboards_data)
    {
        const { leaderboard_id, userId, page, pageSize } = leaderboards_data
        return this.Request('get', `${this.baseURL['leaderboard']}/v1/leaderboards/${leaderboard_id}/scores/?userId=${userId}&page=${page}&pageSize=${pageSize}`)
    }

    LeaderboardScoreRecover(leaderboard_id)
    {
        return this.Request('post', `${this.baseURL['leaderboard']}/v1/leaderboards/${leaderboard_id}/scores`)
    }

    LeaderboardScoreEdit(leaderboard_score_data)
    {
        const {
            id,
            score
        } = leaderboard_score_data

        const payload = {
            data: {
                score: +score
            }
        }
        return this.Request('put', `${this.baseURL['leaderboard']}/v1/scores/${id}`,payload)
    }

    LeaderboardScoreDelete(leaderboard_score_data)
    {
        const { id } = leaderboard_score_data
        return this.Request('post', `${this.baseURL['leaderboard']}/v1/scores/${id}:hide`)
    }

    LeaderboardScoreRestore(leaderboard_score_data)
    {
        const { id } = leaderboard_score_data
        return this.Request('post', `${this.baseURL['leaderboard']}/v1/scores/${id}:unhide`)
    }

    LeaderboardSettingLoad(leaderboard_id)
    {
        return this.Request('get', `${this.baseURL['leaderboard']}/v1/leaderboards/${leaderboard_id}/settings`)
    }

    LeaderboardSettingAdd(leaderboard_setting_data)
    {

        const { 
            leaderboard_id,
            key,
            value
        } = leaderboard_setting_data

        const payload = {
            data: {
                key,
                value
            }
        }

        return this.Request('post',`${this.baseURL['leaderboard']}/v1/leaderboards/${leaderboard_id}/settings`, payload, 'application/json', 'json', true)
    }

    LeaderboardSettingEdit(leaderboard_setting_data)
    {
        const {
            id,
            value
        } = leaderboard_setting_data

        const payload = {
            data: {
                value
            }
        }
        return this.Request('put', `${this.baseURL['leaderboard']}/v1/settings/${id}`,payload)
    }

    LeaderboardSettingDelete(leaderboard_setting_data)
    {
        const { id } = leaderboard_setting_data
        return this.Request('delete', `${this.baseURL['leaderboard']}/v1/settings/${id}`)
    }

    LeaderboardSettingRestore(leaderboard_setting_data)
    {
        const { id } = leaderboard_setting_data
        return this.Request('post', `${this.baseURL['leaderboard']}/v1/settings/${id}:undelete`)
    }

    LeaderboardDetailLoad(leaderboards_data)
    {
        const {id} = leaderboards_data
        return this.Request('get', `${this.baseURL['leaderboard']}/v1/leaderboards/${id}`, {}, 'application/json', 'arraybuffer')
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- PLAYER CARD -----------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    PlayerCardsLoad()
    {
        return this.Request('get', `${this.baseURL['player-card']}/v1/player-cards`)
    }

    PlayerCardAdd(player_card_data)
    {
        const { name, rarity, description, basePower, baseAttack, basePassing, baseDefense, baseValue, traits, nationality, currentTeam, imageFileName, file } = player_card_data

        let formData = new FormData()
        
        formData.append('name', name)
        formData.append('rarity', rarity)
        formData.append('description', description)
        formData.append('basePower', basePower)
        formData.append('baseAttack', baseAttack)
        formData.append('basePassing', basePassing)
        formData.append('baseDefense', baseDefense)
        formData.append('baseValue', baseValue)
        formData.append('traits', JSON.stringify(traits))
        formData.append('class', player_card_data.class)
        formData.append('nationality', nationality)
        formData.append('currentTeam', currentTeam)
        formData.append('imageFileName', imageFileName)
        if (file && file[0])
        {
            formData.append('image', file[0])
        }

        const payload = {
            data: formData
        }

        return this.Request('post', `${this.baseURL['player-card']}/v1/player-cards`, payload, 'multipart/form-data', 'json', true)
    }

    PlayerCardEdit(player_card_data)
    {
        const { id, name, rarity, description, basePower, baseAttack, basePassing, baseDefense, baseValue, traits, nationality, currentTeam, imageFileName, file } = player_card_data

        let formData = new FormData()
        
        formData.append('name', name)
        formData.append('rarity', rarity)
        formData.append('description', description)
        formData.append('basePower', basePower)
        formData.append('baseAttack', baseAttack)
        formData.append('basePassing', basePassing)
        formData.append('baseDefense', baseDefense)
        formData.append('baseValue', baseValue)
        formData.append('traits', JSON.stringify(traits))
        formData.append('class', player_card_data.class)
        formData.append('nationality', nationality)
        formData.append('currentTeam', currentTeam)
        formData.append('imageFileName', imageFileName)
        if (file && file[0])
        {
            formData.append('image', file[0])
        }

        const payload = {
            data: formData
        }

        return this.Request('put', `${this.baseURL['player-card']}/v1/player-cards/${id}`, payload, 'multipart/form-data', 'json', true)
    }

    PlayerCardDelete(player_card_data)
    {
        const { id } = player_card_data
        return this.Request('delete', `${this.baseURL['player-card']}/v1/player-cards/${id}`)
    }

    PlayerCardRestore(player_card_data)
    {
        const { id } = player_card_data
        return this.Request('post', `${this.baseURL['player-card']}/v1/player-cards/${id}:undelete`)
    }

    PlayerCardPackagesLoad()
    {
        return this.Request('get', `${this.baseURL['player-card']}/v1/packages`)
    }

    PlayerCardPackageAdd(package_data)
    {
        const { name, playerCardIds, priority } = package_data

        const payload = {
            data: {
                name,
                playerCardIds,
                priority
            }
        }

        return this.Request('post', `${this.baseURL['player-card']}/v1/packages`, payload, 'application/json', 'json', true)
    }

    PlayerCardPackageEdit(package_data)
    {
        const { id, name, playerCardIds, priority } = package_data

        const payload = {
            data: {
                name,
                playerCardIds,
                priority
            }
        }

        return this.Request('put', `${this.baseURL['player-card']}/v1/packages/${id}`, payload)
    }

    PlayerCardPackageDelete(package_data)
    {
        const { id } = package_data
        return this.Request('delete', `${this.baseURL['player-card']}/v1/packages/${id}`)
    }

    PlayerCardPackageRestore(package_data)
    {
        const { id } = package_data
        return this.Request('post', `${this.baseURL['player-card']}/v1/packages/${id}:undelete`)
    }

    PlayerCardSettingsLoad()
    {
        return this.Request('get', `${this.baseURL['player-card']}/v1/settings`)
    }

    PlayerCardSettingAdd(setting_data)
    {
        const { type, paramName, level, value } = setting_data

        const payload = {
            data: {
                type,
                paramName,
                level,
                value
            }
        }

        return this.Request('post', `${this.baseURL['player-card']}/v1/settings`, payload, 'application/json', 'json', true)
    }

    PlayerCardSettingEdit(setting_data)
    {
        const { id, value } = setting_data

        const payload = {
            data: {
                value
            }
        }

        return this.Request('put', `${this.baseURL['player-card']}/v1/settings/${id}`, payload)
    }

    PlayerCardSettingDelete(setting_data)
    {
        const { id } = setting_data
        return this.Request('delete', `${this.baseURL['player-card']}/v1/settings/${id}`)
    }

    PlayerCardSettingRestore(setting_data)
    {
        const { id } = setting_data
        return this.Request('post', `${this.baseURL['player-card']}/v1/settings/${id}:undelete`)
    }

    PlayerCardParametersLoad()
    {
        return this.Request('get', `${this.baseURL['player-card']}/v1/setting-params`)
    }

    PlayerCardParameterAdd(parameter_data)
    {
        const { type, paramName, description } = parameter_data

        const payload = {
            data: {
                type,
                paramName,
                description
            }
        }

        return this.Request('post', `${this.baseURL['player-card']}/v1/setting-params`, payload, 'application/json', 'json', true)
    }

    PlayerCardParameterEdit(parameter_data)
    {
        const { id, description } = parameter_data

        const payload = {
            data: {
                description
            }
        }

        return this.Request('put', `${this.baseURL['player-card']}/v1/setting-params/${id}`, payload)
    }

    PlayerCardParameterDelete(parameter_data)
    {
        const { id } = parameter_data
        return this.Request('delete', `${this.baseURL['player-card']}/v1/setting-params/${id}`)
    }

    PlayerCardParameterRestore(parameter_data)
    {
        const { id } = parameter_data
        return this.Request('post', `${this.baseURL['player-card']}/v1/setting-params/${id}:undelete`)
    }

    PlayerCardFormationsLoad()
    {
        return this.Request('get', `${this.baseURL['player-card']}/v1/formations`)
    }

    PlayerCardFormationAdd(formation_data)
    {
        const { name, formationString, unitString, linkString } = formation_data

        const payload = {
            data: {
                name,
                formationString,
                unitString,
                linkString
            }
        }

        return this.Request('post', `${this.baseURL['player-card']}/v1/formations`, payload, 'application/json', 'json', true)
    }

    PlayerCardFormationEdit(formation_data)
    {
        const { id, name, formationString, unitString, linkString } = formation_data

        const payload = {
            data: {
                name,
                formationString,
                unitString,
                linkString
            }
        }

        return this.Request('put', `${this.baseURL['player-card']}/v1/formations/${id}`, payload)
    }

    PlayerCardFormationDelete(formation_data)
    {
        const { id } = formation_data
        return this.Request('delete', `${this.baseURL['player-card']}/v1/formations/${id}`)
    }

    PlayerCardFormationRestore(formation_data)
    {
        const { id } = formation_data
        return this.Request('post', `${this.baseURL['player-card']}/v1/formations/${id}:undelete`)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- QUIZ ----------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    
    TypesLoad()
    {
        return this.Request('get', `${this.baseURL['quiz']}/v1/types`)
    }

    TypesAdd(types_data)
    {
        const {
            name,
            status,
            answerType,
            maxAnswers
        } = types_data;

        const payload = {
            data: {
                name,
                status,
                answerType,
                maxAnswers: +maxAnswers
            }
        }
        return this.Request('post', `${this.baseURL['quiz']}/v1/types`, payload, 'application/json', 'json', true)
    }

    TypesEdit(types_data)
    {
        const {
            id,
            status,
            answerType,
            maxAnswers
        } = types_data;

        const payload = {
            data: {
                status,
                answerType,
                maxAnswers: +maxAnswers
            }
        }
        return this.Request('put', `${this.baseURL['quiz']}/v1/types/${id}`, payload)
    }

    TypesDelete(types_data)
    {
        const { id } = types_data
        return this.Request('delete', `${this.baseURL['quiz']}/v1/types/${id}`)
    }

    TypesRestore(types_data)
    {
        const { id } = types_data
        return this.Request('post', `${this.baseURL['quiz']}/v1/types/${id}:undelete`)
    }

    ThemesLoad()
    {
        return this.Request('get', `${this.baseURL['quiz']}/v1/themes`)
    }

    ThemesAdd(themes_data)
    {
        const {
            name,
            description,
            status,
            language,
            order,
        } = themes_data;

        const payload = {
            data: {
                name,
                description,
                status,
                language,
                order
            }
        }
        return this.Request('post', `${this.baseURL['quiz']}/v1/themes`, payload, 'application/json', 'json', true)
    }

    ThemesEdit(themes_data, manual = false)
    {
        const {
            id,
            language,
            name,
            description,
            status,
            order
        } = themes_data;

        const payload = {
            data: {
                name,
                language,
                description,
                status,
                order
            }
        }
        return this.Request('put', `${this.baseURL['quiz']}/v1/themes/${manual ? id : ''}`, payload)
    }

    ThemesDelete(themes_data)
    {
        const { id } = themes_data
        return this.Request('delete', `${this.baseURL['quiz']}/v1/themes/${id}`)
    }

    ThemesRestore(themes_data)
    {
        const { id } = themes_data
        return this.Request('post', `${this.baseURL['quiz']}/v1/themes/${id}:undelete`)
    }

    QuizzesLoad(quiz_data)
    {
        const { theme_id, question, type, status, deletedAt, page, pageSize } = quiz_data
        return this.Request('get', `${this.baseURL['quiz']}/v1/themes/${theme_id}/quizzes/?question=${question}&type=${type}&status=${status}&ignoreDeleted=${deletedAt}&page=${page}&pageSize=${pageSize}`)
    }

    QuizzesAdd(quiz_data)
    {

        const { 
            theme_id,
            question,
            type,
            status,
            answers,
            correctAnswer
        } = quiz_data

        const payload = {
            data: {
                question,
                type,
                status,
                answers,
                correctAnswer:+correctAnswer
            }
        }

        return this.Request('post',`${this.baseURL['quiz']}/v1/themes/${theme_id}/quizzes`, payload, 'application/json', 'json', true)
    }

    QuizzesEdit(quiz_data)
    {
        const {
            id,
            question,
            type,
            status,
            answers,
            correctAnswer
        } = quiz_data

        const payload = {
            data: {
                question,
                type,
                status,
                answers,
                correctAnswer:+correctAnswer
            }
        }
        return this.Request('put',`${this.baseURL['quiz']}/v1/quizzes/${id}`, payload, 'application/json', 'json', true)
    }

    QuizzesDelete(quiz_data)
    {
        const { id } = quiz_data
        return this.Request('delete',`${this.baseURL['quiz']}/v1/quizzes/${id}`)
    }

    QuizzesRestore(quiz_data)
    {
        const { id } = quiz_data
        return this.Request('post',`${this.baseURL['quiz']}/v1/quizzes/${id}:undelete`)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- QUEST SYSTEM ----------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    QuestItemsLoad()
    {
        return this.Request('get', `${this.baseURL['quest']}/v1/items`)
    }

    QuestItemAdd(item_data)
    {
        const { time, code, status, type, difficulty, name, amount, configs, requirement, pickingCondition, userLevel, entertainmentLevel, preconditions ,title, description } = item_data
     
        const payload = {
            data: { 
                code, 
                status,
                type, 
                difficulty, 
                requirement: requirement ? requirement : {name, amount}, 
                pickingCondition: pickingCondition ? pickingCondition : {userLevel: (userLevel === '' ? null : userLevel), entertainmentLevel: (entertainmentLevel === '' ? null : entertainmentLevel), preconditions:(preconditions.length === 0  ? null : preconditions)},
                configs,
                title,
                description,
                time: type === 'Event' ? { startDate: time.ms_begin_utc, endDate: time.ms_end_utc } : null
            }
        }
        
        
        return this.Request('post', `${this.baseURL['quest']}/v1/items`, payload, 'application/json', 'json', true)
    }

    QuestItemEdit(item_data, manual = false)
    {
        const { time, id, code, status, type, difficulty, name, amount, configs, requirement, pickingCondition, userLevel, entertainmentLevel, preconditions,title, description } = item_data

        const payload = {
            data: { 
                code,
                status,
                type, 
                difficulty, 
                requirement: requirement ? requirement : {name, amount},
                pickingCondition: pickingCondition ? pickingCondition : {userLevel: (userLevel === '' ? null : userLevel), entertainmentLevel: (entertainmentLevel === '' ? null : entertainmentLevel),preconditions:(preconditions.length === 0 ? null : preconditions)},
                configs,
                title,
                description,
                time: type === 'Event' ? { startDate: time.ms_begin_utc, endDate: time.ms_end_utc } : null
            }
        }

        return this.Request('put', `${this.baseURL['quest']}/v1/items/${manual ? id : ''}`, payload)
    }

    QuestItemDelete(item_data)
    {
        const { id } = item_data
        return this.Request('delete', `${this.baseURL['quest']}/v1/items/${id}`)
    }

    QuestItemRestore(item_data)
    {
        const { id } = item_data
        return this.Request('post', `${this.baseURL['quest']}/v1/items/${id}:undelete`)
    }

    QuestConfigLoad()
    {
        return this.Request('get', `${this.baseURL['quest']}/v1/configs`)
    }

    QuestConfigAdd(config_data)
    {
        const { 
            status,
            level, 
            quantityConfig, 
            tierOperator,
            easy,
            medium,
            hard,
            divider_1,
            multiplier_1,
            divider_2,
            multiplier_2,
            divider_3,
            multiplier_3
        } = config_data

        const payload = {
            data: {
                status,
                level,
                quantityConfig: quantityConfig ? quantityConfig : {easy, medium, hard},
                tierOperator: tierOperator ? tierOperator : {
                    tier1: {divider: divider_1, multiplier: multiplier_1},
                    tier2: {divider: divider_2, multiplier: multiplier_2},
                    tier3: {divider: divider_3, multiplier: multiplier_3}
                }
            }
        }

        return this.Request('post', `${this.baseURL['quest']}/v1/configs`, payload, 'application/json', 'json', true)
    }

    QuestConfigEdit(config_data, manual = false)
    {
        const { 
            id,
            status,
            level, 
            quantityConfig, 
            tierOperator,
            easy,
            medium,
            hard,
            divider_1,
            multiplier_1,
            divider_2,
            multiplier_2,
            divider_3,
            multiplier_3
        } = config_data

        const payload = {
            data: {
                status,
                level,
                quantityConfig: quantityConfig ? quantityConfig : {easy, medium, hard},
                tierOperator: tierOperator ? tierOperator : {
                    tier1: {divider: divider_1, multiplier: multiplier_1},
                    tier2: {divider: divider_2, multiplier: multiplier_2},
                    tier3: {divider: divider_3, multiplier: multiplier_3}
                }
            }
        }

        return this.Request('put', `${this.baseURL['quest']}/v1/configs/${manual ? id : ''}`, payload)
    }

    QuestConfigDelete(config_data)
    {
        const { id } = config_data
        return this.Request('delete', `${this.baseURL['quest']}/v1/configs/${id}`)
    }

    QuestConfigRestore(config_data)
    {
        const { id } = config_data
        return this.Request('post', `${this.baseURL['quest']}/v1/configs/${id}:undelete`)
    }

    QuestsLoad(profileId)
    {
        return this.Request('get', `${this.baseURL['quest']}/v1/profiles/${profileId}/quests`)
    }

    QuestLocalizationsLoadAll(item_data, data = [])
    {
        return this.Request('get', `${this.baseURL['quest']}/v1/localizations/?cursor=${item_data.cursor}&type=${item_data.type}`)
        .then(response => {
            if (_.isEmpty(response.cursor))
            {
                return data
            }
            else if (response.cursor === 'null')
            {
                data = [...data, ...response.items]
                return data
            }

            data = [...data, ...response.items]
            return this.QuestLocalizationsLoadAll({ cursor: response.cursor, type: item_data.type }, data)
        })
    }

    QuestLocalizationsLoad(item_data)
    {
        const { id } = item_data
        return this.Request('get', `${this.baseURL['quest']}/v1/items/${id}/localizations`)
    }

    QuestLocalizationAdd(item_data)
    {
        const { itemId, lang, title, description } = item_data
     
        const payload = {
            data: { 
                lang,
                title,
                description
            }
        }
        
        return this.Request('post', `${this.baseURL['quest']}/v1/items/${itemId}/localizations`, payload, 'application/json', 'json', true)
    }

    QuestLocalizationEdit(item_data, manual = false)
    {
        const { itemCode, id, lang, title, description } = item_data
        const query = `?itemCode=${itemCode}`

        const payload = {
            data: {
                lang, 
                title,
                description
            }
        }

        return this.Request('put', `${this.baseURL['quest']}/v1/localizations/${manual ? id : query}`, payload)
    }

    QuestLocalizationDelete(item_data)
    {
        const { id } = item_data
        return this.Request('delete', `${this.baseURL['quest']}/v1/localizations/${id}`)
    }

    QuestLocalizationRestore(item_data)
    {
        const { id } = item_data
        return this.Request('post', `${this.baseURL['quest']}/v1/localizations/${id}:undelete`)
    }

    QuestRequirementsLoad()
    {
        return this.Request('get', `${this.baseURL['quest']}/v1/requirements`)
    }

    QuestRequirementAdd(requirement_data)
    {
        const { name, type, description } = requirement_data
     
        const payload = {
            data: { 
                name,
                type,
                description
            }
        }
        
        return this.Request('post', `${this.baseURL['quest']}/v1/requirements`, payload, 'application/json', 'json', true)
    }

    QuestRequirementEdit(requirement_data, manual = false)
    {
        const { id, name, type, description } = requirement_data

        const payload = {
            data: { 
                name,
                type,
                description
            }
        }

        return this.Request('put', `${this.baseURL['quest']}/v1/requirements/${manual ? id : ''}`, payload)
    }

    QuestRequirementDelete(requirement_data)
    {
        const { id } = requirement_data
        return this.Request('delete', `${this.baseURL['quest']}/v1/requirements/${id}`)
    }

    QuestRequirementRestore(requirement_data)
    {
        const { id } = requirement_data
        return this.Request('post', `${this.baseURL['quest']}/v1/requirements/${id}:undelete`)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- PROFILE ---------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    ProfileUserXPConfigsLoad()
    {
        return this.Request('get', `${this.baseURL['profile']}/v1/user-xp-configs`)
    }

    ProfileUserXPConfigsAdd(profile_data)
    {
        const { level, userXp, coin, gem } = profile_data

        const payload = {
            data: {
                level,
                userXp,
                coin,
                gem
            }
        }

        return this.Request('post', `${this.baseURL['profile']}/v1/user-xp-configs`, payload, 'application/json', 'json', true)
    }
    
    ProfileUserXPConfigsEdit(profile_data)
    {
        const { id, userXp, coin, gem } = profile_data

        const payload = {
            data: {
                userXp,
                coin,
                gem
            }
        }

        
        return this.Request('put', `${this.baseURL['profile']}/v1/user-xp-configs/${id}`, payload)
    }

    ProfileUserXPConfigsDelete(profile_data)
    {
        const { id } = profile_data
        return this.Request('delete', `${this.baseURL['profile']}/v1/user-xp-configs/${id}`)
    }

    ProfileUserXPConfigsRestore(profile_data)
    {
        const { id } = profile_data
        return this.Request('post', `${this.baseURL['profile']}/v1/user-xp-configs/${id}:undelete`)
    }

    ProfilesLoad(profile_data)
    {
        const { id, userId, email, search } = profile_data
        return this.Request('get', `${this.baseURL['profile']}/v1/profile-management/?id=${id}&userId=${userId}&email=${email}&search=${search.toLowerCase()}`)
    }

    ProfilesHistoryLoad(profile_data)
    {
        const { userId, email } = profile_data
        return this.Request('get', `${this.baseURL['profile']}/v1/profile-management:getHistory/?userId=${userId}&email=${email}`)
    }

    ProfileEdit(profile_data)
    {
        const { id, action } = profile_data
        return this.Request('put', `${this.baseURL['profile']}/v1/profile-management/${id}:${action}`)
    }

    ProfileBadWordsLoad()
    {
        return this.Request('get', `${this.baseURL['profile']}/v1/profanity`)
    }

    ProfileBadWordAdd(profile_data)
    {
        const { file } = profile_data
        let formData = new FormData()

        formData.append('file', file[0])

        const payload = {
            data: formData
        }

        return this.Request('post', `${this.baseURL['profile']}/v1/profanity:upload`, payload, 'multipart/form-data', 'json', true)
    }

    ProfileBadWordGet(profile_data)
    {
        const { version } = profile_data
        return this.Request('post', `${this.baseURL['profile']}/v1/profanity/${version}:download`, {}, 'application/json', 'arraybuffer')
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- CAMPAIGN MANAGEMENT -------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
   
    CampaignsLoad()
    {
        return this.Request('get', `${this.baseURL['campaign']}/v1/campaigns`)
    }

    CampaignsAdd(campaign_data)
    {
        const {
            code,
            name,
            description,
            type,
            country,
            platform,
            version,
            gender,
            specific_user,
            priority,
            start_hour,
            end_hour,
            start_date,
            end_date,
            custom_condition,
            online_param,
            status
        } = campaign_data

        const payload = {
            data: {
                code,
                name,
                description,
                type,
                country,
                platform,
                version,
                gender,
                specific_user,
                priority,
                start_hour,
                end_hour,
                start_date,
                end_date,
                custom_condition,
                online_param,
                status
            }
        }
        return this.Request('post', `${this.baseURL['campaign']}/v1/campaigns`, payload, 'application/json', 'json', true)
    }

    CampaignsEdit(campaign_data)
    {
        const {
            id,
            code,
            name,
            description,
            type,
            country,
            platform,
            version,
            gender,
            specific_user,
            priority,
            start_hour,
            end_hour,
            start_date,
            end_date,
            custom_condition,
            online_param,
            status
        } = campaign_data
        
        const payload = {
            data: {
                code,
                name,
                description,
                type,
                country,
                platform,
                version,
                gender,
                specific_user,
                priority,
                start_hour,
                end_hour,
                start_date,
                end_date,
                custom_condition,
                online_param,
                status
            }
        }
        return this.Request('put', `${this.baseURL['campaign']}/v1/campaigns/${id}`, payload, 'application/json', 'json', true)
    }

    CampaignsDelete(campaign_data)
    {
        const { id } = campaign_data
        return this.Request('delete', `${this.baseURL['campaign']}/v1/campaigns/${id}`)
    }

    CampaignsRestore(campaign_data)
    {
        const { id } = campaign_data
        return this.Request('post', `${this.baseURL['campaign']}/v1/campaigns/${id}:undelete`)
    }

    CampaignsContentLoad(id)
    {
        return this.Request('get', `${this.baseURL['campaign']}/v1/campaigns/${id}/contents`)
    }

    CampaignsContentAdd(campaign_content_data)
    {
        const {
            campaign_id,
            pointcuts,
            app_code,
            app_name,
            app_version,
            app_url,
            config,
            status
        } = campaign_content_data

        const payload = {
            data: {
                campaign_id,
                pointcuts,
                app_code,
                app_name,
                app_version,
                app_url,
                config,
                status
            }
        }
        return this.Request('post', `${this.baseURL['campaign']}/v1/contents`, payload, 'application/json', 'json', true)
    }

    CampaignsContentEdit(campaign_content_data)
    {
        const {
            id,
           pointcuts,
           app_code,
           app_name,
           app_version,
           app_url,
           config,
           status
        } = campaign_content_data
        
        const payload = {
            data: {
                pointcuts,
                app_code,
                app_name,
                app_version,
                app_url,
                config,
                status
            }
        }
        return this.Request('put', `${this.baseURL['campaign']}/v1/contents/${id}`, payload, 'application/json', 'json', true)
    }

    CampaignsContentDelete(campaign_content_data)
    {
        const { id } = campaign_content_data
        return this.Request('delete', `${this.baseURL['campaign']}/v1/contents/${id}`)
    }

    CampaignsContentRestore(campaign_content_data)
    {
        const { id } = campaign_content_data
        return this.Request('post', `${this.baseURL['campaign']}/v1/contents/${id}:undelete`)
    }

    CampaignsPointcutsLoad()
    {
        return this.Request('get', `${this.baseURL['campaign']}/v1/pointcuts`)
    }

    CampaignsPointcutsAdd(campaign_pointcuts_data)
    {
        const {
            name,
            description
        } = campaign_pointcuts_data

        const payload = {
            data: {
                name,
                description
            }
        }
        return this.Request('post', `${this.baseURL['campaign']}/v1/pointcuts`, payload, 'application/json', 'json', true)
    }

    CampaignsPointcutsEdit(campaign_pointcuts_data)
    {
        const {
            id,
            name,
            description
        } = campaign_pointcuts_data
        
        const payload = {
            data: {
                name,
                description
            }
        }
        return this.Request('put', `${this.baseURL['campaign']}/v1/pointcuts/${id}`, payload, 'application/json', 'json', true)
    }

    CampaignsPointcutsDelete(campaign_pointcuts_data)
    {
        const { id } = campaign_pointcuts_data
        return this.Request('delete', `${this.baseURL['campaign']}/v1/pointcuts/${id}`)
    }

    CampaignsPointcutsRestore(campaign_pointcuts_data)
    {
        const { id } = campaign_pointcuts_data
        return this.Request('post', `${this.baseURL['campaign']}/v1/pointcuts/${id}:undelete`)
    }


    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- SPA -------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    SPAPackagesLoad()
    {
        return this.Request('get', `${this.baseURL['spa']}/v1/spa-packages`)
    }

    SPAPackageAdd(spa_data)
    {
        const { name, source } = spa_data
        let formData = new FormData()

        formData.append('spaName', name)
        formData.append('source', source[0])

        const payload = {
            data: formData
        }

        return this.Request('post', `${this.baseURL['spa']}/v1/spa-packages`, payload, 'multipart/form-data', 'json', true)
    }

    SPAPackageVersionAdd(spa_data)
    {
        const { id, source } = spa_data
        let formData = new FormData()
        
        formData.append('id', id)
        formData.append('source', source[0])

        const payload = {
            data: formData
        }

        return this.Request('post', `${this.baseURL['spa']}/v1/spa-packages/version`, payload, 'multipart/form-data', 'json', true)
    }
    
    SPAPackageEdit(spa_data)
    {
        const { id, name } = spa_data

        const payload = {
            data: {
                spaName: name
            }
        }

        return this.Request('put', `${this.baseURL['spa']}/v1/spa-packages/${id}`, payload)
    }

    SPAPackagesDelete(spa_data)
    {
        const { id } = spa_data
        return this.Request('delete', `${this.baseURL['spa']}/v1/spa-packages/${id}`)
    }

    SPAPackagesContainerDelete()
    {
        return this.Request('delete', `${this.baseURL['spa']}/v1/spa-packages/container`)
    }

    SPAPackagesRestore(spa_data)
    {
        const { id } = spa_data
        return this.Request('post', `${this.baseURL['spa']}/v1/spa-packages/${id}:undelete`)
    }

    SPAPackageDetailsLoad(spa_data)
    {
        const { id } = spa_data
        return this.Request('get', `${this.baseURL['spa']}/v1/spa-packages/${id}`)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- INSTANT WIN -----------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    InstantWinSettingsLoad()
    {
        return this.Request('get', `${this.baseURL['instant-win']}/v1/settings`)
    }

    InstantWinSettingAdd(instant_win_data)
    {
        const { type, code, status, title, subtitle, description, image } = instant_win_data
        let formData = new FormData()
        
        formData.append('typeId', type.id)
        formData.append('code', code)
        formData.append('status', status)
        formData.append('title', title)
        formData.append('subtitle', subtitle)
        formData.append('description', description)
        formData.append('file', image[0])

        const payload = {
            data: formData
        }

        return this.Request('post', `${this.baseURL['instant-win']}/v1/settings`, payload, 'multipart/form-data', 'json', true)
    }
    
    InstantWinSettingEdit(instant_win_data)
    {
        const { id, type, status, title, subtitle, description, image } = instant_win_data
        let formData = new FormData()
        
        formData.append('typeId', type.id)
        formData.append('status', status)
        formData.append('title', title)
        formData.append('subtitle', subtitle)
        formData.append('description', description)
        if (image && image[0] instanceof File)
        {
            formData.append('file', image[0])
        }
        
        const payload = {
            data: formData
        }

        return this.Request('put', `${this.baseURL['instant-win']}/v1/settings/${id}`, payload, 'multipart/form-data', 'json', true)
    }

    InstantWinSettingDelete(instant_win_data)
    {
        const { id } = instant_win_data
        return this.Request('delete', `${this.baseURL['instant-win']}/v1/settings/${id}`)
    }

    InstantWinSettingRestore(instant_win_data)
    {
        const { id } = instant_win_data
        return this.Request('post', `${this.baseURL['instant-win']}/v1/settings/${id}:undelete`)
    }

    InstantWinTypesLoad()
    {
        return this.Request('get', `${this.baseURL['instant-win']}/v1/types`)
    }

    InstantWinTypeAdd(instant_win_data)
    {
        const { type } = instant_win_data

        const payload = {
            data: {
                type
            }
        }

        return this.Request('post', `${this.baseURL['instant-win']}/v1/types`, payload, 'application/json', 'json', true)
    }

    InstantWinTypeEdit(instant_win_data)
    {
        const { id, type } = instant_win_data

        const payload = {
            data: {
                type
            }
        }

        return this.Request('put', `${this.baseURL['instant-win']}/v1/types/${id}`, payload, 'application/json', 'json', true)
    }

    InstantWinTypeDelete(instant_win_data)
    {
        const { id } = instant_win_data
        return this.Request('delete', `${this.baseURL['instant-win']}/v1/types/${id}`)
    }

    InstantWinTypeRestore(instant_win_data)
    {
        const { id } = instant_win_data
        return this.Request('post', `${this.baseURL['instant-win']}/v1/types/${id}:undelete`)
    }

    InstantWinHistoriesLoad(instant_win_data)
    {
        const { userId, code, ms_begin_utc, ms_end_utc } = instant_win_data
        return this.Request('get', `${this.baseURL['instant-win']}/v1/histories/?userId=${userId}&code=${code}&fromDate=${ms_begin_utc}&toDate=${ms_end_utc}`)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- CRON ------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    CronsLoad()
    {
        return this.Request('get', `${this.baseURL['cron']}/v1/crons`)
    }

    CronAdd(cron_data)
    {
        const { name, method, status, api, cronTime, retryAttempt, farmHandler } = cron_data

        const payload = {
            data: {
                name,
                method,
                status,
                api,
                payload: cron_data.payload,
                cronTime,
                retryAttempt,
                farmHandler
            }
        }

        return this.Request('post', `${this.baseURL['cron']}/v1/crons`, payload, 'application/json', 'json', true)
    }
    
    CronEdit(cron_data)
    {
        const { id, method, status, api, cronTime, retryAttempt, farmHandler } = cron_data

        const payload = {
            data: {
                method,
                status,
                api,
                payload: cron_data.payload,
                cronTime,
                retryAttempt,
                farmHandler
            }
        }

        return this.Request('put', `${this.baseURL['cron']}/v1/crons/${id}`, payload)
    }

    CronDelete(cron_data)
    {
        const { id } = cron_data
        return this.Request('delete', `${this.baseURL['cron']}/v1/crons/${id}`)
    }

    CronRestore(cron_data)
    {
        const { id } = cron_data
        return this.Request('post', `${this.baseURL['cron']}/v1/crons/${id}:undelete`)
    }

    CronTrigger(cron_data)
    {
        const { id } = cron_data
        return this.Request('post', `${this.baseURL['cron']}/v1/crons/${id}:trigger`)
    }

    CronHistoriesLoad(cron_data)
    {
        const { cronId, ms_begin_utc, ms_end_utc } = cron_data
        return this.Request('get', `${this.baseURL['cron']}/v1/crons/${cronId}/histories/?startDate=${ms_begin_utc}&endDate=${ms_end_utc}`)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- CMS ACTIVITY LOGS -----------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    CmsActivityLogsLoad(activity_data)
    {
        const { email, serviceName, resource, action, data, message, page, pageSize, ms_begin_utc, ms_end_utc } = activity_data
        return this.Request('get', `${this.baseURL['cms-activity-log']}/v1/cms-activity-log/?email=${email}&serviceName=${serviceName}&resource=${resource}&action=${action}&data=${data}&message=${message}&page=${page}&pageSize=${pageSize}&fromDate=${ms_begin_utc}&toDate=${ms_end_utc}`)
    }

    CmsActivityLogDataLoad(activity_data)
    {
        const { id } = activity_data
        return this.Request('get', `${this.baseURL['cms-activity-log']}/v1/cms-activity-log/${id}`)
    }

    CmsActivityLogsExport(activity_data)
    {
        const { email, serviceName, resource, action, data, message, ms_begin_utc, ms_end_utc } = activity_data

        const payload = {
            data: {
                email,
                serviceName,
                resource,
                action,
                data,
                message,
                fromDate: ms_begin_utc,
                toDate: ms_end_utc
            }
        }

        return this.Request('post', `${this.baseURL['cms-activity-log']}/v1/resources:export`, payload, 'application/json', 'arraybuffer')
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- NOTIFICATION ----------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    NotificationsLoad(notification_data)
    {
        const { type, template, schedule, createdBy, page, pageSize } = notification_data
        return this.Request('get', `${this.baseURL['notification']}/v1/notifications/?type=${type}&template=${template}&schedule=${schedule}&createdBy=${createdBy}&page=${page}&pageSize=${pageSize}`)
    }

    NotificationsExport()
    {
        return this.Request('get', `${this.baseURL['notification']}/v1/notifications:export`)
    }

    NotificationAdd(notification_data)
    {
        const { type, template, schedule, startDate, dayGap, keepReminding, retentionDetail } = notification_data

        const payload = {
            data: {
                type,
                template,
                schedule,
                startDate: startDate,
                retentionDetail: !_.isEmpty(retentionDetail) ? retentionDetail : { dayGap, keepReminding }
            }
        }

        return this.Request('post', `${this.baseURL['notification']}/v1/notifications`, payload, 'application/json', 'json', true)
    }

    NotificationDelete(notification_data)
    {
        const { id } = notification_data
        return this.Request('delete', `${this.baseURL['notification']}/v1/notifications/${id}`)
    }

    NotificationSchedulesLoad()
    {
        return this.Request('get', `${this.baseURL['notification']}/v1/schedules`)
    }

    NotificationScheduleAdd(notification_data)
    {
        const { name, type, status, gapCount, selection, serverBased } = notification_data
        const configs = type === 'Instant' ? { serverBased } : (type === 'Weekly' ? { gapCount, selection, serverBased } : { gapCount, serverBased })
        const payload = {
            data: {
                name,
                type,
                status,
                configs
            }
        }

        return this.Request('post', `${this.baseURL['notification']}/v1/schedules`, payload, 'application/json', 'json', true)
    }

    NotificationScheduleEdit(notification_data, manual = false)
    {
        const { id, name, type, status, gapCount, selection, serverBased } = notification_data
        const configs = type === 'Instant' ? { serverBased } : (type === 'Weekly' ? { gapCount, selection, serverBased } : { gapCount, serverBased })
        const payload = {
            data: {
                name,
                type,
                status,
                configs
            }
        }

        return this.Request('put', `${this.baseURL['notification']}/v1/schedules/${manual ? id : ''}`, payload)
    }

    NotificationScheduleDelete(notification_data)
    {
        const { id } = notification_data
        return this.Request('delete', `${this.baseURL['notification']}/v1/schedules/${id}`)
    }

    NotificationScheduleRestore(notification_data)
    {
        const { id } = notification_data
        return this.Request('post', `${this.baseURL['notification']}/v1/schedules/${id}:undelete`)
    }

    NotificationTemplatesLoad()
    {
        return this.Request('get', `${this.baseURL['notification']}/v1/templates`)
    }

    NotificationTemplateAdd(notification_data, manual = false)
    {
        const { name, type, status, title, message, mediaURL, expiry, ios, android, userIds, attributes, fromExcel, file } = notification_data
        let formData = new FormData()

        formData.append('name', name)
        formData.append('type', type)
        formData.append('status', status)
        formData.append('title', title)
        formData.append('message', message)
        formData.append('mediaURL', mediaURL)
        formData.append('expiry', expiry)
        formData.append('devices', JSON.stringify({ ios, android }))
        formData.append('audience', JSON.stringify({ userIds, attributes }))

        if (manual)
        {
            if (fromExcel)
            {
                if (file && file[0])
                {
                    formData.append('file', file[0])
                }
            }
        }

        const payload = {
            data: formData
        }

        return this.Request('post', `${this.baseURL['notification']}/v1/templates`, payload, 'multipart/form-data', 'json', true)
    }

    NotificationTemplateEdit(notification_data, manual = false)
    {
        const { id, name, type, status, title, message, mediaURL, expiry, ios, android, userIds, attributes, fromExcel, file } = notification_data
        let payload = {}

        if (manual)
        {
            let formData = new FormData()

            formData.append('name', name)
            formData.append('type', type)
            formData.append('status', status)
            formData.append('title', title)
            formData.append('message', message)
            formData.append('mediaURL', mediaURL)
            formData.append('expiry', expiry)
            formData.append('devices', JSON.stringify({ ios, android }))
            formData.append('audience', JSON.stringify({ userIds, attributes }))

            if (fromExcel)
            {
                if (file && file[0])
                {
                    formData.append('file', file[0])
                }
            }

            payload = {
                data: formData
            }

            return this.Request('put', `${this.baseURL['notification']}/v1/templates/${id}`, payload, 'multipart/form-data', 'json', true)
        }
        else
        {
            payload = {
                data: {
                    name,
                    type,
                    status,
                    title, 
                    message,
                    mediaURL, 
                    expiry, 
                    devices: { ios, android }, 
                    audience: { userIds, attributes }
                }
            }
    
            return this.Request('put', `${this.baseURL['notification']}/v1/templates`, payload)
        }
    }

    NotificationTemplateDelete(notification_data)
    {
        const { id } = notification_data
        return this.Request('delete', `${this.baseURL['notification']}/v1/templates/${id}`)
    }

    NotificationTemplateRestore(notification_data)
    {
        const { id } = notification_data
        return this.Request('post', `${this.baseURL['notification']}/v1/templates/${id}:undelete`)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- USER ------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    UsersAuthenticationLoad(user_data)
    {
        const { id, phoneNumber, email, surname, username, page, pageSize } = user_data
        return this.Request('get', `${this.baseURL['user-authentication']}/v1/users/?id=${id}&surname=${surname}&username=${username}&phoneNumber=${encodeURIComponent(phoneNumber)}&email=${email}&page=${page}&pageSize=${pageSize}`)
    }

    UserAuthenticationDelete(user_data)
    {
        const { id } = user_data
        return this.Request('delete', `${this.baseURL['user-authentication']}/v1/users/${id}`)
    }

    UserAuthenticationEdit(user_data)
    {
        const { id, surname, username, email, phoneNumber } = user_data

        const payload = {
            data: {
                surname,
                username,
                email,
                phoneNumber, 
            }
        }

        return this.Request('put', `${this.baseURL['user-authentication']}/v1/users/${id}`, payload)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- ACTIVITY --------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    ActivitiesLoad(activity_data)
    {
        const { profileId, serviceName, type, metadata, data, page, pageSize, ms_begin_utc, ms_end_utc } = activity_data
        return this.Request('get', `${this.baseURL['activity']}/v1/activities/?profileId=${profileId}&serviceName=${serviceName}&type=${type}&metadata=${metadata}&data=${data}&page=${page}&pageSize=${pageSize}&fromDate=${ms_begin_utc}&toDate=${ms_end_utc}`)
    }

    ActivityLogsExport(activity_data)
    {
        const { profileId, serviceName, type, metadata, data, ms_begin_utc, ms_end_utc } = activity_data
        const payload = {
            data: {
                profileId,
                serviceName,
                type,
                metadata,
                data,
                data,
                fromDate: ms_begin_utc,
                toDate: ms_end_utc
            }
        }
    
        return this.Request('post', `${this.baseURL['activity']}/v1/resources:export`, payload, 'application/json', 'arraybuffer')
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- ESB -------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    ESBLoad(esb_data)
    {
        const { ms_begin_utc } = esb_data
        return this.Request('get', `${this.baseURL['esb']}/v1/esbs/?date=${ms_begin_utc}`)
    }

    ESBAdd(esb_data)
    {
        const { time, country, store, downloads, crashes, type, newVersion } = esb_data

        const payload = {
            data: {
                date: time.ms_begin_utc,
                country,
                store,
                downloads, 
                crashes,
                type, 
                newVersion
            }
        }

        return this.Request('post', `${this.baseURL['esb']}/v1/esbs`, payload, 'application/json', 'json', true)
    }

    ESBTrigger(esb_data)
    {
        const { time } = esb_data
        return this.Request('post', `${this.baseURL['esb']}/v1/esbs:trigger/?date=${time.ms_begin_utc}`, {}, 'application/json', 'json', true)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- DLC -------------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    DLCLoad(dlc_data)
    {
        const { dlcCode, platform, page, pageSize } = dlc_data
        return this.Request('get', `${this.baseURL['dlc']}/v1/assets/?dlcCode=${dlcCode}&platform=${platform}&page=${page}&pageSize=${pageSize}`)
    }

    DLCDetailsLoad(dlc_data)
    {
        const { dlcCode } = dlc_data
        return this.Request('get', `${this.baseURL['dlc']}/v1/assets/${dlcCode}`)
    }

    DLCAdd(dlc_data)
    {
        const { dlcCode, platform, file } = dlc_data
        let formData = new FormData()

        formData.append('dlcCode', dlcCode)
        formData.append('platform', platform)
        formData.append('file', file[0])

        const payload = {
            data: formData
        }

        return this.Request('post', `${this.baseURL['dlc']}/v1/assets`, payload, 'multipart/form-data', 'json', true)
    }

    DLCEdit(dlc_data)
    {
        const { id, platform, file } = dlc_data
        let formData = new FormData()

        formData.append('platform', platform)
        formData.append('file', file[0])

        const payload = {
            data: formData
        }

        return this.Request('put', `${this.baseURL['dlc']}/v1/assets/${id}`, payload, 'multipart/form-data', 'json', true)
    }

    DLCGetUrl(dlc_data)
    {
        const { dlcCode, version } = dlc_data
        return this.Request('get', `${this.baseURL['dlc']}/v1/assets/${dlcCode}/hostUrl/?version=${version}`)
    }

    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------
    //----- CONSENT ---------------------------------------------------------------------------------------------------------------------------------------------------------
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------------

    ConsentTrackingLoad(consent_data)
    {
        const { type, userId, data, page, pageSize, ms_begin_utc, ms_end_utc } = consent_data
        return this.Request('get', `${this.baseURL['consent']}/v1/consents/?userId=${userId}&type=${type}&data=${data}&page=${page}&pageSize=${pageSize}&fromDate=${ms_begin_utc}&toDate=${ms_end_utc}`)
    }
}

export default new API()