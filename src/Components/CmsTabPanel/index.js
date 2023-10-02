import React from 'react'
import { Box } from '@material-ui/core'

var CmsTabPanel = function (props)
{
	const { children, value, index, ...other } = props
	return (
		<div {...other}>
			{value === index && <Box p={2}>{children}</Box>}
		</div>
	)
}

export default CmsTabPanel