export const SmartClosePopup = (instance, closeFunction) =>
{
    if (instance.hasOwnProperty('props') === false
        || instance.props.hasOwnProperty('isLoading') === false
        || instance.props.hasOwnProperty('error') === false
    )
    {
        throw new Error('invalid param: instance')
    }

    if (typeof (closeFunction) !== 'function')
    {
        throw new Error('invalid param: closeFunction')
    }

    // [TIP]: waiting API success & close dialog
    // console.log(`Begin isLoading ${Date.now()}`, instance.props.isLoading)
    let interval = setInterval(() =>
    {
        // console.log(`Waiting isLoading ${Date.now()}`, instance.props.isLoading)
        if (instance.props.isLoading === 0)
        {
            // console.log(`End isLoading ${Date.now()}`, instance.props.isLoading, instance.props.error)
            if (instance.props.error === null)
            {
                closeFunction()
            }
            clearInterval(interval)
        }
    }, 100)
}