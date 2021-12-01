import React, { Component } from 'react'
import { ScrollView, Text, TouchableOpacity, View, Button, Image, Alert } from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import { IconToggle, Toolbar, Checkbox } from 'react-native-material-ui'
import { askAsync, CALENDAR, REMINDERS } from 'expo-permissions'
import moment from 'moment'
import { flex } from '../../../shared/styles'
import { dateFormat, dateTimeFormat, timeFormat, timeFormatA } from '../../../shared/consts'
import Subheader from '../../../components/Subheader/Subheader'
import Spinner from '../../../components/Spinner/Spinner'
import Template from '../../Template/Template'
import Input from '../../../components/Input/Input'
import ConfigCategory from '../../Categories/ConfigCategory/ConfigCategory'
import axios from 'axios'
import Camera from '../../../components/Camera'
import {
	checkValid,
	convertDaysIndex,
	convertNumberToDate,
	convertPriorityNames,
	convertRepeatNames,
	dateTime,
	generateDialogObject,
	getTimeVariant,
} from '../../../shared/utility'
import VideoRecorderContainer from '../../../components/VideoRecorder'
import { configTask } from '../../../shared/configTask'
import Dialog from '../../../components/Dialog/Dialog'
import * as Analytics from 'expo-firebase-analytics'
import styles from './EditTask.styles'
import * as ImagePicker from 'expo-image-picker'

import * as actions from '../../../store/actions'
import { connect } from 'react-redux'
import AsyncStorage from '@react-native-community/async-storage'

const defaultNoImage = require('../../../assets/no_image_stock.png')

class EditTask extends Component {
	state = {
		task: {
			id: 0,
			sku: '',
			product_type: 'normal',
			affiliate_link: null,
			user_id: null,
			categories: [],
			category_id: null,
			subcategory_id: null,
			childcategory_id: null,
			attributes: null,
			name: '',
			slug: '',
			photo: '',
			thumbnail: '',
			file: null,
			size: '',
			photo: '',
			video: '',
			size_qty: '',
			size_price: '',
			color: '',
			price: '',
			previous_price: 0,
			details: '',
			stock: 0,
			image: null,
			policy: '',
			status: 0,
			views: 0,
			tags: '',
			features: '',
			colors: '',
			product_condition: 0,
			ship: null,
			is_meta: 0,
			meta_tag: '',
			meta_description: null,
			youtube: null,
			type: 'Physical',
			license: '',
			license_qty: '',
			link: null,
			platform: null,
			region: null,
			licence_type: null,
			measure: null,
			featured: 0,
			best: 0,
			top: 0,
			hot: 0,
			latest: 0,
			big: 0,
			trending: 0,
			sale: 0,
			created_at: '2020-07-15T14:20:46.000000Z',
			updated_at: '2021-10-22T23:02:23.000000Z',
			is_discount: 0,
			discount_date: null,
			whole_sell_qty: '',
			whole_sell_discount: '',
			is_catalog: 0,
			catalog_id: 0,
			// ORIGINAL BELOW
			id: false,
			name: '',
			description: '',
			date: '',
			repeat: 'noRepeat',
			category: this.props.categories[0],
			priority: 'none',
			event_id: null,
			notification_id: null,
		},
		controls: {
			name: {
				label: this.props.translations.nameLabel,
				required: true,
				characterRestriction: 40,
			},
			price: {
				label: this.props.translations.priceLabel,
				required: true,
				characterRestriction: 40,
			},
			stock: {
				label: this.props.translations.stockLabel,
				required: false,
				characterRestriction: 40,
			},
			previousPrice: {
				label: this.props.translations.previousPriceLabel,
				required: true,
				characterRestriction: 40,
			},
			details: {
				label: this.props.translations.tagsLabel,
				required: true,
				characterRestriction: 200,
				multiline: true,
			},
			description: {
				label: this.props.translations.descriptionLabel,
				multiline: true,
			},
			nose: {
				label: this.props.translations.noseLabel,
				required: false,
				characterRestriction: 80,
			},
			structure: {
				label: this.props.translations.structureLabel,
				required: false,
				characterRestriction: 80,
				multiline: true,
			},
		},
		dialog: null,
		showDialog: false,
		otherOption: null,
		taskCopy: null,
		selectedTime: 0,
		editTask: null,
		showConfigCategory: false,
		setEvent: false,
		setNotification: false,
		isVisibleDate: false,
		isVisibleTime: false,
		loading: true,
		updatePhoto: false,
		photoMode: false,
	}

