import { openDatabase } from 'expo-sqlite'
import moment from 'moment'
import * as Analytics from 'expo-firebase-analytics'
import * as actionTypes from './actionTypes'
import { dateTimeFormat, dateFormat } from '../../shared/consts'
import { convertNumberToDate, setCategories, dateTime } from '../../shared/utility'
import { configTask, deleteCalendarEvent, deleteLocalNotification } from '../../shared/configTask'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert } from 'react-native'

const db = openDatabase('maker.db')

export const onRefresh = () => ({
	type: actionTypes.REFRESH,
})

export const onInitToDo = (tasks, finished) => ({
	type: actionTypes.INIT_TODO,
	tasks,
	finished,
})

export const onInitTasks = (tasks) => ({
	type: actionTypes.INIT_TASKS,
	tasks,
})

export const onInitFinished = (tasks) => ({
	type: actionTypes.INIT_FINISHED,
	tasks,
})

export const initTask =
	(id, callback = () => null) =>
	() => {
		db.transaction(
			(tx) => {
				tx.executeSql('select * from tasks where id = ?', [id], (_, { rows }) => {
					callback(rows._array[0])
				})
			},
			// eslint-disable-next-line no-console
			(err) => console.log(err),
		)
	}

export const initFinishedTask =
	(id, callback = () => null) =>
	() => {
		db.transaction(
			(tx) => {
				tx.executeSql('select * from finished where id = ?', [id], (_, { rows }) => {
					callback(rows._array[0])
				})
			},
			// eslint-disable-next-line no-console
			(err) => console.log(err),
		)
	}

export const initToDo = (callback = () => null) => {
	let tasks
	let categories

	return async (dispatch) => {
		// db.transaction(
		// 	(tx) => {
		// 		tx.executeSql('select * from categories', [], (_, { rows }) => {
		// 			categories = rows._array
		// 		})
		// 		tx.executeSql('select * from tasks', [], (_, { rows }) => {
		// 			tasks = rows._array
		// 		})
		// 		tx.executeSql('select * from finished', [], async (_, { rows }) => {
		// 			tasks = await setCategories(tasks, categories)
		// 			const finished = await setCategories(rows._array, categories)

		// 			callback(tasks, finished)
		// 			dispatch(onInitToDo(tasks, finished))
		// 		})
		// 	},
		// 	// eslint-disable-next-line no-console
		// 	(err) => console.log(err),
		// )

		try {
			const rawProducts = await axios.get('http://caliboxs.com/api/v1/products', {
				headers: {
					authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
				},
			})

			const rawCategories = await axios.get('http://caliboxs.com/api/v1/categories', {
				headers: {
					authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
				},
			})

			const filteredProducts = rawProducts.data.result
			const filteredCategories = rawCategories.data.result

			const me = await AsyncStorage.getItem('me')

			// TODO: Change hard-coded user ID to meResponse.data.result.id
			const userFilteredProducts = filteredProducts.filter((product) => product.user_id === +me)
			const userFilteredCategories = filteredCategories.filter(
				(category) => category.user_id === +me,
			)

			const updatedProducts = await setCategories(userFilteredProducts, userFilteredCategories)
			dispatch(onInitToDo(updatedProducts))
		} catch (e) {
			console.error('Error on initTodo :: ', e)
		}
	}
}

export const initTasks = () => {
	// FIRES off whenever new products are made
	let categories
	console.log('THIS IS INITIAL TASKS')
	return async (dispatch) => {
		try {
			const rawProducts = await axios.get('http://caliboxs.com/api/v1/products', {
				headers: {
					authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
				},
			})

			const rawCategories = await axios.get('http://caliboxs.com/api/v1/categories', {
				headers: {
					authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
				},
			})

			const filteredProducts = rawProducts.data.result
			const filteredCategories = rawCategories.data.result

			const updatedProducts = await setCategories(filteredProducts, filteredCategories)

			dispatch(onInitTasks(updatedProducts))
		} catch (e) {
			console.error('Error oninitTask:: ', e)
		}
	}
}

