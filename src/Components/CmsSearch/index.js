import React from 'react';
import PropTypes from 'prop-types';

import { withMultipleStyles, customStyle } from '../../Styles';
import clsx from 'clsx'

import { InputBase, Button, FormControl } from '@material-ui/core';
import { SearchOutlined } from '@material-ui/icons'
import { alpha } from '@material-ui/core/styles'

const styles = theme => ({
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
        borderLeft: '1px solid #D6D6D6',
        '&:hover': {
            backgroundColor: alpha('#E1E5F2', 1),
            borderLeftColor: '#4A58B2 !important',
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderTopRightRadius: 25,
            borderBottomRightRadius: 25,
        },
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        borderTopRightRadius: 5,
        borderBottomRightRadius: 5,
    },
})

class CmsSearch extends React.Component
{
    constructor(props)
    {
        super(props)
        this.state = {
            searchText: props.searchText
        }
    }

    onSearchTextChangeDefault = (evt) =>
    {
        let value = evt.target.value

        if (this.props.onSearchTextChange)
        {
            // maybe, user wants to change text in lowercase
            let newValue = this.props.onSearchTextChange(value)
            if (newValue)
            {
                value = newValue
            }
        }

        this.setState({
            searchText: value
        })
    }

    componentDidUpdate(prevProps, prevState)
	{
        if (this.props.searchText !== prevProps.searchText)
        {
            this.setState({
                searchText: this.props.searchText
            })
        }
    }

    onSearchClickDefault = (evt) =>
    {
        evt.preventDefault()
        this.props.onSearchClick && this.props.onSearchClick(this.state.searchText)
    }

    render()
    {
        const {
            classes,
            textFieldPlaceholder,
            textFieldType,
            buttonTitle,
            hiddenSearchButton
        } = this.props;
        return (
            <FormControl
                component={'form'}
                className={clsx(classes.divRow, classes.divSearch)}
                onSubmit={this.onSearchClickDefault}
                autoComplete={'on'}
            >
                <div className={clsx(classes.divRow, classes.divFullWidth)} style={{ alignItems: 'center' }}>
                    <SearchOutlined className={classes.icon} />
                    <InputBase
                        placeholder={textFieldPlaceholder}
                        onChange={this.onSearchTextChangeDefault}
                        classes={{
                            root: classes.inputRoot,
                            input: classes.inputInput
                        }}
                        type={textFieldType}
                        value={this.state.searchText}
                        autoComplete='off'
                    />
                    {
                        !hiddenSearchButton &&
                        <Button
                            className={classes.btnSearch}
                            variant={'text'}
                            type={'submit'}
                        >
                            {buttonTitle}
                        </Button>
                    }
                </div>
            </FormControl>
        )
    }
}

CmsSearch.propTypes = {
    classes: PropTypes.object.isRequired,
    searchText: PropTypes.string,
    textFieldPlaceholder: PropTypes.string,
    textFieldType: PropTypes.string,
    buttonTitle: PropTypes.string,
    onSearchTextChange: PropTypes.func,
    onSearchClick: PropTypes.func,
    hiddenSearchButton: PropTypes.bool,
}

CmsSearch.defaultProps = {
    searchText: '',
    textFieldPlaceholder: '',
    textFieldType: 'text',
    buttonTitle: 'Search',
    hiddenSearchButton: false
}

export default withMultipleStyles(customStyle, styles)(CmsSearch)