import moment from 'moment'
import timezone from 'moment-timezone'

// https://gist.github.com/vankasteelj/74ab7793133f4b257ea3
export const zeroPadding = (num, size) =>
{
    return ('000' + num).slice(size * -1);
}

export const sec2time = (timeInSeconds) =>
{


    var time = parseFloat(timeInSeconds).toFixed(2),
        // hours = Math.floor(time / 60 / 60),
        minutes = Math.floor(time / 60) % 60,
        seconds = Math.floor(time - minutes * 60);

    var milliseconds = time.slice(-2);

    return zeroPadding(minutes, 2) + ':' + zeroPadding(seconds, 2) + '.' + zeroPadding(milliseconds, 2);

    // return zeroPadding(hours, 2) + ':' + zeroPadding(minutes, 2) + ':' + zeroPadding(seconds, 2) + '.' + zeroPadding(milliseconds, 2);

    // return zeroPadding(hours, 2) + ':' + zeroPadding(minutes, 2) + ':' + zeroPadding(seconds, 2);
}

export const getCurrentTime = (separatorDate = '/', separatorTime = ':', separatorDateTime = ' ') =>
{
    let now = new Date()

    let date = now.getDate()
    let month = now.getMonth() + 1
    let year = now.getFullYear()

    let hours = now.getHours()
    let minutes = now.getMinutes()
    let seconds = now.getSeconds()

    let DATE = `${year}${separatorDate}${zeroPadding(month, 2)}${separatorDate}${zeroPadding(date, 2)}`
    let TIME = `${zeroPadding(hours, 2)}${separatorTime}${zeroPadding(minutes, 2)}${separatorTime}${zeroPadding(seconds, 2)}`

    return `${DATE}${separatorDateTime}${TIME}`
}

export const sec2FullTime = (timeInMiliSeconds, separatorDate = '/', separatorTime = ':', separatorDateTime = ' ') =>
{

    if (isNaN(timeInMiliSeconds))
        return ''

    /*
    let now = new Date(timeInMiliSeconds)

    let date = now.getDate()
    let month = now.getMonth() + 1
    let year = now.getFullYear()

    let hours = now.getHours()
    let minutes = now.getMinutes()
    let seconds = now.getSeconds()
    
    let DATE = `${year}${separatorDate}${zeroPadding(month, 2)}${separatorDate}${zeroPadding(date, 2)}`
    let TIME = `${zeroPadding(hours, 2)}${separatorTime}${zeroPadding(minutes, 2)}${separatorTime}${zeroPadding(seconds, 2)}`
    
    return `${DATE}${separatorDateTime}${TIME}`
    */
    let now = moment.utc(timeInMiliSeconds)
    return now.format(`YYYY${separatorDate}MM${separatorDate}DD${separatorDateTime}hh${separatorTime}mm${separatorTime}ss`)
}

export const getPreviousDateFromNow = (lastDate = -5) =>
{
    // for debug
    // let momentNow = moment("2020-02-28", "YYYY-MM-DD")
    let momentNow = moment()
    let now = momentNow.toDate()
    now.setHours(23, 59, 59, 0)
    // now.setUTCHours(23, 59, 59, 0)

    let momentPrevious = momentNow.add(lastDate, "days")
    let previous = momentPrevious.toDate()
    previous.setHours(0, 0, 0, 0)
    // previous.setUTCHours(0, 0, 0, 0)

    return { now, previous }
}

export const getDateFromNow = (now, add = 0) =>
{
    return moment(now).add(add, 'days').toDate()
}

export const getDateRange = (start, end) =>
{
    // console.log('getDateRange', start)
    let previous = moment(start).toDate()
    let now = moment(end).toDate()

    // console.log('getDateRange', now)
    return { now, previous }
}

export const getStringTimeGMT0 = (ms, format) =>
{
    let result = timezone(ms).tz('Africa/Abidjan').format(format)

    // console.log("getStringTimeGMT0 ", result)
    return result
}

export const convertToUTC = (ms) =>
{
    let currentDate = new Date(ms)
    // in minutes
    let timezoneOffset = currentDate.getTimezoneOffset()
    // in seconds => then in miliseconds
    let nowUTC = ms - (timezoneOffset * 60 * 1000)
    return nowUTC
}

export const convertToLocalTime = (ms) =>
{
    let currentDate = new Date(ms)
    // in minutes
    let timezoneOffset = currentDate.getTimezoneOffset()
    // in seconds => then in miliseconds
    let nowUTC = ms + (timezoneOffset * 60 * 1000)
    return nowUTC
}
