import React, { useState, useEffect, useRef } from 'react';
import { Text, View, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import VideoPlayer from '../Video'

export default function VideoRecorderContainer({ getVideoUri }) {
    const [hasPermission, setHasPermission] = useState(null);
    const [type, setType] = useState(Camera.Constants.Type.back);
    const [preview, setPreview] = useState(false);
    const [photo, setPhoto] = useState('')
    const [cameraRef, setCameraRef] = useState(null)
    const [recording, setRecording] = useState(false)
    const [videoUri, setVideoUri] = useState(null)

    useEffect(() => {
        (async () => {
            // const { status: permissionStatus } = await Camera.requestCameraPermissionsAsync()
            // const { status: microphoneStatus } = await Camera.requestMicrophonePermissionsAsync()

            setHasPermission(true);
        })();
    }, []);

    // const _takePhoto = async () => {
    //     console.debug('taking photo')
    //     const _photo = await cameraRef.current.takePictureAsync()

    //     cameraRef.current.pausePreview();

    //     setPreview(true)
    //     if (_photo) {
    //         setPhoto(_photo)
    //     }
    // }

    // const saveImage = () => {
    //     if (photo && photo.uri && updateImage) {
    //         updateImage(photo.uri)
    //     }
    // }


    if (hasPermission === null) {
        return <View />;
    }
    if (hasPermission === false) {
        return <Text>No access to camera</Text>;
    }
    return (
        <View style={{ flex: 1, height: "100%", width: 350, paddingBottom: 80 }}>
            <Camera style={{ flex: 1, height: 300, marginBottom: 30 }} type={type} ref={ref => {
                setCameraRef(ref);
            }}>
                <View
                    style={{
                        flex: 1,
                        backgroundColor: 'transparent',
                        justifyContent: 'flex-end'
                    }}>
                    <View style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-evenly'
                    }}>
                        <TouchableOpacity
                            style={{
                                flex: 0.1,
                                alignSelf: 'flex-end'
                            }}
                            onPress={() => {
                                setType(
                                    type === Camera.Constants.Type.back
                                        ? Camera.Constants.Type.front
                                        : Camera.Constants.Type.back
                                );
                            }}>
                            <Ionicons name={Platform.OS === 'ios' ? "sync-outline" : 'sync-outline'} size={30} color="white" />

                        </TouchableOpacity>
                        {/* <TouchableOpacity style={{ alignSelf: 'center' }} onPress={async () => {
                            if (cameraRef) {
                                let photo = await cameraRef.takePictureAsync();
                                console.log('photo', photo);
                            }
                        }}>
                            <View style={{
                                borderWidth: 2,
                                borderRadius: 25,
                                borderColor: 'white',
                                height: 50,
                                width: 50,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                            >
                                <View style={{
                                    borderWidth: 2,
                                    borderRadius: 25,
                                    borderColor: 'white',
                                    height: 40,
                                    width: 40,
                                    backgroundColor: 'white'
                                }} >
                                </View>
                            </View>
                        </TouchableOpacity> */}
                        <TouchableOpacity style={{ alignSelf: 'center' }} onPress={async () => {
                            if (!recording) {
                                setRecording(true)
                                let video = await cameraRef.recordAsync();

                                if (video) {
                                    getVideoUri(video.uri)
                                    setVideoUri(video.uri)
                                }

                                console.log('video', video);
                            } else {
                                setRecording(false)
                                cameraRef.stopRecording()
                            }
                        }}>
                            <View style={{
                                borderWidth: 2,
                                borderRadius: 25,
                                borderColor: 'red',
                                height: 50,
                                width: 50,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center'
                            }}
                            >
                                <View style={{
                                    borderWidth: 2,
                                    borderRadius: 25,
                                    borderColor: recording ? "blue" : 'red',
                                    height: 40,
                                    width: 40,
                                    backgroundColor: recording ? "blue" : 'red'
                                }} >
                                </View>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View >
            </Camera >

            {videoUri && <VideoPlayer videoUri={videoUri} />}
            {
                videoUri &&
                <View>
                    <TouchableOpacity style={{ alignSelf: 'center', marginTop: 20, borderColor: '#f4511e', backgroundColor: '#fff', height: 30, width: 300, alignItems: 'center', borderWidth: 1, paddingTop: 5 }} onPress={() => {
                        setVideoUri(null)
                    }}>
                        <Text>Press Here To Record Again</Text>
                    </TouchableOpacity>
                </View>
            }
        </View >
    );
}
