const firebase = require("firebase/app");
require("firebase/database");
const saveRate = (rateId, rateObj) => {
    firebase.database().ref('/rates/' + rateId).set(rateObj);
}

const getRate = async (rateId) => {
    const dbRef = firebase.database().ref();
    const snapshot = await dbRef.child("rates").child(rateId).get();
    if (snapshot.exists()) {
       return snapshot.val();
   } else {
       return null;
   }
}

const updateRate =(rateId) =>{
    // A rate entry.
    let rateData = {
    updatedAT : new Date().toUTCString
    };
  
    // Get a key for a new Post.
    let newRateId = firebase.database().ref().child('rates').push().key;
  
    // Write the new post's data simultaneously in the posts list and the user's post list.
    let updates = {};
    updates['/rates/' + newRateId] = rateData;
    updates['/rate-data/' + rateId + '/' + newRateId] = rateData;
  
    return firebase.database().ref().update(updates);
  }

  const deleteRate = (rateId) =>{
    return firebase.database().ref().child("rates").child(rateId).remove();
  }

module.exports = {
    saveRate,
    getRate,
    updateRate,
    deleteRate
}

