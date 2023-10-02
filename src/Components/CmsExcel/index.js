import React from 'react';

import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'

import { withRouter } from 'react-router-dom'
import { withMultipleStyles, breakpointsStyle } from '../../Styles'
import * as _ from 'lodash'

// LCD modified: ez to customize & fixed minior bugs
// import Workbook from 'react-xlsx-workbook'
import Workbook from '../../3rdParty/react-xlsx-workbook-master/src/index'

import { Button } from '@material-ui/core';

import CmsControlPermission from '../../Components/CmsControlPermission'
import * as Icons from '../../Components/CmsIcons'

import TEXT from './Data/Text'
import Utils from '../../Utils';

import * as ActionCMS from '../../Redux/Actions/ActionCMS'

const styles = theme => ({
    button: {
        // use for user custom via component properties
        // classes: {{button: classes.customButton}}
    }
})

const DATA_NOT_AVAILABLE = 0
const DATA_IS_PARSING = 1
const DATA_AVAILABLE = 2

class CmsExcel extends React.Component
{
    constructor(props)
    {
        super(props)

        this.state = {
            excelData: null,
            excelFunction: false,
            status: DATA_NOT_AVAILABLE,
            version: 0
        }

        this.refExcel = React.createRef()
    }

    static getDerivedStateFromProps(nextProps, prevState)
    {
        const {
            data,
            multiSheetData
        } = nextProps

        let exFunction = null
        let exData = multiSheetData || data

        if (typeof multiSheetData === 'function')
        {
            exFunction = multiSheetData
        }
        else if (typeof data === 'function')
        {
            exFunction = data
        }

        if (exFunction !== null)
        {
            if (exFunction !== prevState.excelFunction)
            {
                return {
                    excelData: [],
                    excelFunction: exFunction,
                    status: DATA_NOT_AVAILABLE
                }
            }
        } 
        else if (exData !== prevState.excelData)
        {
            return {
                excelData: exData,
                excelFunction: null,
                status: DATA_AVAILABLE
            }
        }

        return null
    }

    handleBeforeDownload = () =>
    {
        console.log('handleBeforeDownload', Utils.getCurrentTime())
        this.props.SetLoading(Utils.parseString(TEXT.CMS_EXCEL_LOADING_MESSAGE, this.getFileName()))
    }

    handleAfterDownload = () =>
    {
        console.log('handleAfterDownload', Utils.getCurrentTime())
        this.props.ClearLoading()
        if (this.state.excelFunction)
        {
            // refresh new data for next export called
            this.setState({
                status: DATA_NOT_AVAILABLE
            })

            this.props.onProgress && this.props.onProgress(false)
        }
    }

    handleExport = () =>
    {
        const {
            status
        } = this.state

        if (status === DATA_AVAILABLE)
        {
            this.refExcel.current && this.refExcel.current.click()

        } 
        else
        {
            console.log(`BEGIN handleExport`, Utils.getCurrentTime())

            this.parseData().then(result =>
            {
                console.log(`END handleExport`, Utils.getCurrentTime())

                if (result.status === DATA_AVAILABLE)
                {
                    this.refExcel.current && this.refExcel.current.click()
                }

            })
        }

        this.props.onProgress && this.props.onProgress(true)
    }

