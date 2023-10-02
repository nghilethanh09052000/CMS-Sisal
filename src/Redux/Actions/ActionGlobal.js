import API from '../../Api/API'

export const SetTitle = (title) => ({
    type: 'GLOBAL_TITLE',
    payload: title
})

export const ForceRerender = () => ({
    type: 'GLOBAL_RERENDER'
})

export const SelectProject = (proj) => ({
    type: 'SELECT_PROJECT',
    payload: API.SetProjects(proj)
})

export const SetEndPoint = (end_point) => ({
    type: 'SET_END_POINT',
    payload: API.SetEndPoint(end_point)
})