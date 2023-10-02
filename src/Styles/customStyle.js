import breakpointsStyle from './breakpointsStyle'
import { alpha } from '@material-ui/core/styles'

const EXPANSION_HEIGHT = 40
const TABLE_HEIGHT = 200

const styles = theme => ({
    root: {
        height: '100%',
        width: '100%'
    },
    divColumn: {
        display: 'flex',
        flexDirection: 'column',
    },
    divRow: {
        display: 'flex',
        flexDirection: 'row',
    },
    divFullWidth: {
		width: '100%'
	},
    divHeader: {
		flexGrow: 1,
	},
    divPadding: {
        ...breakpointsStyle(theme, {
            key: 'paddingBottom',
            value: 30,
            variant: 5,
            unit: 'px'
        }),
    },
    justifyBetween: {
        justifyContent: 'space-between',
    },
    justifyEvently: {
		justifyContent: 'space-evenly'
	},
    justifyStart: {
        justifyContent: 'flex-start',
        marginLeft: 15
    },
    justifyEnd: {
        justifyContent: 'flex-end',
        marginRight: 15
    },
    justifyCenter: {
        justifyContent: 'center'
    },
    alignStart: {
        alignItems: 'flex-start'
    },
    alignEnd: {
        alignItems: 'flex-end'
    },
    alignCenter: {
        alignItems: 'center'
    },
    alignBaseline: {
		alignItems: 'baseline'
	},
    title: {
        flexGrow: 1,
        ...breakpointsStyle(
            theme,
            {
                key: ['font-size'],
                value: [1.2],
                variant: [0.15],
                unit: 'rem'
            }
        ),
        color: '#F46C03',
        fontWeight: 500
    },
    autoCompleteRootCountries: {
        width: '100%',
        minHeight: EXPANSION_HEIGHT,
        height: '100%',
        marginLeft: 10,
        zIndex: 1
    },
    autoCompleteRootMetrics: {
        width: '100%', marginTop: 15, zIndex: 0
    },
    autoCompleteRoot100: {
        width: '100%',
        minHeight: EXPANSION_HEIGHT,
        height: '100%',
        marginLeft: 10
    },
    autoCompleteRoot50: {
        width: '50%',
        minHeight: EXPANSION_HEIGHT,
        height: '100%',
        marginLeft: 10
    },
    autoComplete: {
        minHeight: EXPANSION_HEIGHT,
        minWidth: 200,
        height: '100%',
		marginBottom: theme.spacing(1),
    },
    autoCompleteInputRoot: {
        minHeight: EXPANSION_HEIGHT,
        height: '100%',
        '&&[class*="MuiOutlinedInput-root"] input': {
            padding: 0
        }
    },
    autoCompleteInput: {
        height: '100%',
        // paddingRight: 45,
        // minWidth: '100% !important'
    },
    autoCompleteTable: {
		minHeight: 40,
        height: '100%',
		marginBottom: 0,
    },
	autoCompleteInputTable: {
        height: '100%',
		minWidth: '0 !important',
    },
	autoCompleteInputRootTable: {
		minHeight: 40,
		minWidth: '0 !important',
        height: '100%',
        '&&[class*="MuiOutlinedInput-root"] input': {
            padding: 0
        },
        '&&[class*="MuiInput-underline"]:before': {
            borderBottom: '0px'
        },
        '&&[class*="MuiInput-underline"]:after': {
            borderBottom: '0px'
        }
    },
	autoCompleteNoOptionsTable: {
		display: 'none'
	},
    chartHeader: {
        height: EXPANSION_HEIGHT,
        flexGrow: 0,
        flexShrink: 0
    },
    chartTable: {
        minHeight: TABLE_HEIGHT,
        flexGrow: 0,
        flexShrink: 0,
        zIndex: 0,
        // paddingBottom: 20,
        // marginTop: 10
    },
    cmsSearch: {
        width: '100%', marginTop: 15
    },
    ToggleButtonRoot: {
        marginRight: 10,
        width: 50
    },
    tableGrandTotal: {
        fontWeight: 600,
        color: '#4A58B2'
    },
    tabLabelIcon: {
        minHeight: '48px'
    },
    tabWrapper: {
        flexDirection: 'row-reverse',
        justifyContent: 'space-between',
    },
    divHeight: {
        height: EXPANSION_HEIGHT,
    },
    buttonLeft: {
		marginLeft: 10,
		padding: '5px 20px',
		textTransform: 'uppercase'
	},
    buttonRight: {
		marginRight: 10,
		padding: '5px 20px',
		textTransform: 'uppercase'
	},
    inputTextField: {
		width: '100%',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'space-between'
	},
    inputText: {
		marginTop: 0,
	},
    filterSelect: {
        minHeight: 40,
        backgroundColor: alpha('#FFFFFF', 0.15),
        '&:hover': {
            backgroundColor: alpha('#E1E5F2', 0.25),
        },
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start'
    },
    inputRoot: {
        color: 'inherit',
        width: '100%',
        minHeight: 40
    },
	formControl: {
        width: '100%',
        marginTop: theme.spacing(2),
        marginBottom: theme.spacing(1)
    },
    warningIcon: {
		color: theme.palette.warning.main,
		alignSelf: 'flex-start',
		marginRight: 20
	},
    warningExist: {
        color: 'red',
    },
    toolTip: {
		maxWidth: 400
	},
    table: {
        flexGrow: 0,
        flexShrink: 0,
        marginTop: 0,
    },
    detailPanelTable: {
		paddingTop: 10
	},
    divImage: {
        width: 90,
        height: 90,
        display: 'flex',
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 30,
        marginRight: 30,
    },
    image: {
        width: '100%',
        height: 'auto',
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        borderRadius: 5,
        border: '1px solid #1B1F43'
    },
});

export default styles