import React from 'react'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import { Redirect, Switch, Route, withRouter } from 'react-router-dom'

import ProtectedRoute from '../../Components/ProtectedRoute'
import PageNotFound from '../../Components/PageError/PageNotFound'

import Cron from './Cron'

class Others extends React.Component
{
	constructor(props)
	{
		super(props)
	}

	render()
	{
		return (
			<Switch>
				<Redirect exact from={'/others'} to={'/others/cron'} />
				<ProtectedRoute exact path={'/others/cron'} component={Cron} />
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
)(Others);


