// https://w11i.me/recaptcha-v3-react
import React from 'react'
import PropTypes from 'prop-types'
import { env } from '../env'

class ReCaptcha extends React.PureComponent
{
    constructor(props)
    {
        super(props)
        this.state = {
            isReady: false
        }

        this.script = null
        this.widget = null
    }

    componentDidMount()
    {
        this.loadScript()
    }

    componentWillUnmount()
    {
        document.body.removeChild(this.widget)
        document.body.removeChild(this.script)
    }

    loadScript = () =>
    {
        // #1 define the onLoad callback
        window.captchaOnLoad = this.onLoad

        // #2 create the script element and...
        const url = 'https://www.google.com/recaptcha/api.js'
        const queryString = '?onload=captchaOnLoad&render=explicit'
        const script = document.createElement('script')
        script.type = 'text/javascript'
        script.src = url + queryString
        script.async = true
        script.defer = true

        // #3 add it to the DOM
        this.script = document.body.appendChild(script)
    }

    onLoad = () =>
    {
        // #1 create a wrapper div and add it to the DOM
        const widget = document.createElement('div')
        widget.id = 'g-recaptcha'
        this.widget = document.body.appendChild(widget)

        // #2 render the widget into the wrapper div
        window.grecaptcha.render('g-recaptcha', {
            sitekey: env.REACT_APP_reCAPTCHA_V3_SITE_KEY,
            size: 'invisible'
        })

        // #3 set the isReady flag to true when ready
        window.grecaptcha.ready(() =>
        {
            this.setState({
                isReady: true
            })
        })
    }

    executeCaptcha = () =>
    {
        if (!this.state.isReady)
        {
            throw new Error('Captcha is not ready!')
        }

        return window.grecaptcha.execute({
            action: this.props.action
        })
    }

    render()
    {
        return this.props.children({
            isReady: this.state.isReady,
            execute: this.executeCaptcha
        })
    }
}

ReCaptcha.propTypes = {
    action: PropTypes.string,
    children: PropTypes.func.isRequired
}

ReCaptcha.defaultProps = {

}

export default ReCaptcha