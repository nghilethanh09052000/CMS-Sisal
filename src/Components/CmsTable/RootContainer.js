import React from 'react'
import PropTypes from 'prop-types';

import { withMultipleStyles } from '../../Styles'

const style = (theme) => ({
    root: {
        backgroundColor: 'transparent',
    }
})

class RootContainer extends React.Component
{
    render()
    {
        const {
            classes,
            children,
            style
        } = this.props

        return (
            <div className={classes.root} style={style}>
                {
                    children
                }
            </div>
        )
    }
}

RootContainer.propTypes =
{
    classes: PropTypes.object.isRequired
};

RootContainer.defaultProps = {
}

export default withMultipleStyles(style)(RootContainer)