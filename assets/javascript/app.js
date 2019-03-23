var apiKey = "0Zs_pqOsfZm4pVDFyRyvxh2G1qyxYKTqaDPNLmI7SSng";
var apiURL = "https://gateway.watsonplatform.net/tone-analyzer/api?key=" + apiKey;


// function getAnalysis() {
    $.ajax({
        url: apiURL,

        method: "GET"
      }).then(function(response) {
          console.log(response)
})
// }
// getAnalysis()
