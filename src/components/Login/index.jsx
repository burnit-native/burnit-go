import React, { useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { StatusBar } from 'expo-status-bar'
import {
	StyleSheet,
	Text,
	View,
	Image,
	TextInput,
	Button,
	TouchableOpacity,
	Alert,
} from 'react-native'

const LoginContainer = ({ onLoginSuccess }) => {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [createEmail, setCreateEmail] = useState('')
	const [createPassword, setCreatePassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [name, setName] = useState('')
	const [phone, setPhone] = useState('')

	const [needAnAccount, setNeedAnAccount] = useState(false)

	const handleCreateAccountView = () => {
		setNeedAnAccount(true)
	}

	const handleLoginPress = async () => {
		try {
			const response = await axios.post('http://caliboxs.com/api/v1/login', {
				email: 'tester@tester.com',
				password: '123456',
			})

			await AsyncStorage.setItem('isLoggedIn', 'yes')
			await AsyncStorage.setItem('accessToken', response.data.result.access_token)

			const meResponse = await axios.get('http://caliboxs.com/api/v1/me', {
				headers: {
					authorization: 'Bearer ' + response.data.result.access_token,
				},
			})

			await AsyncStorage.setItem('me', JSON.stringify(meResponse.data.result.id))

			onLoginSuccess()
		} catch (e) {
			console.log('THIS IS LOGIN ERROR', e)
		}
	}

	const errorParseResult = (errorObj) => {
		let errorsArray = []
		for (let errorFieldArray in errorObj) {
			errorObj[errorFieldArray].forEach((error) => errorsArray.push(error))
		}
		return errorsArray.join('\n')
	}

	const handleCreateAccountPress = async () => {
		try {
			const bodyFormData = new FormData()

			bodyFormData.append('name', name)
			bodyFormData.append('email', createEmail)
			bodyFormData.append('phone', phone)
			bodyFormData.append('password', createPassword)
			bodyFormData.append('password_confirmation', confirmPassword)

			await axios.post('http://caliboxs.com/api/v1/signup', bodyFormData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			})

			Alert.alert('Success', `Your account has been created, ${name}.`, [
				{
					text: 'Ok',
					onPress: setNeedAnAccount(false),
					style: 'cancel',
				},
			])
		} catch (e) {
			console.log('Error at create account', e.response.data.errors)
			Alert.alert(
				'Error',
				`${e.response.data.message} ${errorParseResult(e.response.data.errors)}`,
				[
					{
						text: 'Ok',
						style: 'cancel',
					},
				],
			)
		}
	}

	return (
		<View style={styles.container}>
			<Image style={styles.image} source='./assets/icon.png' />
			<StatusBar style='auto' />
			<View>
				<Text style={styles.title}>{!needAnAccount ? 'Login' : 'Sign Up'}</Text>
			</View>
			{!needAnAccount ? (
				<>
					<View style={styles.inputView}>
						<TextInput
							key='loginEmail'
							style={styles.TextInput}
							placeholder='Email'
							placeholderTextColor='#003f5c'
							onChangeText={(email) => setEmail(email)}
							value={email}
						/>
					</View>
					<View style={styles.inputView}>
						<TextInput
							key='loginPass'
							style={styles.TextInput}
							placeholder='Password'
							placeholderTextColor='#003f5c'
							secureTextEntry={true}
							onChangeText={(password) => setPassword(password)}
						/>
					</View>
				</>
			) : (
				<>
					<View style={styles.inputView}>
						<TextInput
							key='createName'
							style={styles.TextInput}
							placeholder='Name'
							placeholderTextColor='#003f5c'
							onChangeText={(name) => setName(name)}
						/>
					</View>
					<View style={styles.inputView}>
						<TextInput
							key='createEmail'
							style={styles.TextInput}
							placeholder='Email'
							placeholderTextColor='#003f5c'
							onChangeText={(createEmail) => setCreateEmail(createEmail)}
						/>
					</View>
					<View style={styles.inputView}>
						<TextInput
							key='createPhone'
							style={styles.TextInput}
							placeholder='Phone'
							placeholderTextColor='#003f5c'
							onChangeText={(phone) => setPhone(phone)}
						/>
					</View>
					<View style={styles.inputView}>
						<TextInput
							key='createPass'
							style={styles.TextInput}
							placeholder='Password'
							placeholderTextColor='#003f5c'
							secureTextEntry={true}
							onChangeText={(createPassword) => setCreatePassword(createPassword)}
						/>
					</View>
					<View style={styles.inputView}>
						<TextInput
							key='createPassConfirm'
							style={styles.TextInput}
							placeholder='Confirm Password'
							placeholderTextColor='#003f5c'
							secureTextEntry={true}
							onChangeText={(confirmPassword) => setConfirmPassword(confirmPassword)}
						/>
					</View>
				</>
			)}

			{!needAnAccount ? (
				<>
					<TouchableOpacity onPress={handleCreateAccountView}>
						<Text style={styles.forgot_button}>Need an account?</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.loginBtn} onPress={handleLoginPress}>
						<Text style={styles.loginText}>LOGIN</Text>
					</TouchableOpacity>
				</>
			) : (
				<>
					<TouchableOpacity onPress={() => setNeedAnAccount(false)}>
						<Text style={styles.forgot_button}>I already have an account.</Text>
					</TouchableOpacity>
					<TouchableOpacity style={styles.loginBtn} onPress={handleCreateAccountPress}>
						<Text style={styles.loginText}>Create an account</Text>
					</TouchableOpacity>
				</>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#fff',
		alignItems: 'center',
		justifyContent: 'center',
	},

	title: {
		marginBottom: 40,
		fontSize: 40,
	},

	image: {
		marginBottom: 0,
	},

	inputView: {
		backgroundColor: '#ff9b3c',
		borderRadius: 2,
		width: '70%',
		height: 45,
		marginBottom: 20,
	},

	TextInput: {
		height: 50,
		flex: 1,
		padding: 10,
		marginLeft: 20,
	},

	forgot_button: {
		height: 30,
		marginBottom: 30,
	},

	loginBtn: {
		width: '80%',
		borderRadius: 2,
		height: 50,
		alignItems: 'center',
		justifyContent: 'center',
		marginTop: 40,
		backgroundColor: '#f4511e',
	},
})

export default LoginContainer
