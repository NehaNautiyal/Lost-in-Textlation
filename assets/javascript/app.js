$(document).ready(function () {

    // Initialize Firebase
    var config = {
      apiKey: "AIzaSyAS75xUaaDQmXDU_kULX5Y7svHGhZ0Wa1E",
      authDomain: "lost-in-textlation.firebaseapp.com",
      databaseURL: "https://lost-in-textlation.firebaseio.com",
      projectId: "lost-in-textlation",
      storageBucket: "lost-in-textlation.appspot.com",
      messagingSenderId: "1078465086014"
    };
    firebase.initializeApp(config);
  
    var database = firebase.database();
    var connectionsRef = database.ref("/connections");
    var connectedRef = database.ref(".info/connected");
    var usersRef = database.ref("/users");
    var stateRef = database.ref("/state");
    
    // When the client's connection state changes...
    connectedRef.on("value", function (snap) {

        // If they are connected..
        if (snap.val()) {

            // Add user profile.
            profile = usersRef.push({
                id: "",
                text: "",
                analysis: ""
            });

            //Get a unique key for each window that connects
            userId = profile.key;

            // Remove user from the connection list when they disconnect, along with all of their data
            connectionsRef.onDisconnect().remove();
            usersRef.onDisconnect().remove();
            
        }
    });

    // Initialize some variables
    var input;

    var state = {
        id: "",
        text: "",
        analysis: ""
    }

    // When you click the submit button
    $("#submit-btn").on("click", function(e){
        // Prevent anyone from clicking submit without entering any text
        e.preventDefault();
        input = $("#submit-text").val().trim();
        console.log(input);
        console.log(userId);

        // Update this in the database
        usersRef.child(userId).update({
            id: userId,
            text: input,
            analysis: ""
        });

        state.text = input;

        // Empty the text field
        $("#submit-text").val("");
    });

    // If anything changes in the usersRef in the firebase, that needs to be updated
    usersRef.on("child_changed", function(snapshot) {
        var variable = snapshot.val();
        console.log(variable);



    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });
    
  
    
  


  });