	componentDidMount() {
		const { task } = this.state
		const { navigation, onInitTask, onInitFinishedTask, translations } = this.props
		const taskId = navigation.getParam('task', false)
		const finished = navigation.getParam('finished', false)
		const category = navigation.getParam('category', false)
		const product = navigation.getParam('product', false)

		const newTask = {
			...this.state.task,
			...product,
		}
		this.setState({ task: newTask })

		this.getRawPhoto(newTask.photo)

		// if (taskId !== false) {
		// 	if (finished) {
		// 		onInitFinishedTask(taskId, (task) => {
		// 			this.prepareTask({ ...task, event_id: null, notification_id: null })
		// 		})
		// 	} else {
		// 		onInitTask(taskId, (task) => {
		// 			this.prepareTask(task)
		// 		})
		// 	}
		// 	return
		// }

		if (taskId !== false) {
			onInitTask(taskId, (task) => {
				this.prepareTask(task)
			})
		}

		// if (category && category.name !== translations.all) {
		// 	task.category = category
		// }

		this.setState({
			taskCopy: JSON.parse(JSON.stringify(task)),
			editTask: true,
			loading: false,
		})
	}

	getRawPhoto = async (photoName) => {
		const photoId = photoName.split('-')[1]

		const string = 'http://caliboxs.com/api/v1/galleries/' + photoId

		try {
			const result = await axios.get(string, {
				headers: {
					authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
				},
			})

			const photoArray = result.data.result

			const photoUrl = await photoArray.find((photoObj) => {
				const productId = photoName.split('-').pop()
				return +photoObj.id === +productId
			}).photo

			if (photoUrl) {
				const prevTask = this.state.task

				prevTask.photo = photoUrl

				this.setState({
					task: prevTask,
				})
			}
		} catch (err) {
			console.log('failed to get photo', err)
		}
	}

	getVideoUri = (videoUri) => {
		const { task } = this.state

		if (videoUri) {
			this.setState({
				task: { ...task, video: videoUri },
			})
		}
	}

	updateImage = async (image) => {
		const prevTask = this.state.task
		prevTask.image = image
		this.setState({ task: prevTask, photoMode: false, updatePhoto: true })
	}

	prepareTask = (task) => {
		const { categories, translations, settings } = this.props

		const findCate = categories.find((c) => +c.id === +task.category)
		if (findCate) {
			task.category = findCate
		} else {
			task.category = categories[0]
		}

		let selectedTime = 0
		let repeatValue = '1'
		let otherOption = `${translations.other}...`

		if (+task.repeat === parseInt(task.repeat, 10)) {
			selectedTime = task.repeat[0]
			repeatValue = task.repeat.substring(1)
			if (+selectedTime !== 6) {
				otherOption = `${translations.other} (${repeatValue} ${getTimeVariant(
					+repeatValue,
					convertNumberToDate(+selectedTime),
					settings.lang,
					translations,
				)})`
			} else {
				otherOption = `${translations.other} (${translations.repeatDays} ${convertDaysIndex(
					repeatValue,
					translations,
				)})`
			}
		}

		this.setState({
			taskCopy: JSON.parse(JSON.stringify(task)),
			editTask: true,
			task,
			otherOption,
			repeatValue,
			setEvent: task.event_id !== null,
			setNotification: task.notification_id !== null,
			selectedTime,
			loading: false,
		})
	}

	updateTask = (name, value) => {
		const { task } = this.state
		if (`${task[name]}` === `${value}`) return null
		task[name] = value
		this.setState({ task }, () => {
			if (name === 'date') this.checkCorrectRepeat()
		})
	}

