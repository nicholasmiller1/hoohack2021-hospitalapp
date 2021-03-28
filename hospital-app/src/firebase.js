import firebase from 'firebase';
import {API_KEY, APP_ID} from './apikey.properties';
var config = {
    apiKey: API_KEY,
    authDomain: "hospital2-321b2.firebaseapp.com",
    databaseURL: "https://hospital2-321b2-default-rtdb.firebaseio.com",
    projectId: "hospital2-321b2",
    storageBucket: "hospital2-321b2.appspot.com",
    messagingSenderId: "276154384828",
    appId: APP_ID
};
firebase.initializeApp(config);
export default firebase;