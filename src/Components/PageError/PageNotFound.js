import React from 'react'
import PropTypes from 'prop-types';
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'

import { withMultipleStyles, breakpointsStyle } from '../../Styles'
import { Typography } from '@material-ui/core'
import Utils from '../../Utils'
import { PageNotFoundLogo } from '../../Defines'

import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

const styles = theme => ({
    container: {
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
    },
    text: {
        ...breakpointsStyle(
            theme,
            {
                key: 'fontSize',
                value: 3,
                variant: 0.5,
                unit: 'rem'
            }
        )
    },
    imageBackground: {
        backgroundImage: `url(${Utils.getImageUrl(PageNotFoundLogo)})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'contain',
        backgroundPosition: 'bottom',
        width: '100%',
        height: '100%',
    }
})

class PageNotFound extends React.Component
{
    componentDidMount()
    {
        this.props.SetTitle('Sorry, the page not found!')
    }
    render()
    {
        const {
            classes
        } = this.props

        return (
            <div className={classes.container}>
                <Typography className={classes.text} color={'textPrimary'}>The link you followed probaly not correct.</Typography>
                <div className={classes.imageBackground}></div>
            </div>
        )
    }
}

PageNotFound.propTypes =
{
    classes: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
    ...state.global
})

const mapDispatchToProps = (dispatch) => ({
    SetTitle: (title) =>
    {
        dispatch(ActionGlobal.SetTitle(title))
    }
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles),
)(PageNotFound);