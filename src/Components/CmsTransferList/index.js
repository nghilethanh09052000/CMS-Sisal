import React from 'react';
import PropTypes from 'prop-types';
import { Grid, List, Card, CardHeader, ListItem, ListItemText, ListItemIcon, Checkbox, Button, Divider } from '@material-ui/core'

import * as _ from 'lodash'

import { withMultipleStyles, customStyle } from '../../Styles'

const styles = theme => ({
    container: {
        border: '1px solid #A5ABB3',
        justifyContent: 'center',
        overflow: 'unset',
        boxShadow: 'none'
    },
    cardHeader: {
        padding: theme.spacing(1, 2),
    },
    content: {
        height: 250,
        backgroundColor: theme.palette.background.paper,
        overflow: 'auto',
    },
    button: {
        margin: theme.spacing(1, 0),
    },
    subheader: {
        color: '#F46C03',
    }
})

class CmsTransferList extends React.Component
{
    constructor(props)
    {
        super(props)

        this.state = {
			checked: [],
            left: this.not(this.props.left, this.props.right),
			right: this.props.right
		}
    }

	componentDidMount()
	{
        
	}

	componentDidUpdate(prevProps, prevState)
	{		
		if (prevState !== this.state)
		{
			const { callbackUpdateData, name } = this.props
			if (callbackUpdateData)
			{
				callbackUpdateData(name, this.state.right)
			}		
		}
	}

    not = (a, b) => 
    {
        return _.filter(a, (v_a) => !_.some(b, v_b => (_.isEqual(v_a, v_b))))
    }
      
    intersection = (a, b) =>
    {
        return _.filter(a, (v_a) => _.some(b, v_b => (_.isEqual(v_a, v_b))))
    }
      
    union = (a, b) =>
    {
        return [...a, ...this.not(b, a)];
    }

    handleToggle = (value, side) => () =>
    {
        const { checked } = this.state
        const currentIndex = checked.indexOf(value);
        const newChecked = [...checked];
    
        if (currentIndex === -1)
        {
            newChecked.push(value);
        }
        else
        {
            newChecked.splice(currentIndex, 1)
        }

        this.setState({
            checked: newChecked
        })
    
        this.props.onClick && this.props.onClick(side, value)
    }
    
    numberOfChecked = (items) => 
    {
        const { checked } = this.state
        return this.intersection(checked, items).length
    }

    handleToggleAll = (items) => () =>
    {
        const { checked } = this.state
        if (this.numberOfChecked(items) === items.length)
        {
            this.setState({
                checked: this.not(checked, items)
            })
        }
        else
        {
            this.setState({
                checked: this.union(checked, items)
            })
        }
    }
    
    handleCheckedRight = () =>
    {
        const { checked, left, right } = this.state
        this.setState({
            checked: this.not(checked, this.leftChecked),
            left: this.not(left, this.leftChecked),
            right: right.concat(this.leftChecked)
        })
    }
    
    handleCheckedLeft = () =>
    {
        const { checked, left, right } = this.state
        this.setState({
            checked: this.not(checked, this.rightChecked),
            left: left.concat(this.rightChecked),
            right: this.not(right, this.rightChecked)
        })
    }

    renderCustomList = (title, items, side) =>
    {
        const { classes, getOptionLabel } = this.props
        const { checked } = this.state
        return (
            <Card className={classes.container}>
                <CardHeader
                    className={classes.cardHeader}
                    avatar={
                    <Checkbox
                        onClick={this.handleToggleAll(items)}
                        checked={this.numberOfChecked(items) === items.length && items.length !== 0}
                        indeterminate={this.numberOfChecked(items) !== items.length && this.numberOfChecked(items) !== 0}
                        disabled={items.length === 0}
                        inputProps={{ 'aria-label': 'all items selected' }}
                    />
                    }
                    title={title}
                    subheader={`${this.numberOfChecked(items)}/${items.length} selected`}
                    classes={{
                        subheader: classes.subheader,
                    }}
                />
                <Divider />
                <List className={classes.content} dense component="div" role="list">
                    {
                        items.map((value, key) =>
                        {
                            const labelId = `transfer-list-all-item-${key}-label`;
                            return (
                                <ListItem key={key} role="listitem" button onClick={this.handleToggle(value, side)}>
                                    <ListItemIcon>
                                        <Checkbox
                                            checked={checked.indexOf(value) !== -1}
                                            tabIndex={-1}
                                            disableRipple
                                            inputProps={{ 'aria-labelledby': labelId }}
                                        />
                                    </ListItemIcon>
                                    <ListItemText id={labelId} primary={getOptionLabel ? getOptionLabel(value) : `${value}`} />
                                </ListItem>
                            )
                        })
                    }
                    <ListItem />
                </List>
            </Card>
        )
    }    

    render()
    {
        const { classes, leftTitlle, rightTitlle } = this.props
        const { checked, left, right } = this.state

        this.leftChecked = this.intersection(checked, left);
        this.rightChecked = this.intersection(checked, right);

        return (
            <Grid container>
                <Grid item xs={12}>
                    <Grid container spacing={2} direction="row" alignItems="center">
                        <Grid item xs={5}>{this.renderCustomList(leftTitlle, left, 'left')}</Grid>
                        <Grid item xs={2}>
                            <Grid container direction="column" alignItems="center">
                                <Button
                                    variant="outlined"
                                    className={classes.button}
                                    onClick={this.handleCheckedRight}
                                    disabled={this.leftChecked.length === 0}
                                    
                                >
                                    &gt;
                                </Button>
                                <Button
                                    variant="outlined"
                                    // className={classes.button}
                                    onClick={this.handleCheckedLeft}
                                    disabled={this.rightChecked.length === 0}
                                >
                                    &lt;
                                </Button>
                            </Grid>
                        </Grid>
                        <Grid item xs={5}>{this.renderCustomList(rightTitlle, right, 'right')}</Grid>
                    </Grid>  
                </Grid>
            </Grid>
        )
    }
}

CmsTransferList.propTypes = {
    classes: PropTypes.object.isRequired,
    callbackUpdateData: PropTypes.func,
    getOptionLabel: PropTypes.func,
    onClick: PropTypes.func,
    leftTitlle: PropTypes.string,
	rightTitlle: PropTypes.string,
	left: PropTypes.array,
	right: PropTypes.array,
}

CmsTransferList.defaultProps = {
	leftTitlle: 'Choices',
	rightTitlle: 'Chosen',
	left: [],
	right: [],
}

export default withMultipleStyles(customStyle, styles)(CmsTransferList);
