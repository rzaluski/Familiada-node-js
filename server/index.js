const http = require("http");
const express = require('express');
const app = express();
const clientPath = `${__dirname}/client`;
app.use(express.static(clientPath));
var tools = require('./tools');
const socketio = require('socket.io');

const GameClient = require('./gameClient');
const FamiliadaGame = require('./familiadaGame');
const FamiliadaGameStates = require('./familiadaGameStates');
const websocketServer = require("websocket").server;
const httpServer = http.createServer(app);
const port = process.env.PORT || 9090;
httpServer.listen(port, (s) => {
    console.log("Running on port " + port);
});

const io = socketio(httpServer);

var clients = [];
let games = new Map();

const fs = require('fs');
const questions = JSON.parse(fs.readFileSync(`${__dirname}/questions.json`));

io.on("connection", connection => {
    console.log("New connection");

    connection.on("disconnect", () => removeClient(connection));

    clients.push(new GameClient(connection));
    const payLoad = {
        "method": "connected"
    };
    connection.emit(JSON.stringify(payLoad));
    console.log(Object.keys(clients).length + " clients connected");

    connection.onAny(message => {
        console.log(message);
        const result = JSON.parse(message);
        const client = getClient(connection);
        if(result.method === "createGame")
        {
            const gameId = getUniqueGameId();
            const game = new FamiliadaGame(gameId, client, questions);
            games[gameId] = game;
            const payLoad = {
                "method": "gameCreated",
                "gameId": game.id
            };
            connection.emit(JSON.stringify(payLoad));
        }
        if(result.method === "joinGame")
        {
            const game = getGameById(result.gameId);
            if(game !== null)
            {
                if(game.gameOperator === null)
                {
                    game.gameOperator = client;
                    let payLoad = null;
                    if(game.State === FamiliadaGameStates.PickingQuestion)
                    {
                        payLoad = {
                            "method": "joinedGame",
                            "gameId": game.id,
                            "gameState": game.State,
                            "question": game.getRandQuestion()
                        };
                    }
                    connection.emit(JSON.stringify(payLoad));
                }
                else
                {
                    const payLoad = {
                        "method": "gameOperatorExists",
                        "gameId": game.id
                    };
                    connection.emit(JSON.stringify(payLoad));
                }
            }
            else
            {
                const payLoad = {
                    "method": "gameNotFound"
                };
                connection.emit(JSON.stringify(payLoad));
            }
        }
        if(result.method == "drawQuestion")
        {
            const game = getGameById(result.gameId);
            if(game !== null && game.gameOperator === client && game.State == FamiliadaGameStates.PickingQuestion)
            {
                game.drawQuestion();
            }
        }
        if(result.method == "submitQuestion")
        {
            const game = getGameById(result.gameId);
            const question = result.question;
            if(game !== null && game.gameOperator === client && game.State == FamiliadaGameStates.PickingQuestion && game.currentQuestion.QuestionText == question)
            {
                game.submitQuestion();
            }
        }
        if(result.method == "answerQuestion")
        {
            const game = getGameById(result.gameId);
            const answerText = result.answerText;
            const firstAnsweringTeam = result.firstAnsweringTeam;
            if(game !== null && game.gameOperator === client)
            {
                game.handleAnswer(answerText, firstAnsweringTeam);
            }
        }
    });
    
});

function getUniqueGameId(){
    while(true)
    {
        const id = tools.getRandomInt(1000, 9999);
        var game = getGameById(id);
        if(game === null)
        {
            return id;
        }
    }
}

function getGameById(id)
{
    var game = games[id];
    if(game === undefined)
    {
        return null;
    }
    return game;
}
function getGameIdByConnection(conn)
{
    var gameId = null;
    for (var gameId in games) {
        var game = getGameById(gameId);
        if(game.host.connection === conn || (game.gameOperator != null && game.gameOperator.connection === conn))
        {
            return gameId;
        }
    }
    return null;
}
function getClient(conn)
{
    return clients.find(c => c.connection == conn);
}

function removeClient(conn)
{
    clients = clients.filter(c => c.connection != conn);
    var gameId = getGameIdByConnection(conn);
    console.log('gameId ' + gameId);
    if(gameId != null)
    {
        delete games[gameId];
    }
}