import React, { Fragment } from 'react'
import PropTypes from 'prop-types';

import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'

import { Typography, Button, Accordion, AccordionSummary, AccordionDetails, Backdrop } from '@material-ui/core'
import { MuiPickersUtilsProvider, DateTimePicker } from '@material-ui/pickers'
import DateFnsUtils from '@date-io/date-fns'
import moment from 'moment'
import clsx from 'clsx'

import { ReportDateDelay } from '../../Defines'
import ModalDialog from '../Dialogs/ModalDialog'

import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

import { withMultipleStyles } from '../../Styles'

import * as _ from 'lodash'
import Utils from '../../Utils'
import TEXT from './Data/Text';

const EXPANSION_HEIGHT = 40

const style = (theme) => ({
    expansionPanelDatePicker: {
        width: 490,
        // because this is the 1st left component
        marginLeft: '0 !important',
        height: '100%',
        borderRadius: 5
    },
    expansionPanelDatePickerSingleChoice: {
        width: 305,
    },
    expansionPanelDatePickerExpanded: {
        // because this is the 1st left component
        margin: '0 !important',
        // Fixed: backdrop not overlay menu
        zIndex: theme.zIndex.drawer + 1
    },
    expansionPanelSummary: {
        height: '100%',
        minHeight: EXPANSION_HEIGHT,
        '&.Mui-expanded': {
            minHeight: EXPANSION_HEIGHT
        }
    },
    expansionPanelDetail: {
        backgroundColor: 'white',
        borderRadius: '25px',
        padding: '10px'
    },
    datePicker: {
        width: 200,
        paddingRight: 5
    },
    datePickerPopoverRoot: {
        // backgroundColor: 'rgba(0, 0, 0, 0.4)'
        // we have backdrop overlay already
        backgroundColor: 'transparent'
    },
})

const convertDayToMs = (day) => (day * 24 * 60 * 60 * 1000)

const convertMsToDay = (ms) => (parseInt(ms / 1000 / 24 / 60 / 60))

const MAX_RANGE_DAILY = 31
const MAX_RANGE_MONTHLY = 365
const MAX_DATE_OFFSET = 0

const DEFAULT_DATE_RANGE = 0
const DEFAULT_MONTH_RANGE = 0

// https://material-ui-pickers.dev/api/DatePicker

const styles = theme => ({
	
})

class CmsDate extends React.Component
{
    constructor(props)
    {
        super(props)
        
        let { now, previous } = (this.props.disableCheckMaxRange && this.props.initDate)
                                ?   Utils.getDateRange(this.props.initDate.date_begin, this.props.initDate.date_end)
                                :   Utils.getPreviousDateFromNow(this.props.dateRange)
                                    
        let { now: monthNow, previous: monthPrevious } = (this.props.disableCheckMaxRange && this.props.initDate)
                                                            ?   Utils.getDateRange(this.props.initDate.date_begin, this.props.initDate.date_end)
                                                            :   Utils.getPreviousDateFromNow(this.props.monthRange)
                                                                
        let monthBegin = new Date(monthPrevious.setDate(1))
        // let monthEnd = new Date(monthNow.getFullYear(), monthNow.getMonth() + 1, 0)
        let monthEnd = new Date(monthNow.setDate(0))

        now = moment(now).add(this.props.maxDateOffset, 'days').toDate()

        this.state = {
            showWarning: false,
            limitApplied: false,
            expanded: false,

            // date
            date_begin: previous,
            date_end: now,
            date_begin_confirm: previous,
            date_end_confirm: now,

            // year-month
            month_begin: monthBegin,
            month_end: monthEnd,
            month_begin_confirm: monthBegin,
            month_end_confirm: monthEnd,

            month_max: monthEnd,
            date_max: this.props.disableFuture ? now : moment('2100-01-01', 'YYYY-MM-DD').toDate(),
            date_min: this.props.disablePast ? now : moment('2020-01-01', 'YYYY-MM-DD').toDate()
        }
    }

