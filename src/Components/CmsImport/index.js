import React, { Fragment } from 'react'
import PropTypes from 'prop-types'

import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import clsx from 'clsx'

import { withMultipleStyles } from '../../Styles'

import { Backdrop, Button, Paper, Step, StepContent, StepLabel, Stepper, Typography, Zoom, TextField, Select, Tooltip, MenuItem, FormControlLabel, FormGroup, Checkbox, IconButton, Slide, Radio, Slider } from '@material-ui/core';
import { ErrorOutline as WarningIcon, HelpOutline as AvailableIcon, HighlightOff as CloseIcon, Check as ImportedIcon, Close as DontImportIcon } from '@material-ui/icons';

import CmsControlPermission from '../../Components/CmsControlPermission'
import * as Icons from '../../Components/CmsIcons'

import TEXT from './Data/Text'
import Utils from '../../Utils'

import * as ExcelParser from './ExcelParser'
import * as ActionCMS from '../../Redux/Actions/ActionCMS'
// import CmsExcel from '../CmsExcel'

import * as _ from 'lodash'
import { findBestMatch } from 'string-similarity'
import { withRouter } from 'react-router-dom'
import { Concurrency } from 'max-concurrency'

const styles = theme => ({
    button: {
        // use for user custom via component properties
        // classes: {{button: classes.customButton}}
    },

    stepButton: {
        marginRight: theme.spacing(1),
        marginTop: theme.spacing(1)
    },

    backdrop: {
        zIndex: theme.zIndex.drawer + 1,
        color: 'rgba(0, 0, 0, 0.38)',
    },

    divAction: {
        marginBottom: theme.spacing(2),
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',

        '& > button:last-child': {
            marginRight: 0
        }
    },

    divComplete: {
        padding: theme.spacing(3),
        width: '100%'
    },

    divStep: {
        marginTop: theme.spacing(1),
        marginBottom: theme.spacing(1)
    },

    divColumn: {
        display: 'flex',
        flexDirection: 'column',
    },
    divRow: {
        display: 'flex',
        flexDirection: 'row',
    },

    stepperContainer: {
        width: '60%',
        // use zIndex + position for Slide transition
        zIndex: 0,
        position: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
    },

    stepperRoot: {
        width: '100%',
    },

    divMappingColumn: {
        display: 'inline-flex',
        flex: 1,
        justifyContent: 'center',
        paddingLeft: 10
    },
    divMappingRow: {
        minHeight: 40
    },

    errorContainer: {
        width: '60%',
        // use zIndex + position for Slide transition
        zIndex: 1,
        position: 'fixed',
    },

    errorRoot: {
        padding: theme.spacing(3)
    },

    buttonClose: {
        position: 'absolute',
        right: 10,
        top: 5
    },

    menuItem: {
        alignItems: 'center',
        justifyContent: 'flex-start'
    },

    menuIcon: {
        paddingLeft: 5,
        paddingRight: 5,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    }
})

const STEPPER_TITLES = [
    TEXT.CMS_IMPORT_TITLE_STEP_1,
    TEXT.CMS_IMPORT_TITLE_STEP_2,
    TEXT.CMS_IMPORT_TITLE_STEP_3,
    TEXT.CMS_IMPORT_TITLE_STEP_4,
]

const STEPPER_DESCRIPTIONS = [
    TEXT.CMS_IMPORT_DESCRIPTION_STEP_1,
    TEXT.CMS_IMPORT_DESCRIPTION_STEP_2,
    TEXT.CMS_IMPORT_DESCRIPTION_STEP_3,
    TEXT.CMS_IMPORT_DESCRIPTION_STEP_4,
]

const EXCEL_XLS = 'application/vnd.ms-excel'
const EXCEL_XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

const DONT_IMPORT = "Don't import"


class CmsImport extends React.Component
{
    constructor(props)
    {
        super(props)
        this.state = this.resetState()
        this.countSessionData = 0
    }

    resetState = () =>
    {
        return {
            isOpened: false,
            showError: '',
            step: 0,
            file: null,
            mapping: {},

            isAdd: true,
            isUpdateAfterAdd: false,
            isUpdate: false,
            isDelete: false,
            isUpdateBeforeDelete: false,
            isDone: false,
            isError: false,

            errorMessage: '',
            errorAdd: [],
            errorUpdate: [],
            errorDelete: [],

            countAdd: 0,
            countUpdate: 0,
            countDelete: 0,
            countImport: 0,

            // https://stackoverflow.com/questions/985431/max-parallel-http-connections-in-a-browser
            currentConcurrency: 10,
            tempConcurrency: 10,
            maxConcurrency: 30
        }
    }

    handleNext = () =>
    {
        this.setState(
            (state) => ({
                step: state.step + 1
            }),
            () =>
            {
                this.handleStepAction(this.state.step)
            }
        )
    }

    handleBack = () =>
    {
        this.setState(
            (state) => ({
                step: state.step - 1
            }),
            () =>
            {
                this.handleStepAction(this.state.step)
            }
        )
    }

    handleImport = (evt) =>
    {
        this.setState(
            {
                ...this.resetState(),
                isOpened: true
            },
            () =>
            {
                this.handleStepAction(this.state.step)
            }
        )
    }

    handleClose = (finish) => () =>
    {
        this.setState(
            (state) => ({
                isOpened: false,
                step: state.step + (finish ? 1 : 0)
            }),
            () =>
            {
                this.handleStepAction(this.state.step)
            }
        )
    }

    handleFileUpload = (evt) =>
    {
        if (evt.target.files.length > 0)
        {
            // user ok
            var file = evt.target.files[0]

            Promise.resolve()
                .then(() =>
                {
                    this.props.SetLoading(Utils.parseString(TEXT.CMS_IMPORT_TOOLTIP_PARSING_MESSAGE, file.name))
                    return new Promise((resolve) =>
                    {
                        // Fixed: loading icon not rotate
                        setTimeout(() =>
                        {
                            resolve()
                        }, 1000)
                    })
                })
                .then(() =>
                {
                    return new Promise((resolve, reject) =>
                    {
                        var reader = new FileReader()

                        reader.onload = (e) =>
                        {
                            var data = new Uint8Array(e.target.result)
                            resolve(data)
                        }

                        reader.onerror = () =>
                        {
                            reader.abort()
                            reject(new Error('reading file error'))
                        }

                        reader.readAsArrayBuffer(file)
                    })
                })
                .then(data =>
                {
                    return ExcelParser.parserPromise(data)
                })
                .then((output) =>
                {
                    // console.log('ExcelParser', output)
                    if (this.props.excelParser)
                    {
                        output = this.props.excelParser(output)
                    }

                    let predictMapping = this.predictMapping(this.props.fields, output)
                    // console.log('predictMapping', predictMapping)

                    this.setState({
                        file: output,
                        mapping: predictMapping
                    })
                })
                .catch(err =>
                {
                    console.log('error', err)
                    this.setState({
                        file: null,
                        mapping: {}
                    })
                })
                .finally(() =>
                {
                    this.props.ClearLoading()
                })
        }
        else
        {
            // user cancel
            this.setState({
                file: null,
                mapping: {}
            })
        }
    }

