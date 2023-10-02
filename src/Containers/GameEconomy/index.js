import React from 'react'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import { Redirect, Switch, Route, withRouter } from 'react-router-dom'

import ProtectedRoute from '../../Components/ProtectedRoute'
import PageNotFound from '../../Components/PageError/PageNotFound'

import Reward from './Reward'
import Shop from './Shop'
import IAP from './IAP'
import Item from './Item'
import Prize from './Prize'
import InstantWin from './InstantWin'

class GameEconomy extends React.Component
{
	constructor(props)
	{
		super(props)
	}

	render()
	{
		return (
			<Switch>
				<Redirect exact from={'/game-economy'} to={'/game-economy/reward'} />
				<ProtectedRoute exact path={'/game-economy/reward'} component={Reward} />
				<ProtectedRoute exact path={'/game-economy/shop'} component={Shop} />
				<ProtectedRoute exact path={'/game-economy/iap'} component={IAP} />
                <ProtectedRoute exact path={'/game-economy/item'} component={Item} />
                <ProtectedRoute exact path={'/game-economy/prize'} component={Prize} />
				<ProtectedRoute exact path={'/game-economy/instant-win'} component={InstantWin} />
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
)(GameEconomy);


