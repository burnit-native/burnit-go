import React from 'react';
import LoginScreen from "react-native-login-screen";
import { connect } from 'react-redux'
import { View, Text } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginContainer = ({ navigation, onLoginSuccess }) => {
    const [spinnerVisibility, setSpinnerVisibility] = React.useState(false)
    const [isLoggedIn, setIsLoggedIn] = React.useState("no")
    React.useEffect(() => { }, [isLoggedIn])
    return (<LoginScreen
        // spinnerEnable
        // spinnerVisibility={spinnerVisibility}
        labelTextStyle={{
            color: "#adadad",
            fontFamily: "Now-Bold",
        }}
        logoTextStyle={{
            fontSize: 27,
            color: "#fdfdfd",
            fontFamily: "Now-Black",
        }}
        loginButtonTextStyle={{
            color: "#fdfdfd",
            fontFamily: "Now-Bold",
        }}
        textStyle={{
            color: "#757575",
            fontFamily: "Now-Regular",
        }}
        signupStyle={{
            color: "#fdfdfd",
            fontFamily: "Now-Bold",
        }}
        usernameOnChangeText={(username) => console.log("Username: ", username)}
        onPressSettings={() => alert("Settings Button is pressed")}
        passwordOnChangeText={(password) => console.log("Password: ", password)}
        onPressLogin={async () => {
            try {
                setSpinnerVisibility(true);
                setTimeout(() => {
                    setSpinnerVisibility(false);
                }, 2000);
                await AsyncStorage.setItem('isLoggedIn', "yes")
                setIsLoggedIn("yes")
                onLoginSuccess();

            } catch (e) {
                console.log('THIS IS ERROR', e)
            }
        }}
        onPressSignup={() => {
            console.log("onPressSignUp is pressed");
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
    </LoginScreen>)
}

const mapStateToProps = (state) => ({ primaryColor: state.theme.theme?.primaryColor })

export default connect(mapStateToProps)(LoginContainer)