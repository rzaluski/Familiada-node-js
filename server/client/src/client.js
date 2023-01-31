const sock = io();
const wrongAnswerAudio = new Audio('resources/wronganswer.wav');
const roundsoundAudio = new Audio('resources/roundsound.wav');
const roundSoundWithClapsAudio = new Audio('resources/roundsoundwithclaps.wav');
const clapsAudio = new Audio('resources/claps.wav');
const correntAnswerAudio = new Audio('resources/correctanswer.wav');

let gameId = null;
let pickQuestion = null;
let currentQuestion = null;
let firstAnsweringTeam = null;
let userFunction = "";

const FamiliadaGameStates = {
    PickingQuestion: "PickingQuestion"
}
const FamiliadaTeams = {
    None: "None",
    Left: "Left",
    Right: "Right"
}
sock.on("disconnect", () => {
    if(userFunction != "")
    {
        $("#divReconnect").show();
    }
});
sock.onAny(message =>{
    console.log(message);
    const response = JSON.parse(message);
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
            $("#divGameId").show();
            $("#spanGameId").text("KOD GRY: " + response.gameId);
            userFunction = "host";
            gameId = response.gameId;
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
            userFunction = "gameOperator";
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
            $("#divGameId").hide();
            showQuestion(response.question);
        }
        if(response.method == "questionSubmitted")
        {
            createQuestionPanel(response.question, true);
        }
        if(response.method == "showAnswer")
        {
            updatePoints(response.roundPoints, response.teamLeftPoints, response.teamRightPoints);
            showAnswer(response.answerNumber, response.answerText, response.answerPoints, response.endRound, response.isRoundOn, response.clearPanels);
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
        if(response.method === "currentAnsweringTeam"){
            $("#divTip").show();

            var teamText = "";
            if(response.isRoundOn)
            {

                if(response.currentAnsweringTeam == FamiliadaTeams.Left)
                {
                    teamText = "Lewa";
                }
                if(response.currentAnsweringTeam == FamiliadaTeams.Right)
                {
                    teamText = "Prawa";
                }
                $("#spanTip").text("Odpowiada drużyna: " + teamText);
            }
            else
            {
                $("#spanTip").text("Odsłoń pozostałe odpowiedzi");
            }
        }
        if(response.method == "reconnected")
        {
            $("#divReconnect").hide();
        }
});
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

        var divHoverAnswer = document.createElement('div');
        divHoverAnswer.id = "divHoverAnswer" + answerNumber;
        divHoverAnswer.classList.add("hoverAnswer");
        td2.appendChild(divHoverAnswer);
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
    playStaticAudio(roundsoundAudio);
}
function playAudioWithDelay(audio, delay)
{
    setTimeout(playStaticAudio, delay, audio);
}
function playAudio(path)
{
    var audio = new Audio(path);
    audio.play();
}
function playStaticAudio(audio)
{
    audio.play();
}
function hideX()
{
    $(".img-small-x").hide();
    $(".img-big-x").hide();
    $(".hover").removeClass("animate");
    $(".hover").hide();
}
function showSmallX(team, endRound)
{
    playStaticAudio(wrongAnswerAudio);
    if(endRound)
    {
        playAudioWithDelay(roundSoundWithClapsAudio, 1000);
    }
    var imgName = "smallX" + team;
    var divHoverName = "divHover" + team;
    for(let i = 1; i < 4; i++)
    {
        if($("#" + imgName + i.toString()).is(":hidden"))
        {
            $("#" + imgName + i.toString()).show();
            $("#" + divHoverName + i.toString()).show();
            $("#" + divHoverName + i.toString()).addClass("animate");
            return;
        }
    }
    
}
function showBigX(team, clearPanelsDelay, endRound)
{
    var imgName = "bigX" + team;
    var divHoverName = "divHoverBig" + team;
    $("#" + imgName).show();
    $("#" + divHoverName).show();
    $("#" + divHoverName).addClass("animate");
    setTimeout(() => {$("#" + divHoverName).removeClass("animate");}, 500);

    if(clearPanelsDelay == true)
    {
        setTimeout(hideX, 1000);
    }
    playStaticAudio(wrongAnswerAudio);
    if(endRound)
    {
        playAudioWithDelay(roundSoundWithClapsAudio, 1000);
    }
}
function showAnswer(answerNumber, answerText, answerPoints, endRound, isRoundOn, clearPanelsDelay)
{
    $("#span2Answer" + (answerNumber + 1).toString()).text(answerText.toLowerCase().replace("ą", "a").replace("ć", "c").replace("ż", "z").replace("ź", "z").replace("ń", "n").replace("ś", "s").replace("ł", "l").replace("ę", "e").replace("ó", "o").toUpperCase());
    $("#span3Answer" + (answerNumber + 1).toString()).text(answerPoints);
    var divHoverName = "divHoverAnswer" + (answerNumber + 1).toString();
    $("#" + divHoverName).addClass("animate");
    setTimeout(() => {$("#" + divHoverName).removeClass("animate");}, 500);
    playStaticAudio(correntAnswerAudio);
    if(endRound)
    {
        playAudioWithDelay(roundSoundWithClapsAudio, 1000);
        return;
    }
    if(isRoundOn)
    {
        playAudioWithDelay(clapsAudio, 1000);
    }
    if(clearPanelsDelay == true)
    {
        setTimeout(hideX, 1000);
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
    sock.emit(JSON.stringify(payLoad));
});

const btnReconnect = document.getElementById("btnReconnect");
btnReconnect.addEventListener('click', () =>
{
    $('#btnReconnect').prop('disabled', true);
    const payLoad = {
        "method": "reconnect",
        "gameId": gameId,
        "userFunction": userFunction
    };
    sock.emit(JSON.stringify(payLoad));
    setTimeout(() =>{
        $('#btnReconnect').prop('disabled', false);
    }, 3000);
});

const btnJoinGame = document.getElementById("btnJoinGame");
btnJoinGame.addEventListener('click', () =>
{
    const input = document.getElementById("inputGameId");
    const payLoad = {
        "method": "joinGame",
        "gameId": input.value
    };
    sock.emit(JSON.stringify(payLoad));
});

const btnDrawQuestion = document.getElementById("btnDrawQuestion");
btnDrawQuestion.addEventListener('click', () =>
{
    $('#btnDrawQuestion').prop('disabled', true);
    const payLoad = {
        "method": "drawQuestion",
        "gameId": gameId
    };
    sock.emit(JSON.stringify(payLoad));
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
    sock.emit(JSON.stringify(payLoad));
});

function createQuestionPanel(question, enabled)
{
    $("#divTip").hide();
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
            sock.emit(JSON.stringify(payLoad));
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
            sock.emit(JSON.stringify(payLoad));
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