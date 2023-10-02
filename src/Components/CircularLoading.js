import React from 'react'
import PropTypes from 'prop-types'
import { withMultipleStyles, breakpointsStyle } from '../Styles'
import CircularProgress from '@material-ui/core/CircularProgress'
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
    root: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.tooltip + 1,
        cursor: 'wait',
        pointerEvents: 'fill',
        userSelect: 'none'
    },
    progress: {
        margin: theme.spacing(2)
    },
    title: {
        ...breakpointsStyle(theme,
            {
                key: 'font-size',
                value: 1.4,
                variant: 0.2,
                unit: 'rem'
            }
        ),
        fontWeight: 'light',
        color: 'white',
    }
})

class CircularLoading extends React.Component
{
    render()
    {
        const { classes, backgroundColor, color, message } = this.props
        return (
            <div className={classes.loading} style={{ backgroundColor }}>
                <div className={classes.root}>
                    <CircularProgress className={classes.progress} size={24} style={{ color }} />
                    {
                        typeof (message) === 'string' &&
                        <Typography className={classes.title} align={'center'}>{message}</Typography>
                    }
                    {
                        Array.isArray(message) && message.map((msg, index) => (
                            <Typography className={classes.title} align={'center'} key={index}>{msg}</Typography>
                        ))
                    }
                </div>
            </div>
        )
    }
}

CircularLoading.propTypes = {
    classes: PropTypes.object.isRequired,
    message: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
    backgroundColor: PropTypes.string,
    color: PropTypes.string
}

CircularLoading.defaultProps = {
    message: 'please wait',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white'
}

export default withMultipleStyles(styles)(CircularLoading)