    static getDerivedStateFromProps(nextProps, prevState)
    {
        const {
			selectedProject,
            privilege,
            dateRange,
            monthRange,
            disableFuture,
            disablePast
        } = nextProps
        
        let result = null

        if (!disablePast && !disableFuture && !prevState.limitApplied)
        {
            if (ReportDateDelay.hasOwnProperty(privilege[selectedProject]) && ReportDateDelay[privilege[selectedProject]] !== 0)
            {

                let limitDay = ReportDateDelay[privilege[selectedProject]]
                let limitDate = new Date()
                limitDate.setTime(prevState.date_max.getTime() - convertDayToMs(limitDay))

                result = {
                    limitApplied: true,
                    date_end: limitDate,
                    date_end_confirm: limitDate,
                    date_max: limitDate
                }

                // Fixed: JOG - QA - DEV branch
                if (prevState.date_begin.getTime() > limitDate.getTime())
                {
                    let dateBegin = Utils.getDateFromNow(limitDate, dateRange);
                    
                    // we should keep limitDate value, use clone here
                    let limitMonth = Utils.getDateFromNow(limitDate, 0)
                    let limitPrevMonth = Utils.getDateFromNow(limitDate, monthRange);

                    let monthBegin = new Date(limitPrevMonth.setDate(1))
                    let monthEnd = new Date(limitMonth.setDate(0))
                    
                    result = Object.assign({}, result, {
                        date_begin: dateBegin,
                        date_begin_confirm: dateBegin,

                        month_begin: monthBegin,
                        month_end: monthEnd,
                        month_max: monthEnd
                    })
                }
            }
            else
            {
                result = {
                    limitApplied: true
                }
            }
        }

        /*
        // always fixed date min to 2020-01-01
        if (nextProps.views.includes('date'))
        {
            if (prevState.date_min === undefined)
            {
                result = Object.assign({}, result, {
                    date_min: moment('2020-01-01', 'YYYY-MM-DD').toDate()
                })
            }
        }
        else
        {
            if (prevState.date_min !== undefined)
            {
                result = Object.assign({}, result, {
                    date_min: undefined
                })
            }
        }
        */

        // console.log(`result => ${result ? result.ignoredRender : 'null'}`)
        return result
    }

    componentDidMount()
    {
        if (this.props.raiseSubmitOnMounted)
        {
            this.handleApply(false)
        }
    }

    handleDateChange = (name) => (date) =>
    {
        if (name.includes('begin'))
        {
            if (!this.props.enableFullTimeFormat)
            {
                date.setHours(0, 0, 0, 0)
            }
        } 
        else if (name.includes('end'))
        {
            if (!this.props.enableFullTimeFormat)
            {
                date.setHours(23, 59, 59, 0)
            }

            const isDaily = this.props.views.includes('date')
            if (!isDaily)
            {
                let lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
                if (lastDayOfMonth.getTime() < this.state.month_max.getTime())
                {
                    date.setDate(lastDayOfMonth.getDate())
                } 
                else
                {
                    date.setDate(this.state.month_max.getDate())
                }
            }
        }

        this.setState({
            [name]: date
        })
    }

    handleExpansionPanelChange = (event, expanded) =>
    {
        this.setState({
            expanded
        })
    }

    handleApply = (confirmed) =>
    {
        const {
            date_begin, date_end,
            month_begin, month_end
        } = this.state

        if (confirmed)
        {
            this.setState({
                expanded: false,
                date_begin_confirm: date_begin,
                date_end_confirm: date_end,
                month_begin_confirm: month_begin,
                month_end_confirm: month_end
            })
        }

        const isDaily = this.props.views.includes('date')

        let begin = isDaily ? new Date(date_begin) : new Date(month_begin)
        let end = isDaily ? new Date(date_end) : new Date(month_end)

        this.props.onDateSubmit && this.props.onDateSubmit({
            date_begin: begin,
            date_end: end,
            // Tested 
            // https://www.unixtimestamp.com/index.php
            // https://www.epochconverter.com
            ms_begin_utc: this.props.enableFullTimeFormat ? Utils.convertToUTC(begin.getTime()) : begin.setUTCHours(24, 0, 0, 0),
            ms_end_utc: this.props.enableFullTimeFormat ? Utils.convertToUTC(end.getTime()) : date_end.setUTCHours(23, 59, 59, 0)
        })
    }

    handleSubmit = (evt) =>
    {
        evt.preventDefault()

        const isDaily = this.props.views.includes('date')
        const {
            date_begin, date_end, date_begin_confirm, date_end_confirm,
            month_begin, month_end, month_begin_confirm, month_end_confirm
        } = this.state

        let beginTime = isDaily ? date_begin.getTime() : month_begin.getTime()
        let endTime = isDaily ? date_end.getTime() : month_end.getTime()

        let beginConfirm = isDaily ? date_begin_confirm.getTime() : month_begin_confirm.getTime()
        let endConfirm = isDaily ? date_end_confirm.getTime() : month_end_confirm.getTime()

        let maxRange = isDaily ? convertDayToMs(this.props.maxRangeDaily) : convertDayToMs(this.props.maxRangeMonthly)

        if (beginTime !== beginConfirm || endTime !== endConfirm)
        {
            let diff = endTime - beginTime
            if (!this.props.disableCheckMaxRange && diff > maxRange)
            {
                this.setState({
                    showWarning: true
                })
            }
            else
            {
                this.handleApply(true)
            }
        }
        else
        {
            this.setState({
                expanded: false
            })
        }
    }

    handleConfirm = () =>
    {
        this.handleCancel()
        this.handleApply(true)
    }