export const initFinished = () => {
	let categories
	return (dispatch) => {
		db.transaction(
			(tx) => {
				tx.executeSql('select * from categories', [], (_, { rows }) => {
					categories = rows._array
				})
				tx.executeSql('select * from finished', [], async (_, { rows }) => {
					const tasks = await setCategories(rows._array, categories)
					dispatch(onInitFinished(tasks))
				})
			},
			// eslint-disable-next-line no-console
			(err) => console.log(err),
		)
	}
}

const errorParseResult = (errorObj) => {
	let errorsArray = []
	for (let errorFieldArray in errorObj) {
		errorObj[errorFieldArray].forEach((error) => errorsArray.push(error))
	}
	return errorsArray.join('\n')
}

export const saveEditTask =
	(state, callback = () => null) =>
	async (dispatch) => {
		const bodyFormData = new FormData()

		bodyFormData.append('_method', 'put')
		bodyFormData.append('name', state.task.name)
		bodyFormData.append('price', state.task.price)
		bodyFormData.append('stock', state.task.stock)
		bodyFormData.append('details', state.task.details)
		bodyFormData.append('nose', state.task.nose)
		bodyFormData.append('structure', state.task.structure)
		bodyFormData.append('categories[]', state.task.category.id)

		try {
			let filteredNewVideo
			let filteredNewPhoto

			if (state.task.image) {
				const photoForm = new FormData()

				photoForm.append('product_id', '200')
				photoForm.append('gallery[]', {
					uri: state.task.image,
					type: 'image/jpeg',
					name: state.task.name + '_photo',
				})

				const newPhoto = await axios.post(
					'http://caliboxs.com/api/v1/galleries/upload',
					photoForm,
					{
						headers: {
							'content-type': 'multipart/form-data',
							authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
						},
					},
				)

				filteredNewPhoto = newPhoto.data.result[0]

				bodyFormData.append('photo', {
					uri: filteredNewPhoto.photo,
					type: 'image/jpeg',
					name: `-${filteredNewPhoto.product_id}-${filteredNewPhoto.id}`,
				})
			}

			if (state.newVideoUri) {
				console.log('new video incoming....')
				const videoForm = new FormData()
				bodyFormData.append('video', state.task.video)
				videoForm.append('product_id', '200')

				videoForm.append('gallery[]', {
					uri: state.task.video,
					type: 'video/mov/mp4',
					name: state.task.name + '_video',
				})
				console.log('sending request...')
				const newVideo = await axios.post(
					'http://caliboxs.com/api/v1/galleries/upload',
					videoForm,
					{
						headers: {
							'content-type': 'multipart/form-data',
							authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
						},
					},
				)

				console.log('response', newVideo)

				filteredNewVideo = newVideo.data.result[0]
				bodyFormData.append('video', filteredNewVideo.video_path)
			}

			const response = await axios.post(
				`http://caliboxs.com/api/v1/products/${state.task.id}`,
				bodyFormData,
				{
					headers: {
						'content-type': 'application/json',
						authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
					},
				},
			)

			if (response) {
				Alert.alert('Success', `Your product has been updated.`, [
					{
						text: 'Ok',
						onPress: () => {
							callback()
							if (state.saveThruDialog) {
								callback()
							}
						},
						style: 'cancel',
					},
				])

				// if (state.saveThruDialog) {
				// 	callback()
				// }

				dispatch(initToDo())
			}
		} catch (err) {
			console.log(`error`, err)
			if (err.response) {
				console.error(`error editing product`, err.response.data)
				Alert.alert(
					'Error',
					`${err.response.data.message} ${errorParseResult(err.response.data.errors)}`,
					[
						{
							text: 'Ok',
							onPress: null,
							style: 'cancel',
						},
					],
				)
			}
		}
	}

