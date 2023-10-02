import React from 'react';
import PropTypes from 'prop-types';

import { withMultipleStyles } from '../../Styles';
import clsx from 'clsx'

import { InputBase, Button } from '@material-ui/core';
import { SearchOutlined } from '@material-ui/icons'
import { alpha } from '@material-ui/core/styles'

const styles = theme => ({
    divRow: {
        display: 'flex',
        flexDirection: 'row'
    },
    divSearch: {
        flexGrow: 1,
        borderRadius: 25,
        backgroundColor: alpha('#FFFFFF', 0.15),
        '&:hover': {
            backgroundColor: alpha('#E1E5F2', 0.25),
            borderColor: '#4A58B2 !important',
        },
        border: '1px solid #D6D6D6',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
    },
    divFullWidth: {
        width: '100%'
    },
    divMarginRight: {
        marginRight: theme.spacing(1),
    },
    icon: {
        marginLeft: 10,
        marginRight: 10
    },
    inputRoot: {
        color: 'inherit',
        width: '100%',
        minHeight: 40
    },
    inputInput: {
        transition: theme.transitions.create('width')
    },
    btnSearch: {
        border: '1px solid #D6D6D6',
        '&:hover': {
            backgroundColor: alpha('#E1E5F2', 1),
            borderColor: '#4A58B2 !important',
        },
        borderRadius: 25
    },
})

class CmsSearchV2 extends React.Component
{
    constructor(props)
    {
        super(props)
        this.state = {
            isInit: false
        }
    }

    static getDerivedStateFromProps(nextProps, prevState)
    {
        if (!prevState.isInit)
        {
            let initState = nextProps.textFields.reduce((state, textField) =>
            {
                if (textField.name)
                {
                    return {
                        ...state,
                        [textField.name]: nextProps.value ? nextProps.value[textField.name] : ''
                    }
                }

                return state
            }, {})

            return {
                isInit: true,
                ...initState
            }
        }
        return null
    }

    onSearchTextChangeDefault = (name) => (evt) =>
    {
        let value = evt.target.value

        if (this.props.onSearchTextChange)
        {
            // maybe, user wants to change text in lowercase
            let newValue = this.props.onSearchTextChange(name, value)
            if (newValue)
            {
                value = newValue
            }
        }

        this.setState({
            [name]: value
        })
    }

    onSearchClickDefault = (evt) =>
    {
        evt.preventDefault()
        this.props.onSearchClick && this.props.onSearchClick(this.state)
    }

    render()
    {
        const {
            classes,
            textFields,
            buttonTitle,
            confirmDisable
        } = this.props;
        return (

            <div className={clsx(classes.divRow, classes.divFullWidth)} style={{ alignItems: 'center' }}>
                {
                    textFields.map(textField =>
                    {
                        if (textField.name)
                        {
                            return (
                                <div
                                    id={`group_${textField.name}`}
                                    key={`group_${textField.name}`}
                                    className={clsx(classes.divRow, classes.divFullWidth, classes.divSearch, classes.divMarginRight)}
                                    style={{ alignItems: 'center' }}
                                >
                                    <SearchOutlined className={classes.icon} />
                                    <InputBase
                                        id={`${textField.name}`}
                                        placeholder={textField.placeholder || ''}
                                        onChange={this.onSearchTextChangeDefault(textField.name)}
                                        classes={{
                                            root: classes.inputRoot,
                                            input: classes.inputInput
                                        }}
                                        type={textField.type || 'text'}
                                        value={this.state[textField.name]}
                                        autoComplete='off'
                                    />
                                </div>
                            )
                        }
                        return null
                    })
                }

                <Button
                    className={classes.btnSearch}
                    variant={'text'}
                    onClick={this.onSearchClickDefault}
                    disabled={confirmDisable}
                >
                    {buttonTitle}
                </Button>
            </div>


        )
    }
}

CmsSearchV2.propTypes = {
    classes: PropTypes.object.isRequired,
    textFields: PropTypes.arrayOf(PropTypes.shape({
        type: PropTypes.string,
        placeholder: PropTypes.string,
        name: PropTypes.string.isRequired
    })).isRequired,
    buttonTitle: PropTypes.string,
    onSearchTextChange: PropTypes.func,
    onSearchClick: PropTypes.func,
    confirmDisable: PropTypes.bool,
    value: PropTypes.object
}

CmsSearchV2.defaultProps = {
    buttonTitle: 'Search'
}

export default withMultipleStyles(styles)(CmsSearchV2)