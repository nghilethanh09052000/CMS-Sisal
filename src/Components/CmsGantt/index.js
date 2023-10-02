import React, { Component } from 'react';
import { connect } from 'react-redux'
import { InputBase, FormControl, InputLabel, Select, MenuItem, FormControlLabel, Checkbox } from '@material-ui/core'
import { alpha } from '@material-ui/core/styles'
import { SearchOutlined } from '@material-ui/icons'
import { withRouter } from 'react-router-dom'
import { gantt } from 'dhtmlx-gantt'
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css'
import './gantt.css'
import PropTypes from 'prop-types'
import { compose } from '@shakacode/recompose'

import clsx from 'clsx'
import moment from 'moment'
import * as _ from 'lodash'

import { withMultipleStyles, breakpointsStyle, chartStyle } from '../../Styles'
import TEXT from './Data/Text'
import * as Icons from '../../Components/CmsIcons'

const styles = (theme) => ({
    divSearchAndFilter: {
        ...breakpointsStyle(theme, {
            key: ['paddingTop', 'paddingBottom'],
            value: [16, 16],
            variant: [2, 2],
            unit: ['px', 'px']
        }),
        display: 'flex',
        flex: 1.0,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%'
    },
    divSearch: {
        flexGrow: 1,
        borderRadius: 5,
        backgroundColor: alpha('#FFFFFF', 0.15),
        '&:hover': {
            backgroundColor: alpha('#E1E5F2', 0.25),
            borderColor: '#4A58B2 !important',
        },
        border: '1px solid #D6D6D6',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    icon: {
        marginLeft: 10,
        marginRight: 10
    },
    inputRoot: {
        color: 'inherit',
        width: '100%',
        minHeight: 40
    },
    inputInput: {
        transition: theme.transitions.create('width')
    },
    divFilter: {
        flex: 0,
        flexBasis: '15%',
        marginRight: 10
    },
    divViewMode: {
        flex: 0,
        flexBasis: '15%',
        marginLeft: 10
    },
    formControl: {
        width: '100%',
    },
    filterSelect: {
        minHeight: 40,
        backgroundColor: alpha('#FFFFFF', 0.15),
        '&:hover': {
            backgroundColor: alpha('#E1E5F2', 0.25),
        },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
    },
    filterLabel: {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
    },
    checkboxLabel: {
        color: '#525252 !important'
    }
})

class CmsGantt extends Component
{
    constructor(props) 
    {
        super(props);
        this.state = {
			zoom: 'Days',
            filter: 'All',
            algorithm: 'startsWith',
            searchText: '',
            completed: true,
            onProgress: true,
            notStartedYet: true
		}

        this.filters = this.props.columns.map(column => ({...column, completed: true, onProgress: true, notStartedYet: true}))
        this.algorithm = 'startsWith'
        this.searchText = ''

        this.initZoom(this.props.zoomConfig)
    }

    // instance of gantt.dataProcessor
    dataProcessor = null;

    initZoom = (zoomConfig) =>
    {
        gantt.ext.zoom.init({
            levels: zoomConfig
        });
    }

    setZoom = (value) =>
    {
        gantt.ext.zoom.setLevel(value);
    }

    initGanttDataProcessor = () =>
    {
        /**
         * type: "task"|"link"
         * action: "create"|"update"|"delete"
         * item: data object object
         */
        const onDataUpdated = this.props.onDataUpdated;
        this.dataProcessor = gantt.createDataProcessor((type, action, item, id) => 
        {
            return new Promise((resolve, reject) => 
            {
                if (onDataUpdated) 
                {
                    onDataUpdated(type, action, item, id);
                }

                // if onDataUpdated changes returns a permanent id of the created item, you can return it from here so dhtmlxGantt could apply it
                // resolve({id: databaseId});
                return resolve();
            });
        });
    }

    handleAction = (evt) =>
    {
        const { filter, algorithm, searchText, completed, onProgress, notStartedYet } = this.state
        const name = evt.target.name
        let status = { completed, onProgress, notStartedYet }
        let filters = { filter, algorithm, searchText }
        switch (name)
		{
			case 'zoom':
                this.setState({ zoom: evt.target.value })
                break
            case 'completed':
			case 'onProgress':
            case 'notStartedYet':
                status = {...status, [name]: evt.target.checked}
                this.setState({ ...status }, () => { this.doFilter(filters, status) })
                break
            case 'filter':
            case 'algorithm':
            case 'searchText':
                filters = {...filters, [name]: evt.target.value}
                this.setState({ ...filters }, () => { this.doFilter(filters, status) })
                break;   
            default:
        }
    }

    doFilter = (filters, status) =>
    {

        this.filters = this.props.columns.filter(column => (filters.filter === 'All' ? true : column.name === filters.filter))
                                        .map(column =>
                                        ({
                                            ...column, 
                                            completed: status.completed, 
                                            onProgress: status.onProgress, 
                                            notStartedYet: status.notStartedYet
                                        }))
        
        this.algorithm = filters.algorithm
        this.searchText = filters.searchText
        gantt.render()
    }

    componentDidMount() 
    {
        const { tasks, columns } = this.props;

        gantt.plugins({
            tooltip: true
        });
    
        gantt.config.tooltip_offset_x = 5;
        gantt.config.tooltip_offset_y = 5;
        
        gantt.event(window, "click", (e) => 
        {
            var target = e.target;
            var clickableTooltipElement = gantt.utils.dom.closest(target, "[data-tooltip-btn]");
            if (clickableTooltipElement)
            {
                var taskId = clickableTooltipElement.getAttribute("data-task");
                alert(taskId)
            }
        });

        gantt.attachEvent("onBeforeTaskDisplay", (id, task) =>
        {
            return this.filters.some(column =>
            {
                let result = true
                const hidden = !((task.gantt_progress === 100 && column.completed === true) || 
                                 (task.gantt_progress === 0 && column.notStartedYet === true) || 
                                 (0 < task.gantt_progress && task.gantt_progress < 100 && column.onProgress === true))

                if (column.customFilterAndSearch)
                {
                    result = !!column.customFilterAndSearch(this.searchText, task, this.algorithm);
                }
                else
                {
                    const normalizedText = task[column.name].toString().toLowerCase()
                    const normalizedValue = this.searchText.toLocaleLowerCase()
                    result = this.algorithm === 'startsWith' ? normalizedText.startsWith(normalizedValue) : normalizedText.includes(normalizedValue)
                }

                return !hidden && result
            })
        })
    
        gantt.config.readonly = true;
        gantt.config.sort = true;
        gantt.config.columns = columns.filter(column => (!column.hasOwnProperty('hidden') || column.hidden === false))
        gantt.config.xml_date = "%Y-%m-%d %H:%i";
        gantt.init(this.ganttContainer);
        this.initGanttDataProcessor();
        gantt.parse(tasks);
    }

    componentWillUnmount() 
    {
        if (this.dataProcessor) 
        {
            this.dataProcessor.destructor();
            this.dataProcessor = null;
        }

        this.filters = this.props.columns.map(column => ({...column, completed: true, onProgress: true, notStartedYet: true}))
        this.algorithm = 'startsWith'
        this.searchText = ''
    }

    renderDescription = () =>
    {
        const { classes } = this.props
        const { completed, onProgress, notStartedYet } = this.state

		return (
            <div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
                <FormControlLabel
                    control={
                        <Checkbox
                            name='completed'
                            icon={<Icons.IconUnChecked />}
                            checkedIcon={<Icons.IconCompleted />}
                            checked={completed}
                            onChange={this.handleAction}
                        />
                    }
                    label={TEXT.COMPLETED_TITLE}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            name='onProgress'
                            icon={<Icons.IconUnChecked />}
                            checkedIcon={<Icons.IconOnProgress />} 
                            checked={onProgress}
                            onChange={this.handleAction}
                        />
                    }
                    label={TEXT.ON_PROGRESS_TITLE}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            name='notStartedYet'
                            icon={<Icons.IconUnChecked />}
                            checkedIcon={<Icons.IconNotStartedYet />} 
                            checked={notStartedYet}
                            onChange={this.handleAction}
                        />
                    }
                    label={TEXT.NOT_STARTED_YET_TITLE}
                />
                <FormControlLabel
                    control={
                        <Checkbox
                            disabled
                            name='Current Date'
                            icon={<Icons.IconUnChecked />}
                            checkedIcon={<Icons.IconOnCurrentDate />}
                            checked={true}
                            
                        />
                    }
                    classes={{
                        label: classes.checkboxLabel,
                    }}
                    label={TEXT.CURRENT_DATE_TITLE}
                />
            </div>	
		)
    }

    renderZoomer = () =>
    {
        const { classes } = this.props
        const { zoom } = this.state

        return (
            <div className={classes.divViewMode}>
                <FormControl variant="outlined" className={classes.formControl}>
                    <InputLabel className={classes.filterLabel}>{TEXT.VIEW_MODE_TITLE}</InputLabel>
                    <Select
                        name='zoom'
                        value={zoom}
                        onChange={this.handleAction}
                        label={TEXT.VIEW_MODE_TITLE}
                        classes={{
                            root: classes.filterSelect,
                            nativeInput: classes.inputRoot
                        }}
                    >
                        <MenuItem value="Months">
                        { 
                             TEXT.WEEKLY_TITLE
                        }
                        </MenuItem>
                        <MenuItem value="Days">
                        { 
                            TEXT.MONTHLY_TITLE 
                        }
                        </MenuItem>
                    </Select>
                </FormControl>
            </div>
        )
    }

    renderFilter = () =>
    {
        const { classes, columns } = this.props
        const { filter } = this.state
        return (
            <div className={classes.divFilter}>
                <FormControl variant="outlined" className={classes.formControl}>
                    <InputLabel className={classes.filterLabel}>{TEXT.FILTER_TITLE}</InputLabel>
                    <Select
                        name='filter'
                        value={filter}
                        onChange={this.handleAction}
                        label={TEXT.FILTER_TITLE}
                        classes={{
                            root: classes.filterSelect,
                            nativeInput: classes.inputRoot
                        }}
                    >
                        <MenuItem value="All">
                            <em>All</em>
                        </MenuItem>
                        {
                            columns.map((column, index) =>
                            {
                                return (
                                    <MenuItem key={index} value={column.name}>
                                    {
                                        column.label
                                    }
                                    </MenuItem>
                                )
                            })
                        }
                    </Select>
                </FormControl>
            </div>
        )
    }

    renderAlgorithm = () =>
    {
        const { classes } = this.props
        const { algorithm } = this.state

        return (
            <div className={classes.divFilter}>
                <FormControl variant="outlined" className={classes.formControl}>
                    <InputLabel className={classes.filterLabel}>{TEXT.ALGORITHM_TITLE}</InputLabel>
                    <Select
                        name='algorithm'
                        value={algorithm}
                        onChange={this.handleAction}
                        label={TEXT.ALGORITHM_TITLE}
                        classes={{
                            root: classes.filterSelect,
                            nativeInput: classes.inputRoot
                        }}
                    >
                        <MenuItem value="startsWith">
                            Starts With
                        </MenuItem>
                        <MenuItem value="includes">
                            Includes
                        </MenuItem>
                    </Select>
                </FormControl>
            </div>
        )
    }

    renderSearch = () =>
    {
        const { classes } = this.props
        const { searchText } = this.state
        return (
            <div className={classes.divSearch}>
                <SearchOutlined className={classes.icon} />
                <InputBase
                    name='searchText'
                    autoFocus={true}
                    placeholder={TEXT.SEARCH_PLACEHOLDER}
                    value={searchText}
                    onChange={this.handleAction}
                    classes={{
                        root: classes.inputRoot,
                        input: classes.inputInput
                    }}
                />
            </div>
        )
    }

    renderSearchBar = () =>
	{
		const { classes } = this.props

		return (
            <div className={clsx(classes.divRow, classes.justifyEnd, classes.divSearchAndFilter)}>
                {this.renderFilter()}
                {this.renderAlgorithm()}
                {this.renderSearch()}
                {this.renderZoomer()}
            </div>
		)
	}

    renderActionsBar = () =>
    {
        const { classes } = this.props

		return (
            <div className={clsx(classes.divRow, classes.justifyEnd, classes.alignCenter)}>
                {this.renderDescription()}
            </div>
		)
    }

    renderChart = () =>
    {
        const { classes } = this.props

        return (
            <div 
                className={clsx(classes.root)}
                ref={(input) => { this.ganttContainer = input }}
            />
        )
    }

    render()
    {
        const { classes, tooltip_text, task_text } = this.props;
        const { zoom } = this.state;

        gantt.templates.tooltip_text = tooltip_text
        gantt.templates.task_text = task_text
        gantt.templates.scale_cell_class = (date) => 
        {
            if ((zoom === 'Months' &&
                    moment.utc(date).year() === moment.utc().year() &&
                    moment.utc(date).week() === moment.utc().week()
                ) ||
                (zoom === 'Days' &&
                    moment.utc(date).year() === moment.utc().year() &&
                    moment.utc(date).format('MMMM') === moment.utc().startOf('month').subtract(1, 'month').format('MMMM')
                )
               )
            {
                return 'gantt-current-time';
            }
        };

        this.setZoom(zoom);

		return (
			<div className={clsx(classes.root, classes.divColumn)}>
				{this.renderSearchBar()}
				{this.renderChart()}
                {this.renderActionsBar()}
			</div>
		)
    }
}

CmsGantt.propTypes =
{
    classes: PropTypes.object.isRequired,
    ignoredRender: PropTypes.bool
};

CmsGantt.defaultProps = {
    ignoredRender: false
}

const mapStateToProps = (state) => ({
    isLoggedIn: state.cms.isLoggedIn,
    access: state.cms.access,
    access_group: state.cms.access_group,
    privilege: state.cms.privilege,
    selectedProject: state.global.selectedProject
})

export default compose(
    connect(mapStateToProps, null),
	withRouter,
    withMultipleStyles(chartStyle, styles),
)(CmsGantt);
