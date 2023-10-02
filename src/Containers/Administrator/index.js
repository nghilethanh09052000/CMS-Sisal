import React from 'react'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import { Redirect, Switch, Route, withRouter } from 'react-router-dom'

import ProtectedRoute from '../../Components/ProtectedRoute'
import PageNotFound from '../../Components/PageError/PageNotFound'

import Overview from './Overview'
import Role from './Role'
import Group from './Group'
import { env } from '../../env'

class Administrator extends React.Component
{
	constructor(props)
	{
		super(props)
	}

	render()
	{
		return (
			<Switch>
				<Redirect exact from={'/administrator'} to={'/administrator/overview'} />
				<ProtectedRoute exact path={'/administrator/overview'} component={Overview} />
				<ProtectedRoute exact path={'/administrator/group'} component={Group} />
				<ProtectedRoute exact path={'/administrator/role'} component={Role} />
				{/* invalid path */}
				<Route path='*' component={PageNotFound} />
			</Switch>
		)
	}
}

const mapStateToProps = (state) => ({
	isLoggedIn: state.cms.isLoggedIn,
})

export default compose(
	connect(mapStateToProps, null),
	withRouter
)(Administrator);


