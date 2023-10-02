import { COUNTRY_LIST_SERVER } from '../Defines'
import * as _ from 'lodash'

export const parseString = (str, ...rest) =>
{
    var args = [].slice.call(rest, 0)
    var i = 0
    return str.replace(/{%s}/g, () => args[i++])
}

export const hasNumber = value =>
{
    return new RegExp(/[0-9]/).test(value)
}

export const onlyNumber = value =>
{
    return new RegExp(/^[0-9\b]+$/).test(value)
}

export const hasUpperCase = value =>
{
    return new RegExp(/[A-Z]/).test(value)
}

export const hasLowerCase = value =>
{
    return new RegExp(/[a-z]/).test(value)
}

export const hasSpecial = value =>
{
    return new RegExp(/[:;<=>?@[\]^_`{|}~!"#$%&'()*+,-./]/).test(value)
}

export const isEmail = value =>
{
    return new RegExp(/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/).test(value)
}

export const isVersion = value =>
{
    return new RegExp(/^\d+\.\d+(\.\d+)?[a-z]?$/).test(value)
}

export const cmsFormatText = value =>
{
    return value.replace('weekly_report_', '').replace('#', ' # ').replace(/[-, _]/g, ' ').replace(/(\b[a-z](?!\s))/g, x => { return x.toUpperCase() })
}

export const getCountryName = value =>
{
    let result = _.find(COUNTRY_LIST_SERVER, item =>
    {
        return item.code.toUpperCase() === value.toUpperCase()
    })

    return result ? result.name + ' (' + result.code + ')' : value
}

export const getCountryNameWithoutCode = value =>
{
    let result = _.find(COUNTRY_LIST_SERVER, item =>
    {
        return item.code.toUpperCase() === value.toUpperCase()
    })

    return result ? result.name : value
}

export const cmsFormatIdentId = value =>
{
    // Only Alphabetical, Numbers, '_' and '-'
    return new RegExp(/^[0-9a-zA-Z_-]+$/).test(value)
}

export const cmsFormatIdentType = (value, definedTypes, dataType = 'object') =>
{
    if (dataType === 'object')
    {
        return _.includes(definedTypes, value)
    }

    if (dataType === 'array')
    {
        return _.find(definedTypes, value) === undefined ? false : true
    }

    return false
}

export const cmsFormatArrayString = (string, separator) =>
{
    return _.map(_.split(string, separator), value => (value.trim())).join(separator)
}

export const cmsStringToArray = (string, separator) =>
{
    let result = _.reduce(_.split(string, separator), (result, value, key) => {
                    let tmp = value.trim()
                    return tmp === '' ? result : [...result, tmp] 
                },[])
                
    return result
}

export const cmsIsLatinString = (value) =>
{
    return new RegExp(/^([A-Za-z\u00C0-\u00D6\u00D8-\u00f6\u00f8-\u00ff\s]*)$/gi).test(value)
}

export const ValidateIPaddress = (ipaddress) =>
{
    if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress))
    {
        return true
    }

    return false
}

export const convertCamelcaseToNormal = (value) =>
{
    return value
            // insert a space before all caps
            .replace(/([A-Z])/g, ' $1')
            // uppercase the first character
            .replace(/^./, function(str){ return str.toUpperCase(); })
}

export const convertToNormalString = (string, replaceChar) =>
{
    return string.replace (/^[-_]*(.)/, (_, c) => c.toUpperCase())       // Initial char (after -/_)
                .replace (/[-_]+(.)/g, (_, c) => replaceChar + c.toUpperCase()) // First char after each -/_
}

export const isJSON = (string) =>
{
    if (typeof string !== "string")
    {
        return false;
    }

    try
    {
        JSON.parse(string)
        return true
    } 
    catch (error)
    {
        return false
    }
}