	showDialog = async (action) => {
		const { task } = this.state
		const { translations, navigation } = this.props

		const cancelHandler = () => this.setState({ showDialog: false })

		let dialog
		if (action === 'exit') {
			dialog = generateDialogObject(
				cancelHandler,
				translations.defaultTitle,
				translations.exitDescription,
				{
					[translations.yes]: () => {
						cancelHandler()
						navigation.goBack()
					},
					[translations.save]: () => {
						cancelHandler()
						this.saveEditTask()
					},
					[translations.cancel]: cancelHandler,
				},
			)
		} else if (action === 'delete') {
			dialog = generateDialogObject(
				cancelHandler,
				translations.defaultTitle,
				translations.deleteDescription,
				{
					[translations.yes]: () => {
						const { onRemoveTask, navigation } = this.props

						cancelHandler()
						onRemoveTask(task, !!task.finish, () => {
							navigation.goBack()

							Analytics.logEvent('removedTask', {
								name: 'taskAction',
							})
						})
					},
					[translations.cancel]: cancelHandler,
				},
			)
		} else if (action === 'repeat') {
			const repeats = [
				'noRepeat',
				'onceDay',
				'onceDayMonFri',
				'onceDaySatSun',
				'onceWeek',
				'onceMonth',
				'onceYear',
			]
			const options = []
			repeats.map((p) => {
				options.push({
					name: convertRepeatNames(p, translations),
					value: p,
					onClick: (value) => {
						cancelHandler()
						this.updateTask('repeat', value)
					},
				})
			})

			dialog = generateDialogObject(cancelHandler, translations.repeat, options, {
				[translations.cancel]: cancelHandler,
			})

			dialog.select = true
			dialog.selectedValue = task.repeat
		} else if (action === 'category') {
			const { categories } = this.props

			const me = await AsyncStorage.getItem('me')
			const userCategories = categories.filter((category) => category.user_id === +me)

			const options = []
			userCategories.map((c) => {
				options.push({
					name: c.name,
					value: c,
					onClick: (value) => {
						task.category = value
						this.setState({ task, showDialog: false })
					},
				})
			})

			dialog = generateDialogObject(cancelHandler, translations.category, options, {
				[translations.cancel]: cancelHandler,
			})

			dialog.select = true
			dialog.selectedValue = task.category
		} else if (action === 'priority') {
			const priorities = ['none', 'low', 'medium', 'high']
			const options = []
			priorities.map((p) => {
				options.push({
					name: convertPriorityNames(p, translations),
					value: p,
					onClick: (value) => {
						cancelHandler()
						this.updateTask('priority', value)
					},
				})
			})

			dialog = generateDialogObject(cancelHandler, translations.priority, options, {
				[translations.cancel]: cancelHandler,
			})

			dialog.select = true
			dialog.selectedValue = task.priority
		}

		this.setState({ dialog, showDialog: true })
	}

	toggleConfigCategory = (category) => {
		const { showConfigCategory, task } = this.state

		if (category) task.category = category
		this.setState({ task, showConfigCategory: !showConfigCategory })
	}

	showOtherRepeat = () => {
		const { task, selectedTime, repeatValue } = this.state

		const usingTime = dateTime(task.date)
		this.props.navigation.navigate('OtherRepeat', {
			usingTime,
			selectedTime,
			repeat: repeatValue,
			saveHandler: (repeat, selectedTime) => this.saveOtherRepeat(repeat, selectedTime),
		})
	}

	saveOtherRepeat = (repeatValue, selectedTime) => {
		const { translations, settings } = this.props

		const repeat = selectedTime + repeatValue
		let otherOption
		if (+selectedTime !== 6) {
			otherOption = `${translations.other} (${repeatValue} ${getTimeVariant(
				+repeatValue,
				convertNumberToDate(+selectedTime),
				settings.lang,
				translations,
			)})`
		} else {
			otherOption = `${translations.other} (${translations.repeatDays} ${convertDaysIndex(
				repeatValue,
				translations,
			)})`
		}
		this.updateTask('repeat', repeat)
		this.setState({
			otherOption,
			repeatValue,
			selectedTime,
		})
	}

