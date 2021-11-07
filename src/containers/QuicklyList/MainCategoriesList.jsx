import React, { Component } from 'react'
import { ScrollView, Text, View, ImageBackground } from 'react-native'
import { ActionButton, IconToggle, ListItem, Toolbar } from 'react-native-material-ui'
import { generateDialogObject, getVariety } from '../../shared/utility'
import { flex, foundResults, shadow } from '../../shared/styles'
import { DOWN, UP } from '../../shared/consts'
import EmptyList from '../../components/EmptyList/EmptyList'
import Spinner from '../../components/Spinner/Spinner'
import Dialog from '../../components/Dialog/Dialog'
import styles from './QuicklyList.styles'
import ConfigCategory from '../Categories/ConfigCategory/ConfigCategory'
import AsyncStorage from '@react-native-async-storage/async-storage'

import * as actions from '../../store/actions'
import { connect } from 'react-redux'

class MainCategoriesList extends Component {
	state = {
		amounts: {},
		searchText: '',
		showConfigCategory: false,
		offset: 0,
		scrollDirection: 0,
		bottomHidden: false,
		dialog: null,
		showDialog: false,
		loading: true,
		me: null,
	}

	componentDidMount() {
		// TODO
		this.filterOutCategories()
		this.reloadListsAmount()
	}

	componentDidUpdate(prevProps) {
		if (prevProps.lists !== this.props.lists) {
			this.reloadListsAmount()
		}
	}

	goIntoEdit = (category) => {
		const { navigation } = this.props
		navigation.navigate('QuicklyTaskList', { list: category, edit: true, name: category.name })
	}

	reloadListsAmount = () => {
		const { lists } = this.props
		const { amounts } = this.state
		const listsLength = lists.length

		if (listsLength) {
			const { onInitList } = this.props
			lists.map((list, index) => {
				onInitList(list.id, (tasks) => {
					amounts[list.id] = tasks.length
					if (index === listsLength - 1) {
						this.setState({ amounts, loading: false })
					}
				})
			})
		} else {
			this.setState({ loading: false })
		}
	}

	onScroll = (e) => {
		const { offset, scrollDirection } = this.state

		const currentOffset = e.nativeEvent.contentOffset.y
		const sub = offset - currentOffset

		if (sub > -50 && sub < 50) return
		this.state.offset = e.nativeEvent.contentOffset.y

		const currentDirection = sub > 0 ? UP : DOWN

		if (scrollDirection !== currentDirection) {
			this.state.scrollDirection = currentDirection

			this.setState({
				bottomHidden: currentDirection === DOWN,
			})
		}
	}

	showDialog = (list_id) => {
		// TODO
		const { translations, onRemoveList } = this.props

		const cancelHandler = () => this.setState({ showDialog: false })

		const dialog = generateDialogObject(
			cancelHandler,
			translations.defaultTitle,
			`${translations.dialogDescription}`,
			{
				[translations.yes]: () => {
					cancelHandler()
					onRemoveList(list_id)
				},
				[translations.no]: cancelHandler,
			},
		)

		this.setState({ dialog, showDialog: true })
	}

	getFilterData = () => {
		const { lists } = this.props

		return lists.filter((list) => {
			const searchText = this.state.searchText.toLowerCase()
			return !(searchText.length > 0 && list.name.toLowerCase().indexOf(searchText) < 0)
		})
	}

	toggleModalHandler = (selected = false) => {
		const { showConfigCategory } = this.state

		if (selected !== false) {
			this.setState({
				showConfigCategory: !showConfigCategory,
				selectedCategory: selected,
			})
		} else {
			this.setState({
				showConfigCategory: !showConfigCategory,
				selectedCategory: false,
			})
		}
	}

	getProductCountFromCategory = (category) => {
		// renaming it to products temporarily
		const { tasks: products } = this.props
		if (products) {
			return products.filter((product) => {
				if (product.category.id === category.id) {
					return true
				}
				return false
			}).length
		}
		return 0
	}

	// this function filters out categories based on logged in user id
	filterOutCategories = async () => {
		try {
			const me = await AsyncStorage.getItem('me')
			this.setState({ me })
		} catch (e) {
			console.log('error getting me from storage: ', e)
		}
	}

