import axios from 'axios'
import * as _ from 'lodash'
import { getCountryName } from './String'
import * as Defines from '../Defines'
import { env } from '../env'

export const getUrl = (path) =>
{

    let PUBLIC_URL = `${env.PUBLIC_URL}`

    if (path.startsWith(`${PUBLIC_URL}/`))
    {
        path = path.slice(PUBLIC_URL.length + 1)
    }

    let finalPath = path.startsWith('/')
        ? `${PUBLIC_URL}${path}`
        : `${PUBLIC_URL}/${path}`

    return finalPath
}

export const getBufferAsync = (url, responseType = 'arraybuffer', direct_url = false) =>
{
    let config = {
        method: 'get',
        url: direct_url ? url : getUrl(url),
        responseType: responseType
    }
    return axios(config).then(response =>
    {
        // due to API::PostProcessing
        return response
    })
}

export const getIconUrl = (asset) =>
{
    return getUrl('icons/' + asset)
}

export const getImageUrl = (asset) =>
{
    return getUrl('images/' + asset)
}

export const getCampaignImagmeUrl = (asset) =>
{
    return getUrl('images/toys/' + asset)
}

export const getCampaignQRCodeUrl = (asset) =>
{
    return getUrl('images/qrs/' + asset)
}

export const getMarkdown = (fileName) =>
{
    return getBufferAsync('markdown/' + fileName, 'text')
}

export const getAssetJson = (url) =>
{
    return getBufferAsync(url, 'arraybuffer', true)
}

export const convertTextToFile = (text, filename) =>
{
    let blob = new Blob([text], {
        type: 'text/plain'
    })

    let file = new File([blob], filename, {lastModified: new Date()})
    return file
}

export const sortObject = (o) => 
{
    var sorted = {},
    key, a = [];

    for (key in o) {
        if (o.hasOwnProperty(key)) {
            a.push(key);
        }
    }

    a.sort();

    for (key = 0; key < a.length; key++) {
        sorted[a[key]] = o[a[key]];
    }
    
    return sorted;
}

export const getFormData = (object) => {
    const formData = new FormData();
    
    Object.keys(object).forEach(key => formData.append(key, object[key]))

    return formData;
}

export const getFileName = (filepath) => {
    return filepath.replace(/^.*?([^\\\/]*)$/, '$1')
}

export const preprocessDataList = (arrData, type, enabled) =>
{	
    let arrResult = []
    if (type && type == 'countries')
    {
        arrResult = arrData.filter(value => (value.name != 'all' && value.name != 'none'))
                            .map((value, key) => ({id: getCountryName(value.code), value: value.code, enable: enabled}))
    }
    else if (type && type == 'country')
    {
        arrResult = arrData.map((value, key) => ({id: getCountryName(value), value: value, enable: enabled}))
    }
    else
    {
        arrResult = arrData.map((value, key) => ({id: value, value: value, enable: enabled}))
    }

    return arrResult;
}

export const getDataMenu = (name) =>
{
    switch(name) {

        case Defines.PROJECT_ADMINISTRATOR:
            return env.REACT_APP_SUPPORT_NON_AD_USERS === 'true' ? Defines.AdministratorDataMenu : _.drop(Defines.AdministratorDataMenu)
        case Defines.PROJECT_MAIN:
            return Defines.MainDataMenu

        default: return []
    }
}

export const createLocalFileURL = (file) =>
{
    return typeof file === 'string' ? file : (file && file[0] instanceof File ? URL.createObjectURL(file[0]) : undefined) 
}

export const getFilesSizeInput = (files) =>
{
    let size = 0
    if (files.length > 0) 
    {
        for (let i = 0; i <= files.length - 1; i++) 
        {
            size = size + files[i].size
        }
    }

    return Math.round((size/1024))
}