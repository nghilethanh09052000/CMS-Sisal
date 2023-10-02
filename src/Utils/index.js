import * as Assets from './Assets'
import * as String from './String'
import * as Time from './Time'
import * as Cryption from './Cryption'
import * as Storage from './Storage'
import * as Popup from './Popup'

import * as _ from 'lodash'

const Utils = {
    getUrl: Assets.getUrl,
    getIconUrl: Assets.getIconUrl,
    getImageUrl: Assets.getImageUrl,
    getCampaignImagmeUrl: Assets.getCampaignImagmeUrl,
    getCampaignQRCodeUrl: Assets.getCampaignQRCodeUrl,
    getBufferAsync: Assets.getBufferAsync,
    getMarkdown: Assets.getMarkdown,
    getAssetJson: Assets.getAssetJson,
    convertTextToFile: Assets.convertTextToFile,
    sortObject: Assets.sortObject,
    getFormData: Assets.getFormData,
    getFileName: Assets.getFileName,
    preprocessDataList: Assets.preprocessDataList,
    getDataMenu: Assets.getDataMenu,
    createLocalFileURL: Assets.createLocalFileURL,
    getFilesSizeInput: Assets.getFilesSizeInput,

    parseString: String.parseString,
    hasNumber: String.hasNumber,
    onlyNumber: String.onlyNumber,
    hasUpperCase: String.hasUpperCase,
    hasLowerCase: String.hasLowerCase,
    hasSpecial: String.hasSpecial,
    isEmail: String.isEmail,
    isVersion: String.isVersion,
    cmsFormatText: String.cmsFormatText,
    getCountryName: String.getCountryName,
    getCountryNameWithoutCode: String.getCountryNameWithoutCode,
    cmsFormatIdentId: String.cmsFormatIdentId,
    cmsFormatIdentType: String.cmsFormatIdentType,
    cmsFormatArrayString: String.cmsFormatArrayString,
    cmsStringToArray: String.cmsStringToArray,
    cmsIsLatinString: String.cmsIsLatinString,
    ValidateIPaddress: String.ValidateIPaddress,
    convertCamelcaseToNormal: String.convertCamelcaseToNormal,
    convertToNormalString: String.convertToNormalString,
    isJSON: String.isJSON,


    getCurrentTime: Time.getCurrentTime,
    sec2time: Time.sec2time,
    sec2FullTime: Time.sec2FullTime,
    zeroPadding: Time.zeroPadding,
    getPreviousDateFromNow: Time.getPreviousDateFromNow,
    getDateFromNow: Time.getDateFromNow,
    getDateRange: Time.getDateRange,
    getStringTimeGMT0: Time.getStringTimeGMT0,
    convertToUTC: Time.convertToUTC,
    convertToLocalTime: Time.convertToLocalTime,

    EncryptData: Cryption.EncryptData,
    DecryptData: Cryption.DecryptData,
    Hash: Cryption.Hash,
    String2Hex: Cryption.String2Hex,
    Hex2String: Cryption.Hex2String,

    getItem: Storage.getItem,
    setItem: Storage.setItem,
    clearAllItems: Storage.clearAllItems,

    REMEMBER_ME: Storage.REMEMBER_ME,
    ACCESS_TOKEN: Storage.ACCESS_TOKEN,
    LOGIN_TOKEN: Storage.LOGIN_TOKEN,
    EMAIL: Storage.EMAIL,
    PRIVILEGE: Storage.PRIVILEGE,
    TRACER: Storage.TRACER,

    SmartClosePopup: Popup.SmartClosePopup,

    dispatchEvent: (eventName, data) =>
    {
        var evt;
        try
        {
            evt = new CustomEvent(eventName, { detail: data });
        } catch (e)
        {
            evt = document.createEvent('Event');
            evt.initEvent(eventName, true, true);
            evt.detail = data
        }
        document.dispatchEvent(evt);
    },

    cmsPickArray: (array, array_path) =>
    {
        if (!array_path || array_path.length === 0)
        {
            return (!array || array.length === 0) ? [] : array
        }

        let keys = _.reduce(array_path, (keys, value) =>
        {
            return [...keys, value.field]
        }, [])

        let result = _.map(array, value =>
        {
            return _.pick(value, keys)
        })

        return result
    }
}

export default Utils