	renderQuicklyList = (data = null) => {
		// This is executed when a quickly task is made, not when it loads
		const { amounts } = this.state
		const { theme, navigation, translations, categories, tasks } = this.props

		const filteredByUserCategories = this.state.me
			? categories.filter((cate) => {
					if (cate.user_id === +this.state.me) {
						return true
					}
			  })
			: categories

		return filteredByUserCategories.map((category, index) => (
			<View key={index} style={styles.quicklyTaskList}>
				<ListItem
					dense
					onPress={() =>
						navigation.navigate(
							'TaskList',
							{ category },
							// { list: list, edit: true, name: list.name }
						)
					}
					style={{
						container: [
							shadow,
							{
								// backgroundColorbackgroundImage: theme.primaryBackgroundColor
								backgroundColor: 'white',
								height: 80,
								// backgroundColor: `url(${category.photo})`
								// backgroundImage: `url${category.photo}`
							},
						],
						primaryText: {
							fontSize: 17,
							color: theme.secondaryTextColor,
						},
						secondaryText: {
							color: theme.thirdTextColor,
						},
					}}
					centerElement={
						// {
						// 	primaryText: category.name,
						// 	styles: {
						// 		backgroundColor: 'red',
						// 		color: 'blue'
						// 	},
						// 	// backgroundImage: `url(${category.photo})`,
						// 	secondaryText: `${translations.totalTasks} ${amounts[category.id] ? amounts[category.id] : 0}`,
						// }
						<View>
							{/* TODO */}
							{category.photo && console.log('this is category with photo', category.photo)}
							<ImageBackground
								style={{
									width: 'auto',
									height: 80,
									zIndex: -1,
									marginLeft: -15,
								}}
								resizeMode='center'
								source={category.photo ? { uri: category.photo.photo } : ''}
							>
								<Text
									style={{
										marginLeft: 30,
										marginTop: 15,
										width: 'auto',
										color: `${category.photo ? 'white' : 'black'}`,
										backgroundColor: `${category.photo ? 'rgba(24, 15, 10, 0.68)' : 'white'}`,
										width: 150,
										zIndex: 2,
									}}
								>
									{category.name}
								</Text>
								<Text
									style={{
										marginLeft: 30,
										marginTop: 15,
										width: 'auto',
										color: `${category.photo ? 'white' : 'black'}`,
										backgroundColor: `${category.photo ? 'rgba(24, 15, 10, 0.68)' : 'white'}`,
										width: 150,
										zIndex: 2,
									}}
								>{`${translations.totalTasks} ${this.getProductCountFromCategory(category)}`}</Text>
							</ImageBackground>
						</View>
					}
					rightElement={
						<View style={styles.rightElements}>
							<IconToggle
								onPress={() => this.goIntoEdit(category)}
								name='edit'
								color={theme.warningColor}
								size={26}
							/>
							<IconToggle
								onPress={() =>
									this.showDialog(
										category.id,
										// list.name
									)
								}
								name='delete'
								color={theme.warningColor}
								size={26}
							/>
						</View>
					}
				/>
			</View>
		))
	}

	render() {
		const {
			bottomHidden,
			searchText,
			showDialog,
			dialog,
			showConfigCategory,
			selectedCategory,
			// loading,
		} = this.state
		// const { bottomHidden, searchText, showDialog, dialog, loading } = this.state
		const { theme, navigation, settings, translations, categories, onInitCategories, list } =
			this.props

		const filterData = this.getFilterData()

		return (
			<View style={flex}>
				{/* comment out for now when showing MVP */}
				<Toolbar
					searchable={{
						autoFocus: true,
						placeholder: translations.search,
						onChangeText: (value) => this.setState({ searchText: value }),
						onSearchCloseRequested: () => this.setState({ searchText: '' }),
					}}
					leftElement='menu'
					leftElement=''
					centerElement={translations.MainCategoriesList}
					onLeftElementPress={() => navigation.navigate('Drawer')}
				/>

				{searchText.length > 0 && (
					<View style={foundResults}>
						<Text style={{ color: theme.thirdTextColor }}>
							{translations.found}:{' '}
							{getVariety(
								filterData.length,
								translations.ImageBackgroundresultSingular,
								translations.resultPlural,
								translations.resultGenitive,
								settings.lang,
							)}
						</Text>
					</View>
				)}

				<Dialog {...dialog} theme={theme} showDialog={showDialog} />

				{/* {!loading ? ( */}
				{categories[0] ? (
					<ScrollView
						scrollEventThrottle={16}
						keyboardShouldPersistTaps='always'
						keyboardDismissMode='interactive'
						onScroll={this.onScroll}
						style={styles.scrollView}
					>
						{this.state.me ? (
							<View style={styles.quicklyTaskListWrapper}>{this.renderQuicklyList()}</View>
						) : (
							<EmptyList color={theme.thirdTextColor} text={translations.emptyList} />
						)}
					</ScrollView>
				) : (
					<Spinner />
				)}

				<View style={styles.actionButtonWrapper}>
					<ActionButton
						hidden={bottomHidden}
						onPress={this.toggleModalHandler}
						onPress={() => navigation.navigate('QuicklyTaskList', { list: false, edit: false })}
						icon='add'
						style={{
							container: { backgroundColor: theme.warningColor },
							icon: { color: theme.primaryTextColor },
						}}
					/>
				</View>

				{showConfigCategory && (
					<ConfigCategory
						showDialog={showConfigCategory}
						category={selectedCategory}
						toggleModal={this.toggleModalHandler}
					/>
				)}
			</View>
		)
	}
}

const mapStateToProps = (state) => ({
	theme: state.theme.theme,
	tasks: state.tasks.tasks,
	settings: state.settings.settings,
	lists: state.lists.lists,
	categories: state.categories.categories,
	translations: {
		...state.settings.translations.QuicklyList,
		...state.settings.translations.common,
	},
})

const mapDispatchToProps = (dispatch) => ({
	onInitList: (id, callback) => dispatch(actions.initList(id, callback)),
	onRemoveList: (list_id) => dispatch(actions.removeList(list_id)),
})

export default connect(mapStateToProps, mapDispatchToProps)(MainCategoriesList)
