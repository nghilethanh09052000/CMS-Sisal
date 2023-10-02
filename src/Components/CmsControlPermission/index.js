import React from 'react'
import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import { withRouter } from 'react-router-dom'

class CmsControlPermission extends React.Component
{
    constructor(props)
    {
        super(props)
    }

    render()
    {
        const { control } = this.props

        return (
            <React.Fragment>
            {
                React.cloneElement(control)
            }
            </React.Fragment>
        )
    }
}

CmsControlPermission.propTypes = {
    control: PropTypes.element.isRequired,
    link: PropTypes.string.isRequired,
    attribute: PropTypes.string.isRequired
}

const mapStateToProps = (state) => ({
    
})

export default compose(
    connect(mapStateToProps, null),
	withRouter
)(CmsControlPermission);