    handleCancel = () =>
    {
        this.setState({
            showWarning: false
        })
    }

    renderCustomDay = (name) => (day, selectedDate, dayInCurrentMonth, dayComponent) =>
    {
        // console.log('selectedDate', selectedDate, 'dayInCurrentMonth', dayInCurrentMonth)
        const {
            date_max,
            date_begin,
            date_end
        } = this.state

        let backgroundAlpha = 0.1
        if (moment(day).format('YYYY-MM-DD') === moment(date_begin).format('YYYY-MM-DD')
            || moment(day).format('YYYY-MM-DD') === moment(date_end).format('YYYY-MM-DD'))
        {
            backgroundAlpha = 0.3
        }

        let style = {
            color: day.getTime() > date_max.getTime()
                ? 'rgba(0, 0, 0, 0.38)' // disable 
                : day.getDay() === 0
                    ? 'red' // Sunday
                    : day.getDay() === 6
                        ? 'blue' // Saturday
                        : '#1B1F43', // normal day
            backgroundColor: date_begin.getTime() <= day.getTime() && day.getTime() <= date_end.getTime()
                ? `rgba(102, 204, 255, ${backgroundAlpha})`
                : null
        }
        return React.cloneElement(dayComponent, {
            style: style
        })

    }

    renderWarning()
    {
        const {
            date_begin,
            date_end,
            showWarning
        } = this.state

        if (!showWarning)
        {
            return null
        }

        const {
            views,
            maxRangeDaily,
            maxRangeMonthly
        } = this.props

        let mbegin = moment(date_begin)
        let mend = moment(date_end)
        let isDaily = views.includes('date')

        return (
            <ModalDialog
                open={true}
                titleText={TEXT.MODAL_WARNING}
                confirmText={TEXT.MODAL_OK}
                cancelText={TEXT.MODAL_CANCEL}
                handleConfirmClick={this.handleConfirm}
                handleCancelClick={this.handleCancel}
            >
                <Typography>
                    {Utils.parseString(
                        TEXT.CMS_DATE_WARNING,
                        isDaily ? maxRangeDaily : maxRangeMonthly,
                        mbegin.format('MMM DD YYYY'),
                        mend.format('MMM DD YYYY'),
                        // convertMsToDay(date_end.getTime() - date_begin.getTime())
                        // mend.diff(mbegin, 'days')
                    )}
                </Typography>
            </ModalDialog>
        )
    }

    renderCalendar()
    {
        // console.log('CmsDate', this.props);
        const { 
            classes, style: customStyle, views, format, openTo, isSingleChoice,
            disableToolbar, disableFuture, disablePast, disabledStartDate, disabledEndDate, disabled
        } = this.props
        const {
            expanded,
            date_begin, date_end, date_begin_confirm, date_end_confirm,
            month_begin, month_end, month_begin_confirm, month_end_confirm,
            month_max, date_max, date_min
        } = this.state

        const isDaily = views.includes('date')
        const isValid = isSingleChoice 
                        ?   true
                        :   isDaily
                            ? date_end.getTime() >= date_begin.getTime()
                            : month_end.getTime() >= month_begin.getTime()

        return (
            <Accordion
                classes={{
                    root: clsx(classes.expansionPanelDatePicker, {[classes.expansionPanelDatePickerSingleChoice]: isSingleChoice}),
                    expanded: classes.expansionPanelDatePickerExpanded
                }}
                style={customStyle}
                variant="outlined"
                expanded={expanded}
                onChange={this.handleExpansionPanelChange}
                disabled={disabled}
            >
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    classes={{
                        root: classes.expansionPanelSummary
                    }}
                >
                    {
                        isDaily
                        ?   <Typography>
                            {
                                isSingleChoice 
                                ?   `${moment(date_begin_confirm).format(`${format.toUpperCase()} HH:mm`)}`
                                :   `${moment(date_begin_confirm).format(`${format.toUpperCase()} HH:mm`)}  --> ${moment(date_end_confirm).format(`${format.toUpperCase()} HH:mm`)}`
                            }
                            </Typography>
                        :   <Typography>
                            {
                                isSingleChoice
                                ?   `${moment(month_begin_confirm).format(format.toUpperCase())}`
                                :   `${moment(month_begin_confirm).format(format.toUpperCase())} --> ${moment(month_end_confirm).format(format.toUpperCase())}`
                            }
                            </Typography>
                    }
                </AccordionSummary>
                <AccordionDetails
                    classes={{
                        root: classes.expansionPanelDetail
                    }}
                >
                    <Backdrop open={expanded} />
                    <MuiPickersUtilsProvider utils={DateFnsUtils}>
                        <Fragment>
                            <DateTimePicker
                                autoOk={true}
                                className={classes.datePicker}
                                inputVariant="outlined"
                                variant="inline"
                                disableToolbar={disableToolbar}
                                format={`${format} HH:mm`}
                                ampm={false}
                                views={views}
                                openTo={openTo}
                                label={isSingleChoice ? '' : 'From'}
                                value={isDaily ? date_begin : month_begin}
                                onChange={isDaily ? this.handleDateChange('date_begin') : this.handleDateChange('month_begin')}
                                PopoverProps={{
                                    classes: {
                                        root: classes.datePickerPopoverRoot
                                    }
                                }}
                                maxDate={isDaily ? date_max : month_max}
                                minDate={date_min}
                                disableFuture={disableFuture}
                                disablePast={disablePast}
                                renderDay={this.renderCustomDay('date_begin')}
                                disabled={disabledStartDate}
                            />
                            {
                                !isSingleChoice &&
                                <DateTimePicker
                                    autoOk={true}
                                    className={classes.datePicker}
                                    inputVariant="outlined"
                                    variant="inline"
                                    disableToolbar={disableToolbar}
                                    format={`${format} HH:mm`}
                                    ampm={false}
                                    views={views}
                                    openTo={openTo}
                                    label={isSingleChoice ? '' : 'To'}
                                    value={isDaily ? date_end : month_end}
                                    onChange={isDaily ? this.handleDateChange('date_end') : this.handleDateChange('month_end')}
                                    PopoverProps={{
                                        classes: {
                                            root: classes.datePickerPopoverRoot
                                        }
                                    }}
                                    maxDate={isDaily ? date_max : month_max}
                                    minDate={date_min}
                                    disableFuture={disableFuture}
                                    disablePast={disablePast}
                                    renderDay={this.renderCustomDay('date_end')}
                                    disabled={disabledEndDate}
                                />
                            }
                        </Fragment>
                    </MuiPickersUtilsProvider>
                    <Button
                        disabled={!isValid}
                        variant={'contained'}
                        color={'primary'}
                        onClick={this.handleSubmit}
                    >
                        {isValid ? TEXT.MODAL_APPLY : TEXT.MODAL_INVALID}
                    </Button>
                </AccordionDetails>
            </Accordion>
        )
    }

