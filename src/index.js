import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom'

import { MuiThemeProvider } from '@material-ui/core/styles'
import { CssBaseline } from '@material-ui/core'

import * as serviceWorker from './serviceWorker'
import store from './Redux/Store'
import { defaultTheme } from './Styles'

import PageNotFound from './Components/PageError/PageNotFound'
import ProtectedRoute from './Components/ProtectedRoute'

import App from './Containers/App'
import Login from './Containers/Login'
import Administrator from './Containers/Administrator'
import Desktop from './Containers/Desktop'
import Profile from './Containers/Profile'
import TycoonProperty from './Containers/TycoonProperty'
import GameEconomy from './Containers/GameEconomy'
import Content from './Containers/Content'
import RegisteredUser from './Containers/RegisteredUser'
import LiveOperations from './Containers/LiveOperations'
import League from './Containers/League'
import RemoteConfiguration from './Containers/RemoteConfiguration'
import Tracking from './Containers/Tracking'
import Others from './Containers/Others'

const metadata = require('./metadata.json')
console.log('metadata', metadata)

const divLoading = document.getElementById('loading')
document.body.removeChild(divLoading)

const Routes = () =>
{
    return (
        <MuiThemeProvider theme={defaultTheme}>
            <Provider store={store}>
                <Router>
                    <React.Fragment>
                        <CssBaseline />
                        <App>
                            <Switch>
                                {/* Homepage === Profile because of user permission */}
                                <Redirect exact from='/' to={'/profile'} />

                                {/* Force login if needed by using protected route */}
                                <Route exact path='/login' component={Login} />

                                <ProtectedRoute exact path='/homepage' component={Desktop} />

                                {/* has sub menu */}
                                <ProtectedRoute path='/administrator' component={Administrator} />
                                <ProtectedRoute path='/tycoon-property' component={TycoonProperty} />
                                <ProtectedRoute path='/game-economy' component={GameEconomy} />
                                <ProtectedRoute path='/content' component={Content} />
                                <ProtectedRoute path='/registered' component={RegisteredUser} />
                                <ProtectedRoute path='/live-operations' component={LiveOperations} />
                                <ProtectedRoute path='/league' component={League} />
                                <ProtectedRoute path='/remote-configuration' component={RemoteConfiguration} />
                                <ProtectedRoute path='/tracking' component={Tracking} />
                                <ProtectedRoute path='/others' component={Others} />
                              
                                {/* single menu */}
                                <ProtectedRoute exact path='/profile' component={Profile} />
                                {/* invalid path */}
                                <Route path='*' component={PageNotFound} />
                            </Switch>
                        </App>
                    </React.Fragment>
                </Router>
            </Provider>
        </MuiThemeProvider>
    )
}

// remove React.StrictMode to fix findDOMNode is deprecated
// https://stackoverflow.com/questions/61220424/material-ui-drawer-finddomnode-is-deprecated-in-strictmode
ReactDOM.render(
    <React.Fragment>
        <Routes />
    </React.Fragment>,
    document.getElementById('root')
)

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister()
