import React, { Component } from 'react'
import { ScrollView, Text, TouchableOpacity, View, Image } from 'react-native'
import DateTimePickerModal from 'react-native-modal-datetime-picker'
import AsyncStorage from '@react-native-async-storage/async-storage'
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
import VideoPlayer from '../../../components/Video'
import { configTask } from '../../../shared/configTask'
import Dialog from '../../../components/Dialog/Dialog'
import * as Analytics from 'expo-firebase-analytics'
import styles from './ViewProduct.styles'

import * as actions from '../../../store/actions'
import { connect } from 'react-redux'
import axios from 'axios'
import Carousel from 'react-native-snap-carousel'

const defaultNoImage = require('../../../assets/no_image_stock.png')

class ViewProduct extends Component {
	state = {
		task: {
			id: 0,
			sku: '',
			product_type: 'normal',
			affiliate_link: null,
			user_id: 0,
			categories: [],
			category_id: 20,
			subcategory_id: null,
			childcategory_id: null,
			attributes: null,
			name: '',
			slug: '',
			photo: '',
			thumbnail: '',
			file: null,
			size: '',
			size_qty: '',
			size_price: '',
			color: '',
			price: 0,
			previous_price: 0,
			details: '',
			stock: 0,
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
			nose: '',
			structure: '',
			catalog_id: 0,
			video: '',
			// ORIGINAL BELOW
			// id: false,
			// name: '',
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
			color: {
				label: this.props.translations.colorLabel,
				required: true,
				characterRestriction: 40,
			},
			previousPrice: {
				label: this.props.translations.previousPriceLabel,
				required: true,
				characterRestriction: 40,
			},
			tags: {
				label: this.props.translations.tagsLabel,
				required: true,
				characterRestriction: 40,
			},
			description: {
				label: this.props.translations.descriptionLabel,
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
		photoArray: [],
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

		// TODO

		this.setState({ task: newTask })

		this.getRawPhoto(newTask.photo)

		// if (taskId !== false) {
		// 	console.log('THISIS INSIDE TASK ID FALSE')
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

		if (category && category.name !== translations.all) {
			task.category = category
		}

		this.setState({
			taskCopy: JSON.parse(JSON.stringify(task)),
			editTask: false,
			loading: false,
		})
	}

	getRawPhoto = async (photoName) => {
		const photoId = photoName.split('-')[1]

		console.log('this is photoID', photoId)

		const string = 'http://caliboxs.com/api/v1/galleries/' + photoId

		// TOOD this is string
		console.log('this is string:: ', string)

		try {
			const result = await axios.get(string, {
				headers: {
					authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
				},
			})

			const photoArray = result.data.result

			console.log('this is photo array from looking up photo', photoArray)

			this.setState({ photoArray: photoArray })

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

	prepareTask = (task) => {
		const { categories, translations, settings } = this.props

		if (task) {
			const findCate = categories.find((c) => +c.id === +task.category)

			if (findCate) {
				task.category = findCate
			} else {
				task.category = categories[0]
			}
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

	showDialog = (action) => {
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
						this.saveTask()
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

			const options = []
			categories.map((c) => {
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

	saveTask = async () => {
		let { task, setEvent, setNotification } = this.state
		const { navigation, theme, onSaveTask, onUndoTask } = this.props

		// const saveTaskCallback = (task) => {
		// 	if (task.finish) {
		// 		onUndoTask(task, navigation.goBack)
		// 	} else {
		// 		onSaveTask(task, navigation.goBack)
		// 	}
		// }

		// if (!dateTime(task.date)) setNotification = false
		// configTask(task, theme.primaryColor, setEvent, setNotification)
		// 	.then((task) => saveTaskCallback(task))
		// 	.catch((task) => saveTaskCallback(task))
	}

	renderCarouselItem = ({ item }) => {
		return (
			<View style={styles.carouselSlide}>
				<Image
					source={{
						uri: item.photo || defaultNoImage,
					}}
					style={{ width: 300, height: 300, marginLeft: 'auto', marginRight: 'auto' }}
				/>
			</View>
		)
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
		let date
		let now

		return (
			<Template bgColor={theme.secondaryBackgroundColor}>
				<Toolbar
					leftElement='arrow-back'
					centerElement={
						!loading ? (
							editTask ? (
								translations.editTask
							) : (
								this.state.task.name
							)
						) : (
							<View style={styles.spinnerWrapper}>
								<Spinner color={theme.primaryBackgroundColor} size='small' />
							</View>
						)
					}
					rightElement={
						<View style={styles.headerIcons}>
							{editTask && (
								<IconToggle
									name='delete'
									color={theme.primaryTextColor}
									onPress={() => this.showDialog('delete')}
								/>
							)}
							{/* {this.checkChanges() && (
								<IconToggle
									name={task.finish ? 'replay' : 'save'}
									color={theme.primaryTextColor}
									onPress={this.saveTask}
								/>
							)} */}
						</View>
					}
					onLeftElementPress={() => {
						navigation.goBack()
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
						<View style={styles.container}>
							<Subheader text='Name:' />
							<Text style={styles.productInfo}>{this.state.task.name}</Text>
							<Subheader text='Price:' />
							<Text style={styles.productInfo}>{`$ ${this.state.task.price}`}</Text>
							<Subheader text='Stock:' />
							<Text style={styles.productInfo}>{this.state.task.stock}</Text>
							<Subheader text='Details:' />
							<Text style={styles.productInfo}>{this.state.task.details}</Text>
							<Subheader text='Nose:' />
							<Text style={styles.productInfo}>{this.state.task.nose}</Text>
							<Subheader text='Structure:' />
							<Text style={styles.productInfo}>{this.state.task.structure}</Text>
							<View style={styles.imageContainer}>
								<Subheader text={translations.image} />
								<Image
									source={{
										uri: task.photo || defaultNoImage,
									}}
									style={{ width: 200, height: 200, marginLeft: 'auto', marginRight: 'auto' }}
								/>
								<Subheader text={translations.gallery} />
								<Carousel
									ref={(c) => {
										this._carousel = c
									}}
									data={this.state.photoArray}
									renderItem={this.renderCarouselItem}
									sliderWidth={600}
									itemWidth={300}
									layout='stack'
									layoutCardOffset='20'
								/>
							</View>
							<View style={styles.dateContainer}>
								<Subheader text={translations.video} />
								<VideoPlayer videoUri={this.state.task.video} />
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
	onSaveTask: (task, callback) => dispatch(actions.saveTask(task, callback)),
	onUndoTask: (task, callback) => dispatch(actions.undoTask(task, callback)),
	onRemoveTask: (task, finished, callback) =>
		dispatch(actions.removeTask(task, finished, callback)),
	onUpdateSnackbar: (showSnackbar, snackbarText) =>
		dispatch(actions.updateSnackbar(showSnackbar, snackbarText)),
})

export default connect(mapStateToProps, mapDispatchToProps)(ViewProduct)
