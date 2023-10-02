import CryptoJS from 'crypto-js'
import { env } from '../env'

// https://cryptojs.gitbook.io/docs/#ciphers
export const EncryptData = (data) =>
{
    if (data === null || data === undefined)
    {
        return data
    }

    // https://www.code-sample.com/2019/12/react-encryption-decryption-data-text.html
    // https://stackoverflow.com/questions/48699820/how-do-i-hide-api-key-in-create-react-app
    return CryptoJS.AES.encrypt(data, CryptoJS.enc.Utf8.parse(env.REACT_APP_DATA_TRANSFER_KEY), { iv: CryptoJS.enc.Utf8.parse(env.REACT_APP_DATA_TRANSFER_IV) }).toString(CryptoJS.format.Hex)
}

export const DecryptData = (data) =>
{
    if (data === null || data === undefined)
    {
        return data
    }

    try
    {
        return CryptoJS.AES.decrypt(data, CryptoJS.enc.Utf8.parse(env.REACT_APP_DATA_TRANSFER_KEY), { iv: CryptoJS.enc.Utf8.parse(env.REACT_APP_DATA_TRANSFER_IV), format: CryptoJS.format.Hex }).toString(CryptoJS.enc.Utf8)
    } catch (err)
    {
        console.error(err)
        console.log(data)
    }
    return null
}

// https://cryptojs.gitbook.io/docs/#hashing
export const Hash = (message) =>
{
    let hash = CryptoJS.SHA256("".concat(env.REACT_APP_DATA_TRANSFER_KEY, "".concat('-', message, '-'), env.REACT_APP_DATA_TRANSFER_IV))
    return hash.toString(CryptoJS.enc.Base64)
}

export const String2Hex = (message, key = 'secret-key') =>
{
    let hash = CryptoJS.AES.encrypt(message, key).toString()
    let b64 = CryptoJS.enc.Base64.parse(hash)
    let hex = b64.toString(CryptoJS.enc.Hex)
    return hex
}

export const Hex2String = (hexMessage, key = 'secret-key') =>
{
    let hex = CryptoJS.enc.Hex.parse(hexMessage)
    let b64 = hex.toString(CryptoJS.enc.Base64)
    let hash = CryptoJS.AES.decrypt(b64, key)
    let message = hash.toString(CryptoJS.enc.Utf8)
    return message
}