export const saveTask =
	(task, callback = () => null) =>
	async (dispatch) => {
		const bodyFormData = new FormData()
		const photoForm = new FormData()
		const videoForm = new FormData()

		bodyFormData.append('name', task.name)
		bodyFormData.append('price', task.price)
		bodyFormData.append('stock', task.stock)
		bodyFormData.append('details', task.details)
		bodyFormData.append('nose', task.nose)
		bodyFormData.append('structure', task.structure)
		bodyFormData.append('categories[]', task.category.id)
		bodyFormData.append('video', task.video)

		photoForm.append('product_id', '200')
		photoForm.append('gallery[]', {
			uri: task.image,
			type: 'image/jpeg',
			name: task.name + '_photo',
		})

		videoForm.append('product_id', '200')
		videoForm.append('gallery[]', {
			uri: task.video,
			type: 'video/mov/mp4',
			name: task.name + '_video',
		})

		try {
			let filteredNewPhoto
			let filteredNewVideo

			if (task.image) {
				const newPhoto = await axios.post(
					'http://caliboxs.com/api/v1/galleries/upload',
					photoForm,
					{
						headers: {
							'content-type': 'multipart/form-data',
							authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
						},
					},
				)
				filteredNewPhoto = newPhoto.data.result[0]
			}

			if (task.video) {
				const newVideo = await axios.post(
					'http://caliboxs.com/api/v1/galleries/upload',
					videoForm,
					{
						headers: {
							'content-type': 'multipart/form-data',
							authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
						},
					},
				)

				filteredNewVideo = newVideo.data.result[0]
				bodyFormData.append('video', filteredNewVideo.video_path)
			}

			bodyFormData.append('photo', {
				uri: filteredNewPhoto.photo,
				type: 'image/jpeg',
				name: `-${filteredNewPhoto.product_id}-${filteredNewPhoto.id}`,
			})

			const response = await axios.post(`http://caliboxs.com/api/v1/products`, bodyFormData, {
				headers: {
					'content-type': 'application/json',
					authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
				},
			})

			if (response) {
				Alert.alert('Success', `Your product has been updated.`, [
					{
						text: 'Ok',
						onPress: callback,
						style: 'cancel',
					},
				])
				console.log('nice')
				dispatch(initToDo())
			}
		} catch (err) {
			console.log(`error`, err)
			console.error(`error editing product`, err.response.data)
			Alert.alert(
				'Error',
				`${err.response.data.message} ${errorParseResult(err.response.data.errors)}`,
				[
					{
						text: 'Ok',
						onPress: null,
						style: 'cancel',
					},
				],
			)
		}
	}

// export const finishTask = (task, endTask, primaryColor, callback = () => null) => {
// 	let nextDate = task.date
// 	const format = dateTime(task.date) ? dateTimeFormat : dateFormat

// 	// Set next repeat date
// 	if (+task.repeat === parseInt(task.repeat, 10)) {
// 		// Other repeat
// 		if (task.repeat[0] === '6') {
// 			const repeatDays = task.repeat.substring(1).split('').sort()
// 			const actualWeekday = moment(task.date, format).day()
// 			let nextWeekday = repeatDays.find((weekday) => +weekday > +actualWeekday)

// 			if (nextWeekday) {
// 				nextDate = moment(task.date, format).day(nextWeekday)
// 			} else {
// 				nextDate = moment(task.date, format).day(+repeatDays[0] + 7)
// 			}
// 		} else {
// 			nextDate = moment(nextDate, format).add(
// 				+task.repeat.substring(1),
// 				`${convertNumberToDate(+task.repeat[0])}s`,
// 			)
// 		}
// 	} else if (task.repeat === 'onceDay') nextDate = moment(nextDate, format).add(1, 'days')
// 	else if (task.repeat === 'onceDayMonFri') {
// 		if (moment(task.date, format).day() === 5) {
// 			// Friday
// 			nextDate = moment(nextDate, format).add(3, 'days')
// 		} else if (moment(task.date, format).day() === 6) {
// 			// Saturday
// 			nextDate = moment(nextDate, format).add(2, 'days')
// 		} else {
// 			nextDate = moment(nextDate, format).add(1, 'days')
// 		}
// 	} else if (task.repeat === 'onceDaySatSun') {
// 		if (moment(task.date, format).day() === 6) {
// 			// Saturday
// 			nextDate = moment(nextDate, format).add(1, 'days')
// 		} else if (moment(task.date, format).day() === 0) {
// 			// Sunday
// 			nextDate = moment(nextDate, format).add(6, 'days')
// 		} else {
// 			// Other day
// 			nextDate = moment(nextDate, format).day(6)
// 		}
// 	} else if (task.repeat === 'onceWeek') nextDate = moment(nextDate, format).add(1, 'week')
// 	else if (task.repeat === 'onceMonth') nextDate = moment(nextDate, format).add(1, 'month')
// 	else if (task.repeat === 'onceYear') nextDate = moment(nextDate, format).add(1, 'year')

