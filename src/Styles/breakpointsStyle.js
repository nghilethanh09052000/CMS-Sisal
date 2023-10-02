const screenSizes = [
    'default', // extra-large
    'lg', // large
    'md', // medium
    'sm', // small
    'xs', // extra small
]

const createStyleForScreenSize = (theme, options, screen, multiply) =>
{
    const key = options.key
    const value = options.value || 3.0
    const variant = options.variant || 0.5
    const unit = options.unit || 'px'

    let styleDetail = {}

    if (Array.isArray(key))
    {
        key.forEach((key0, i) =>
        {
            const value0 = Array.isArray(value) ? value[i] : value
            const variant0 = Array.isArray(variant) ? variant[i] : variant
            const unit0 = Array.isArray(unit) ? unit[i] : unit

            styleDetail = Object.assign(styleDetail, {
                [key0]: `${value0 - multiply * variant0}${unit0}`
            })
        })
    } 
    else
    {
        styleDetail = Object.assign(styleDetail, {
            [key]: `${value - multiply * variant}${unit}`
        })
    }

    if (screen === 'default')
    {
        // console.log('createStyleForScreenSize ' + screen, styleDetail)
        return styleDetail
    }

    let style = {
        [theme.breakpoints.only(screen)]: {
            ...styleDetail
        }
    }
    // console.log('createStyleForScreenSize ' + screen, style)
    return style
}

const createStyle = (theme, options) =>
{

    let style = {}

    screenSizes.forEach((screen, index) =>
    {
        let styleForScreen = createStyleForScreenSize(theme, options, screen, index)

        style = Object.assign(style, { ...styleForScreen })
    })

    // console.log('createStyle', style)

    return style
}

const styles = (theme, options) =>
{
    // console.log('-----------------', options)

    return createStyle(theme, options)
}

export default styles