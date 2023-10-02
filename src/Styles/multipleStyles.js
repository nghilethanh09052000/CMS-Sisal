import { withStyles } from '@material-ui/core/styles'

// Fixed: material-ui "The key provided to the classes property is not implemented"
const withMultipleStyles = (...params) =>
{

    // check if last params is options
    var options = params[params.length - 1]
    if (typeof options === 'function')
    {
        options = {}
    }

    return withStyles((theme) =>
    {
        var styles = {}
        for (var len = params.length, key = 0; key < len; key++)
        {
            if (typeof params[key] === 'function')
            {
                styles = Object.assign(styles, params[key](theme))
            }
        }

        return styles
    }, options)
}

export default withMultipleStyles