    handleFieldChange = (evt) =>
    {
        const { name, value } = evt.target
        // console.log('handleFieldChange', name, value)
        this.setState((state) => ({
            mapping: {
                ...state.mapping,
                [name]: value
            }
        }))
    }

    handleImportChange = (evt, checked) =>
    {
        const { name } = evt.target
        // console.log('handleImportChange', name, checked)
        switch (name)
        {
            case 'isAdd':
                {
                    this.setState({
                        [name]: checked,
                        'isDelete': !checked,
                        'isUpdate': !checked
                    })
                    break
                }

            case 'isUpdate':
                {
                    this.setState({
                        [name]: checked,
                        'isAdd': !checked,
                        'isDelete': !checked
                    })
                    break
                }    

            case 'isDelete':
                {
                    this.setState({
                        [name]: checked,
                        'isAdd': !checked,
                        'isUpdate': !checked
                    })
                    break
                }

            default:
                {
                    this.setState({
                        [name]: checked
                    })
                    break
                }
        }
    }

    handleSliderChange = (name) => (evt, value) =>
    {
        // optimize slider speed
        if (this.state[name] !== value)
        {
            this.setState({
                [name]: value
            })
        }
    }

    handleStepAction(step)
    {
        switch (step)
        {
            case 3:
                this.importData()
                break;
            default:
                console.log('handleStepAction', step)
                break;
        }

        this.props.onProgress && this.props.onProgress(this.state.isOpened, step)
    }

