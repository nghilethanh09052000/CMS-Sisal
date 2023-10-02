import * as XLSX from 'xlsx'

const DEBUG_FIELD = 'excelRow'

// https://stackoverflow.com/questions/44967466/date-in-xls-sheet-not-parsing-correctly
const DEFAULT_OPTIONS = {
    type: 'array',
    cellDates: true,
    cellNF: false,
    cellText: false
}

const parser = (input, options = DEFAULT_OPTIONS) =>
{
    var workbook = XLSX.read(input, options)
    var sheets = workbook.SheetNames
    var output = {}

    sheets.forEach(sheetName =>
    {
        var workSheet = workbook.Sheets[sheetName]
        var headers = {}
        var data = []

        for (let info in workSheet)
        {
            if (info[0] === '!') continue

            // parse out the column, row and value
            const regexStringNumber = /([a-z]*)([0-9]*)/gmi
            let matchesStringNumber = regexStringNumber.exec(info)

            var col = matchesStringNumber[1]
            var row = matchesStringNumber[2]
            var value = workSheet[info].v

            // console.log('col', col, 'row', row, 'value', value)
            if (row === '1')
            {
                headers[col] = value
            } 
            else
            {
                if (!data[row])
                {
                    data[row] = {
                        // for debug
                        [DEBUG_FIELD]: row
                    }
                }
                data[row][headers[col]] = value
            }
        }

        //drop those rows which are empty
        let emptyRow = 0
        while (emptyRow < data.length)
        {
            if (!data[emptyRow])
            {
                data.splice(emptyRow, 1);
            } 
            else
            {
                emptyRow++
            }
        }

        output[sheetName] = {
            headers,
            data
        }
    })

    return output
}

const parserPromise = (input, options = DEFAULT_OPTIONS) =>
{
    return new Promise((resolve, reject) =>
    {
        try
        {

            let output = parser(input, options)
            resolve(output)
        } catch (err)
        {
            reject(err)
        }
    })
}

export
{
    parser,
    parserPromise,
    DEBUG_FIELD
} 