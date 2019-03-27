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

                    subjectivity_confidence: "",
                    score: "",
                    positiveWords: "",
                    negativeWords: "",

                    syn: "None requested"
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
    var num = 0;

    var state = {
        id: "",
        text: "",
        analysis: {
            polarity: "",
            polarity_confidence: "",
            subjectivity: "",
            subjectivity_confidence: "",
            score: "",
            positiveWords: "",
            negativeWords: "",
            syn: []
        }
    }

    // When you click the submit button
    // $("#submit-btn").on("click", function (e) {
    $("#submit-text").keypress(function(e) {   
         
    if (event.which === 32 ) {
            
        
        analyze = $("#submit-text").val().trim();

        var sentimood = new Sentimood();
        var analysis = sentimood.analyze(analyze);
        var positivity = sentimood.positivity(analyze);
        var negativity = sentimood.negativity(analyze);
        var score = analysis.score
        var positiveWords = positivity.words
        var negativeWords = negativity.words
        console.log(analysis);
        console.log(score);
        console.log(positiveWords); //is an array
        console.log(negativeWords);


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

                    subjectivity_confidence: subjectivity_confidence,
                    score: score,
                    syn: "None requested",
                    positiveWords: positiveWords,
                    negativeWords: negativeWords
                }
            });

            // Update the local variables
            state.text = analyze;
            state.analysis.polarity = polarity;
            state.analysis.polarity_confidence = polarity_confidence;
            state.analysis.subjectivity = subjectivity;
            state.analysis.subjectivity_confidence = subjectivity_confidence;

            state.analysis.score = score
            state.analysis.positiveWords = positiveWords;
            state.analysis.negativeWords = negativeWords;

        });
        // Empty the text field
        $("#submit-text").val("");
    }

        
    });

    // If anything changes in the usersRef in the firebase, that needs to be updated
    usersRef.on("child_changed", function (snapshot) {
        var sv = snapshot.val();
        console.log(sv);

        // Update the html display

        var newTableHeight = $('<th scope="row">'); //Analysis
        var newTableRow = $("<tr>").attr("id", "analysis-" + num);
        var newTableDataTrigWord = $("<td>"); //Trigger Word
        var newTableDataSyn = $("<td>"); //Synonyms
        var newTableDataScore = $("<i>") // Emoji as icon
        var newTableDataPol = $("<td>"); //Polarity
        // var newTableDataPolConf = $("<td>"); //Polarity Confidence
        var newTableDataSub = $("<td>"); // Subjectivity
        var newTableDataSubConf = $("<td>"); //subjectivity confidence

        //Need a for loop to make a new button for every trigger word
        for (let j = 0; j < sv.analysis.positiveWords.length - 1; j++) {
            //Make the Trigger words into buttons to find the synonym
            var b = $("<button>");
            b.addClass("triggerWord").attr("id", sv.analysis.positiveWords[j]).text(sv.analysis.positiveWords[j]);
            console.log(sv.analysis.positiveWords[j]);
            newTableDataTrigWord.prepend(b);
            newTableDataSyn.text(sv.analysis.syn).addClass("syn").attr("id", "syn-" + sv.analysis.positiveWords[j]);
            
        }

        for (let k = 0; k < sv.analysis.negativeWords.length - 1; k++) {
            //Make the Trigger words into buttons to find the synonym
            var b = $("<button>");
            b.addClass("triggerWord").attr("id", sv.analysis.negativeWords[k]).text(sv.analysis.negativeWords[k]);
            newTableDataTrigWord.prepend(b);
            newTableDataSyn.text(sv.analysis.syn).addClass("syn").attr("id", "syn-" + sv.analysis.negativeWords[k]);
            
        }

        var polConPer = sv.analysis.polarity_confidence * 100;
        var subConPer = sv.analysis.subjectivity_confidence * 100;

        newTableHeight.append(sv.text);        
        newTableDataPol.text(`${polConPer.toFixed(2)}% ${sv.analysis.polarity}`);
        newTableDataScore.attr("id", "emoji-" + sv.text);
        // newTableDataPolConf.text(polConPer.toFixed(2) + "%");
        newTableDataSub.text(`${subConPer.toFixed(2)}% ${sv.analysis.subjectivity}`);
        // newTableDataSubConf.text(subConPer.toFixed(2) + "%");

        var newData = newTableRow.append(newTableHeight, newTableDataTrigWord, newTableDataSyn, newTableDataPol, newTableDataScore, newTableDataSub);
        $("tbody").prepend(newData);

        // Change the background color of the text with data depending on if it is positive, neutral, or negative
        if (sv.analysis.polarity === "positive") {
            $("#analysis-" + num).css("background", "green");
            $("#emoji-" + sv.text).addClass("twa twa-smiley");
        } else if (sv.analysis.polarity === "neutral") {
            $("#analysis-" + num).css("background", "yellow")
            $("#emoji-" + sv.text).addClass("twa twa-expressionless");
        } else if (sv.analysis.polarity === "negative") {
            $("#analysis-" + num).css("background", "red")
            $("#emoji-" + sv.text).addClass("twa twa-open-mouth");
        }

        num++;
        console.log(num);
    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });

    $(document).on("click", ".triggerWord", function () {
        var word = $(this).attr("id");
        console.log(word);

        wordApiKey = "fe9aa725-d588-4523-ae33-60a5fd3be34c";
        wordUrl = "https://www.dictionaryapi.com/api/v3/references/thesaurus/json/" + word + "?key=" + wordApiKey;

        $.ajax({
            url: wordUrl,
            method: "GET"
        }).then(function (response) {
            console.log(response);

            //Reset the local state.analysis.syn array
            state.analysis.syn = [];

            for (let i = 0; i < response[0].meta.syns[0].length; i++) {
                var synonymsFromMerriam = response[0].meta.syns[0][i];
                state.analysis.syn.push(synonymsFromMerriam);
                console.log(synonymsFromMerriam);
                console.log(`State.analysis.syn: ${state.analysis.syn}`);
            }

            // $("#syn-" + num).text(state.analysis.syn.join(" "));
            $("#syn-"+ word).text(state.analysis.syn.join(" "));
            // Update this in the database
            // usersRef.child(userId).update({
            //     id: userId,
            //     text: state.text,
            //     analysis: {
            //         polarity: state.analysis.polarity,
            //         polarity_confidence: state.analysis.polarity_confidence,
            //         subjectivity: state.analysis.subjectivity,

            //         subjectivity_confidence: state.analysis.subjectivity_confidence,
            //         score: state.analysis.score,
            //         syn: state.analysis.syn.join(" "),
            //         positiveWords: state.analysis.positiveWords,
            //         negativeWords: state.analysis.negativeWords
            //     }
            // });

        });

    });





});

