import React from 'react';
import PropTypes from 'prop-types'
import { Redirect } from 'react-router-dom'
import { Grid, Paper, Typography } from '@material-ui/core/'
import { connect } from 'react-redux'
import { compose } from '@shakacode/recompose'

import clsx from 'clsx'

import * as ActionGlobal from '../../Redux/Actions/ActionGlobal'

import TEXT from './Data/Text'
import Utils from '../../Utils'
import * as Defines from '../../Defines'
import { withMultipleStyles, breakpointsStyle, customStyle } from '../../Styles'

import * as Icons from '../../Components/CmsIcons'
import AspectRatio from '../../Components/AspectRatio'

const PADDING = '30%'
const GRID_SPACING = 3

const metadata = require('../../metadata.json')

const styles = theme => ({
    root: {
        minWidth: '100%',
        paddingLeft: PADDING,
        paddingRight: PADDING,
        marginLeft: -theme.spacing(GRID_SPACING),
        marginRight: -theme.spacing(GRID_SPACING)
    },
    container: {
        width: '100%',
        height: '100%',
        borderRadius: theme.spacing(1),
        border: '1px solid #A5ABB3',
        justifyContent: 'center',
        cursor: 'pointer',
        '&:hover': {
            backgroundColor: '#E2F1FF',
        },
    },
    logo: {
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        objectPosition: 'center',
        pointerEvents: 'none',
        userSelect: 'none',
        paddingRight: theme.spacing(3)
    },
    title: {
        ...breakpointsStyle(theme, {
            key: ['fontSize'],
            value: [20],
            variant: [2],
            unit: ['px']
        }),
        fontWeight: 700,
    },
    goStarted: {
        ...breakpointsStyle(theme, {
            key: ['fontSize'],
            value: [15],
            variant: [2],
            unit: ['px']
        }),
        marginRight: 5,
        textTransform: 'uppercase',
        fontWeight: 500,
        color: '#5CB0FE'
    },
    header: {
        ...breakpointsStyle(theme, {
            key: 'fontSize',
            value: 2.0,
            variant: 0.2,
            unit: 'rem'
        }),
        marginBottom: theme.spacing(6),
    },
    divCMSVersion: {
        ...breakpointsStyle(
            theme,
            {
                key: ['bottom'],
                value: [10],
                variant: [6],
                unit: ['px']
            }
        ),
        display: 'flex',
        justifyContent: 'flex-end',
        width: '100%',
        maxWidth: '100%',
        position: 'fixed',
    },
    cmsVersion: {
        ...breakpointsStyle(
            theme,
            {
                key: ['width', 'fontSize'],
                value: [55, 0.8],
                variant: [-10, 0.1],
                unit: ['%', 'rem']
            }
        ),
        color: '#525252',
        marginRight: 20,
    }
});

class Desktop extends React.Component
{
    constructor(props)
	{
        super(props)
		this.state = {
            administrator: true,
            sisal: true
        }
    }

    componentDidMount()
    {
        const { SetTitle } = this.props

        SetTitle('')

        let divParent = document.getElementById('main-container')
        if (divParent)
        {
            divParent.style.backgroundColor = 'transparent'
            divParent.style.border = 'none'
        }
    }

    componentWillUnmount()
    {
        let divParent = document.getElementById('main-container')
        if (divParent)
        {
            try
            {
                divParent.style.removeProperty('background-color')
                divParent.style.removeProperty('border')
            } catch (ex)
            {
                divParent.style.backgroundColor = '#FFF'
                divParent.style.border = '1px solid #D6D6D6'
            }
        }
    }

    handleSelectProject = (project) => (evt) =>
    {
        this.props.SelectProject(project)
    }

    render()
    {
        const { classes, selectedProject } = this.props
        const { administrator, sisal } = this.state
        if (selectedProject !== '')
        {
            return <Redirect to={selectedProject === Defines.PROJECT_ADMINISTRATOR ? '/administrator' : '/profile'} />
        }

        return (
            <div className={clsx(classes.divColumn, classes.alignCenter)}>
                <Typography 
                    variant="h6" 
                    className={clsx(classes.header)} 
                    color={'textPrimary'} 
                    noWrap={true}
                >
                    {TEXT.DESKTOP_TITLE}
                </Typography>
                <Grid className={classes.root} container spacing={GRID_SPACING}>
                    {   
                        sisal &&
                        <Grid key={Defines.PROJECT_MAIN} item xs={6}>
                            <AspectRatio ratio={3 / 2}>
                                <Paper elevation={0} className={clsx(classes.divRow, classes.container, classes.justifyBetween, classes.alignCenter)} onClick={this.handleSelectProject(Defines.PROJECT_MAIN)}>
                                    <div style={{ width: '50%', height: '80%' }}>
                                        <img
                                            className={classes.logo}
                                            src={Utils.getIconUrl(Defines.SisalLogo)}
                                            alt={'SisalLogo'}
                                        />
                                    </div>
                                    <div className={clsx(classes.divColumn)}>
                                        <Typography component={'div'} className={classes.title} color={'textPrimary'}>{TEXT.PROJECT_MAIN_TITLE}</Typography>
                                        <div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
                                            <Typography component={'div'} className={classes.goStarted}>{TEXT.GO_STARTED_TITLE}</Typography>
                                            <Icons.IconArrowRight style={{ color: '#5CB0FE' }}/>
                                        </div>
                                    </div>
                                </Paper>
                            </AspectRatio>
                        </Grid>
                    }
                    {
                        administrator &&
                        <Grid key={Defines.PROJECT_ADMINISTRATOR} item xs={6}>
                            <AspectRatio ratio={3 / 2}>
                                <Paper elevation={0} className={clsx(classes.divRow, classes.container, classes.justifyBetween, classes.alignCenter)} onClick={this.handleSelectProject(Defines.PROJECT_ADMINISTRATOR)}>
                                    <div style={{ width: '50%', height: '80%' }}>
                                        <img
                                            className={classes.logo}
                                            src={Utils.getIconUrl(Defines.AdministratorLogo)}
                                            alt={'AdministratorLogo'}
                                        />
                                    </div>
                                    <div className={clsx(classes.divColumn)}>
                                        <Typography component={'div'} className={classes.title} color={'textPrimary'}>{TEXT.PROJECT_ADMIN_TITLE}</Typography>
                                        <div className={clsx(classes.divRow, classes.justifyBetween, classes.alignCenter)}>
                                            <Typography component={'div'} className={classes.goStarted}>{TEXT.GO_STARTED_TITLE}</Typography>
                                            <Icons.IconArrowRight style={{ color: '#5CB0FE' }}/>
                                        </div>
                                    </div>
                                </Paper>
                            </AspectRatio>
                        </Grid>
                    }
                </Grid>
                <div className={classes.divCMSVersion}>
                {    
                    <Typography 
                        className={classes.cmsVersion}
                        align={'right'}
                    >
                        {`${metadata['release-date']} (${metadata['release-number']})`}
                    </Typography>
                }    
                </div>
            </div>
        )
    }
}

Desktop.propTypes =
{
    classes: PropTypes.object.isRequired,
};

const mapStateToProps = (state) => ({
    ...state.global,
    privilege: state.cms.privilege,
})

const mapDispatchToProps = (dispatch) => ({
    SetTitle: (title) =>
    {
        dispatch(ActionGlobal.SetTitle(title))
    },
    SelectProject: (project) =>
    {
        dispatch(ActionGlobal.SelectProject(project))
    }
})

export default compose(
    connect(mapStateToProps, mapDispatchToProps),
    withMultipleStyles(customStyle, styles)
)(Desktop);