	convertDate = (newDate) => {
		const { task } = this.state

		if (dateTime(task.date)) {
			return `${newDate}${task.date.slice(10, 18)}`
		}
		return newDate
	}

	toggleSnackbar = (message, visible = true) => {
		const { onUpdateSnackbar } = this.props

		onUpdateSnackbar(visible, message)
	}

	checkChanges = () => {
		const { task, taskCopy, setEvent, setNotification, controls } = this.state

		return (
			checkValid(controls.name, task.name) &&
			(JSON.stringify(task) !== JSON.stringify(taskCopy) ||
				setEvent !== (task.event_id !== null) ||
				setNotification !== (task.notification_id !== null))
		)
	}

	checkCorrectRepeat = () => {
		const { task } = this.state
		if ((task.repeat[0] === '0' || task.repeat[0] === '1') && task.date.length < 13) {
			task.repeat = 'noRepeat'
			this.setState({ task })
		}
	}

	setEvent = async (value) => {
		if (value) {
			const { status } = await askAsync(CALENDAR, REMINDERS)
			if (status === 'granted') {
				this.setState({ setEvent: value })
			} else {
				const { translations } = this.props
				this.toggleSnackbar(translations.permissionError)
			}
		} else {
			this.setState({ setEvent: value })
		}
	}

	setNotification = async (value) => {
		this.setState({ setNotification: value })
	}

	toggleDateModal = () => {
		const { isVisibleDate } = this.state

		this.setState({ isVisibleDate: !isVisibleDate })
	}

	toggleTimeModal = () => {
		const { isVisibleTime } = this.state

		this.setState({ isVisibleTime: !isVisibleTime })
	}

