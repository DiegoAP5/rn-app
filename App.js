import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Button, Image, FlatList, Text, TouchableOpacity } from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';

export default function Add() {
  const [cameraPermission, setCameraPermission] = useState(null);
  const [camera, setCamera] = useState(null);
  const [galleryPermission, setGalleryPermission] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [imageArray, setImageArray] = useState([]);
  const [response, setResponse] = useState(null);

  const permisionFunction = async () => {
    const cameraPermission = await Camera.requestCameraPermissionsAsync();
    setCameraPermission(cameraPermission.status === 'granted');

    const imagePermission = await ImagePicker.getMediaLibraryPermissionsAsync();
    setGalleryPermission(imagePermission.status === 'granted');

    if (imagePermission.status !== 'granted' && cameraPermission.status !== 'granted') {
      alert('Permission for media access needed.');
    }
  };

  useEffect(() => {
    permisionFunction();
  }, []);

  const takePicture = async () => {
    if (camera) {
      const data = await camera.takePictureAsync(null);
      console.log(data.uri);
      setImageUri(data.uri);
      setImageArray([...imageArray, data.uri]);
      handleUpload(data.uri); // Envia la imagen capturada a la API
    }
  };

  const handleUpload = (uri) => {
    const formData = new FormData();
    formData.append('image', uri);
    axios.post('http://localhost:5000/predict', formData)
        .then(response => {
            setResponse(response.data.predicted_class);
        })
        .catch(error => {
            console.error('Error predicting:', error);
        });
};

  const uploadImage = async (uri) => {
    const formData = new FormData();
    formData.append('image', uri);

    try {
      const response = await axios.post('http://localhost:5000/predict', formData)

      const json = await response.json();
      console.log('Response from API:', json);
      setResponse(json); // Guarda la respuesta de la API
    } catch (error) {
      console.error('Error uploading image:', error);
    }
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    console.log(result.uri);
    if (!result.cancelled) {
      setImageArray([...imageArray, result.uri]);
      uploadImage(result.uri); // Envia la imagen seleccionada de la galería a la API
    }
  };

  const renderResponse = () => {
    if (response) {
      return (
        <View style={styles.responseContainer}>
          <Text style={styles.responseText}>API Response:</Text>
          <Text style={styles.responseText}>{JSON.stringify(response)}</Text>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {!showCamera ? (
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuButton} onPress={() => setShowCamera(true)}>
            <Ionicons name="camera-outline" size={24} color="black" />
            <Text style={styles.menuText}>Take Picture</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.menuButton} onPress={pickImage}>
            <Ionicons name="images-outline" size={24} color="black" />
            <Text style={styles.menuText}>Gallery</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          <Camera
            ref={(ref) => setCamera(ref)}
            style={styles.fixedRatio}
            type={Camera.Constants.Type.back}
          />
          <TouchableOpacity style={styles.cameraButton} onPress={takePicture}>
            <Ionicons name="camera-outline" size={36} color="white" />
          </TouchableOpacity>
        </View>
      )}

      {renderResponse()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menu: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 20,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuText: {
    marginLeft: 5,
  },
  fixedRatio: {
    flex: 1,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 50,
  },
  responseContainer: {
    margin: 20,
  },
  responseText: {
    fontSize: 18,
  },
});
