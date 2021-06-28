const firebase = require("firebase/app");
require("firebase/database");
const saveRate = (rateId, rateObj) => {
    firebase.database().ref('/rates' + rateId).set(rateObj);
}

const getRate = async (rateId) => {
    const dbRef = firebase.database().ref();
    const snapshot = await dbRef.child(rateId).get();
    console.log(snapshot);
    if (await snapshot.exists()) {
       return await snapshot.val();
   } else {
       return null;
   }
}

module.exports = {
    saveRate,
    getRate
}

