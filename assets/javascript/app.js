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
                analysis: {
                    polarity: "",
                    polarity_confidence: "",
                    subjectivity: "",
                    subjectivity_confidence: ""
                }
            });

            //Get a unique key for each window that connects
            userId = profile.key;

            // Remove user from the connection list when they disconnect, along with all of their data
            connectionsRef.onDisconnect().remove();
            usersRef.onDisconnect().remove();

        }
    });

    // Initialize some variables
    var analyze;
    var polarity;
    var subjectivity;
    var polarity_confidence;
    var subjectivity_confidence;

    var state = {
        id: "",
        text: "",
        analysis: {
            polarity: "",
            polarity_confidence: "",
            subjectivity: "",
            subjectivity_confidence: ""
        }
    }

    // When you click the submit button
    $("#submit-btn").on("click", function (e) {
        // Prevent anyone from clicking submit without entering any text
        e.preventDefault();
        analyze = $("#submit-text").val().trim();

        var apiURL = "https://cors-anywhere.herokuapp.com/https://api.aylien.com/api/v1/sentiment";

        $.ajax({
            url: apiURL,
            headers: {
                "X-AYLIEN-TextAPI-Application-Key": "61ffcd895f4e02c544e7bb1732b494bb",
                "X-AYLIEN-TextAPI-Application-Id": "dd4fff67"
            },
            data: {
                text: analyze
            },
            // headers: { "HeaderName": "fd5385f172d340618f77121d772e59a8" },
            async: true,
            crossDomain: true,
            dataType: "json",
            contentType: "application/json",
            method: "GET"
        }).then(function (response) {
            console.log(response);
            polarity = response.polarity;
            subjectivity = response.subjectivity;
            polarity_confidence = response.polarity_confidence;
            subjectivity_confidence = response.subjectivity_confidence;




            // Update this in the database
            usersRef.child(userId).update({
                id: userId,
                text: analyze,
                analysis: {
                    polarity: polarity,
                    polarity_confidence: polarity_confidence,
                    subjectivity: subjectivity,
                    subjectivity_confidence: subjectivity_confidence
                }
            });

            // Update the local variables
            state.text = analyze;
            state.analysis.polarity = polarity;
            state.analysis.polarity_confidence = polarity_confidence;
            state.analysis.subjectivity = subjectivity;
            state.analysis.subjectivity_confidence = subjectivity_confidence;

        });

        // Empty the text field
        $("#submit-text").val("");
    });

    // If anything changes in the usersRef in the firebase, that needs to be updated
    usersRef.on("child_changed", function (snapshot) {
        var sv = snapshot.val();
        
           // Update the html display
           var newTableHeight = $('<th scope="row">'); //Analysis
           var newTableRow = $("<tr>");
           var newTableDataPol = $("<td>"); //Polarity
           var newTableDataPolConf = $("<td>"); //Polarity Confidence
           var newTableDataSub = $("<td>"); // Subjectivity
           var newTableDataSubConf = $("<td>"); //subjectivity confidence
   
           newTableHeight.append(sv.text);
           newTableDataPol.text(sv.analysis.polarity);
           newTableDataPolConf.text(sv.analysis.polarity_confidence);
           newTableDataSub.text(sv.analysis.subjectivity);
           newTableDataSubConf.text(sv.analysis.subjectivity_confidence);
   
           var newData = newTableRow.append(newTableHeight, newTableDataPol,
               newTableDataPolConf, newTableDataSub, newTableDataSubConf);
           $("tbody").append(newData);



    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });






});

