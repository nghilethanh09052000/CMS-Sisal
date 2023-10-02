import React from 'react'
import { Route, Redirect, withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose';

class ProtectedRoute extends React.Component
{
    constructor(props)
    {
        super(props)
    }

    render()
    {
        const { component: Component, isLoggedIn, ...rest } = this.props

        return (
            <Route
                {...rest}
                render={
                    (props) =>
                    {
                        if (isLoggedIn)
                        {
                            return <Component key={this.props.location.pathname} {...props} />
                        }

                        return <Redirect to={
                            {
                                pathname: "/login",
                                state: {
                                    from: props.location
                                }
                            }
                        } />
                    }
                }
            />
        )
    }
}

const mapStateToProps = (state) => ({
    isLoggedIn: state.cms.isLoggedIn,
})

export default compose(
	connect(mapStateToProps, null),
	withRouter
)(ProtectedRoute);