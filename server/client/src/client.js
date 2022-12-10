let ws = new WebSocket("ws://0.0.0.0:" + process.env.PORT || 3000);
const FamiliadaGameStates = {
    PickingQuestion: "PickingQuestion"
}
let gameId = null;
let pickQuestion = null;
let currentQuestion = null;
let firstAnsweringTeam = null;
ws.onmessage = message => {
    const response = JSON.parse(message.data);
    console.log(response);
    if(response.method === "connected"){
        console.log("Connected to server");
        $('#btnCreateGame').prop('disabled', false);
        $('#btnJoinGame').prop('disabled', false);
    }
    if(response.method === "gameCreated"){
        $("#divStart").hide();
        $('#btnCreateGame').prop('disabled', false);
        $('#btnJoinGame').prop('disabled', false);
        console.log("created game with id: " + response.gameId);
    }
    if(response.method === "joinedGame"){
        const gameState = response.gameState;
        gameId = response.gameId;
        $("#divStart").hide();
        $("#divGameOperator").show();
        if(gameState === FamiliadaGameStates.PickingQuestion)
        {
            pickQuestion = response.question;
            createQuestionPanel(response.question, false);
        }
        console.log(response);
    }
    if(response.method === "gameOperatorExists"){
        console.log("Game already has operator");
    }
    if(response.method === "gameNotFound"){
        console.log("Game not found");
    }
    if(response.method == "drewQuestion")
    {
        $("#divDrawQuestion").show();
        $('#btnSubmitQuestion').prop('disabled', false);
        $('#btnDrawQuestion').prop('disabled', false);
        pickQuestion = response.question;
        createQuestionPanel(response.question, false);
    }
    if(response.method == "showQuestion")
    {
        showQuestion(response.question);
    }
    if(response.method == "questionSubmitted")
    {
        createQuestionPanel(response.question, true);
    }
    if(response.method == "showAnswer")
    {
        updatePoints(response.roundPoints, response.teamLeftPoints, response.teamRightPoints);
        showAnswer(response.answerNumber, response.answerText, response.answerPoints, response.endRound, response.isRoundOn);
    }
    if(response.method == "isRoundOn")
    {
        if(response.isRoundOn == false)
        {
        }
    }
    if(response.method == "endRound")
    {
        var btnWrongQuestion = document.getElementById('btnWrongQuestion');
        btnWrongQuestion.parentNode.removeChild(btnWrongQuestion);
    }
    if(response.method == "showSmallX")
    {
        updatePoints(response.roundPoints, response.teamLeftPoints, response.teamRightPoints);
        showSmallX(response.team, response.endRound);
    }
    if(response.method == "showBigX")
    {
        updatePoints(response.roundPoints, response.teamLeftPoints, response.teamRightPoints);
        showBigX(response.team, response.clearPanelsDelay, response.endRound);
    }
}
function showQuestion(currentQuestion)
{
    $("#divHost").show();
    var divAnswers = document.getElementById('divAnswers');
    divAnswers.innerHTML = '';

    var table = document.createElement('table');
    table.id = "tbAnswers";
    var answerNumber = 1;
    currentQuestion.Answers.forEach(answer => {
        var tr = document.createElement('tr');
        tr.id = "trAnswer" + answerNumber;
        var td1 = document.createElement('td');
        var td2 = document.createElement('td');
        var td3 = document.createElement('td');
        td1.classList.add("td1");
        td2.classList.add("td2");
        td3.classList.add("td3");
        var span1 = document.createElement('span');
        span1.innerText = answerNumber.toString() + ".";
        span1.id = "span1Answer" + answerNumber;
        td1.appendChild(span1);

        var span2 = document.createElement('span');
        span2.innerText = ".........................................................";
        span2.id = "span2Answer" + answerNumber;
        td2.appendChild(span2);

        var span3 = document.createElement('span');
        span3.innerText = "--";
        span3.id = "span3Answer" + answerNumber;
        td3.appendChild(span3);

        tr.appendChild(td1);
        tr.appendChild(td2);
        tr.appendChild(td3);
        table.appendChild(tr);
        answerNumber++;
    });
    $("#divAnswers").append(table);
    hideX();
    playAudio('resources/roundsound.wav');
}
function playAudioWithDelay(path, delay)
{
    setTimeout(playAudio, delay, path);
}
function playAudio(path)
{
    var audio = new Audio(path);
    audio.play();
}
function hideX()
{
    $(".img-small-x").hide();
    $(".img-big-x").hide();
}
function showSmallX(team, endRound)
{
    playAudio('resources/wronganswer.wav');
    if(endRound)
    {
        playAudioWithDelay('resources/roundsoundwithclaps.wav', 1000);
    }
    var imgName = "smallX" + team;
    for(let i = 1; i < 4; i++)
    {
        if($("#" + imgName + i.toString()).is(":hidden"))
        {
            $("#" + imgName + i.toString()).show();
            return;
        }
    }
    
}
function showBigX(team, clearPanelsDelay, endRound)
{
    var imgName = "bigX" + team;
    $("#" + imgName).show();
    if(clearPanelsDelay == true)
    {
        setTimeout(hideX, 3000);
    }
    playAudio('resources/wronganswer.wav');
    if(endRound)
    {
        playAudioWithDelay('resources/roundsoundwithclaps.wav', 1000);
    }
}
function showAnswer(answerNumber, answerText, answerPoints, endRound, isRoundOn)
{
    $("#span2Answer" + (answerNumber + 1).toString()).text(answerText);
    $("#span3Answer" + (answerNumber + 1).toString()).text(answerPoints);
    playAudio('resources/correctanswer.wav');
    if(endRound)
    {
        playAudioWithDelay('resources/roundsoundwithclaps.wav', 1000);
        return;
    }
    if(isRoundOn)
    {
        playAudioWithDelay('resources/claps.wav', 1000);
    }
}
function updatePoints(roundPoints, teamLeftPoints, teamRightPoints)
{
    $("#spanRoundPoints").text(roundPoints);
    $("#spanTeamLeftPoints").text(teamLeftPoints);
    $("#spanTeamRightPoints").text(teamRightPoints);
}
const btnCreateGame = document.getElementById("btnCreateGame");
btnCreateGame.addEventListener('click', () =>
{
    $('#btnCreateGame').prop('disabled', true);
    $('#btnJoinGame').prop('disabled', true);
    const payLoad = {
        "method": "createGame"
    };
    ws.send(JSON.stringify(payLoad));
});

