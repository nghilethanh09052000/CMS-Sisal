import React from 'react'
import PropTypes from 'prop-types'
import { withMultipleStyles, customStyle } from '../../Styles'

import Utils from '../../Utils'
import { NoImgFound } from '../../Defines'

const styles = theme => ({
})

class CmsImage extends React.PureComponent
{
    constructor(props)
    {
        super(props)
        this.state = {
            imgSource: null
        }
    }

    componentDidMount()
    {
        this.setState({
            imgSource: this.props.fileName || Utils.getImageUrl(NoImgFound)
        })
    }

    componentDidUpdate(prevProps, prevState)
	{
        if (prevProps.fileName !== this.props.fileName)
        {
            this.setState({
                imgSource: this.props.fileName || Utils.getImageUrl(NoImgFound)
            })
        }
		
	}

    handleImageErrorLoad = (type) => (error) =>
    {
        this.setState({
            imgSource: Utils.getImageUrl(NoImgFound)
        })
    }

    render()
    {
        const { classes } = this.props

        return (
            <div className={classes.divImage}>
                <img src={this.state.imgSource}
                    alt={this.state.imgSource}
                    className={classes.image}
                    onError={this.handleImageErrorLoad(this.props.type)}
                />
            </div>
        )
    }
}

CmsImage.propTypes = {
    classes: PropTypes.object.isRequired,
    type: PropTypes.oneOf(['IMAGE', 'QR_CODE'])
}

CmsImage.defaultProps = {
    type: 'IMAGE'
}

export default withMultipleStyles(customStyle, styles)(CmsImage)