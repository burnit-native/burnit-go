import React, { Component } from 'react'
import {
	FlatList,
	ScrollView,
	KeyboardAvoidingView,
	Platform,
	RefreshControl,
	Text,
	TouchableOpacity,
	View,
	Keyboard,
	Button,
	Image,
	Alert,
} from 'react-native'
import { IconToggle, Toolbar } from 'react-native-material-ui'
import { listRow, shadow, flex, foundResults } from '../../../shared/styles'
import Input from '../../../components/Input/Input'
import { generateDialogObject, getVariety } from '../../../shared/utility'
import EmptyList from '../../../components/EmptyList/EmptyList'
import ConfigQuicklyTask from '../ConfigQuicklyTask/ConfigQuicklyTask'
import Spinner from '../../../components/Spinner/Spinner'
import Template from '../../Template/Template'
import Dialog from '../../../components/Dialog/Dialog'
import styles from './QuicklyTaskList.styles'
import Subheader from '../../../components/Subheader/Subheader'
import * as ImagePicker from 'expo-image-picker'
import axios from 'axios'
import AsyncStorage from '@react-native-community/async-storage'
import Camera from '../../../components/Camera'

import * as actions from '../../../store/actions'
import { connect } from 'react-redux'

const initialNumToRender = 16
class QuicklyTaskList extends Component {
	state = {
		image: null,
		quicklyTasks: [],
		showDialog: false,
		showInputDialog: false,
		selectedTask: false,
		list: {
			id: false,
			name: null,
			photo: { photo: null }
		},
		newListName: this.props.translations.listName,
		control: {
			label: this.props.translations.listName,
			required: true,
			characterRestriction: 20,
		},
		input: {
			control: {
				label: this.props.navigation.getParam('list', 'Enter new category name').name,
				required: true,
				characterRestriction: 40,
			},
			value: '',
		},
		keyboardDidShow: false,
		visibleData: 16,
		searchText: '',
		loading: true,
		editMode: false,
		edit: false,
		spinner: false,
		add: false,
	}

