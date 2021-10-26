import { openDatabase } from 'expo-sqlite'
import * as Analytics from 'expo-firebase-analytics'
import * as actionTypes from './actionTypes'
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const db = openDatabase('maker.db')

export const onInitCategories = (categories) => ({
	type: actionTypes.INIT_CATEGORIES,
	categories,
})

export const initCategories = (callback = () => null) => async (dispatch) => {
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
				authorization: `Bearer ${await AsyncStorage.getItem('accessToken')}`
			}
		})

		const filteredCategories = rawCategories.data.result;

		callback()
		dispatch(onInitCategories(filteredCategories))


	} catch (e) {
		console.error('Error on initCategories :: ', e)
	}
}

export const initCategory = (id, callback = () => null) => () => {
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

export const saveCategory = (category, callback) => () => {
	if (category.id !== false) {
		db.transaction(
			(tx) => {
				tx.executeSql(
					`update categories
                                   set name = ?
                                   where id = ?;`,
					[category.name, category.id],
					() => {
						Analytics.logEvent('updatedCategory', {
							name: 'categoryAction',
						})

						callback()
					},
				)
			},
			// eslint-disable-next-line no-console
			(err) => console.log(err),
		)
	} else {
		db.transaction(
			(tx) => {
				tx.executeSql(
					'insert into categories (name) values (?)',
					[category.name],
					(_, { insertId }) => {
						Analytics.logEvent('createdCategory', {
							name: 'categoryAction',
						})

						callback({ id: insertId, name: category.name })
					},
				)
			},
			// eslint-disable-next-line no-console
			(err) => console.log(err),
		)
	}
}

export const removeCategory = (id, callback = () => null) => (dispatch) => {
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