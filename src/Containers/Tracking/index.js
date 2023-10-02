import React from 'react'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import { Redirect, Switch, Route, withRouter } from 'react-router-dom'

import ProtectedRoute from '../../Components/ProtectedRoute'
import PageNotFound from '../../Components/PageError/PageNotFound'

import Activity from './Activity'
import CmsActivityLog from './CmsActivityLog'
import StoreData from './StoreData'
import ESB from './ESB'

class Tracking extends React.Component
{
	constructor(props)
	{
		super(props)
	}

	render()
	{
		return (
			<Switch>
				<Redirect exact from={'/tracking'} to={'/tracking/activity'} />
				<ProtectedRoute exact path={'/tracking/activity'} component={Activity} />
                <ProtectedRoute exact path={'/tracking/cms-activity-log'} component={CmsActivityLog} />
                <ProtectedRoute exact path={'/tracking/store-data'} component={StoreData} />
                <ProtectedRoute exact path={'/tracking/esb'} component={ESB} />
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
)(Tracking);


