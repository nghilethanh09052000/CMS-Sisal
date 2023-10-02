import { createStore, combineReducers, applyMiddleware } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import promise from 'redux-promise-middleware'
import thunk from 'redux-thunk'

import ReducerCMS from './Reducers/ReducerCMS'
import ReducerGlobal from './Reducers/ReducerGlobal'

import { env } from '../env'

const enhancer = env.NODE_ENV === 'development'
    ? composeWithDevTools(applyMiddleware(promise, thunk))
    : applyMiddleware(promise, thunk)

const rootReducer = combineReducers({
    cms: ReducerCMS,
    global: ReducerGlobal
})

const store = createStore(rootReducer, enhancer)

export default store