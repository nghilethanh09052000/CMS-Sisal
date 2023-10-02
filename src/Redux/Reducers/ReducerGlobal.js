const defaultState = {
    title: 'TITLE',
    forceRerender: false,
    selectedProject: '',
    hasEndPoint: false
}

const ReducerGlobal = (state = defaultState, action) =>
{
    switch (action.type)
    {
        case 'GLOBAL_TITLE': {
            return {
                ...state,
                title: action.payload
            }
        }
        case 'GLOBAL_RERENDER': {
            return {
                ...state,
                forceRerender: !state.forceRerender
            }
        }
        case 'SELECT_PROJECT': {
            return {
                ...state,
                selectedProject: action.payload,
            }
        }
        case 'SET_END_POINT': {
            return {
                ...state,
                hasEndPoint: action.payload,
            }
        }

        default:
            return state
    }
}

export default ReducerGlobal