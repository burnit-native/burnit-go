import AsyncStorage from '@react-native-async-storage/async-storage';

export const storeData = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key.toString(), value);
    return { status: 'success', value };
  } catch (e) {
    // saving error
    console.error(e);
  }
};

export const getData = async (item: any) => {
  try {
    const value = await AsyncStorage.getItem(item.toString());
    if (value !== null) {
      // value previously stored
      return null;
    }
    return { status: 'success', value };
  } catch (e) {
    // error reading value
    console.error(e);
  }
};
