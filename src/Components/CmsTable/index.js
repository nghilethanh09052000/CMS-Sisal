import React from 'react'
import { forwardRef } from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import { withRouter } from 'react-router-dom'
import Icon from '@material-ui/core/Icon'
import * as _ from 'lodash'

import TEXT from './Data/Text'
import { withMultipleStyles } from '../../Styles'
import SearchBar from './SearchBar'
import PageBar from './PageBar'
import RootContainer from './RootContainer'
import * as Icons from '../../Components/CmsIcons'
import MaterialTable from '../../3rdParty/material-table-master/src'

const DEFAULT_EVEN_COLOR = '#FFFFFF'
const DEFAULT_ODD_COLOR = '#E1E5F280'
const DEFAULT_SELECTED_COLOR = '#66a5b5'

const style = (theme) => ({
    paginationRoot: {
        color: 'green'
    },
    paginationToolbar: {
        backgroundColor: 'white'
    },
    paginationCaption: {
        color: 'blue'
    },
    paginationSelectRoot: {
        color: '#525252'
    }
})

class CmsTable extends React.Component
{
    constructor(props)
    {
        super(props)
    }

    shouldComponentUpdate(nextProps, nextState)
    {
        if (nextProps.data === undefined)
        {
            return false
        }

        return !nextProps.ignoredRender
    }

    formatEditableActionsPermission = (actions) =>
    {
        if (_.isEmpty(actions))
        {
            return 'never'
        }

        let result = _.reduce(actions, (result, action, key) => {
            result = {...result, 
                        cellEditable: {...result.cellEditable, ...action}, 
                        editable: {...result.editable, ...action}
                    }
            return result        
        }, {cellEditable: {}, editable: {}})

        return result   
    }

    checkActionsPermission = (actions) =>
    {
        if (!actions)
        {
            return []
        }

        let permissionActions = actions.reduce((arr, action) =>
        {
            if (action.hasOwnProperty('controlPermission'))
            {
                // let link = action['controlPermission'].link
                // let attribute = action['controlPermission'].attribute

                let hasPermission = true // To do implement
                if (!hasPermission)
                {
                    return arr
                }
            }
            
            return arr.concat(action)
        }, [])

        return permissionActions
    }

    render()
    {
        const {
            options,
            actions,
            editable,
            actionsExtend,
            ...others
        } = this.props

        let overrideActions = this.checkActionsPermission(actions)
        let overrideEditableActions = this.checkActionsPermission(editable?.actions)
        overrideEditableActions = this.formatEditableActionsPermission(overrideEditableActions)

        let overrideOptions = Object.assign({
            headerStyle: {
                minWidth: 100,
                userSelect: 'none',
                backgroundColor: 'white', // Fixed: Firefox not showing table border
            },
            cellStyle: {
                minWidth: 100,
                userSelect: 'none',
                backgroundColor: 'transparent', // Fixed: Firefox not showing table border
            },
            actionsCellStyle: (data, index, level) =>
            {
                let style = {
                    userSelect: 'none',
                    backgroundColor: 'transparent', // Fixed: Firefox not showing table border
                    borderLeft: `1px #D6D6D6 solid`,
                }

                if (data.tableData && data.tableData.checked)
                {
                    // Fixed: action icon not change color when row selected
                    style = {
                        ...style,
                        color: '#FFFFFF'
                    }
                }

                return style
            },
            rowStyle: (data, index, level) =>
            {
                if (data.tableData && data.tableData.checked)
                {
                    return {
                        backgroundColor: DEFAULT_SELECTED_COLOR,
                        color: '#FFFFFF'
                    }
                }
                return {
                    backgroundColor: index % 2 === 0 ? DEFAULT_ODD_COLOR : DEFAULT_EVEN_COLOR
                }
            },
            selectionProps: (data) =>
            {
                if (data.checkedAll)
                {
                    // header
                    return {
                        color: 'default'
                    }
                } 
                else if (data.tableData && data.tableData.checked)
                {
                    // rows
                    return {
                        color: 'default'
                    }
                }

                return {
                    color: 'primary'
                }
            },
            pageSize: 10,
            pageSizeOptions: [5, 10, 20, 30, 50, 100, 500, 1000],
            showTitle: false,

            // table with fixed header
            tableStickyHeader: true,
            tableMaxHeight: '60vh',
        }, (options || {}))

        if (overrideOptions.tableStickyHeader && overrideOptions.fixedColumns)
        {
            console.warn('CmsTable can not support both stick header & fix columns at the same time')
        }
        
        const localization = {
            body: {
                emptyDataSourceMessage: TEXT.CMS_TABLE_NO_DATA_SOURCE,
                filterRow: {
                    filterTooltip: TEXT.CMS_TABLE_FILTER_TOOLTIP,
                    filterPlaceHolder: TEXT.CMS_TABLE_FILTER_PLACEHOLDER
                },
            }
        }

        return (
            <MaterialTable
                components={{
                    // we don't want forward parent classes to child element
                    Toolbar: ({ classes, ...props }) => (
                        <SearchBar 
                            {...props} 
                            actionsExtend={actionsExtend}
                        />
                    ),
                    Pagination: ({ classes, ...props }) => (<PageBar {...props} />),
                    Container: ({ classes, ...props }) => (<RootContainer {...props} />)
                }}
                {...others}
                options={overrideOptions}
                actions={overrideActions}
                {...overrideEditableActions}
                localization={{...localization, body: {...localization.body, ...editable?.tooltip || {}}}}
                icons={{
					Edit: forwardRef((props, ref) => <Icons.IconEdit {...props} ref={ref} />),
					Delete: forwardRef((props, ref) => <Icons.IconRemove {...props} ref={ref} />),
                    EditCell: forwardRef((props, ref) => (<Icon fontSize={'small'} {...props} ref={ref} >editsharp</Icon>)),
                    Filter: forwardRef((props, ref) => <Icon {...props} style={{ color: '#AEAEAE' }} ref={ref}>help</Icon>)
				}}
            />
        )
    }
}

CmsTable.propTypes =
{
    classes: PropTypes.object.isRequired,
    ignoredRender: PropTypes.bool
};

CmsTable.defaultProps = {
    ignoredRender: false
}

const mapStateToProps = (state) => ({
})

export default compose(
    connect(mapStateToProps, null),
	withRouter,
    withMultipleStyles(style)
)(CmsTable);
