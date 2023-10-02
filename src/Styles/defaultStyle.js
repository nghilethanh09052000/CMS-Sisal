import { createTheme } from '@material-ui/core/styles';

// const pxToRem = (size) => `${size / 16}rem`

const defaultMuiTheme = createTheme();

const defaultTheme = createTheme({
    palette: {
        background: {
            default: '#E5E5E5'
        },
        text: {
            primary: '#1B1F43',
            secondary: '#EBEBEB',
            disabled: '#ABABAB'
        },
        error: {
            main: '#FF4444'
        },

        warning: {
            main: '#F9C257'
        }
    },
    mixins: {
        toolbar: {
            minHeight: 48,
            '@media (min-width:0px) and (orientation:landscape)': {
                minHeight: 40,
            },
            '@media (min-width:600px)': {
                minHeight: 56,
            }
        }
    },
    overrides: {
        MuiCssBaseline: {
            '@global': {
                ul: {
                    marginBlockStart: 0,
                    marginBlockEnd: 0
                }
            }
        },
        MuiToolbar: {
            regular: {
                backgroundColor: '#E5E5E5'
            }
        },
        MuiButton: {
            root: {
                minWidth: 90,
                height: 40,
                borderRadius: 25,
                padding: '8px 24px',
                transition: defaultMuiTheme.transitions.create(['transform'], {
                    duration: 300
                }),
                transform: 'translateZ(0) scale(1.0) perspective(1px)',
                transformOrigin: 'center',
                backfaceVisibility: 'hidden',

                '&:hover': {
                    transition: defaultMuiTheme.transitions.create(['transform'], {
                        duration: 300
                    }),
                    transform: 'translateZ(0) scale(1.05) perspective(1px)',
                },
            },
            contained: {
                backgroundColor: '#4A58B2',
                color: '#FFFFFF',
                '&:hover': {
                    backgroundColor: '#3C499A',
                    color: '#FFFFFF'
                },
                '&:active': {
                    backgroundColor: '#24307E',
                    color: '#FFFFFF',
                },
                '&.Mui-disabled': {
                    backgroundColor: '#B3BAE4',
                    color: '#FFFFFF',
                }
            },
            containedSecondary: {
                backgroundColor: '#FDFDFD',
                color: '#525252',
                border: 'solid 1px #D6D6D6',
                '&:hover': {
                    backgroundColor: '#F2F2F2',
                    color: '#525252'
                },
                '&:active': {
                    backgroundColor: '#D5D6D8',
                    color: '#525252',
                },
                '&.Mui-disabled': {
                    backgroundColor: '#EDEDED',
                    color: '#ABABAB',
                }
            },
            label: {
                fontWeight: 'normal',
                fontFamily: '"Roboto" !important',
                fontSmoothing: 'antialiased !important'
            }
        },
        MuiOutlinedInput: {
            root: {
                backgroundColor: 'white',
                borderRadius: 25,
                '& fieldset': {
                    borderColor: '#D6D6D6',
                },
                '&:hover fieldset': {
                    borderColor: '#4A58B2 !important',
                }
            },
            input: {
                color: '#525252',
                height: 40,
                padding: '0 20px',
                // Fixed: override Chrome autofill background color
                '&:-webkit-autofill': {
                    WebkitBoxShadow: '0 0 0 1000px white inset !important',
                    backgroundColor: 'white !important'
                }
            },
        },
        MuiFormLabel: {
            root: {
                color: '#ABABAB',
                '&.Mui-focused': {
                    color: '#4A58B2'
                },
                '&.Mui-disabled': {
                    color: '#1B1F43'
                },
                marginLeft: 10
            }
        },
        PrivateNotchedOutline: {
            legendNotched: {
                marginLeft: 10
            }
        },
        MuiInputLabel: {
            outlined: {
                transform: 'translate(14px, 14px) scale(1)'
            }
        },
        MuiTableSortLabel: {
            root: {
                color: 'inherit',
                // onMouse hover
                '&:hover': {
                    color: 'inherit',
                    fontWeight: 600,
                },
                // onMouse click
                '&:active': {
                    color: 'inherit',
                },
            },
            // after sorted
            active: {
                color: 'inherit !important',
                fontWeight: 600,
                fontStyle: 'italic'
            },
            // icon
            iconDirectionAsc: {
                color: 'red !important'
            },
            iconDirectionDesc: {
                color: 'green !important'
            }
        },
        MuiTypography: {
            root: {
                userSelect: 'none',
                fontFamily: '"Roboto" !important',
                // fontSmoothing: 'antialiased !important',
                whiteSpace: 'pre-wrap'
            },
            caption: {
                color: '#525252'
            },
            colorInherit: {
                fontWeight: "inherit",
                fontSize: 'inherit'
            }
        },
        MuiListItemIcon: {
            root: {
                minWidth: 32,
                color: '#525252'
            },
        },
        MuiListItemText: {
            root: {
                transition: defaultMuiTheme.transitions.create(['transform'], {
                    duration: 300
                }),
                transform: 'scale(1.0) translate3d(0, 0, 0)',
                transformOrigin: 'left',
                backfaceVisibility: 'hidden',

                '&:hover': {
                    transition: defaultMuiTheme.transitions.create(['transform'], {
                        duration: 300
                    }),
                    transform: 'scale(1.1) translate3d(0, 0, 0)',
                },
            },
            primary: {
                color: '#525252'
            }
        },
        MuiTouchRipple: {
            rippleVisible: {
                color: 'rgba(0, 0, 0, 0.2)'
            },
        },
        MuiListItem: {
            root: {
                '&.Mui-selected': {
                    backgroundColor: 'white',
                    '&:hover': {
                        backgroundColor: 'white',
                    },
                    '&:active': {
                        backgroundColor: 'white'
                    }
                }
            },
            button: {
                backgroundColor: 'white',
                '&:hover': {
                    backgroundColor: '#F2F2F2'
                }
            }
        },
        MuiCheckbox: {
            colorPrimary: {
                color: '#1B1F43',
                '&:hover': {
                    color: '#4A58B2'
                },
                '&.Mui-checked': {
                    color: '#4A58B2'
                }
            },
            colorSecondary: {
                color: '#1B1F43',
                '&:hover': {
                    color: '#F52300'
                },
                '&.Mui-checked': {
                    color: '#F52300'
                }
            }
        },
        MuiRadio: {
            colorPrimary: {
                color: '#1B1F43',
                '&:hover': {
                    color: '#4A58B2'
                },
                '&.Mui-checked': {
                    color: '#4A58B2'
                }
            },
            colorSecondary: {
                color: '#1B1F43',
                '&:hover': {
                    color: '#F52300'
                },
                '&.Mui-checked': {
                    color: '#F52300'
                }
            }
        },
        MuiFormControlLabel: {
            label: {
                color: '#525252',
                whiteSpace: 'nowrap'
            }
        },
        MuiSnackbarContent: {
            root: {
                borderRadius: 25,
            },
            message: {
                padding: 0,
                minHeight: 32,
                display: 'flex'
            }
        },
        MuiInputBase: {
            input: {
                '&.Mui-disabled': {
                    backgroundColor: '#F5F4EF',
                    color: '#525252',
                    borderRadius: 25,
                }
            }
        },
        MuiFormHelperText: {
            root: {
                color: '#282F48'
            },
            contained: {
                alignSelf: 'start'
            }
        },
        MuiTooltip: {
            tooltip: {
                backgroundColor: '#FFFF',
                color: '#1B1F43',
                boxShadow: defaultMuiTheme.shadows[1],
                fontSize: 11
            }
        },
        MuiPickersDay: {
            day: {
                fontWeight: 400
            },
            current: {
                backgroundColor: 'rgba(255, 255, 0, 0.3)'
            }
        },
        MuiStepLabel: {
            label: {
                color: '#ABABAB'
            }
        },
        MuiAccordion: {
            rounded: {
                '&:first-child': {
                    borderTopLeftRadius: 25,
                    borderTopRightRadius: 25,
                    borderBottomLeftRadius: 25,
                    borderBottomRightRadius: 25
                },
                '&:last-child': {
                    borderTopLeftRadius: 25,
                    borderTopRightRadius: 25,
                    borderBottomLeftRadius: 25,
                    borderBottomRightRadius: 25
                }
            }
        },
        MuiAppBar: {
            root: {
                boxShadow: 'none'
            }
        },
        MuiTab: {
            textColorInherit: {
                opacity: 1,
                '&.Mui-selected': {
                color: '#F46C03',
                }
            }
        },
        PrivateTabIndicator: {
            colorPrimary: {
                backgroundColor: '#F46C03'
            }
        },    
    },
});

export default defaultTheme