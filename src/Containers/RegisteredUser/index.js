import React from 'react'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import { Redirect, Switch, Route, withRouter } from 'react-router-dom'

import ProtectedRoute from '../../Components/ProtectedRoute'
import PageNotFound from '../../Components/PageError/PageNotFound'

import User from './User'
import UserProfile from './UserProfile'
import ConsentTracking from './ConsentTracking'
import Profile from './Profile'

class RegisteredUser extends React.Component
{
	constructor(props)
	{
		super(props)
	}

	render()
	{
		return (
			<Switch>
				<Redirect exact from={'/registered'} to={'/registered/user'} />
				<ProtectedRoute exact path={'/registered/user'} component={User} />
				<ProtectedRoute exact path={'/registered/user/:action/:userId/'} component={UserProfile} />
                <ProtectedRoute exact path={'/registered/consent-tracking'} component={ConsentTracking} />
                <ProtectedRoute exact path={'/registered/profile'} component={Profile} />
				{/* invalid path */}
				<Route path='*' component={PageNotFound} />
			</Switch>
		);
	}
}

const mapStateToProps = (state) => ({
	isLoggedIn: state.cms.isLoggedIn,
})

export default compose(
	connect(mapStateToProps, null),
	withRouter
)(RegisteredUser);