const btnJoinGame = document.getElementById("btnJoinGame");
btnJoinGame.addEventListener('click', () =>
{
    const input = document.getElementById("inputGameId");
    const payLoad = {
        "method": "joinGame",
        "gameId": input.value
    };
    ws.send(JSON.stringify(payLoad));
});

const btnDrawQuestion = document.getElementById("btnDrawQuestion");
btnDrawQuestion.addEventListener('click', () =>
{
    $('#btnDrawQuestion').prop('disabled', true);
    const payLoad = {
        "method": "drawQuestion",
        "gameId": gameId
    };
    ws.send(JSON.stringify(payLoad));
});

const btnSubmitQuestion = document.getElementById("btnSubmitQuestion");
btnSubmitQuestion.addEventListener('click', () =>
{
    $('#btnSubmitQuestion').prop('disabled', true);
    const payLoad = {
        "method": "submitQuestion",
        "gameId": gameId,
        "question": pickQuestion.QuestionText
    };
    ws.send(JSON.stringify(payLoad));
});

function createQuestionPanel(question, enabled)
{
    $("#drewQuestion").text(question.QuestionText);

    var divOperatorAnswers = document.getElementById('divOperatorAnswers');
    divOperatorAnswers.innerHTML = '';
    if(enabled)
    {
        var btnWrongQuestion = document.createElement('button');
        btnWrongQuestion.id = "btnWrongQuestion";
        btnWrongQuestion.innerHTML = "Zła odpowiedź";
        btnWrongQuestion.className = 'answerButton';
        btnWrongQuestion.addEventListener('click', () =>
        {
            const payLoad = {
                "method": "answerQuestion",
                "gameId": gameId,
                "answerText": "WrongAnswer",
                "firstAnsweringTeam": firstAnsweringTeam
            };
            ws.send(JSON.stringify(payLoad));
            $("#divFirstAnsweringTeam").hide();
        });
        divOperatorAnswers.appendChild(btnWrongQuestion);
    }
    

    question.Answers.forEach(answer=>
    {
        var button = document.createElement('button');
        button.innerHTML = answer.AnswerText;
        button.className = 'answerButton';
        button.addEventListener('click', () =>
        {
            const payLoad = {
                "method": "answerQuestion",
                "gameId": gameId,
                "answerText": answer.AnswerText,
                "firstAnsweringTeam": firstAnsweringTeam
            };
            ws.send(JSON.stringify(payLoad));
            button.parentNode.removeChild(button);
            $("#divFirstAnsweringTeam").hide();
        });
        divOperatorAnswers.appendChild(button);
    });

    $('.answerButton').prop('disabled', true);
    $("#divOperatorAnswers").show();
    if(enabled)
    {
        firstAnsweringTeam = null;
        $("#divDrawQuestion").hide();
        $('input[name="first_answering_team"]').prop('checked', false);
        $("#divFirstAnsweringTeam").show();
    }
}

function answeringTeamChange(sender)
{
    $('.answerButton').prop('disabled', false);
    firstAnsweringTeam = sender.value;
}