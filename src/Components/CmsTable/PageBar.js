import React from 'react'
import PropTypes from 'prop-types';

import { withMultipleStyles } from '../../Styles'
import { TablePagination } from '@material-ui/core';

const DEFAULT_ALIGNMENT = 'right'

const style = (theme) => ({
    root: {
        width: '100%',
    },
    toolbar: {
        // background color
        backgroundColor: 'white',
        padding: 0,
        float: DEFAULT_ALIGNMENT
    },
    caption: {
        // rows per page text color
        color: '#525252',
        display: 'none'
    },
    actions: {
        color: 'blue'
    },
    input: {
        // selection text color
        color: '#525252'
    }
})

class PageBar extends React.Component
{
    render()
    {
        const {
            classes,
            ...others
        } = this.props

        return (
            <TablePagination
                classes={{
                    root: classes.root,
                    toolbar: classes.toolbar,
                    caption: classes.caption,
                    actions: classes.actions,
                    input: classes.input
                }}
                {...others}
            />
        )
    }
}

PageBar.propTypes =
{
    classes: PropTypes.object.isRequired,
    rowsPerPage: PropTypes.number,
    rowsPerPageOptions: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.number,
            PropTypes.shape({
                label: PropTypes.string,
                value: PropTypes.number
            })
        ])
    ),
    labelRowsPerPage: PropTypes.string,
    labelDisplayedRows: PropTypes.func
};

PageBar.defaultProps = {
    rowsPerPage: 10,
    rowsPerPageOptions: [10, 20, 30],
    labelRowsPerPage: 'Rows per page:',
    labelDisplayedRows: ({ from, to, count }) => `Show ${from}-${to} of ${count} items`
}

export default withMultipleStyles(style)(PageBar)