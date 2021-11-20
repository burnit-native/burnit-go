import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';

export default function CameraPictureContainer({ updateImage = null }) {
    const [hasPermission, setHasPermission] = useState(null);
    const [type, setType] = useState(Camera.Constants.Type.back);
    const [preview, setPreview] = useState(false);
    const [photo, setPhoto] = useState('')
    const cameraRef = useRef(null)


    useEffect(() => {
        (async () => {
            const { status } = await Camera.requestPermissionsAsync();
            setHasPermission(status === 'granted');
        })();
    }, []);

    const _takePhoto = async () => {
        console.debug('taking photo')
        const _photo = await cameraRef.current.takePictureAsync()

        cameraRef.current.pausePreview();

        setPreview(true)
        if (_photo) {
            setPhoto(_photo)
        }
    }

    const saveImage = () => {
        if (photo && photo.uri && updateImage) {
            updateImage(photo.uri)
        }
    }


    if (hasPermission === null) {
        return <View />;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }
    return (
        <View style={{ flex: 1 }}>
            <Camera style={{ flex: 1 }} type={type} ref={cameraRef}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'transparent',
                        flexDirection: 'row',
                    }}>
                    <TouchableOpacity
                        style={{
                            flex: 0.1,
                            alignSelf: 'flex-end',
                            alignItems: 'center',
                        }}
                        onPress={() => {
                            setType(
                                type === Camera.Constants.Type.back
                                    ? Camera.Constants.Type.front
                                    : Camera.Constants.Type.back
                            );
                        }}>
                        <Text style={{ fontSize: 18, marginBottom: 10, color: 'white' }}> Flip </Text>
                    </TouchableOpacity>
                    {!preview ? <TouchableOpacity
                        style={{
                            flex: 0.5,
                            width: 500,
                            alignSelf: 'flex-end',
                            alignItems: 'flex-end',
                        }}
                        onPress={() => {
                            _takePhoto()
                        }}
                    >
                        <Text style={{ flex: 2, fontSize: 18, marginBottom: 10, color: 'white', marginTop: 350 }}>Snap Photo</Text>
                    </TouchableOpacity> :
                        <>
                            <TouchableOpacity
                                style={{
                                    flex: 0.5,
                                    width: 500,
                                    alignSelf: 'flex-end',
                                    alignItems: 'flex-end',
                                }}
                                onPress={() => {
                                    if (preview) {
                                        cameraRef.current.resumePreview();
                                        setPreview(false)
                                    }
                                }}
                            >
                                <Text style={{
                                    flex: 2, fontSize: 18, marginBottom: 10, color: 'white', marginTop: 350,
                                    backgroundColor: "#FB4C0D",
                                    borderRadius: 20,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    alignSelf: 'center',
                                    padding: 10,
                                    height: 50,
                                }}>Resume Camera</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{
                                    flex: 0.5,
                                    width: 500,
                                    alignSelf: 'flex-end',
                                    alignItems: 'flex-end',
                                }}
                                onPress={() => {
                                    saveImage();
                                }}
                            >
                                <Text style={{
                                    flex: 3, fontSize: 18, marginBottom: 10, color: 'white', marginTop: 350, marginRight: 50,
                                    backgroundColor: "#FB4C0D",
                                    borderRadius: 20,
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    alignSelf: 'center',
                                    padding: 10,
                                    height: 50,
                                }}>Save Photo</Text>
                            </TouchableOpacity>
                        </>
                    }
                </View>
            </Camera >
        </View >
    );
}
