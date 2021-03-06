import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { Input, Button } from '@ui-kitten/components';
import axios from 'axios';
import * as asyncStorage from '../utils/asyncStorage';
import {
  StyleSheet,
  TouchableOpacity,
  TextInputChangeEventData,
  NativeSyntheticEvent,
  Keyboard,
} from 'react-native';
import config from '../constants/Config';

import Colors from '../constants/Colors';
import { Text, View } from './Themed';
import { useState } from 'react';
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';

export default function LoginScreenInfo({ path }: { path: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleChange = (
    e: NativeSyntheticEvent<TextInputChangeEventData>,
    type: string,
  ): void => {
    const value = e.nativeEvent.text;
    if (type === 'email') setEmail(value);
    if (type === 'password') setPassword(value);
  };

  const handleSubmit = async () => {
    console.log('this is response')
    const response = await axios.post(config.loginPost, {
      email,
      password,
    });
    
    console.log('dfdsafd response', response)

    const storageResponse = await asyncStorage.storeData(
      '@access_token',
      response?.data?.result?.access_token,
    );

    if (storageResponse?.status === 'success') {
      //reroute
    }
  };

  return (
    <View>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.getStartedContainer}>
          <Input
            label="Email"
            placeholder="user@domain.com"
            value={email}
            onChange={(e) => handleChange(e, 'email')}
          />
          <Input
            label="Password"
            placeholder="password"
            value={password}
            onChange={(e) => handleChange(e, 'password')}
            secureTextEntry={true}
          />
        </View>
      </TouchableWithoutFeedback>
      <View style={styles.helpContainer}>
        <Button onPressOut={handleSubmit}>Sign In</Button>
        <TouchableOpacity onPress={handleHelpPress} style={styles.helpLink}>
          <Text style={styles.helpLinkText} lightColor={Colors.light.tint}>
            Tap here to register.
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function handleHelpPress() {
  WebBrowser.openBrowserAsync(
    'https://docs.expo.io/get-started/create-a-new-app/#opening-the-app-on-your-phonetablet',
  );
}

const styles = StyleSheet.create({
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightContainer: {
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    height: 40,
    margin: 12,
    borderWidth: 1,
  },
  helpContainer: {
    marginTop: 15,
    width: 300,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    textAlign: 'center',
  },
});