    importData()
    {
        const {
            file,
            mapping,
            isAdd,
            isUpdateAfterAdd,
            isUpdate,
            isDelete,
            isUpdateBeforeDelete,
            currentConcurrency
        } = this.state

        const {
            normalizeData,
            formatData,
            apiAdd,
            apiUpdate,
            apiDelete,
            enabledOnceImport,
            requestLimitSize
        } = this.props

        // console.log('file', file)
        // console.log('mapping', mapping)

        var allTasks = []
        var mappingDataArray = []
        this.countSessionData = 0

        this.props.SetLoading('')

        Object.keys(file).forEach(sheetName =>
        {
            let headers = file[sheetName].headers
            let data = file[sheetName].data
            data.forEach((row, index) =>
            {
                let mappingData = {}
                let isError = false

                Object.keys(headers).forEach(column =>
                {
                    let excelName = headers[column].trim()
                    let key = `${sheetName}::${excelName}`
                    let field = Object.keys(mapping).reduce((current, item) =>
                    {
                        if (mapping[item] === key)
                        {
                            return item
                        }
                        return current
                    }, DONT_IMPORT)

                    if (field !== DONT_IMPORT && row.hasOwnProperty(excelName))
                    {
                        if (normalizeData)
                        {
                            if (!isError)
                            {
                                try
                                {
                                    mappingData[field] = normalizeData(row, field, excelName)
                                } catch (err)
                                {
                                    // console.log(`normalizeData field ${field}`, err)
                                    isError = true
                                    
                                    const error = {
                                        [ExcelParser.DEBUG_FIELD]: `${sheetName} :: ${row[ExcelParser.DEBUG_FIELD]}`,
                                        code: -999,
                                        message: `normalizeData field ${field} error\n${err.message ? err.message : err}`
                                    }

                                    this.setState(
                                        (state) => ({
                                            countImport: state.countImport + 1,
                                            errorAdd: [
                                                ...state.errorAdd,
                                                error
                                            ],
                                            errorUpdate: [
                                                ...state.errorUpdate,
                                                error
                                            ],
                                            errorDelete: [
                                                ...state.errorDelete,
                                                error
                                            ],
                                        })
                                    )
                                }
                            }
                        }
                        else
                        {
                            mappingData[field] = row[excelName]
                        }
                    }
                })

                if (Object.keys(mappingData).length === 0)
                {
                    // console.log(`invalid sheet ${sheetName} row ${row[ExcelParser.DEBUG_FIELD]}`)
                    isError = true
                    this.setState(
                        (state) => ({
                            countImport: state.countImport + 1,
                            errorAdd: [
                                ...state.errorAdd,
                                {
                                    [ExcelParser.DEBUG_FIELD]: `${sheetName} :: ${row[ExcelParser.DEBUG_FIELD]}`,
                                    code: -998,
                                    message: `invalid sheet ${sheetName} row ${row[ExcelParser.DEBUG_FIELD]}`
                                }
                            ]
                        })
                    )
                }

                mappingData = formatData ? formatData(mappingData) : mappingData
                // console.log(index, mappingData)

                if (enabledOnceImport)
                {
                    if (!isError)
                    {
                        mappingDataArray = [...mappingDataArray, mappingData]
                        this.countSessionData++
                    } 
                    
                    if (index === data.length - 1 || this.countSessionData === requestLimitSize)
                    {
                        mappingData = [...mappingDataArray]
                        // Reset session
                        mappingDataArray = []
                        // Save odd
                        if (index < data.length - 1)
                        {
                            this.countSessionData = 0
                        }
                    }
                    else
                    {
                        return
                    } 
                }
                
                if (!isError && !enabledOnceImport || enabledOnceImport && !_.isEmpty(mappingData))
                {
                    if (isAdd)
                    {
                        if (apiAdd)
                        {
                            // allTasks.push(new Promise((resolve, reject) =>
                            allTasks.push(() => (new Promise((resolve, reject) =>
                            {
                                apiAdd(mappingData)
                                    .then(() =>
                                    {
                                        this.setState(
                                            (state) => ({
                                                countAdd: state.countAdd + 1,
                                                countImport: state.countImport + 1
                                            }),
                                            () =>
                                            {
                                                resolve()
                                            }
                                        )
                                    })
                                    .catch(errorAdd =>
                                    {
                                        if (isUpdateAfterAdd)
                                        {
                                            if (apiUpdate)
                                            {
                                                apiUpdate(mappingData)
                                                    .then(() =>
                                                    {
                                                        this.setState(
                                                            (state) => ({
                                                                countUpdate: state.countUpdate + 1,
                                                                countImport: state.countImport + 1
                                                            }),
                                                            () =>
                                                            {
                                                                resolve()
                                                            }
                                                        )
                                                    })
                                                    .catch(errorUpdate =>
                                                    {
                                                        // I don't want to stop import other data
                                                        // console.log('update error excel row', row[ExcelParser.DEBUG_FIELD], 'log', errorUpdate)
                                                        this.setState(
                                                            (state) => ({
                                                                countImport: state.countImport + 1,
                                                                errorUpdate: [
                                                                    ...state.errorUpdate,
                                                                    {
                                                                        [ExcelParser.DEBUG_FIELD]: `${sheetName} :: ${row[ExcelParser.DEBUG_FIELD]}`,
                                                                        code: errorUpdate.code,
                                                                        message: errorUpdate.message.message
                                                                    }
                                                                ]
                                                            }),
                                                            () =>
                                                            {
                                                                resolve()
                                                            }
                                                        )
                                                    })
                                            }
                                            else
                                            {
                                                this.setState({
                                                    isError: true,
                                                    errorMessage: TEXT.CMS_IMPORT_ERROR_API_UPDATE
                                                })
                                            }
                                        }
                                        else
                                        {
                                            // I don't want to stop import other data
                                            // console.log('add error excel row', row[ExcelParser.DEBUG_FIELD], 'log', errorAdd)
                                            this.setState(
                                                (state) => ({
                                                    countImport: state.countImport + 1,
                                                    errorAdd: [
                                                        ...state.errorAdd,
                                                        {
                                                            [ExcelParser.DEBUG_FIELD]: `${sheetName} :: ${row[ExcelParser.DEBUG_FIELD]}`,
                                                            code: errorAdd.code,
                                                            message: errorAdd.message.message
                                                        }
                                                    ]
                                                }),
                                                () =>
                                                {
                                                    resolve()
                                                }
                                            )
                                        }
                                    })
                            })))
                        }
                        else
                        {
                            this.setState({
                                isError: true,
                                errorMessage: TEXT.CMS_IMPORT_ERROR_API_ADD
                            })
                        }
                    }
                    else if (isUpdate)
                    {
                        if (apiUpdate)
                        {
                            // allTasks.push(new Promise((resolve, reject) =>
                            allTasks.push(() => (new Promise((resolve, reject) =>
                            {
                                apiUpdate(mappingData)
                                    .then(() =>
                                    {
                                        this.setState(
                                            (state) => ({
                                                countUpdate: state.countUpdate + 1,
                                                countImport: state.countImport + 1
                                            }),
                                            () =>
                                            {
                                                resolve()
                                            }
                                        )
                                    })
                                    .catch(errorUpdate =>
                                    {
                                        // I don't want to stop import other data
                                        console.log('update error excel row', row[ExcelParser.DEBUG_FIELD], 'log', errorUpdate)
                                        this.setState(
                                            (state) => ({
                                                countImport: state.countImport + 1,
                                                errorUpdate: [
                                                    ...state.errorUpdate,
                                                    {
                                                        [ExcelParser.DEBUG_FIELD]: `${sheetName} :: ${row[ExcelParser.DEBUG_FIELD]}`,
                                                        code: errorUpdate.code,
                                                        message: errorUpdate.message.message
                                                    }
                                                ]
                                            }),
                                            () =>
                                            {
                                                resolve()
                                            }
                                        )
                                    })
                            })))
                        }
                        else
                        {
                            this.setState({
                                isError: true,
                                errorMessage: TEXT.CMS_IMPORT_ERROR_API_UPDATE
                            })
                        }
                    }
                    else if (isDelete) 
                    {
                        if (apiDelete)
                        {
                            // allTasks.push(new Promise((resolve, reject) =>
                            allTasks.push(() => (new Promise((resolve, reject) =>
                            {
                                let promiseBeforeDelete = Promise.resolve()

                                if (isUpdateBeforeDelete)
                                {
                                    if (apiUpdate)
                                    {
                                        promiseBeforeDelete = apiUpdate(mappingData)
                                    }
                                    else
                                    {
                                        promiseBeforeDelete = Promise.reject({
                                            code: -997,
                                            message: TEXT.CMS_IMPORT_ERROR_API_UPDATE
                                        })
                                    }
                                }

                                promiseBeforeDelete
                                    .then(() =>
                                    {
                                        return apiDelete(mappingData)
                                    })
                                    .then(() =>
                                    {
                                        this.setState(
                                            (state) => ({
                                                countDelete: state.countDelete + 1,
                                                countImport: state.countImport + 1
                                            }),
                                            () =>
                                            {
                                                resolve()
                                            }
                                        )
                                    })
                                    .catch(errorDelete =>
                                    {
                                        // I don't want to stop import other data
                                        // console.log('delete error excel row', row[ExcelParser.DEBUG_FIELD], 'log', errorDelete)
                                        this.setState(
                                            (state) => ({
                                                countImport: state.countImport + 1,
                                                errorDelete: [
                                                    ...state.errorDelete,
                                                    {
                                                        [ExcelParser.DEBUG_FIELD]: `${sheetName} :: ${row[ExcelParser.DEBUG_FIELD]}`,
                                                        code: errorDelete.code,
                                                        message: errorDelete.message.message
                                                    }
                                                ]
                                            }),
                                            () =>
                                            {
                                                resolve()
                                            }
                                        )
                                    })
                            })))
                        }
                        else
                        {
                            this.setState({
                                isError: true,
                                errorMessage: TEXT.CMS_IMPORT_ERROR_API_DELETE
                            })
                        }
                    }
                }
            })
        })

        // Promise.all(allTasks)
        Concurrency
            .all({
                promiseProviders: allTasks,
                maxConcurrency: currentConcurrency
            })
            .then(() =>
            {
                this.setState({
                    isDone: true
                })
            })
            .catch(error =>
            {
                this.setState({
                    isError: true,
                    errorMessage: error.message ? error.message : error
                })
            })
            .finally(() =>
            {
                this.props.ClearLoading()
            })
    }

