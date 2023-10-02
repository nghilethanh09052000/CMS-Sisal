import React from 'react'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import { Redirect, Switch, Route, withRouter } from 'react-router-dom'

import ProtectedRoute from '../../Components/ProtectedRoute'
import PageNotFound from '../../Components/PageError/PageNotFound'

import Building from './Building'
import Currency from './Currency'
import Achievement from './Achievement'
import Badge from './Badge'
import Club from './Club'


class TycoonProperty extends React.Component
{
	constructor(props)
	{
		super(props)
	}

	render()
	{
		return (
			<Switch>
				<Redirect exact from={'/tycoon-property'} to={'/tycoon-property/building'} />
				<ProtectedRoute exact path={'/tycoon-property/building'} component={Building} />
				<ProtectedRoute exact path={'/tycoon-property/currency'} component={Currency} />
				<ProtectedRoute exact path={'/tycoon-property/achievement'} component={Achievement} />
                <ProtectedRoute exact path={'/tycoon-property/badge'} component={Badge} />
                <ProtectedRoute exact path={'/tycoon-property/club'} component={Club} />
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
)(TycoonProperty);


