import React from 'react'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import { Redirect, Switch, Route, withRouter } from 'react-router-dom'

import ProtectedRoute from '../../Components/ProtectedRoute'
import PageNotFound from '../../Components/PageError/PageNotFound'

import Overview from './Overview'
import Environment from './Environment'
import Configuration from './Configuration'
import Detail from './Detail'

class RemoteConfiguration extends React.Component
{
	constructor(props)
	{
		super(props)
	}

	render()
	{
		return (
			<Switch>
				<Redirect exact from={'/remote-configuration'} to={'/remote-configuration/overview'} />
				<ProtectedRoute exact path={'/remote-configuration/overview'} component={Overview} />
				<ProtectedRoute exact path={'/remote-configuration/environment'} component={Environment} />
				<ProtectedRoute exact path={'/remote-configuration/detail/:id/:client/:version/:env/:status/:goLive'} component={Detail} />
				<ProtectedRoute exact path={'/remote-configuration/configuration/:id/:client/:version/:env/:status/:goLive'} component={Configuration} />
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
)(RemoteConfiguration);


