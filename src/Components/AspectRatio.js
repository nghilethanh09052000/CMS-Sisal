import React from 'react'
import PropTypes from 'prop-types'

import { withMultipleStyles } from '../Styles'
import { transform } from 'lodash'

const styles = (theme) => ({
    outerWrapper: {
        position: 'relative',
        width: '100%',
        height: 0
    },

    innerWrapper: {
        position: 'absolute'
    },

    fullView: {
        width: '100%',
        height: '100%'
    },

    fullViewFitContain: {
        width: '100%',
        height: '100%',
        objectFit: 'contain'
    }
})

class AspectRatio extends React.Component
{
    constructor(props)
    {
        super(props)

        this.state = {
            transform: ''
        }

        this.refOuterDiv = React.createRef()
    }

    componentDidMount()
    {
        window.addEventListener("resize", this._rescale)
    }

    componentWillUnmount()
    {
        window.removeEventListener("resize", this._rescale)
    }

    render()
    {
        const {
            classes,
            children,
            ratio,
            padding
        } = this.props

        let customOuterStyles = {
            paddingBottom: `${100 / ratio}%`
        }

        let customInnerStyles = {
            top: padding / ratio,
            left: padding,
            right: padding,
            bottom: padding / ratio
        }

        return (
            <div id={'outerWrapper'} ref={this.refOuterDiv} className={classes.outerWrapper} style={customOuterStyles} >
                <div className={classes.innerWrapper} style={customInnerStyles}>
                    {
                        children
                    }
                </div>
            </div>
        )
    }

    componentDidUpdate()
    {
        this._rescale()
    }

    _rescale = () =>
    {
        let div = this.refOuterDiv.current
        if (div)
        {
            let parent = div.parentNode

            if (parent)
            {
                let pS = window.getComputedStyle(parent)
                let pH = parent.clientHeight - parseInt(pS.paddingTop) - parseInt(pS.paddingBottom)
                let H = div.clientHeight
                let transform = ''

                if (H > pH)
                {
                    // Fixed: outer div overflow parent div
                    transform = `scale(${(pH / H).toFixed(3)})`
                }
                else
                {
                    transform = `scale(1.0)`
                }

                if (transform !== this.state.transform)
                {
                    div.style.transform = transform
                    this.setState({
                        transform
                    })
                }
            }
        }
    }
}

AspectRatio.propTypes = {
    classes: PropTypes.object.isRequired,
    ratio: PropTypes.number.isRequired,
    padding: PropTypes.number
}

AspectRatio.defaultProps = {
    padding: 0
}

export default withMultipleStyles(styles)(AspectRatio)