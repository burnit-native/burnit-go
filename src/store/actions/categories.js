import { openDatabase } from 'expo-sqlite'
import * as Analytics from 'expo-firebase-analytics'
import * as actionTypes from './actionTypes'
import axios from 'axios'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

	const rawPhoto = await axios.get(
		`http://caliboxs.com/api/v1/galleries/${list.photo.product_id}`,
		{
			headers: {
				authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
			},
		},
	)

	const filteredPhoto = rawPhoto.data.result.find((photoObject) => {
		if (+photoObject.id === +list.photo.id && +photoObject.product_id === +list.photo.product_id) {
			return true
		}
	})

	list.photo = await filteredPhoto

	return list
}

export const onInitCategories = (categories) => ({
	type: actionTypes.INIT_CATEGORIES,
	categories,
})

export const initCategories =
	(callback = () => null) =>
	async (dispatch) => {
		// db.transaction(
		// 	(tx) => {
		// 		// TODO
		// 		console.log('this is cateogries ocming back')
		// 		tx.executeSql('select * from categories', [], (_, { rows }) => {
		// 			console.log('this is ROWS', rows._array)
		// 			callback()
		// 			dispatch(onInitCategories(rows._array))
		// 		})
		// 	},
		// 	// eslint-disable-next-line no-console
		// 	(err) => console.log(err),
		// )
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

					callToGetPhoto(updatedList).then((data) => {
						if (data && data.photo) {
							return data.photo.photo
						}
						data.photo = null
						return null
					})
					return updatedList
				}),
			)

			callback()
			dispatch(onInitCategories(await photoUpdatedCategories))
		} catch (e) {
			console.error('Error on initCategories :: ', e)
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
	// if (category.id !== false) {
	// 	db.transaction(
	// 		(tx) => {
	// 			tx.executeSql(
	// 				`update categories
	//                                set name = ?
	//                                where id = ?;`,
	// 				[category.name, category.id],
	// 				() => {
	// 					Analytics.logEvent('updatedCategory', {
	// 						name: 'categoryAction',
	// 					})

	// 					callback()
	// 				},
	// 			)
	// 		},
	// 		// eslint-disable-next-line no-console
	// 		(err) => console.log(err),
	// 	)
	// } else {
	// 	db.transaction(
	// 		(tx) => {
	// 			tx.executeSql(
	// 				'insert into categories (name) values (?)',
	// 				[category.name],
	// 				(_, { insertId }) => {
	// 					Analytics.logEvent('createdCategory', {
	// 						name: 'categoryAction',
	// 					})

	// 					callback({ id: insertId, name: category.name })
	// 				},
	// 			)
	// 		},
	// 		// eslint-disable-next-line no-console
	// 		(err) => console.log(err),
	// 	)
	// }

	// const photoForm = new FormData();
	// photoForm.append('product_id', '183');
	// photoForm.append('gallery[]', {
	// 	uri: category.photo,
	// 	type: 'image/jpeg',
	// 	name: category.name + '_photo',
	// })

	// Takes the incoming object and turns it into form-data
	const form = new FormData()
	form.append('name', category.name)

	try {
		const photoForm = new FormData()
		photoForm.append('product_id', '183')
		photoForm.append('gallery[]', {
			uri: category.photo,
			type: 'image/jpeg',
			name: category.name + '_photo',
		})
		const newPhoto = await axios.post('http://caliboxs.com/api/v1/galleries/upload', photoForm, {
			headers: {
				'content-type': 'multipart/form-data',
				// "content-type": "application/json",
				authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
			},
		})

		const filteredNewPhoto = newPhoto.data.result[0]
		// file object created for post request with axios
		form.append('photo', {
			uri: category.photo,
			type: 'image/jpeg',
			name: `-${filteredNewPhoto.product_id}-${filteredNewPhoto.id}`,
		})
	} catch (e) {
		console.error('Error on uploading category photo :: ', e)
	}

	try {
		const response = await axios.post('http://caliboxs.com/api/v1/categories', form, {
			headers: {
				'content-type': 'multipart/form-data',
				authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
			},
		})

		return response.data.result
	} catch (e) {
		console.error('Error on saving categories :: ', e)
	}
}
export const updateCategory = (category, callback) => async () => {
	// Takes the incoming object and turns it into form-data
	const form = new FormData()
	form.append('name', category.name)

	// file object created for post request with axios
	form.append('photo', {
		uri: category.photo,
		type: 'image/jpeg',
		name: category.name + '_photo',
	})

	form.append('_method', 'put')

	try {
		const response = await axios.post(
			'http://caliboxs.com/api/v1/categories/' + category.id,
			form,
			{
				headers: {
					'content-type': 'multipart/form-data',
					// "content-type": "application/json",
					authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`,
				},
			},
		)

		console.log('new category updated: ', response.data.result)

		return response.data.result
	} catch (e) {
		console.error('Error on saving categories :: ', e)
	}
}

export const removeCategory =
	(id, callback = () => null) =>
		(dispatch) => {
			db.transaction(
				(tx) => {
					tx.executeSql('delete from categories where id = ?', [id], () => {
						Analytics.logEvent('removedCategory', {
							name: 'categoryAction',
						})

						callback()
						dispatch(initCategories())
					})
				},
				// eslint-disable-next-line no-console
				(err) => console.log(err),
			)
		}
