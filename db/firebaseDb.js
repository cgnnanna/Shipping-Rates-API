const firebase = require("firebase/app");
require("firebase/database");

// handles saving of rates to the database with specific rate id
const saveToFireBase = (rateId, rateObj) => {
    firebase.database().ref('/rates/' + rateId).set(rateObj);
}
// handles getting rate with specific id from database
const getById = async (rateId) => {
    const dbRef = firebase.database().ref();
    const snapshot = await dbRef.child("rates").child(rateId).get();
    if (snapshot.exists()) {
       return snapshot.val();
   } else {
       return null;
   }
}
// handles updating of rate with a specific id in the database
const updateOnFireBase =(rateId, rateObj) =>{
    let updates = {};
    updates['/rates/' + rateId] = rateObj;
    return firebase.database().ref().update(updates);
  }
// handles deleting of rate with a specific id from the database
  const deleteOnFirebase = (rateId) =>{
    return firebase.database().ref('/rates/' + rateId).remove();
  }

module.exports = {
    saveToFireBase,
    getById,
    updateOnFireBase,
    deleteOnFirebase
}