	componentDidMount() {
		const { navigation } = this.props

		const listFromProp = navigation.getParam('list', null)

		console.log('thisis list coming thorugh', listFromProp)

		if (navigation.getParam('add')) {
			console.log('add mode on')
			this.setState({ add: true })
		}

		if (navigation.getParam('edit')) {
			console.log('add mode on')
			this.setState({ edit: true })
		}

		// if category image is found this will be set the string URI in state.image
		if (listFromProp) {
			// const updatedList = filterOutPhoto(listFromProp)
			// callToGetPhoto(updatedList).then(data => {
			// 	this.setState({ image: data.photo.photo })
			// })
			// TODO
			this.setState({ list: listFromProp })
		}

		this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', () =>
			this.keyboardDidShow(true),
		)
		this.keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () =>
			this.keyboardDidShow(false),
		)


		if (listFromProp && listFromProp.id !== false) {
			this.reloadTasks(listFromProp)
		} else {
			this.setState({ loading: false })
		}
	}

	componentWillUnmount() {
		this.keyboardDidShowListener.remove()
		this.keyboardDidHideListener.remove()
	}

	keyboardDidShow = (status) => {
		this.setState({ keyboardDidShow: status })
	}

	reloadTasks = (list = this.state.list) => {
		const { onInitList } = this.props
		onInitList(list.id, (tasks) => {
			this.setState({
				quicklyTasks: tasks,
				newListName: list.name,
				list,
				loading: false,
			})
		})
	}

	toggleModalHandler = (selected = false, list = false) => {
		const { showDialog } = this.state
		if (selected !== false) {
			if (list) this.reloadTasks(list)

			this.setState({
				showDialog: !showDialog,
				selectedTask: selected,
			})
		} else {
			this.setState({
				showDialog: !showDialog,
				selectedTask: false,
			})
		}
	}

	showDialog = () => {
		const { newListName, list, control } = this.state
		const { translations } = this.props

		const cancelHandler = () => {
			delete control.error
			this.setState({
				showInputDialog: false,
				newListName: list.name,
				control,
			})
		}

		const dialog = generateDialogObject(
			cancelHandler,
			translations.dialogTitle,
			{
				elementConfig: control,
				focus: true,
				value: newListName === translations.listName ? '' : newListName,
				onChange: (value, control) => {
					this.setState({ newListName: value, control }, this.showDialog)
				},
			},
			{
				[translations.save]: () => {
					const { list, newListName, control } = this.state
					if (!control.error) {
						this.saveCategory({
							id: list.id,
							name: newListName,
						})
						this.setState({ showInputDialog: false })
					}
				},
				[translations.cancel]: cancelHandler,
			},
		)

		this.setState({ showInputDialog: true, dialog })
	}

	// TODO
	updateImage = async (image) => {
		this.setState({ list: { ...this.state.list, photo: { ...this.state.list.photo, photo: image } } })
	}

	addCategory = async () => {
		console.log(`img`, this.state.image)
		if (!this.state.list.photo || !this.state.input.value) {
			return Alert.alert('Error', `Please provide a name and a photo.`, [
				{
					text: 'Ok',

					style: 'cancel',
				},
			])
		}

		const {
			input,
			// list
		} = this.state
		const {
			// onSaveQuicklyTask,
			onSaveCategory,
			navigation,
			onInitCategories,
		} = this.props

		if (!input.control.error) {
			this.setState({ spinner: true })
			const newCategory = {
				name: input.value,
				photo: this.state.list.photo,
			}

			const newlyUpdatedCategory = await onSaveCategory(newCategory)

			if (newlyUpdatedCategory !== null || newlyUpdatedCategory !== undefined) {

				Alert.alert('Success', `Your category has been created.`, [
					{
						text: 'Ok',
						onPress: navigation.goBack,
						style: 'cancel',
					},
				])
				this.setState({ spinner: false })
				await onInitCategories()
			}

			// onSaveQuicklyTask(newTask, list, (list) => {
			// 	this.setState({ input: { ...input, value: null } })
			// 	this.reloadTasks(list)
			// })
		}
	}

	setEditTrue = async (category) => {
		this.setState({ edit: true })
	}

	updateCategory = async () => {
		const { onUpdateCategory, onInitCategories, navigation } = this.props

		const { list } = this.state

		const {
			input,
			// list
		} = this.state

		if (!input.control.error) {
			this.setState({ spinner: true })
			const newCategory = {
				id: this.state.list.id,
				name: input.value,
				photo: this.state.list.photo,
			}

			const response = await onUpdateCategory(newCategory)

			if (response !== null || response !== undefined) {
				console.log('this is newly updated category', response)

				Alert.alert('Success', `Your category has been updated.`, [
					{
						text: 'Ok',
						onPress: navigation.goBack,
						style: 'cancel',
					},
				])
				this.setState({ spinner: false })
				await onInitCategories()
			}

			// onSaveQuicklyTask(newTask, list, (list) => {
			// 	this.setState({ input: { ...input, value: null } })
			// 	this.reloadTasks(list)
			// })
		}

		// if (response) {
		// 	// Alert.alert('Success', `Your category has been updated.`, [
		// 	// 	{
		// 	// 		text: 'Ok',
		// 	// 		onPress: navigation.goBack,
		// 	// 		style: 'cancel',
		// 	// 	},
		// 	// ])

		// 	this.setState({
		// 		list: response.data.result,
		// 		edit: false,
		// 	})

		// 	this.setState({ spinner: false })
		// }
		// else
		// Alert.alert('Error', `Your category could not be updated.`, [
		// 	{
		// 		text: 'Ok',
		// 		onPress: navigation.goBack,
		// 		style: 'cancel',
		// 	},
		// ])
	}

	// const { input,
	// 	// list
	// } = this.state
	// const {
	// 	// onSaveQuicklyTask,
	// 	onUpdateCategory, navigation, onInitCategories } = this.props

	// if (!input.control.error) {
	// 	const newCategory = {
	// 		name: input.value,
	// 		photo: this.state.image
	// 	}

	// 	const newlyCreatedCategory = await onUpdateCategory(newCategory);

	// 	if (newlyCreatedCategory !== null || newlyCreatedCategory !== undefined) {
	// 		await onInitCategories();
	// 		navigation.goBack();
	// 	}

	// 	// onSaveQuicklyTask(newTask, list, (list) => {
	// 	// 	this.setState({ input: { ...input, value: null } })
	// 	// 	this.reloadTasks(list)
	// 	// })
	// }

	// const { translations, onUpdateCategory } = this.props

	// const cancelHandler = () => this.setState({ showDialog: false })

	// const dialog = generateDialogObject(
	// 	cancelHandler,
	// 	translations.defaultTitle,
	// 	`${translations.dialogDescription}`,
	// 	{
	// 		[translations.yes]: () => {
	// 			cancelHandler()
	// 			this.props.onUpdateCategory(category.id)
	// 		},
	// 		[translations.no]: cancelHandler,
	// 	},
	// )
	// this.setState({ dialog, showDialog: true })

	saveCategory = (category) => {
		const { onSaveCategory, navigation } = this.props

		onSaveCategory(category, (savedcategory) => {
			if (savedcategory) {
				this.setState({ category: savedcategory })
				navigation.goBack()
			}
		})
	}

	finishTask = (id) => {
		const { onRemoveQuicklyTask } = this.props

		onRemoveQuicklyTask(id, () => this.reloadTasks())
	}

	loadNextData = () => {
		const { visibleData, quicklyTasks } = this.state
		if (visibleData < quicklyTasks.length) {
			this.setState({ visibleData: visibleData + initialNumToRender })
		}
	}

	getFilterData = () => {
		const { quicklyTasks, visibleData } = this.state

		return quicklyTasks.filter((task, index) => {
			if (index > visibleData) {
				return false
			}

			const searchText = this.state.searchText.toLowerCase()
			return !(searchText.length > 0 && task.name.toLowerCase().indexOf(searchText) < 0)
		})
	}

	pickImage = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 1,
		})

		if (!result.cancelled) {
			this.setState({ list: { ...this.state.list, photo: { ...this.state.list.photo, photo: result.uri } } })
		}
	}

	// updateImage = async (image) => {
	// 	const prevTask = this.state.task
	// 	prevTask.image = image
	// 	console.log(`new image`, prevTask.image)
	// 	this.setState({ task: prevTask, photoMode: false })
	// }

	renderTaskRow = (item, index) => {
		const { keyboardDidShow } = this.state
		const { theme } = this.props

		return (
			<TouchableOpacity
				style={{
					...shadow,
					...listRow,
					backgroundColor: theme.primaryBackgroundColor,
				}}
				onPress={() => {
					if (keyboardDidShow) {
						Keyboard.dismiss()
					} else {
						this.toggleModalHandler(item.id)
					}
				}}
			>
				<View style={styles.listContainer}>
					<View style={styles.taskNameWrapper}>
						<Text
							numberOfLines={1}
							style={{
								...styles.taskName,
								color: theme.secondaryTextColor,
							}}
						>
							{index + 1}. {item.name}
						</Text>
					</View>
					<View style={styles.taskIconContainer}>
						<IconToggle
							color={theme.doneIconColor}
							onPress={() => this.finishTask(item.id)}
							name='done'
						/>
					</View>
				</View>
			</TouchableOpacity>
		)
	}

	render() {
		const {
			showDialog,
			showInputDialog,
			dialog,
			selectedTask,
			input,
			list,
			searchText,
			visibleData,
			loading,
		} = this.state
		const { navigation, theme, lang, translations, onInitLists } = this.props

		const filterData = this.getFilterData()
		const category = navigation.getParam('list', null)

		console.log('this is staet on edit from categories', this.state.edit)

		return (
			<Template bgColor={theme.secondaryBackgroundColor}>
				<Toolbar
					// searchable={{
					// 	autoFocus: true,
					// 	placeholder: translations.search,
					// 	onChangeText: (value) => this.setState({ searchText: value }),
					// 	onSearchCloseRequested: () => this.setState({ searchText: '' }),
					// }}
					leftElement='arrow-back'
					// rightElement={
					// 	<>
					// 		<IconToggle color={theme.primaryTextColor} onPress={this.showDialog} name='edit' />
					// 		<IconToggle
					// 			color={theme.primaryTextColor}
					// 			name='add'
					// 			onPress={this.toggleModalHandler}
					// 		/>
					// 	</>
					// }
					onLeftElementPress={() => {
						onInitLists()
						navigation.goBack()
					}}
					centerElement={
						list.name && !loading ? (
							<TouchableOpacity onPress={this.showDialog}>
								<Text
									numberOfLines={1}
									style={{
										color: theme.primaryTextColor,
										fontSize: 20,
									}}
								>
									{list.name}
								</Text>
							</TouchableOpacity>
						) : (
							<View style={styles.spinnerWrapper}>
								<Spinner color={theme.secondaryBackgroundColor} size='small' />
							</View>
						)
					}
				/>

				{/* {searchText.length > 0 && (
					<View style={foundResults}>
						<Text style={{ color: theme.thirdTextColor }}>
							{translations.found}:{' '}
							{getVariety(
								filterData.length,
								translations.resultSingular,
								translations.resultPlural,
								translations.resultGenitive,
								lang,
							)}
						</Text>
					</View>
				)} */}

				{showDialog && (
					<ConfigQuicklyTask
						showDialog={showDialog}
						task_id={selectedTask}
						list={list}
						navigation={navigation}
						taskLength={filterData.length}
						toggleModal={(selected, list) => this.toggleModalHandler(selected, list)}
					/>
				)}

				<Dialog {...dialog} input theme={theme} showDialog={showInputDialog} />

				{!loading ? (
					<ScrollView style={flex}>
						{(this.state.edit || this.state.add) && <Camera updateImage={this.updateImage} />}
						<View style={styles.quicklyTaskListWrapper}>
							<FlatList
								keyboardShouldPersistTaps='handled'
								keyboardDismissMode='interactive'
								data={filterData}
								refreshControl={
									<RefreshControl
										refreshing={loading}
										tintColor={theme.primaryColor}
										onRefresh={this.reloadTasks}
									/>
								}
								style={styles.quicklyTaskList}
								onEndReached={this.loadNextData}
								initialNumToRender={initialNumToRender}
								// ListEmptyComponent={
								// 	<EmptyList color={theme.thirdTextColor} text={translations.emptyList} />
								// }
								renderItem={({ item, index }) => this.renderTaskRow(item, index)}
								keyExtractor={(item) => `${item.id}`}
								onRefresh={this.reloadTasks}
								refreshing={loading}
								ListFooterComponent={filterData.length > visibleData && <Spinner />}
							/>

							<View style={styles.inputWrapper}>
								{this.state.edit || this.state.add ? (
									<Input
										elementConfig={input.control}
										focus={false}
										value={input.value}
										changed={(value) => {
											const { input } = this.state
											this.setState({ input: { ...input, value } })
										}}
									/>
								) : (
									<>
										<Subheader text='Name:' />
										<Text>
											{this.state.list.name || navigation.getParam('category', { name: '' }).name}
										</Text>
									</>
								)}
								{(this.state.edit || this.state.add) && <Button title='Pick an image from camera roll' onPress={this.pickImage} />}


								{(this.state.list.photo.photo || navigation.getParam('category')) && (
									<Image
										source={{
											uri: this.state.list.photo.photo || navigation.getParam('category').photo.photo,
										}}
										style={{ width: 200, height: 200 }}
									/>
								)}

								{/* <View style={styles.addIcon}> */}
								{this.state.spinner ? (
									<Spinner />
								) : this.state.edit ? (

									<Button title="Press Here To Save Category" styles={styles.addIcon} onPress={this.updateCategory} />
								) : (
									<Button title="Press Here To Add Category" styles={styles.addIcon} onPress={this.addCategory} />
								)}
								<IconToggle
									styles={styles.addIcon}
									onPress={() => this.setEditTrue(category)}
									name='edit'
								/>
								{/* </View> */}
							</View>
						</View>
					</ScrollView>
				) : (
					<Spinner />
				)}
			</Template>
		)
	}
}

const mapStateToProps = (state) => ({
	theme: state.theme.theme,
	lang: state.settings.settings.lang,
	translations: {
		...state.settings.translations.QuicklyTaskList,
		...state.settings.translations.validation,
		...state.settings.translations.common,
	},
})

const mapDispatchToProps = (dispatch) => ({
	onInitCategories: () => dispatch(actions.initCategories()),
	onInitLists: () => dispatch(actions.initLists()),
	onInitList: (id, callback) => dispatch(actions.initList(id, callback)),
	onSaveQuicklyTask: (task, list, callback) =>
		dispatch(actions.saveQuicklyTask(task, list, callback)),
	// onsaveCategory: (list, callback) => dispatch(actions.updateCategory(list, callback)),
	onSaveCategory: (category, callback) => dispatch(actions.saveCategory(category, callback)),
	onUpdateCategory: (category, callback) => dispatch(actions.updateCategory(category, callback)),
	onRemoveQuicklyTask: (id, callback) => dispatch(actions.removeQuicklyTask(id, callback)),
})

export default connect(mapStateToProps, mapDispatchToProps)(QuicklyTaskList)
