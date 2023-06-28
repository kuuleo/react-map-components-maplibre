import { ListItemTextProps } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import { Theme } from '@mui/system';

declare module '@mui/material' {
	interface Palette {
		topToolbar: { barColor: string };
		navigation: { navColor: string; navHover: string; navText: string; navTextHover: string };
		compass: { compColor: string; compHover: string };
		followGPS: { GPSBackround: string; GPSHover: string };
	}
}
declare module '@mui/material/Button' {
	interface ButtonPropsVariantOverrides {
		navtools: true;
	}
}
declare module '@mui/material' {
	export interface ListItemTextProps {
		variant?: 'layerlist';
	}
}

const lightDefault = createTheme({
	palette: {
		mode: 'light',
	},
});
const darkDefault = createTheme({
	palette: {
		mode: 'dark',
	},
});

const getDesignTokens = (mode: 'light' | 'dark') => ({
	...(mode === 'light' ? lightDefault : darkDefault),
	palette: {
		mode,
		...(mode === 'dark'
			? {
					primary: {
						main: '#009EE0',
					},
					secondary: { main: '#747577' },
					background: { paper: '#414244' },
					text: {
						primary: '#FFF',
						contrast: '#000',
					},
					topToolbar: { barColor: '#000' },
					navigation: {
						navColor: '#414244',
						navHover: '#414244',
						navText: '#BCBDBF',
						navTextHover: '#FFF',
					},
					compass: { compColor: '#414244', compHover: '#626262' },
					followGPS: { GPSBackround: '#414244', GPSHover: '#FFF' },
			  }
			: {
					primary: {
						main: '#009ee0',
					},
					secondary: { main: '#747577' },
					text: {
						primary: '#000',
						contrast: '#fff',
					},
					topToolbar: { barColor: '#fff' },
					navigation: { navColor: '#fff', navHover: '#f5f5f5' },
					compass: { compColor: '#fff', compHover: '#f5f5f5' },
					followGPS: { GPSBackround: '#FFF', GPSHover: '#f5f5f5' },
			  }),
	},
});
const getTheme = (mode: 'light' | 'dark') => {
	const theme: Theme = getDesignTokens(mode);

	// eslint-disable-next-line @typescript-eslint/ban-ts-comment
	// @ts-ignore
	return createTheme(theme, {
		components: {
			MuiTypography: {
				styleOverrides: {
					root: {},
				},
			},
			MuiAppBar: {
				styleOverrides: {
					root: {
						backgroundColor: theme.palette.topToolbar.barColor,
					},
				},
			},
			MuiButton: {
				styleOverrides: {
					contained: {
						color: '#fff',
					},
				},
				variants: [
					{
						props: { variant: 'navtools' },
						style: {
							minWidth: '20px',
							minHeight: '20px',
							fontWeight: 600,
							[theme.breakpoints.down('md')]: {
								width: '50px',
								height: '50px',
								fontSize: '1.4em',
							},
							[theme.breakpoints.up('md')]: {
								width: '30px',
								height: '30px',
								fontSize: '1.2em',
							},
							color: theme.palette.navigation.navText,
							backgroundColor: theme.palette.navigation.navColor,
							borderRadius: '23%',
							margin: '0.15px',
							marginTop: '4px',
							':hover': {
								color: theme.palette.navigation.navTextHover,
								backgroundColor: theme.palette.navigation.navHover,
							},
						},
					},
				],
			},
			MuiListItemText: {
				styleOverrides: {
					primary: ({ ownerState }: { ownerState: ListItemTextProps }) => {
						if (ownerState?.variant === 'layerlist') {
							return { fontSize: '0.9rem' };
						}
						return {};
					},
					secondary: ({ ownerState }: { ownerState: ListItemTextProps }) => {
						if (ownerState?.variant === 'layerlist') {
							return { fontSize: '0.7rem' };
						}
						return {};
					},
				},
			},
		},
	});
};

export default getTheme;
