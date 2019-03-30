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
    var connectedRef = database.ref(".info/connected");
    var usersRef = database.ref("/users");
    // var profile;

    //____________________________________________________________________________________________________________
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

                    syn: "None requested",
                    ant: "None requested"
                }
            });
            //Get a unique key for each window that connects
            userId = profile.key;

            // Remove their profile when they disconnect
            profile.onDisconnect().remove();

        }
    });

    // When first loaded or when the connections list changes...
    usersRef.on("value", function (snap) {

        // Display the viewer count in the html.
        // The number of online users is the number of children in the users list.
        $("#connected-viewers").text(`Number of people currently analyzing their text: ${snap.numChildren()}`);
    });

    //____________________________________________________________________________________________________________
    // Initialize some variables at local level;
    var analyze;
    var polarity;
    var subjectivity;
    var polarity_confidence;
    var subjectivity_confidence;
    var num = 0;
    var showDirections = true;

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
            syn: [],
            ant: []
        }
    }
    //____________________________________________________________________________________________________________
    // When you type in the submit-text area
    $("#submit-text").keypress(function (event) {
        // If the user presses the spacebar
        if (event.which === 32) {
            doneTyping();
        }
    });
    //____________________________________________________________________________________________________________
    //setup before functions
    var typingTimer;                //timer identifier
    var doneTypingInterval = 500;

    //on keyup, start the countdown
    $("#submit-text").on('keyup', function () {
        clearTimeout(typingTimer);
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    });

    //on keydown, clear the countdown 
    $("#submit-text").on('keydown', function () {
        clearTimeout(typingTimer);
    });

    //____________________________________________________________________________________________________________
    //save function to analyze text, make Aylien API call
    function doneTyping() {
        analyze = $("#submit-text").val().trim();

        var sentimood = new Sentimood();
        var analysis = sentimood.analyze(analyze);
        var positivity = sentimood.positivity(analyze);
        var negativity = sentimood.negativity(analyze);
        var score = analysis.score
        var positiveWords = positivity.words
        var negativeWords = negativity.words

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
                    ant: "None requested",
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
    }
    //____________________________________________________________________________________________________________
    // If anything changes in the usersRef in the firebase, that needs to be updated in the HTML
    database.ref("/users").on("child_changed", function (snapshot) {
        // database.ref("/users/" + userId).on("child_changed", function (snapshot) {
        var sv = snapshot.val();
   
        //If the userId of the person doesn't match what's in firebase, they will not see the analysis of a different user
        if (sv.id !== userId) {
            //return here means it will get out of this
            return;
        }

        // Update the html display
        var newTableHeight = $('<th scope="row">'); //Analysis
        var newTableRow = $("<tr>").attr({
            id: "analysis-" + num,
            id: "analysis-" + userId
        });
        var newTableDataTrigWord = $("<td>"); //Trigger Word
        var newTableDataSyn = $("<td>"); //Synonyms
        var newTableDataAnt = $("<td>"); //Antonyms
        var newTableDataEmoji = $("<i>") // Emoji as icon
        var newTableDataScore = $("<td>") // Polarity Score
        var newTableDataPol = $("<td>"); //Polarity

        //Need a for loop to make a new button for every trigger word
        for (let j = 0; j < sv.analysis.positiveWords.length - 1; j++) {
            //Make the Trigger words into buttons to find the synonym
            var b = $("<button>");
            b.addClass("triggerWord btn").attr({id: sv.analysis.positiveWords[j],
                                            "data-toggle": "tooltip",
                                            "data-placement": "bottom",
                                            "title": "Display synonyms & antonyms"}).text(sv.analysis.positiveWords[j]);
            newTableDataTrigWord.prepend(b);
            newTableDataSyn.text(sv.analysis.syn).addClass("syn").attr({
                id: "syn-" + sv.analysis.positiveWords[j],
                id: "syn-" + userId
            });
            newTableDataAnt.text(sv.analysis.ant).addClass("ant").attr({
                id: "ant-" + sv.analysis.positiveWords[j],
                id: "ant-" + userId
            });

        }

        for (let k = 0; k < sv.analysis.negativeWords.length - 1; k++) {
            //Make the Trigger words into buttons to find the synonym
            var b = $("<button>");
            b.addClass("triggerWord btn").attr({id: sv.analysis.negativeWords[k],
                                            "data-toggle": "tooltip",
                                            "data-placement": "bottom",
                                            "title": "Display synonyms & antonyms"}).text(sv.analysis.negativeWords[k]);
            newTableDataTrigWord.prepend(b);
            newTableDataSyn.text(sv.analysis.syn).addClass("syn").attr({
                id: "syn-" + sv.analysis.negativeWords[k],
                id: "syn-" + userId
            });
            newTableDataAnt.text(sv.analysis.ant).addClass("ant").attr({
                id: "ant-" + sv.analysis.negativeWords[k],
                id: "ant-" + userId
            });
        }

        var polConPer = sv.analysis.polarity_confidence * 100;

        newTableHeight.append(sv.text);
        newTableDataPol.text(`${polConPer.toFixed(2)}% confident it's ${sv.analysis.polarity} `);
        newTableDataScore.addClass("score").html(`${sv.analysis.score}<br>`);
        newTableDataEmoji.addClass("emoji");
        newTableDataScore.append(newTableDataEmoji);

        var newData = newTableRow.append(newTableHeight, newTableDataTrigWord, newTableDataSyn, newTableDataAnt, newTableDataPol, newTableDataScore);
        $("tbody").html(newData);

        // Change the background color of the text with data depending on if it is positive, neutral, or negative
        if (sv.analysis.polarity === "positive") {
            $("#analysis-" + userId).css("background", "#96d74c");
            $(".emoji").addClass("twa twa-smiley");
        } else if (sv.analysis.polarity === "neutral") {
            $("#analysis-" + userId).css("background", "#4c96d7")
            $(".emoji").addClass("twa twa-neutral-face");
        } else if (sv.analysis.polarity === "negative") {
            $("#analysis-" + userId).css("background", "#d74c96")
            $(".emoji").addClass("twa twa-angry");
        }

        num++;

    }, function (errorObject) {
        console.log("The read failed: " + errorObject.code);
    });

    //_______________________________________________________________________
    //Function for dynamically expanding the textarea depending on the text

    $(document)
        .one('focus.autoExpand', 'textarea.autoExpand', function () {
            var savedValue = this.value;
            this.value = '';
            this.baseScrollHeight = this.scrollHeight;
            this.value = savedValue;
        })
        .on('input.autoExpand', 'textarea.autoExpand', function () {
            var minRows = this.getAttribute('data-min-rows') | 0, rows;
            this.rows = minRows;
            rows = Math.ceil((this.scrollHeight - this.baseScrollHeight) / 22);
            this.rows = minRows + rows;
        });

    //_______________________________________________________________________
    // When a "key word" is pressed, antonyms and synonyms will show up as buttons

    $(document).on("click", ".triggerWord", function () {
        var word = $(this).attr("id");

        wordApiKey = "fe9aa725-d588-4523-ae33-60a5fd3be34c";
        wordUrl = "https://www.dictionaryapi.com/api/v3/references/thesaurus/json/" + word + "?key=" + wordApiKey;

        $.ajax({
            url: wordUrl,
            method: "GET"
        }).then(function (response) {

            $(".syn, .ant").text("");

            if (response[0].meta.syns[0].length !== 0) {
                for (let m = 0; m < response[0].meta.syns[0].length; m++) {

                    var p = $("<p>");
                    p.addClass("replaceWord btn").attr({"data-syn": response[0].meta.syns[0][m],
                                                    "data-toReplace": word,
                                                    "data-toggle": "tooltip",
                                                    "data-placement": "bottom",
                                                    "title": "Replace & re-analyze"}).text(response[0].meta.syns[0][m]);
                    $("#syn-" + userId).prepend(p);

                    p.on("click", function(){
                        var syn = $(this).attr("data-syn");
                        var word = $(this).attr("data-toReplace");
                        var originalInput = $("#submit-text").val();
                        $("#submit-text").val(originalInput.replace(word, syn));
                        $("#syn-" + userId).children().attr("data-toReplace", syn);
                        setTimeout(doneTyping, 1000);
                    });
                }

            } else {
                $("#syn-" + userId).text("No synonyms listed");
            }


            if (response[0].meta.ants[0].length !== 0) {
                for (let l = 0; l < response[0].meta.ants[0].length; l++) {

                    var p = $("<p>");
                    p.addClass("replaceWord btn").attr({"data-ant": response[0].meta.ants[0][l],
                                                    "data-toReplace": word,
                                                    "data-toggle": "tooltip",
                                                    "data-placement": "bottom",
                                                    "title": "Replace & re-analyze"}).text(response[0].meta.ants[0][l]);
                    $("#ant-" + userId).prepend(p);

                    p.on("click", function(){
                        var ant = $(this).attr("data-ant");
                        var word = $(this).attr("data-toReplace");
                        var originalInput = $("#submit-text").val();
                        $("#submit-text").val(originalInput.replace(word, ant));
                        $("#ant-" + userId).children().attr("data-toReplace", ant);
                        setTimeout(doneTyping, 1000);
                    });
                }
            } else if (response[0].meta.ants.length === 0) {
                $("#ant-" + userId).text("No antonyms listed");
            }
        });

    });





});