    predictMapping = (fields, file) =>
    {
        const {
            bestMatchRating
        } = this.props

        var predicts = {}
        var excelColumns = Object.keys(file).reduce((allColumns, sheetName) =>
        {
            let headers = file[sheetName].headers
            let sheetColumns = Object.keys(headers).map(column =>
            {
                let excelName = headers[column].trim()
                if (excelName.length > 0)
                {
                    let key = `${sheetName}::${excelName}`
                    return key
                }
                return null
            })
            return allColumns.concat(sheetColumns.filter(column => column !== null))
        }, [])

        fields.forEach(item =>
        {
            let result = findBestMatch(item.field, excelColumns)
            let result2 = findBestMatch(item.title ? item.title : item.field, excelColumns)
            if (result.bestMatch.rating > bestMatchRating || result2.bestMatch.rating > bestMatchRating)
            {
                if (result.bestMatch.rating > result2.bestMatch.rating)
                {
                    predicts[item.field] = result.bestMatch.target
                }
                else
                {
                    predicts[item.field] = excelColumns[result2.bestMatchIndex]
                }
            }
            else
            {
                predicts[item.field] = DONT_IMPORT
            }
        })

        return predicts
    }

    showError = (name) => (evt) =>
    {
        this.setState({
            showError: name
        })
    }

    hideError = () =>
    {
        this.setState({
            showError: ''
        })
    }

