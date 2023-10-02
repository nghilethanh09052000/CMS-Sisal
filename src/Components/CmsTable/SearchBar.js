import React from 'react'
import PropTypes from 'prop-types';

import { InputBase, FormControl, InputLabel, Select, MenuItem, Typography } from '@material-ui/core'
import { SearchOutlined } from '@material-ui/icons'
import { alpha } from '@material-ui/core/styles'
import { withMultipleStyles, breakpointsStyle } from '../../Styles'
import TEXT from './Data/Text'

const style = (theme) => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%'
    },
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
        borderRadius: 25,
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
        flexBasis: '22%',
        maxWidth: 250,
        marginRight: 10
    },
    formControl: {
        width: '100%',
    },
    filterSelect: {
        minHeight: 40,
        backgroundColor: alpha('#FFFFFF', 0.15),
        '&:hover': {
            backgroundColor: alpha('#E1E5F2', 0.25),
            borderRadius: 25,
        },
        '&:focus': {
            backgroundColor: alpha('#E1E5F2', 0.25),
            borderRadius: 25,
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

    title: {
        fontWeight: 'bold',
        fontSize: '1.5em'
    }
})

class SearchBar extends React.Component
{
    constructor(props)
    {
        super(props)
        this.state = {
            filter: props.dataManager.searchColumnFilter || 'All',
            searchText: props.searchText || '',
            algorithm: props.dataManager.searchAlgorithm
        }
    }

    _handleSearchTextChange = (evt) =>
    {
        let searchText = evt.target.value
        this.setState({ searchText })

        this.props.dataManager.changeSearchText(searchText)
        this.props.onSearchChanged(searchText)
    }

    _hanldeSelectChange = (evt) =>
    {
        let filter = evt.target.value
        this.setState({ filter })

        const {
            searchText
        } = this.state

        this.props.dataManager.changeSearchColumnFilter(filter)
        this.props.dataManager.changeSearchText(searchText)
        this.props.onSearchChanged(searchText)
    }

    _handleSearchAlgorithmChange = (evt) =>
    {
        let algorithm = evt.target.value
        this.setState({ algorithm })

        const {
            searchText
        } = this.state

        this.props.dataManager.changeSearchAlgorithm(algorithm)
        this.props.dataManager.changeSearchText(searchText)
        this.props.onSearchChanged(searchText)
    }

    renderFilter()
    {
        const {
            classes,
            columns
        } = this.props
        const {
            filter
        } = this.state
        return (
            <div className={classes.divFilter}>
                <FormControl variant="outlined" className={classes.formControl}>
                    <InputLabel className={classes.filterLabel}>{TEXT.CMS_TABLE_FILTER_TITLE}</InputLabel>
                    <Select
                        value={filter}
                        onChange={this._hanldeSelectChange}
                        label={TEXT.CMS_TABLE_FILTER_TITLE}
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
                                if (column.hidden && !column.placeholder)
                                {
                                    return null
                                }

                                if (column.nofilter)
                                {
                                    return null
                                }

                                if (column.placeholder)
                                {
                                    return (
                                        <MenuItem key={index} value={column.field}>
                                            {
                                                column.placeholder
                                            }
                                        </MenuItem>
                                    )
                                }
                                else if (typeof (column.title) === 'string')
                                {
                                    return (
                                        <MenuItem key={index} value={column.field}>
                                            {
                                                column.title
                                            }
                                        </MenuItem>
                                    )
                                }
                                else if (column.field)
                                {
                                    return (
                                        <MenuItem key={index} value={column.field}>
                                            {
                                                column.field
                                            }
                                        </MenuItem>
                                    )
                                }
                                return null
                            })
                        }
                    </Select>
                </FormControl>
            </div>
        )
    }

    renderSearch()
    {
        const {
            classes,
            searchAutoFocus
        } = this.props
        const {
            searchText
        } = this.state
        return (
            <div className={classes.divSearch}>
                <SearchOutlined className={classes.icon} />
                <InputBase
                    autoFocus={searchAutoFocus}
                    placeholder={TEXT.CMS_TABLE_SEARCH_PLACEHOLDER}
                    value={searchText}
                    onChange={this._handleSearchTextChange}
                    classes={{
                        root: classes.inputRoot,
                        input: classes.inputInput
                    }}
                />
            </div>
        )
    }

    renderTitle(title)
    {
        const {
            classes
        } = this.props

        if (typeof (title) === 'string')
        {
            return (
                <div>
                    <Typography className={classes.title}>{title}</Typography>
                </div>
            )
        }

        // React.element
        return title
    }

    renderAlgorithm()
    {
        const {
            classes
        } = this.props
        const {
            algorithm
        } = this.state
        return (
            <div className={classes.divFilter}>
                <FormControl variant="outlined" className={classes.formControl}>
                    <InputLabel className={classes.filterLabel}>{TEXT.CMS_TABLE_ALGORITHM_TITLE}</InputLabel>
                    <Select
                        value={algorithm}
                        onChange={this._handleSearchAlgorithmChange}
                        label={TEXT.CMS_TABLE_ALGORITHM_TITLE}
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

    renderActionsExtend()
    {
        const {
            classes,
            actionsExtend,
        } = this.props

        if (typeof (actionsExtend) === 'object' && actionsExtend.hasOwnProperty('createElement'))
        {
            return (
                <div className={classes.containerHeader}>
                    {
                        actionsExtend.createElement({ actionsExtend })
                    }
                </div>
            )
        }

        return null
    }

    render()
    {
        const {
            classes,
            search,
            showTitle,
            title
        } = this.props

        return (
            <div className={classes.root}>
                {
                    showTitle && this.renderTitle(title)
                }
                {
                    search && <div className={classes.divSearchAndFilter}>
                        {
                            this.renderFilter()
                        }
                        {
                            this.renderAlgorithm()
                        }
                        {
                            this.renderSearch()
                        }
                        {
                            this.renderActionsExtend()
                        }
                    </div>
                }
            </div>
        )
    }
}

SearchBar.propTypes =
{
    classes: PropTypes.object.isRequired,
};

export default withMultipleStyles(style)(SearchBar)