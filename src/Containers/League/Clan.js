import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'

import * as ActionCMS from '../../Redux/Actions/ActionCMS'
import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import TEXT from './Data/Text'
import { withMultipleStyles, customStyle } from '../../Styles'

import PageUnderContruction from '../../Components/PageError/PageUnderContruction';

const styles = theme => ({
    
});

class Clan extends React.Component
{
	constructor(props)
	{
		super(props)
	}

    componentDidMount()
	{
		this.props.SetTitle(TEXT.CLAN_MANAGEMENT_TITLE)
	}

	componentWillUnmount() 
	{
		this.props.ClearProps([])
	}

	componentDidUpdate(prevProps, prevState)
	{
		if (this.props.needRefresh)
		{
			this.props.ClearRefresh()
			// To do
		}
	}

    render()
    {
        const { classes } = this.props;
        
        return (
            <div className={classes.root}>
                <PageUnderContruction />
            </div>
        );
    }
}

Clan.propTypes =
{
    classes: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
    ...state.global,
    ...state.cms
})

const mapDispatchToProps = (dispatch) => ({
    SetTitle: (title) =>
    {
        dispatch(ActionGlobal.SetTitle(title))
    },
	ClearRefresh: () =>
	{
		dispatch(ActionCMS.ClearRefresh())
	},
	ClearProps: (keys) =>
	{
		dispatch(ActionCMS.ClearProps(keys))
	},
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(styles, customStyle)
)(Clan);

