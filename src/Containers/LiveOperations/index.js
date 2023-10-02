import React from 'react'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import { Redirect, Switch, Route, withRouter } from 'react-router-dom'

import ProtectedRoute from '../../Components/ProtectedRoute'
import PageNotFound from '../../Components/PageError/PageNotFound'

import Campaign from './Campaign'
import CampaignContent from './CampaignContent'
import SPA from './SPA'
import OnlineNotification from './OnlineNotification'
import MarketPlace from './MarketPlace'

class LiveOperations extends React.Component
{
	constructor(props)
	{
		super(props)
	}

	render()
	{
		return (
			<Switch>
				<Redirect exact from={'/live-operations'} to={'/live-operations/spa'} />
				<ProtectedRoute exact path={'/live-operations/spa'} component={SPA} />
				<ProtectedRoute exact path={'/live-operations/online-notification'} component={OnlineNotification} />
				<ProtectedRoute exact path={'/live-operations/campaign'} component={Campaign} />
				<ProtectedRoute exact path={'/live-operations/campaign/:campaignId/contents'} component={CampaignContent} />
                <ProtectedRoute exact path={'/live-operations/market-place'} component={MarketPlace} />
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
)(LiveOperations);