// 	nextDate = moment(nextDate, format).format(format)

// 	return (dispatch) => {
// 		const insertTaskToFinished = (tx, repeating) => {
// 			tx.executeSql(
// 				'insert into finished (name, description, date, category, priority, repeat, finish) values (?,?,?,?,?,?,1)',
// 				[task.name, task.description, task.date, task.category.id, task.priority, task.repeat],
// 				() => {
// 					Analytics.logEvent('finishedTask', {
// 						name: 'taskAction',
// 					})

// 					if (!repeating) {
// 						if (task.event_id !== false) {
// 							deleteCalendarEvent(task.event_id)
// 						}
// 						if (task.notification_id !== null) {
// 							deleteLocalNotification(task.notification_id)
// 						}
// 					}

// 					callback()
// 					dispatch(initToDo())
// 				},
// 			)
// 		}

// 		if (task.repeat === 'noRepeat' || endTask) {
// 			db.transaction(
// 				(tx) => {
// 					tx.executeSql('delete from tasks where id = ?', [task.id])
// 					insertTaskToFinished(tx, false)
// 				},
// 				// eslint-disable-next-line no-console
// 				(err) => console.log(err),
// 			)
// 		} else {
// 			db.transaction((tx) => {
// 				tx.executeSql(
// 					`update tasks
//                                    set date = ?
//                                    where id = ?;`,
// 					[nextDate, task.id],
// 					() => {
// 						insertTaskToFinished(tx, true)

// 						task.date = nextDate
// 						configTask(task, primaryColor, task.event_id, task.notification_id !== null)
// 					},
// 					// eslint-disable-next-line no-console
// 					(err) => console.log(err),
// 				)
// 			})
// 		}
// 	}
// }

export const undoTask =
	(task, callback = () => null) =>
	(dispatch) => {
		db.transaction(
			(tx) => {
				tx.executeSql('delete from finished where id = ?', [task.id])
				tx.executeSql(
					'insert into tasks (name, description, date, category, priority, repeat, event_id, notification_id) values (?,?,?,?,?,?,?,?)',
					[
						task.name,
						task.description,
						task.date,
						task.category.id,
						task.priority,
						task.repeat,
						task.event_id,
						task.notification_id,
					],
					() => {
						Analytics.logEvent('undoTask', {
							name: 'taskAction',
						})

						callback()
						dispatch(initToDo())
					},
				)
			},
			// eslint-disable-next-line no-console
			(err) => console.log(err),
		)
	}

export const removeTask =
	(productId, finished = true, callback = () => null) =>
	async (dispatch) => {
		const bodyFormData = new FormData()
		bodyFormData.append('_method', 'DELETE')

		try {
			await axios.post('http://caliboxs.com/api/v1/products/' + productId, bodyFormData, {
				headers: {
					'content-type': 'multipart/form-data',
					authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
				},
			})

			callback()
			dispatch(initToDo())
		} catch (err) {
			console.log('error deleting product', err)
		}

		// if (finished) {
		// 	db.transaction(
		// 		(tx) => {
		// 			tx.executeSql('delete from finished where id = ?', [task.id], () => {
		// 				callback()
		// 				dispatch(initFinished())
		// 			})
		// 		},
		// 		// eslint-disable-next-line no-console
		// 		(err) => console.log(err),
		// 	)
		// } else {
		// 	db.transaction(
		// 		(tx) => {
		// 			tx.executeSql('delete from tasks where id = ?', [task.id], () => {
		// 				Analytics.logEvent('removedTask', {
		// 					name: 'taskAction',
		// 				})
		// 				if (task.event_id !== null) {
		// 					deleteCalendarEvent(task.event_id)
		// 				}
		// 				if (task.notification_id !== null) {
		// 					deleteLocalNotification(task.notification_id)
		// 				}
		// 				callback()
		// 				dispatch(initTasks())
		// 			})
		// 		},
		// 		// eslint-disable-next-line no-console
		// 		(err) => console.log(err),
		// 	)
		// }
	}
