import React from 'react'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import { Redirect, Switch, Route, withRouter } from 'react-router-dom'

import ProtectedRoute from '../../Components/ProtectedRoute'
import PageNotFound from '../../Components/PageError/PageNotFound'

import Season from './Season'
import Tournament from './Tournament'
import Leaderboard from './Leaderboard'
import Clan from './Clan'
import MultiplayPvP from './MultiplayPvP'
import Scores from './Scores'
class League extends React.Component
{
	constructor(props)
	{
		super(props)
	}

	render()
	{
		return (
			<Switch>
				<Redirect exact from={'/league'} to={'/league/season'} />
				<ProtectedRoute exact path={'/league/season'} component={Season} />
				<ProtectedRoute exact path={'/league/tournament'} component={Tournament} />
				<ProtectedRoute exact path={'/league/leaderboard'} component={Leaderboard} />
				<ProtectedRoute exact path={'/:page/:subPage/:leaderboard_id/:name/scores'} component={Scores} />
                <ProtectedRoute exact path={'/league/clan'} component={Clan} />
                <ProtectedRoute exact path={'/league/multiplay-pvp'} component={MultiplayPvP} />

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
)(League);