    render()
    {
        return (
            <Fragment>
                {
                    this.renderCalendar()
                }
                {
                    this.renderWarning()
                }
            </Fragment>
        )
    }

    componentDidUpdate(prevProps, prevState)
    {
        if (!_.isEqual(prevProps.views.sort(), this.props.views.sort()))
        {
            if (this.props.raiseSubmitOnMounted)
            {
                this.handleApply(false)
            }
        }
    }
}

CmsDate.propTypes =
{
    classes: PropTypes.object.isRequired,
    onDateSubmit: PropTypes.func,
    raiseSubmitOnMounted: PropTypes.bool,
    // custom view for date component
    views: PropTypes.array,
    format: PropTypes.string,
    openTo: PropTypes.string,
    enableFullTimeFormat: PropTypes.bool,
    disableToolbar: PropTypes.bool,
    disableFuture: PropTypes.bool,
    disablePast: PropTypes.bool,
    disableCheckMaxRange: PropTypes.bool,
    dateRange: PropTypes.number,
    monthRange: PropTypes.number,
    maxRangeDaily: PropTypes.number,
    maxRangeMonthly: PropTypes.number,
    maxDateOffset: PropTypes.number,
    initDate: PropTypes.object,
    isSingleChoice: PropTypes.bool,
    disabledStartDate: PropTypes.bool,
    disabledEndDate: PropTypes.bool,
    disabled: PropTypes.bool,
}

CmsDate.defaultProps = {
    raiseSubmitOnMounted: false,
    /** style 1 */
    views: ['date'],
    format: 'MMM-dd-yyyy',
    openTo: 'date',
    enableFullTimeFormat: false,
    disableToolbar: true,
    disableFuture: false,
    disablePast: false,
    disableCheckMaxRange: false,
    dateRange: DEFAULT_DATE_RANGE,
    monthRange: DEFAULT_MONTH_RANGE,
    maxRangeDaily: MAX_RANGE_DAILY,
    maxRangeMonthly: MAX_RANGE_MONTHLY,
    maxDateOffset: MAX_DATE_OFFSET,
    initDate: null,
    isSingleChoice: false,
    disabledStartDate: false,
    disabledEndDate: false,
    disabled: false
    
    /** style 2 */
    // views: ['year', 'month'],
    // format: 'MMM-yyyy',
    // openTo: 'month',
    // disableToolbar: false,
}

const mapStateToProps = (state) => ({
    privilege: state.cms.privilege,
    selectedProject: state.global.selectedProject
})

export default compose(
    connect(mapStateToProps, null),
    withMultipleStyles(style),
)(CmsDate);
