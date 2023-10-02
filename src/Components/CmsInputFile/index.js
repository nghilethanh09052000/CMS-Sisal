import React from 'react';
import PropTypes from 'prop-types';
import { withMultipleStyles, customStyle } from '../../Styles'
import { TextField, Button } from '@material-ui/core'
import Autocomplete from '@material-ui/lab/Autocomplete'
import TEXT from './Data/Text'
import clsx from 'clsx'
import Utils from '../../Utils'

const EXPANSION_HEIGHT = 40

const styles = theme => ({
	button: {
		marginLeft: 10,
        width: 170
	},
    autoCompleteRoot: {
        padding: 0,
    },
	autoCompleteInputRoot: {
        minHeight: EXPANSION_HEIGHT,
        height: '100%',
        '&&[class*="MuiOutlinedInput-root"]': {
            padding: '0 9px'
        }
    },
    customInputFile: {
        display: 'none'
    },
    autoCompleteInput: {
        height: '100%'        
    },
});

class CmsInputFile extends React.Component
{
    constructor(props)
    {
        super(props)

        this.state = {
			[props.name]: props.value,
		}
 
		this.fileUpload = React.createRef();
    }

    handleAction = (name, data) => (evt) =>
	{
		evt.preventDefault && evt.preventDefault()
       
        switch (name)
		{
            case 'choose_file':
                this.fileUpload.current.click();

                break
            default:
				this.setState({ [this.props.name]: Object.values(data) })

                break 
        }  
	}

	componentDidMount()
	{
        
	}

	componentDidUpdate(prevProps, prevState)
	{		
		if (prevState !== this.state)
		{
			const { onChange } = this.props
			if (onChange)
			{
				onChange(this.state[this.props.name])
			}		
		}
	}

    render()
    {
		const { classes } = this.props

        return (

            <div className={clsx(classes.root, classes.divRow)}>
                <Autocomplete
                    fullWidth
                    multiple
                    freeSolo
                    limitTags={4}
                    options={[]}
                    value={this.state[this.props.name]}
                    getOptionLabel={option => (option.name || this.props.initFileName)}
                    size='small'
                    disableClearable={true}
                    onChange={(evt, value) => {
                        this.handleAction('delete', value)(evt)
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="outlined"
                            type="file"
                            inputProps={{
                                ...params.inputProps,
                                accept: this.props.acceptFile,
                                multiple: this.props.multiple
                            }}
                            onChange={(evt) => { this.handleAction('input', evt.target.files)(evt) }}
                            inputRef={this.fileUpload}
                            helperText={`${Utils.getFilesSizeInput(this.state[this.props.name])}${TEXT.MODAL_KB}${this.props.helperText}`}
                        />
                    )}
                    classes={{
                        root: classes.autoCompleteRoot,
                        input: classes.customInputFile,
                        inputRoot: classes.autoCompleteInputRoot
                    }}				
                />
                <Button
                    variant='outlined'
                    color={'default'}
                    onClick={this.handleAction('choose_file')}
                    className={classes.button}
                >
                    {TEXT.MODAL_CHOOSE_FILE}
                </Button>
            </div>
        )
    }
}

CmsInputFile.propTypes = {
    classes: PropTypes.object.isRequired,
    onChange: PropTypes.func,
    helperText: PropTypes.string,
}

CmsInputFile.defaultProps = {
    multiple: false,
	acceptFile: '*.*',
    helperText: ''
}

export default withMultipleStyles(customStyle, styles)(CmsInputFile);