	pickImage = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 1,
		})

		if (!result.cancelled) {
			const prevTask = { ...this.state.task }
			const newTask = { ...prevTask, image: result.uri }
			this.setState({ task: newTask, updatePhoto: true })
		}
	}

	pickVideo = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.All,
			allowsEditing: true,
			aspect: [4, 3],
			quality: 1,
		})

		if (!result.cancelled) {
			const prevTask = { ...this.state.task }
			const newTask = { ...prevTask, video: result.uri }
			this.setState({ task: newTask, updateVideo: true })
		}
	}

	saveEditTask = async () => {
		let { task, setEvent, setNotification, updatePhoto } = this.state
		const { navigation, theme, onSaveTask, onUndoTask } = this.props
		// const saveTaskCallback = (task) => {
		// 	if (task.finish) {
		// 		onUndoTask(task, navigation.goBack)
		// 	} else {
		this.setState({ loading: true })
		this.props.onSaveEditTask(this.state, navigation.goBack)
		// 	}
		// }
	}

	render() {
		const {
			task,
			controls,
			loading,
			editTask,
			showConfigCategory,
			otherOption,
			setEvent,
			setNotification,
			isVisibleTime,
			isVisibleDate,
			dialog,
			showDialog,
		} = this.state
		const { navigation, theme, settings, translations } = this.props

		// TODO

		return (
			<Template bgColor={theme.secondaryBackgroundColor}>
				<Toolbar
					leftElement='arrow-back'
					centerElement={
						!loading ? (
							editTask ? (
								translations.editTask
							) : (
								translations.newTask
							)
						) : (
							<View style={styles.spinnerWrapper}>
								<Spinner color={theme.primaryBackgroundColor} size='small' />
							</View>
						)
					}
					rightElement={
						<View style={styles.headerIcons}>
							{/* {editTask && (
								<IconToggle
									name='delete'
									color={theme.primaryTextColor}
									onPress={() => this.showDialog('delete')}
								/>
							)} */}
							{this.checkChanges() && !loading && (
								<IconToggle
									name={task.finish ? 'replay' : 'save'}
									color={theme.primaryTextColor}
									onPress={this.saveEditTask}
								/>
							)}
						</View>
					}
					onLeftElementPress={() => {
						if (this.checkChanges()) this.showDialog('exit')
						else navigation.goBack()
					}}
				/>

				<ConfigCategory
					showDialog={showConfigCategory}
					category={false}
					toggleModal={this.toggleConfigCategory}
				/>

				<Dialog {...dialog} theme={theme} showDialog={showDialog} />

				{!loading ? (
					<ScrollView>
						<Input
							elementConfig={controls.name}
							focus={!editTask}
							value={task.name}
							changed={(value, control) => {
								const { task, controls } = this.state
								task.name = value || ''
								controls.name = control
								this.setState({ task, controls })
							}}
						/>
						<Input
							elementConfig={controls.price}
							focus={!editTask}
							value={task.price}
							changed={(value, control) => {
								const { task, controls } = this.state
								task.price = value
								controls.price = control
								this.setState({ task, controls })
							}}
						/>
						<Input
							elementConfig={controls.stock}
							focus={!editTask}
							value={task.stock}
							changed={(value, control) => {
								const { task, controls } = this.state
								task.stock = value
								controls.stock = control
								this.setState({ task, controls })
							}}
						/>
						<Input
							elementConfig={controls.details}
							focus={!editTask}
							value={task.details}
							changed={(value, control) => {
								const { task, controls } = this.state
								task.details = value
								controls.details = control
								this.setState({ task, controls })
							}}
						/>
						<Input
							elementConfig={controls.nose}
							focus={!editTask}
							value={task.nose}
							changed={(value, control) => {
								const { task, controls } = this.state
								task.nose = value
								controls.nose = control
								this.setState({ task, controls })
							}}
						/>
						<Input
							elementConfig={controls.structure}
							focus={!editTask}
							value={task.structure}
							changed={(value, control) => {
								const { task, controls } = this.state
								task.structure = value
								controls.structure = control
								this.setState({ task, controls })
							}}
						/>

						<View style={styles.container}>
							<Subheader text={translations.category} />
							<View style={styles.select}>
								<TouchableOpacity
									style={flex}
									onPress={() => {
										this.showDialog('category')
									}}
								>
									<Text
										style={{
											...styles.selectedOption,
											color: theme.secondaryTextColor,
										}}
									>
										{task.category.name}
									</Text>
								</TouchableOpacity>
							</View>
						</View>
						{this.state.task.photo && (
							<Image
								source={{
									uri: this.state.task.photo || defaultNoImage,
								}}
								style={{ width: 200, height: 200, marginLeft: 'auto', marginRight: 'auto' }}
							/>
						)}
						{this.state.task.image && (
							<Image
								source={{
									uri: this.state.task.image || defaultNoImage,
								}}
								style={{ width: 200, height: 200, marginLeft: 'auto', marginRight: 'auto' }}
							/>
						)}

						{this.state.photoMode ? (
							<Camera updateImage={this.updateImage} />
						) : (
							<Button title='Take a photo' onPress={() => this.setState({ photoMode: true })} />
						)}

						<Button title='Pick an image from camera roll' onPress={this.pickImage} />
						<View style={styles.container}>
							<Subheader text={translations.videoRecord} />
							<Button title='Pick a video from camera roll' onPress={this.pickVideo} />
							<VideoRecorderContainer
								getVideoUri={this.getVideoUri}
								setState={this.setState}
								task={task}
							/>
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
	categories: state.categories.categories,
	theme: state.theme.theme,
	settings: state.settings.settings,
	translations: {
		...state.settings.translations.ConfigTask,
		...state.settings.translations.OtherRepeat,
		...state.settings.translations.validation,
		...state.settings.translations.times,
		...state.settings.translations.common,
	},
})

const mapDispatchToProps = (dispatch) => ({
	onInitTask: (id, callback) => dispatch(actions.initTask(id, callback)),
	onInitFinishedTask: (id, callback) => dispatch(actions.initFinishedTask(id, callback)),
	onSaveEditTask: (task, callback) => dispatch(actions.saveEditTask(task, callback)),
	onUndoTask: (task, callback) => dispatch(actions.undoTask(task, callback)),
	onRemoveTask: (task, finished, callback) =>
		dispatch(actions.removeTask(task, finished, callback)),
	onUpdateSnackbar: (showSnackbar, snackbarText) =>
		dispatch(actions.updateSnackbar(showSnackbar, snackbarText)),
})

export default connect(mapStateToProps, mapDispatchToProps)(EditTask)
