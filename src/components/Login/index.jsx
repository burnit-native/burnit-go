import React from 'react'
import LoginScreen from 'react-native-login-screen'
import { connect } from 'react-redux'
import { View, Text } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'

const LoginContainer = ({ navigation, onLoginSuccess }) => {
	const [spinnerVisibility, setSpinnerVisibility] = React.useState(false)
	// test@test.com
	// 123456
	const [email, setEmail] = React.useState('')
	const [password, setPassword] = React.useState('')

	return (
		<LoginScreen
			labelTextStyle={{
				color: '#adadad',
				fontFamily: 'Now-Bold',
			}}
			logoTextStyle={{
				fontSize: 27,
				color: '#fdfdfd',
				fontFamily: 'Now-Black',
			}}
			loginButtonTextStyle={{
				color: '#fdfdfd',
				fontFamily: 'Now-Bold',
			}}
			textStyle={{
				color: '#757575',
				fontFamily: 'Now-Regular',
			}}
			signupStyle={{
				color: '#fdfdfd',
				fontFamily: 'Now-Bold',
			}}
			usernameOnChangeText={(v) => setEmail(v)}
			onPressSettings={() => alert('Settings Button is pressed')}
			passwordOnChangeText={(v) => setPassword(v)}
			onPressLogin={async () => {
				try {
					const response = await axios.post('http://caliboxs.com/api/v1/login', {
						email,
						password,
					})

					setSpinnerVisibility(true)
					setTimeout(() => {
						setSpinnerVisibility(false)
					}, 2000)

					await AsyncStorage.setItem('isLoggedIn', 'yes')
					await AsyncStorage.setItem('accessToken', response.data.result.access_token)

					onLoginSuccess()
				} catch (e) {
					console.log('THIS IS ERROR', e)
				}
			}}
			onPressSignup={() => {
				console.log('onPressSignUp is pressed')
			}}
		>
			{/* <View
            style={{
                position: "relative",
                alignSelf: "center",
                marginTop: 64,
            }}
        >
            <Text style={{ color: "white", fontSize: 30 }}>
                Inside Login Screen Component
            </Text>
        </View> */}
		</LoginScreen>
	)
}

const mapStateToProps = (state) => ({ primaryColor: state.theme.theme?.primaryColor })

export default connect(mapStateToProps)(LoginContainer)