    getFileName = () =>
    {
        const {
            fileName,
            fileNameExtend,
            location: {
                pathname
            }
        } = this.props

        let excelFileName = fileName
        if (excelFileName.length === 0)
        {
            excelFileName = Utils.parseString(TEXT.CMS_EXCEL_FILE_NAME_FROM_URL, `${pathname}${fileNameExtend}`.replace(/\//g, '_'))
        }

        return excelFileName
    }

    getLabels = (data, parentKey = null) =>
    {
        return Object.keys(data).reduce((arr, key) =>
        {
            // ignore CmsTable extra data
            if (key === 'tableData')
            {
                return arr
            }

            // fixed: object not exported
            if (_.isArray(data[key]))
            {
                // export as array of string
            }
            else if (_.isObject(data[key]))
            {
                return arr.concat(this.getLabels(data[key], key))
            }

            if (parentKey)
            {
                return arr.concat(`${parentKey}::${key}`)
            }
            return arr.concat(key)
        }, [])
    }

    getValue = (row, columnName) =>
    {
        if (columnName.includes('::'))
        {
            // fixed: object not exported
            let subColumns = columnName.split('::')
            let firstSubColum = subColumns.shift()
            return this.getValue(row[firstSubColum], subColumns.join('::'))
        }

        let value = row[columnName]

        if (_.isArray(value))
        {
            // export as array of string
            let arrayValue = value.reduce((arr, val) =>
            {
                return arr.concat(JSON.stringify(val))
            }, [])
            return arrayValue.join('\n')

        } 
        else if (_.isObject(value))
        {
            // export as string
            return JSON.stringify(value)
        }

        return value
    }


    renderExcelSheet = (sheetName, labels, data) =>
    {
        const {
            columns
        } = this.props

        return (
            <Workbook.Sheet data={data} name={sheetName} key={sheetName}>
                {

                    labels
                        // fixed feedback: column export order not same as render
                        .sort((label1, label2) =>
                        {
                            let label1Index = columns.findIndex((column) =>
                            {
                                if (column.field === label1)
                                {
                                    return true
                                }
                                return false
                            })

                            let label2Index = columns.findIndex((column) =>
                            {
                                if (column.field === label2)
                                {
                                    return true
                                }
                                return false
                            })

                            return label1Index - label2Index
                        })
                        // fixed error : Failed prop type: Invalid prop `children` of type `object` supplied to `Sheet`, expected an array
                        .map(columnName =>
                        {
                            // mapping column field => column title
                            let columLabel = columns.reduce((label, column) =>
                            {
                                if (column.field === columnName)
                                {
                                    return column.title
                                }
                                return label
                            }, columnName)

                            return (
                                <Workbook.Column
                                    key={columnName}
                                    label={columLabel}
                                    value={(row) =>
                                    {
                                        return this.getValue(row, columnName)
                                    }}
                                />
                            )
                        })
                }
            </Workbook.Sheet>
        )
    }

    renderPermissionButton = (disabled) =>
    {
        const {
            controlPermission,
        } = this.props

        return (
            <CmsControlPermission
                control={this.renderButton(disabled)}
                link={controlPermission.link}
                attribute={controlPermission.attribute}
            />
        )
    }

    renderButton = (disabled) =>
    {
        const {
            title,
            buttonColor,
            buttonVariant,
            classes
        } = this.props

        return (
            <Button
                variant={buttonVariant}
                color={buttonColor}
                disabled={disabled}
                className={classes.button}
                startIcon={<Icons.ExportIcon/>}
                onClick={this.handleExport}
                ref={this.props.excelRef}
            >
                {title}
            </Button>
        )
    }

    renderExcel = (excelData) =>
    {
        const {
            fullColumns
        } = this.props

        return (
            <Workbook
                filename={this.getFileName()}
                element={<div ref={this.refExcel} id={this.getFileName()} />}
                beforeDownload={this.handleBeforeDownload}
                afterDownload={this.handleAfterDownload}
            >
                {
                    Object.keys(excelData).map(sheetName =>
                    {
                        let labels = []
                        let data = excelData[sheetName] || []
                        if (data.length > 0)
                        {
                            let index = 0
                            if (fullColumns)
                            {
                                let max = 0
                                _.forEach(data, (value, key) =>
                                {
                                    if (Object.keys(value).length > max)
                                    {
                                        max = Object.keys(value).length
                                        index = key
                                    }
                                })
                            }

                            labels = this.getLabels(data[index])
                        }
                        // xlsx lib doesn't allow these special characters [ ] * ? / \
                        return this.renderExcelSheet(sheetName.replace(/([\[\]*?\/\\])/g, ''), labels, data)
                    })
                }
            </Workbook>
        )
    }

    parseData = () =>
    {
        return new Promise((resolve, reject) =>
        {
            this.setState(
                (state) => (
                    {
                        status: DATA_IS_PARSING,
                        version: state.version + 1
                    }
                ),
                () =>
                {
                    console.log('parseData', this.state.version)

                    Promise.resolve(this.state.version)
                        .then((version) =>
                        {
                            return new Promise((resolve, reject) =>
                            {
                                this.props.SetLoading('Parsing Data')
                                setTimeout(() =>
                                {
                                    resolve(version)
                                }, 100);
                            })
                        })
                        .then((version) =>
                        {

                            let exData = this.state.excelFunction ? this.state.excelFunction() : []

                            // Detect if exData is a Promise
                            if (!!exData && typeof exData.then === 'function')
                            {
                                exData.then((result) => {
                                    this.setState(
                                        (state) =>
                                        {
                                            // Fixed: multithread parsing vs render
                                            if (state.version === version)
                                            {
                                                console.log('finished parseData', state.version)
                                                console.log('excelData', result)
                                                return {
                                                    excelData: result,
                                                    status: DATA_AVAILABLE
                                                }
                                            }
                                            console.warn(`ignore parseData prevVersion ${version} vs currVersion ${state.version}`)
                                            return null
                                        },
                                        () =>
                                        {
                                            resolve({
                                                status: this.state.status
                                            })
                                        }
                                    )
                                });
                            }
                            else
                            {
                                this.setState(
                                    (state) =>
                                    {
                                        // Fixed: multithread parsing vs render
                                        if (state.version === version)
                                        {
                                            console.log('finished parseData', state.version)
                                            return {
                                                excelData: exData,
                                                status: DATA_AVAILABLE
                                            }
                                        }
                                        console.warn(`ignore parseData prevVersion ${version} vs currVersion ${state.version}`)
                                        return null
                                    },
                                    () =>
                                    {
                                        resolve({
                                            status: this.state.status
                                        })
                                    }
                                )
                            } 
                        })
                        .catch(err =>
                        {
                            reject({
                                error: err
                            })
                        })
                        .finally(() =>
                        {
                            this.props.ClearLoading()
                        })
                }
            )
        })
    }

    render()
    {
        const {
            controlPermission,
            sheetName
        } = this.props

        const {
            excelData,
            status
        } = this.state

        return (
            <div>
                {
                    controlPermission
                        ? this.renderPermissionButton(excelData === null)
                        : this.renderButton(excelData === null)
                }
                {
                    status === DATA_AVAILABLE && excelData !== null && (
                        Array.isArray(excelData)
                            ? this.renderExcel({ [sheetName]: excelData })
                            : this.renderExcel(excelData)
                    )
                }
            </div>
        )
    }
}

CmsExcel.propTypes = {
    classes: PropTypes.object.isRequired,
    fileName: PropTypes.string,
    fileNameExtend: PropTypes.string,
    // only one sheet
    sheetName: PropTypes.string,
    data: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
    // or multiple sheets: { sheetName1: [data1], sheetName2: [data2] }
    multiSheetData: PropTypes.oneOfType([PropTypes.object, PropTypes.func]),
    controlPermission: PropTypes.shape({
        link: PropTypes.string,
        attribute: PropTypes.string
    }),
    title: PropTypes.string,
    columns: PropTypes.arrayOf(PropTypes.shape({
        title: PropTypes.string,
        field: PropTypes.string
    })),
    fullColumns: PropTypes.bool,
    buttonColor: PropTypes.oneOf(['default', 'inherit', 'primary', 'secondary']),
    buttonVariant: PropTypes.oneOf(['contained', 'outlined', 'text']),
    excelRef: PropTypes.any,
}

CmsExcel.defaultProps = {
    fileName: '',
    fileNameExtend: '',
    sheetName: TEXT.CMS_EXCEL_SHEET_NAME,
    data: null,
    multiSheetData: null,
    title: TEXT.CMS_EXCEL_BUTTON_EXPORT_TITLE,
    controlPermission: null,
    columns: [],
    fullColumns: false,
    buttonColor: 'primary',
    buttonVariant: 'contained',
    onProgress: PropTypes.func,
}

const mapDispatchToProps = (dispatch) => ({
    SetLoading: (msg) =>
    {
        dispatch(ActionCMS.SetLoading(msg))
    },
    ClearLoading: () =>
    {
        dispatch(ActionCMS.ClearLoading())
    }
})

export default compose(
    connect(null, mapDispatchToProps),
    withMultipleStyles(styles),
    withRouter
)(CmsExcel);
