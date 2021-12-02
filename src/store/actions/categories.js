import { openDatabase } from 'expo-sqlite'
import * as Analytics from 'expo-firebase-analytics'
import * as actionTypes from './actionTypes'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Alert } from 'react-native'

const db = openDatabase('maker.db')

const isObject = (obj) => {
	return Object.prototype.toString.call(obj) === '[object Object]'
}

const filterOutPhoto = (list) => {
	if (!list || !list.photo) {
		return list
	}

	if (isObject(list.photo)) {
		list.photo = null
		return list
	}

	const photoIdentityArray = list.photo.split('-')

	if (photoIdentityArray.length < 2) {
		list.photo = null
		return list
	}

	photoIdentityArray.shift()

	list.photo = {
		product_id: photoIdentityArray[0],
		id: photoIdentityArray[1],
	}
	return list
}

const callToGetPhoto = async (list) => {
	if (!list.photo) {
		return list
	}

	try {
		const rawPhoto = await axios.get(
			`http://caliboxs.com/api/v1/galleries/${list.photo.product_id}`,
			{
				headers: {
					authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
				},
			},
		)

		const filteredPhoto = rawPhoto.data.result.find((photoObject) => {
			if (
				+photoObject.id === +list.photo.id &&
				+photoObject.product_id === +list.photo.product_id
			) {
				return true
			}
		})

		list.photo = await filteredPhoto

		return list
	} catch (err) {
		console.log(`categories photo error`, err)
		console.log(`categories photo error`, err.response)
	}
}

export const onInitCategories = (categories) => ({
	type: actionTypes.INIT_CATEGORIES,
	categories,
})

export const initCategories =
	(callback = () => null) =>
		async (dispatch) => {
			try {
				const rawCategories = await axios.get('http://caliboxs.com/api/v1/categories', {
					headers: {
						authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
					},
				})

				const me = await AsyncStorage.getItem('me')
				const filteredCategories = rawCategories.data.result.filter(
					(category) => category.user_id === +me,
				)

				const photoUpdatedCategories = Promise.all(
					filteredCategories.map((category) => {
						const updatedList = filterOutPhoto(category)

						callToGetPhoto(updatedList)
							.then((data) => {
								if (data && data.photo) {
									return data.photo.photo
								}
								data.photo = null
								return null
							})
							.catch((err) => console.log(`calltoGetPhoto`, err))
						return updatedList
					}),
				)

				callback()
				dispatch(onInitCategories(await photoUpdatedCategories))
			} catch (e) {
				console.error('Error on initCategories :: ', e)

				Alert.alert(
					'Error',
					`${err.response.data.message} ${errorParseResult(err.response.data.errors)}`,
					[
						{
							text: 'Ok',
							onPress: callback(),
							style: 'cancel',
						},
					],
				)
			}
		}

export const initCategory =
	(id, callback = () => null) =>
		() => {
			db.transaction(
				(tx) => {
					tx.executeSql('select * from categories where id = ?', [id], (_, { rows }) => {
						callback(rows._array[0])
					})
				},
				// eslint-disable-next-line no-console
				(err) => console.log(err),
			)
		}

export const saveCategory = (category, callback) => async () => {
	// Takes the incoming object and turns it into form-data
	const form = new FormData()
	form.append('name', category.name)

	try {
		const photoForm = new FormData()
		photoForm.append('product_id', '190')
		photoForm.append('gallery[]', {
			uri: category.photo.photo,
			type: 'image/jpeg',
			name: category.name + '_photo',
		})

		console.log('adding new photo')

		const newPhoto = await axios.post('http://caliboxs.com/api/v1/galleries/upload', photoForm, {
			headers: {
				'content-type': 'multipart/form-data',
				// "content-type": "application/json",
				authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
			},
		})

		console.log('new photo added', newPhoto)

		const filteredNewPhoto = newPhoto.data.result[0]
		// file object created for post request with axios
		form.append('photo', {
			uri: filteredNewPhoto.photo,
			type: 'image/jpeg',
			name: `-${filteredNewPhoto.product_id}-${filteredNewPhoto.id}`,
		})
	} catch (e) {
		console.error('Error on uploading category photo :: ', e)


		Alert.alert(
			'Error',
			`${err.response.data.message} ${errorParseResult(err.response.data.errors)}`,
			[
				{
					text: 'Ok',
					onPress: callback(),
					style: 'cancel',
				},
			],
		)
	}

	try {

		console.log('making call to new category')
		const response = await axios.post('http://caliboxs.com/api/v1/categories', form, {
			headers: {
				'content-type': 'multipart/form-data',
				authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
			},
		})

		return response.data.result
	} catch (e) {
		console.error('Error on saving categories :: ', e)
		console.error('Error on saving categories :: ', e.response)
	}
}
export const updateCategory = (category, callback) => async (dispatch) => {
	const form = new FormData()
	form.append('name', category.name)
	form.append('_method', 'put')

	try {
		const photoForm = new FormData()
		photoForm.append('product_id', '190')
		photoForm.append('gallery[]', {
			uri: category.photo.photo,
			type: 'image/jpeg',
			name: category.name + '_photo',
		})

		console.log('adding new photo')

		const newPhoto = await axios.post('http://caliboxs.com/api/v1/galleries/upload', photoForm, {
			headers: {
				'content-type': 'multipart/form-data',
				// "content-type": "application/json",
				authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
			},
		})


		const filteredNewPhoto = newPhoto.data.result[0]
		console.log('new photo added', filteredNewPhoto)
		// file object created for post request with axios
		form.append('photo', {
			uri: filteredNewPhoto.photo,
			type: 'image/jpeg',
			name: `-${filteredNewPhoto.product_id}-${filteredNewPhoto.id}`,
		})
	} catch (e) {
		console.error('Error on uploading category photo :: ', e)

		return null;
	}

	try {
		const urlString = `http://caliboxs.com/api/v1/categories/${category.id}`

		console.log('this is urlString', urlString)

		console.log('making call to new category FORM : ', form, ' :: category ID; ', category.id)
		const response = await axios.post(urlString, form, {
			headers: {
				'content-type': 'multipart/form-data',
				authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
			},
		})

		console.log('Updated category STRAIGHT FORM CALL', response.data.result)

		return response.data.result
	} catch (e) {
		console.error('Error on saving categories :: ', e)
		console.error('Error on saving categories :: ', e.response)
		return null
	}
}

export const removeCategory = (id) => async (dispatch) => {
	// Takes the incoming object and turns it into form-data
	// todo
	console.log('this is id coming into remove category', removeCategory)
	try {
		await axios.delete('http://caliboxs.com/api/v1/categories/' + id, {
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
			},
		})

		Alert.alert('Success', `Your category has been removed.`, [
			{
				text: 'Ok',
				onPress: await dispatch(initCategories()),
				style: 'confirm',
			},
		])

		// return response.data.result
		dispatch(initCategories())
	} catch (e) {
		// Alert.alert('Error', `Your category has not been removed.`, [
		// 	{
		// 		text: 'Ok',
		// 		onPress: dispatch(initCategories()),
		// 		style: 'cancel',
		// 	},
		// ])
		return null
		// console.error('Error on saving categories :: ', e)
	}
}