    handleExportError = (name) => (evt) =>
    {
        console.log('handleExportError', name)
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
                startIcon={<Icons.IconAdd/>}
                onClick={this.handleImport}
                
            >
                {title}
            </Button>
        )
    }

    renderSteppers()
    {
        const {
            classes
        } = this.props

        const {
            showError,
            step
        } = this.state

        return (
            <Slide direction={'right'} in={showError.length === 0} mountOnEnter unmountOnExit >
                <Paper elevation={4} className={classes.stepperContainer}>
                    {
                        step < STEPPER_TITLES.length - 1 &&
                        < IconButton onClick={this.handleClose(false)} className={classes.buttonClose}>
                            <CloseIcon />
                        </IconButton>
                    }
                    <Stepper
                        activeStep={step}
                        orientation={'vertical'}
                        className={classes.stepperRoot}
                    >
                        {
                            STEPPER_TITLES.map((title, index) => (
                                <Step key={index}>
                                    <StepLabel>{title}</StepLabel>
                                    {
                                        index === step &&
                                        <StepContent>
                                            <Typography>{STEPPER_DESCRIPTIONS[index]}</Typography>
                                            {
                                                this.renderStep(index)
                                            }
                                        </StepContent>
                                    }
                                </Step>
                            ))
                        }
                    </Stepper>
                </Paper>
            </Slide >
        )
    }

    renderStep(index)
    {
        switch (index)
        {
            case 0:
                return this.renderStep1()
            case 1:
                return this.renderStep2()
            case 2:
                return this.renderStep3()
            case 3:
                return this.renderStep4()
            default: break
        }
        return null
    }

    renderStep1()
    {
        const {
            classes
        } = this.props

        const {
            step,
            file
        } = this.state

        return (
            <Fragment>
                <div className={classes.divStep}>
                    <TextField
                        inputProps={{
                            id: 'fileSelect',
                            type: 'file',
                            accept: `${EXCEL_XLS}, ${EXCEL_XLSX}, .xls, .xlsx`
                        }}
                        fullWidth={true}
                        onChange={this.handleFileUpload}
                    />
                </div>
                {
                    this.renderStepAction(step === 0, file === null)
                }
            </Fragment>
        )
    }

    renderStep3()
    {
        let {
            classes,
            fields,
            tooltipDeleteExtendFunction
        } = this.props

        const {
            step,
            file,
            mapping,
            isDelete,
        } = this.state

        if (!file)
        {
            return null
        }

        if (isDelete)
        {
            let tmp = _.filter(fields, value => (value.hasOwnProperty('action') && _.includes(value.action, 'delete')))
            if (!_.isEmpty(tmp))
            {
                fields = tmp
            }
        }

        const duplicate = _.groupBy(mapping, (value) =>
        {
            return value
        })

        // console.log('duplicate', duplicate)

        const hasDuplicate = _.reduce(duplicate, (sum, value) =>
        {
            if (value.length > 1 && value[0] !== DONT_IMPORT)
            {
                return sum + value.length
            }
            return sum
        }, 0)

        const allSheets = Object.keys(file)

        return (
            <Fragment>
                <div className={classes.divStep}>
                    <div className={classes.divColumn} style={{ width: '100%', maxHeight: '50vh', overflowY: 'none', border: '1px solid black' }}>
                        <div className={clsx(classes.divRow, classes.divMappingRow)} style={{ backgroundColor: '#4A58B2', flex: 2 }} >
                            <div className={clsx(classes.divColumn, classes.divMappingColumn)} style={{ flex: 1 }}>
                                <Typography variant={'h6'} style={{ color: 'white' }}>{TEXT.CMS_IMPORT_LABEL_MAPPING_TO}</Typography>
                            </div>
                            <div className={clsx(classes.divColumn, classes.divMappingColumn)} style={{ flex: 1 }}>
                                <Typography variant={'h6'} style={{ color: 'white' }}>{TEXT.CMS_IMPORT_LABEL_MAPPING_FROM}</Typography>
                            </div>
                        </div>
                        <div style={{ height: '100%', overflowY: 'auto' }}>
                            {
                                fields.map((item, index) => (
                                    <div key={index} className={clsx(classes.divRow, classes.divMappingRow)} style={{ backgroundColor: index % 2 === 0 ? '#FFF' : '#E1E5F280', flex: 2, margin: '5px 0' }}>
                                        <div className={clsx(classes.divColumn, classes.divMappingColumn)} style={{ flex: 1 }}>
                                            {
                                                item.title
                                                    ? (
                                                        <div className={clsx(classes.divColumn)} style={{ justifyContent: 'flex-start' }}>
                                                            <Typography variant={'body1'}>{item.title}</Typography>
                                                            <Typography variant={'body2'}>({item.field})</Typography>
                                                        </div>
                                                    )
                                                    : (
                                                        <div className={clsx(classes.divColumn)} style={{ justifyContent: 'flex-start' }}>
                                                            <Typography variant={'body1'}>{item.field}</Typography>
                                                        </div>
                                                    )
                                            }
                                        </div>
                                        <div className={clsx(classes.divColumn, classes.divMappingColumn)} style={{ flex: 1 }}>
                                            <Select
                                                value={mapping[item.field] || DONT_IMPORT}
                                                name={item.field}
                                                onChange={this.handleFieldChange}
                                                disableUnderline={true}
                                                classes={{ root: clsx(classes.divRow, classes.menuItem) }}
                                            >
                                                <MenuItem value={DONT_IMPORT} classes={{ root: clsx(classes.divRow, classes.menuItem) }}>
                                                    <span className={classes.menuIcon}>
                                                        <DontImportIcon style={{ color: '#FF0000' }} />
                                                    </span>
                                                    <em>{DONT_IMPORT}</em>
                                                </MenuItem>
                                                {
                                                    allSheets.reduce((allColumns, sheetName) =>
                                                    {
                                                        let headers = file[sheetName].headers
                                                        let sheetColumns = Object.keys(headers).map((column, index) =>
                                                        {
                                                            let excelName = headers[column].trim()
                                                            if (excelName.length > 0)
                                                            {
                                                                let key = `${sheetName}::${excelName}`
                                                                return (
                                                                    <MenuItem key={key} value={key} classes={{ root: clsx(classes.divRow, classes.menuItem) }}>
                                                                        {
                                                                            duplicate[key] && duplicate[key].length === 1 &&
                                                                            <span className={classes.menuIcon}>
                                                                                <ImportedIcon style={{ color: '#00FF00' }} />
                                                                            </span>
                                                                        }
                                                                        {
                                                                            duplicate[key] && duplicate[key].length > 1 &&
                                                                            <Tooltip
                                                                                title={Utils.parseString(TEXT.CMS_IMPORT_TOOLTIP_DUPLICATE, duplicate[key].length, excelName)}
                                                                                arrow={true}
                                                                                placement={'top'}

                                                                            >
                                                                                <span className={classes.menuIcon}>
                                                                                    <WarningIcon style={{ color: '#F9C257' }} />
                                                                                </span>
                                                                            </Tooltip>
                                                                        }
                                                                        {
                                                                            duplicate[key] === undefined &&
                                                                            <Tooltip
                                                                                title={Utils.parseString(TEXT.CMS_IMPORT_TOOLTIP_AVAILABLE)}
                                                                                arrow={true}
                                                                                placement={'top'}

                                                                            >
                                                                                <span className={classes.menuIcon}>
                                                                                    <AvailableIcon style={{ color: '#4A58B2' }} />
                                                                                </span>
                                                                            </Tooltip>
                                                                        }
                                                                        {
                                                                            allSheets.length > 1
                                                                                ? (
                                                                                    <div className={clsx(classes.divColumn)} style={{ justifyContent: 'flex-start' }}>
                                                                                        <Typography variant={'body1'}>{excelName}</Typography>
                                                                                        <Typography variant={'body2'}>({sheetName})</Typography>
                                                                                    </div>
                                                                                )
                                                                                : (
                                                                                    <div className={clsx(classes.divColumn)} style={{ justifyContent: 'flex-start' }}>
                                                                                        <Typography variant={'body1'}>{excelName}</Typography>
                                                                                    </div>
                                                                                )
                                                                        }
                                                                    </MenuItem>
                                                                )
                                                            }

                                                            return null
                                                        })
                                                        return allColumns.concat(sheetColumns.filter(column => column !== null))
                                                    }, [])
                                                }
                                            </Select>
                                        </div>
                                    </div>
                                ))
                            }
                        </div>
                    </div>
                    {
                        !isDelete && <Typography style={{ marginTop: 5, fontWeight: 500, fontStyle: 'italic', opacity: 0.5 }} >{tooltipDeleteExtendFunction}</Typography>
                    }       
                </div>
                {
                    this.renderStepAction(step === 0, hasDuplicate !== 0)
                }
            </Fragment >
        )
    }

    getRGBColor(min, max, value)
    {
        let _normalize = (min, max, value) =>
        {
            return (value - min) / (max - min) * 2
        }

        let _distance = (value, color) =>
        {
            let distance = Math.abs(value - color)
            let colorStrength = 1 - distance
            if (colorStrength < 0) 
            {
                colorStrength = 0
            }
            return parseInt(Math.round(colorStrength * 255))
        }

        let normalizeValue = _normalize(min, max, value)
        return {
            r: _distance(normalizeValue, 2),
            g: _distance(normalizeValue, 0),
            b: _distance(normalizeValue, 1)
        }
    }

    renderStep2()
    {
        const {
            classes,
            disabledUpdateBeforeDelete,
            disabledUpdateAfterAdd,
            disabledUpdate,
            disabledDelete,
            titleAddFunction,
            titleAddExtendFunction,
            titleUpdateFunction,
            titleDeleteFunction,
            titleDeleteExtendFunction
        } = this.props

        const {
            step,
            isAdd,
            isUpdateAfterAdd,
            isUpdate,
            isDelete,
            isUpdateBeforeDelete,
            currentConcurrency,
            tempConcurrency,
            maxConcurrency
        } = this.state

        // const sliderColor = `rgb(${tempConcurrency * 255 / maxConcurrency}, ${(maxConcurrency - tempConcurrency) * 255 / maxConcurrency}, 0)`
        const color = this.getRGBColor(1, maxConcurrency, tempConcurrency)
        const sliderColor = `rgb(${color.r}, ${color.g}, ${color.b})`
        // console.log('sliderColor', sliderColor)

        return (
            <Fragment>
                <div className={classes.divStep}>
                    <FormGroup>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Radio
                                        color={'primary'}
                                        name={'isAdd'}
                                        // value={isAdd}
                                        checked={isAdd}
                                        onChange={this.handleImportChange}
                                    />
                                }
                                label={titleAddFunction}
                            />
                            {
                                !disabledUpdateAfterAdd && (
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            disabled={!isAdd}
                                            color={!isAdd ? 'default' : 'primary'}
                                            name={'isUpdateAfterAdd'}
                                            checked={isUpdateAfterAdd}
                                            onChange={this.handleImportChange}
                                            style={{
                                                marginLeft: 30
                                            }}
                                        />
                                    }
                                    label={titleAddExtendFunction}
                                />)
                            }
                        </FormGroup>
                        {   
                            !disabledUpdate && (
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Radio
                                            color={'primary'}
                                            name={'isUpdate'}
                                            // value={isUpdate}
                                            checked={isUpdate}
                                            onChange={this.handleImportChange}
                                        />
                                    }
                                    label={titleUpdateFunction}
                                />
                            </FormGroup>)
                        }
                        {
                            !disabledDelete &&
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Radio
                                            color={'primary'}
                                            name={'isDelete'}
                                            // value={isDelete}
                                            checked={isDelete}
                                            onChange={this.handleImportChange}
                                        />
                                    }
                                    label={titleDeleteFunction}
                                />
                                { 
                                    !disabledUpdateBeforeDelete && (
                                    <FormControlLabel
                                        control={
                                            <Checkbox
                                                disabled={!isDelete}
                                                color={!isDelete ? 'default' : 'primary'}
                                                name={'isUpdateBeforeDelete'}
                                                checked={isUpdateBeforeDelete}
                                                onChange={this.handleImportChange}
                                                style={{
                                                    marginLeft: 30
                                                }}
                                            />
                                        }
                                        label={titleDeleteExtendFunction}
                                    />)
                                }
                            </FormGroup>
                        }
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Slider
                                        key={`slider-${currentConcurrency}`}
                                        defaultValue={currentConcurrency}
                                        value={tempConcurrency}
                                        step={1}
                                        max={maxConcurrency}
                                        min={1}
                                        marks
                                        valueLabelDisplay={'auto'}
                                        onChangeCommitted={this.handleSliderChange('currentConcurrency')}
                                        onChange={this.handleSliderChange('tempConcurrency')}
                                        style={{
                                            color: sliderColor
                                        }}
                                    />
                                }
                                labelPlacement={'top'}
                                label={`${TEXT.CMS_IMPORT_LABEL_CONCURRENCY}: ${currentConcurrency}`}
                                style={{
                                    alignItems: 'flex-start',
                                    margin: '10px 0'
                                }}
                            />
                        </FormGroup>
                    </FormGroup>
                </div>
                {
                    this.renderStepAction(step === 0, false)
                }
            </Fragment>
        )
    }

    renderStep4()
    {
        const {
            classes,
            enabledOnceImport,
            requestLimitSize
        } = this.props

        const {
            step,
            isDone,
            isError,
            isAdd,
            isUpdateAfterAdd,
            isUpdate,
            isDelete,
            errorMessage,
            errorAdd,
            errorUpdate,
            errorDelete,
            countAdd,
            countUpdate,
            countDelete,
            countImport,
            file
        } = this.state

        if (!file)
        {
            return null
        }

        const totalData = Object.keys(file).reduce((total, sheetName) =>
        {
            let data = file[sheetName].data
            return total + data.length
        }, 0)

        const totalErrorAdd = isDone
            ? errorAdd
                .sort((a, b) =>
                {
                    let rowA = Number(a[ExcelParser.DEBUG_FIELD])
                    let rowB = Number(b[ExcelParser.DEBUG_FIELD])
                    return rowA - rowB
                })
                .filter((item, pos, self) =>
                {
                    // remove duplicate rowID after sort
                    return !pos || item[ExcelParser.DEBUG_FIELD] !== self[pos - 1][ExcelParser.DEBUG_FIELD]
                })
                .length
            : errorAdd.length

        const totalErrorUpdate = isDone
            ? errorUpdate
                .sort((a, b) =>
                {
                    let rowA = Number(a[ExcelParser.DEBUG_FIELD])
                    let rowB = Number(b[ExcelParser.DEBUG_FIELD])
                    return rowA - rowB
                })
                .filter((item, pos, self) =>
                {
                    // remove duplicate rowID after sort
                    return !pos || item[ExcelParser.DEBUG_FIELD] !== self[pos - 1][ExcelParser.DEBUG_FIELD]
                })
                .length
            : errorUpdate.length

        const totalErrorDelete = isDone
            ? errorDelete
                .sort((a, b) =>
                {
                    let rowA = Number(a[ExcelParser.DEBUG_FIELD])
                    let rowB = Number(b[ExcelParser.DEBUG_FIELD])
                    return rowA - rowB
                })
                .filter((item, pos, self) =>
                {
                    // remove duplicate rowID after sort
                    return !pos || item[ExcelParser.DEBUG_FIELD] !== self[pos - 1][ExcelParser.DEBUG_FIELD]
                })
                .length
            : errorDelete.length
         
        return (
            <Fragment>
                <div className={classes.divStep}>
                    <div className={clsx(classes.divColumn)}>
                        <Typography variant={'subtitle1'}>{Utils.parseString(TEXT.CMS_IMPORT_LABEL_COUNT_IMPORT, enabledOnceImport ? Math.abs(countImport - 1)*requestLimitSize + this.countSessionData : countImport, totalData)}</Typography>
                        {
                            isAdd &&
                            <div className={clsx(classes.divRow)} style={{ alignItems: 'center' }}>
                                <Typography variant={'subtitle1'}>{Utils.parseString(TEXT.CMS_IMPORT_LABEL_COUNT_ADD, enabledOnceImport ? Math.abs(countAdd - 1)*requestLimitSize + this.countSessionData : countAdd)}</Typography>
                                {
                                    totalErrorAdd > 0 &&
                                    <Tooltip
                                        title={Utils.parseString(TEXT.CMS_IMPORT_TOOLTIP_DETAIL_ADD, totalErrorAdd, totalErrorAdd > 1 ? 's' : '')}
                                        arrow={true}
                                        placement={'top'}

                                    >
                                        <IconButton onClick={this.showError('errorAdd')} style={{ marginLeft: 5 }} size={'small'}>
                                            <AvailableIcon style={{ color: '#F9C257' }} />
                                        </IconButton>
                                    </Tooltip>
                                }
                            </div>
                        }
                        {
                            isUpdate &&
                            <div className={clsx(classes.divRow)} style={{ alignItems: 'center' }}>
                                <Typography variant={'subtitle1'}>{Utils.parseString(TEXT.CMS_IMPORT_LABEL_COUNT_UPDATE, enabledOnceImport ? Math.abs(countUpdate - 1)*requestLimitSize + this.countSessionData : countUpdate)}</Typography>
                                {
                                    totalErrorUpdate > 0 &&
                                    <Tooltip
                                        title={Utils.parseString(TEXT.CMS_IMPORT_TOOLTIP_DETAIL_UPDATE, totalErrorUpdate, totalErrorUpdate > 1 ? 's' : '')}
                                        arrow={true}
                                        placement={'top'}

                                    >
                                        <IconButton onClick={this.showError('errorUpdate')} style={{ marginLeft: 5 }} size={'small'}>
                                            <AvailableIcon style={{ color: '#F9C257' }} />
                                        </IconButton>
                                    </Tooltip>
                                }
                            </div>
                        }
                        {
                            isUpdateAfterAdd &&
                            <div className={clsx(classes.divRow)} style={{ alignItems: 'center' }}>
                                <Typography variant={'subtitle1'}>{Utils.parseString(TEXT.CMS_IMPORT_LABEL_COUNT_UPDATE, enabledOnceImport ? Math.abs(countUpdate - 1)*requestLimitSize + this.countSessionData : countUpdate)}</Typography>
                                {
                                    totalErrorUpdate > 0 &&
                                    <Tooltip
                                        title={Utils.parseString(TEXT.CMS_IMPORT_TOOLTIP_DETAIL_UPDATE, totalErrorUpdate, totalErrorUpdate > 1 ? 's' : '')}
                                        arrow={true}
                                        placement={'top'}

                                    >
                                        <IconButton onClick={this.showError('errorUpdate')} style={{ marginLeft: 5 }} size={'small'}>
                                            <AvailableIcon style={{ color: '#F9C257' }} />
                                        </IconButton>
                                    </Tooltip>
                                }
                            </div>
                        }
                        {
                            isDelete &&
                            <div className={clsx(classes.divRow)} style={{ alignItems: 'center' }}>
                                <Typography variant={'subtitle1'}>{Utils.parseString(TEXT.CMS_IMPORT_LABEL_COUNT_DELETE, enabledOnceImport ? Math.abs(countDelete - 1)*requestLimitSize + this.countSessionData : countDelete)}</Typography>
                                {
                                    totalErrorDelete > 0 &&
                                    <Tooltip
                                        title={Utils.parseString(TEXT.CMS_IMPORT_TOOLTIP_DETAIL_DELETE, totalErrorDelete, totalErrorDelete > 1 ? 's' : '')}
                                        arrow={true}
                                        placement={'top'}

                                    >
                                        <IconButton onClick={this.showError('errorDelete')} style={{ marginLeft: 5 }} size={'small'}>
                                            <AvailableIcon style={{ color: '#F9C257' }} />
                                        </IconButton>
                                    </Tooltip>
                                }
                            </div>
                        }
                        {
                            isDone &&
                            <Typography variant={'subtitle1'}>{TEXT.CMS_IMPORT_DESCRIPTION_COMPLETE}</Typography>
                        }
                        {
                            isError &&
                            <Typography variant={'subtitle1'} color={'error'} >{Utils.parseString(TEXT.CMS_IMPORT_DESCRIPTION_ERROR, errorMessage)}</Typography>
                        }
                    </div>

                </div>
                {
                    this.renderStepAction(step === 0, !isDone && !isError)
                }
            </Fragment >
        )
    }

    renderStepAction(disableBack, disableNext)
    {
        const {
            classes
        } = this.props
        return (
            <div className={classes.divAction}>
                {
                    this.state.step < STEPPER_TITLES.length - 1 &&
                    <Button
                        variant={'outlined'}
                        className={classes.stepButton}
                        onClick={this.handleBack}
                        disabled={disableBack}
                    >
                        {TEXT.CMS_IMPORT_BUTTON_BACK}
                    </Button>
                }
                {
                    this.state.step < STEPPER_TITLES.length - 1 &&
                    <Button
                        variant={'outlined'}
                        className={classes.stepButton}
                        onClick={this.handleNext}
                        disabled={disableNext}
                    >
                        {TEXT.CMS_IMPORT_BUTTON_NEXT}
                    </Button>
                }
                {
                    this.state.step === STEPPER_TITLES.length - 1 &&
                    <Button
                        variant={'outlined'}
                        className={classes.stepButton}
                        onClick={this.handleClose(true)}
                        disabled={disableNext}
                    >
                        {TEXT.CMS_IMPORT_BUTTON_FINISH}
                    </Button>
                }
            </div>
        )
    }

    renderError()
    {
        const {
            classes,
            location: {
                pathname
            }
        } = this.props

        const {
            showError,
            isDone
        } = this.state

        let dataError = []
        if (isDone && showError.length > 0)
        {
            dataError = this.state[showError]
                .sort((a, b) =>
                {
                    let rowA = Number(a[ExcelParser.DEBUG_FIELD])
                    let rowB = Number(b[ExcelParser.DEBUG_FIELD])
                    return rowA - rowB
                })
                .filter((item, pos, self) =>
                {
                    // remove duplicate rowID after sort
                    return !pos || item[ExcelParser.DEBUG_FIELD] !== self[pos - 1][ExcelParser.DEBUG_FIELD]
                })
        }
        else
        {
            return null
        }

        const excelFileName = Utils.parseString(TEXT.CMS_IMPORT_LABEL_ERROR_EXPORT, pathname.replace(/\//g, '_'))

        return (
            <Slide direction={'left'} in={showError.length > 0} mountOnEnter unmountOnExit >
                <Paper elevation={4} className={classes.errorContainer}>
                    <div className={clsx(classes.errorRoot, classes.divColumn)}>
                        <div className={classes.divColumn} style={{ width: '100%', maxHeight: '50vh', overflowY: 'none', border: '1px solid black' }}>
                            <div className={clsx(classes.divRow, classes.divMappingRow)} style={{ backgroundColor: '#4A58B2', flex: 4 }} >
                                <div className={clsx(classes.divColumn, classes.divMappingColumn)}>
                                    <Typography variant={'h6'} style={{ color: 'white' }}>{TEXT.CMS_IMPORT_LABEL_ERROR_ROW}</Typography>
                                </div>
                                <div className={clsx(classes.divColumn, classes.divMappingColumn)}>
                                    <Typography variant={'h6'} style={{ color: 'white' }}>{TEXT.CMS_IMPORT_LABEL_ERROR_CODE}</Typography>
                                </div>
                                <div className={clsx(classes.divColumn, classes.divMappingColumn)} style={{ flex: 2 }}>
                                    <Typography variant={'h6'} style={{ color: 'white' }}>{TEXT.CMS_IMPORT_LABEL_ERROR_MESSAGE}</Typography>
                                </div>
                            </div>
                            <div style={{ height: '100%', overflowY: 'auto' }}>
                                {
                                    dataError.map((error, index) => (
                                        <div key={index} className={clsx(classes.divRow, classes.divMappingRow)} style={{ backgroundColor: index % 2 === 0 ? '#FFF' : '#E1E5F280', flex: 4, margin: '5px 0' }}>
                                            <div className={clsx(classes.divColumn, classes.divMappingColumn)}>
                                                {error[ExcelParser.DEBUG_FIELD]}
                                            </div>
                                            <div className={clsx(classes.divColumn, classes.divMappingColumn)}>
                                                {
                                                    error.code
                                                }
                                            </div>
                                            <div className={clsx(classes.divColumn, classes.divMappingColumn)} style={{ flex: 2, whiteSpace: 'pre-wrap' }}>
                                                {
                                                    _.isObject(error.message)
                                                    ? error.message.message
                                                    : error.message
                                                }
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                        <div style={{ margin: '5px 0' }}>
                            {
                                // because of optimize render in renderStep4
                                isDone
                                    ? <Typography variant={'subtitle2'}>{Utils.parseString(TEXT.CMS_IMPORT_ERROR_TOTAL, dataError.length)}</Typography>
                                    : <Typography variant={'subtitle2'}>{Utils.parseString(TEXT.CMS_IMPORT_ERROR_TOTAL, this.state[showError].length)}</Typography>
                            }
                        </div>
                        <div className={classes.divAction}>
                            {/* <CmsExcel
                                classes={{
                                    button: classes.stepButton
                                }}
                                title={TEXT.CMS_IMPORT_BUTTON_EXPORT}
                                buttonColor={'default'}
                                buttonVariant={'outlined'}
                                data={dataError}
                                sheetName={showError}
                                fileName={excelFileName}
                                columns={[
                                    { title: TEXT.CMS_IMPORT_LABEL_ERROR_ROW, field: ExcelParser.DEBUG_FIELD },
                                    { title: TEXT.CMS_IMPORT_LABEL_ERROR_CODE, field: 'code' },
                                    { title: TEXT.CMS_IMPORT_LABEL_ERROR_MESSAGE, field: 'message' },
                                ]}
                            /> */}
                            <Button
                                variant={'outlined'}
                                className={classes.stepButton}
                                onClick={this.hideError}
                            >
                                {TEXT.CMS_IMPORT_BUTTON_CLOSE}
                            </Button>
                        </div>
                    </div>
                </Paper>

            </Slide >
        )
    }

    render()
    {
        const {
            controlPermission,
            disabled,
            classes
        } = this.props

        const {
            isOpened
        } = this.state

        return (
            <Fragment>
                {
                    controlPermission
                        ? this.renderPermissionButton(disabled)
                        : this.renderButton(disabled)
                }
                <Zoom in={isOpened} mountOnEnter unmountOnExit>
                    <Backdrop className={classes.backdrop} open={true}>
                        {
                            this.renderSteppers()
                        }
                        {
                            this.renderError()
                        }
                    </Backdrop>
                </Zoom>
            </Fragment>
        )
    }


}

CmsImport.propTypes = {
    classes: PropTypes.object.isRequired,
    title: PropTypes.string,
    controlPermission: PropTypes.shape({
        link: PropTypes.string,
        attribute: PropTypes.string
    }),
    disabled: PropTypes.bool,
    fields: PropTypes.arrayOf(PropTypes.shape({
        field: PropTypes.string.isRequired,
        title: PropTypes.string

        // [TODO]: self normalize data by using field type
        //type: PropTypes.oneOf(['string', 'boolean', 'numeric', 'date', 'datetime', 'time', 'currency']),
    })).isRequired,
    apiAdd: PropTypes.func,
    apiUpdate: PropTypes.func,
    apiDelete: PropTypes.func,
    // https://stackoverflow.com/questions/33278862/reactjs-component-proptypes-specify-a-function-type-with-a-set-number-paramete
    normalizeData: PropTypes.func,
    onProgress: PropTypes.func,
    formatData: PropTypes.func,
    excelParser: PropTypes.func,
    buttonColor: PropTypes.oneOf(['default', 'inherit', 'primary', 'secondary']),
    buttonVariant: PropTypes.oneOf(['contained', 'outlined', 'text']),
    bestMatchRating: PropTypes.number,
    disabledUpdateBeforeDelete: PropTypes.bool,
    disabledUpdateAfterAdd: PropTypes.bool,
    disabledUpdate: PropTypes.bool,
    disabledDelete: PropTypes.bool,
    enabledOnceImport: PropTypes.bool,
    requestLimitSize: PropTypes.number, // must use with enabledOnceImport
    titleAddFunction: PropTypes.string,
    titleAddExtendFunction: PropTypes.string,
    titleDeleteFunction: PropTypes.string,
    titleDeleteExtendFunction: PropTypes.string,
    titleUpdateFunction: PropTypes.string,
    tooltipDeleteExtendFunction: PropTypes.string,
}

CmsImport.defaultProps = {
    title: TEXT.CMS_EXCEL_BUTTON_IMPORT_TITLE,
    controlPermission: null,
    disabled: false,
    fields: [],
    buttonColor: 'primary',
    buttonVariant: 'contained',
    bestMatchRating: 0.5,
    disabledUpdateBeforeDelete: false,
    disabledUpdateAfterAdd: false,
    disabledUpdate: true,
    disabledDelete: true,
    enabledOnceImport: false,
    requestLimitSize: 100,
    titleAddFunction: TEXT.CMS_IMPORT_LABEL_ADD,
    titleAddExtendFunction: TEXT.CMS_IMPORT_LABEL_UPDATE_AFTER_ADD,
    titleDeleteFunction: TEXT.CMS_IMPORT_LABEL_DELETE,
    titleDeleteExtendFunction: TEXT.CMS_IMPORT_LABEL_UPDATE_BEFORE_DELETE,
    titleUpdateFunction: TEXT.CMS_IMPORT_LABEL_UPDATE,
    tooltipDeleteExtendFunction: ''
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
)(CmsImport);
