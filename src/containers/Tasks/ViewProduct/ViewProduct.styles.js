import { StyleSheet } from 'react-native'

export default StyleSheet.create({
	container: {
		paddingLeft: 20,
		paddingRight: 20,
		paddingBottom: 20,
		display: 'flex',
		alignItems: 'flex-start',
		justifyContent: 'center',
	},
	datePicker: {
		marginRight: 5,
		borderBottomWidth: 0.5,
		borderLeftWidth: 0,
		borderRightWidth: 0,
		borderTopWidth: 0,
		width: '85%',
		justifyContent: 'center',
	},
	category: {
		flex: 1,
		borderWidth: 0,
	},
	select: {
		width: '100%',
		borderWidth: 0,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	selectedOption: {
		marginLeft: 10,
	},
	spinnerWrapper: {
		marginTop: 10,
	},
	headerIcons: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	dateContainer: {
		flex: 1,
		width: '100%',
	},
	imageContainer: {
		flex: 1,
		width: '100%',
		alignItems: 'center',
	},
	dateWrapper: {
		flexDirection: 'row',
		justifyContent: 'space-between',
	},
	productInfo: {
		fontSize: 14,
		textAlign: 'left',
		marginLeft: 10,
	},
	productDetails: {
		fontSize: 14,
		textAlign: 'center',
	},
	carouselSlide: {
		marginTop: 10,
		backgroundColor: '#ffc8b4',
		height: 300,
		borderStyle: 'solid',
		borderColor: 'black',
	},
	carouselTitle: {
		fontSize: 30,
	},
})
