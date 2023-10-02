import React from 'react'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'
import { Redirect, Switch, Route, withRouter } from 'react-router-dom'

import ProtectedRoute from '../../Components/ProtectedRoute'
import PageNotFound from '../../Components/PageError/PageNotFound'

import PlayerCard from './PlayerCard'
import Downloadable from './Downloadable'
import QuizBank from './QuizBank'
import Quizzes from './Quizzes'
import PopIn from './PopIn'
import QuestSytem from './QuestSytem'

class Content extends React.Component
{
	constructor(props)
	{
		super(props)
	}

	render()
	{
		return (
			<Switch>
				<Redirect exact from={'/content'} to={'/content/player-card'} />
				<ProtectedRoute exact path={'/content/player-card'} component={PlayerCard} />
				<ProtectedRoute exact path={'/content/downloadable'} component={Downloadable} />
				<ProtectedRoute exact path={'/content/quiz-bank'} component={QuizBank} />
				<ProtectedRoute exact path={'/:page/:subpage/:theme_id/:name/quizzes'} component={Quizzes} />
                <ProtectedRoute exact path={'/content/pop-in'} component={PopIn} />
                <ProtectedRoute exact path={'/content/quest-sytem'} component={QuestSytem} />
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
)(Content);


