const tools = require('./tools');
const FamiliadaGameStates = require('./familiadaGameStates');
const Team = require('./familiadaTeams');
class FamiliadaGame{
    constructor(id, host, questions)
    {
        this.host = host;
        this.id = id;
        this.gameOperator = null;
        this.questions = questions;
        this.State = FamiliadaGameStates.PickingQuestion;

        this.currentQuestion = null;
        this.answeredQuestions = [];
        this.round = 0;
        this.isRoundOn = false;
        this.correctAnswers = 0;
        this.roundPoints = 0;
        this.pointsMultiplier = 1;
        this.totalAnswers = 0;
        this.incorrectAnswers = 0;
        this.teamPoints = {};
        this.teamPoints[Team.Left] = 0;
        this.teamPoints[Team.Right] = 0;
        this.teamWonBattle = Team.None;
        this.currentAnsweringTeam = Team.None;
        this.createDate = new Date();
    }

    newRound()
    {
        this.round++;
        this.correctAnswers = 0;
        this.incorrectAnswers = 0;
        this.totalAnswers = 0;
        this.currentAnsweringTeam = Team.None;
        this.roundPoints = 0;
        this.teamWonBattle = Team.None;
        this.isRoundOn = true;
        if(this.round == 4) this.pointsMultiplier = 2;
        if(this.round == 5) this.pointsMultiplier = 3;
    }

    submitQuestion()
    {
        this.State = FamiliadaGameStates.Answering;
        this.newRound();
        
        let payLoad = {
            "method": "questionSubmitted",
            "question": this.currentQuestion
        };
        this.gameOperator.connection.emit(JSON.stringify(payLoad));
        let payLoad2 = {
            "method": "showQuestion",
            "question": this.currentQuestion
        };
        this.host.connection.emit(JSON.stringify(payLoad2));
    }
    drawQuestion()
    {
        const payLoad = {
            "method": "drewQuestion",
            "question": this.getRandQuestion()
        };
        this.gameOperator.connection.emit(JSON.stringify(payLoad));
    }
    getRandQuestion()
    {
        const nextRound = this.round + 1;
        var tempQuestions = null;
        tempQuestions = this.getFilterQuestions(1, 10);
        // if(nextRound < 4)
        // {
        //     tempQuestions = this.getFilterQuestions(6, 10);
        // }
        // else if(nextRound == 4)
        // {
        //     tempQuestions = this.getFilterQuestions(4, 5);
        // }
        // else if(nextRound > 4)
        // {
        //     tempQuestions = this.getFilterQuestions(1, 3);
        // }
        this.currentQuestion = tempQuestions[tools.getRandomInt(0, tempQuestions.length - 1)]
        return this.currentQuestion;
    }
    getFilterQuestions(minAnswers, maxAnswers)
    {
        var tempQuestions = [];
        this.questions.forEach(question => {
            if(question.Answers.length >= minAnswers && question.Answers.length <= maxAnswers)
            {
                tempQuestions.push(question);
            }
        });
        return tempQuestions;
    }
    handleAnswer(answerText, firstAnsweringTeam){
        if(this.State == FamiliadaGameStates.Answering)
        {
            if(this.currentAnsweringTeam == Team.None)
            {
                this.currentAnsweringTeam = firstAnsweringTeam;
            }
            if(answerText == "WrongAnswer")
            {
                this.proceedUncorrectAnswer();
            }
            else
            {
                this.proceedCorrectAnswer(answerText);
            }
        }
    }
    getOppositeTeam(team)
    {
        return team == Team.Left ? Team.Right : Team.Left;
    }
    showAnswer(answerNumber, clearPanels, endRound)
    {
        let payLoad = {
            "method": "showAnswer",
            "answerNumber": answerNumber,
            "answerText": this.currentQuestion.Answers[answerNumber].AnswerText,
            "answerPoints": this.currentQuestion.Answers[answerNumber].Points,
            "isRoundOn": this.isRoundOn,
            "endRound": endRound,
            "clearPanels": clearPanels,
            "roundPoints": this.roundPoints,
            "teamLeftPoints": this.teamPoints[Team.Left],
            "teamRightPoints": this.teamPoints[Team.Right],
        };
        this.host.connection.emit(JSON.stringify(payLoad));
        this.sendCurrentAnsweringTeam();
    }
    proceedCorrectAnswer(answerText)
    {
        var endRound = false;
        var clearPanels = false;
        var answerNumber = this.getAnswerNumber(answerText);
        if(!this.answeredQuestions.includes(answerNumber))
        {
            this.totalAnswers++;
            this.correctAnswers++;
            if(this.isRoundOn)
            {
                var pointsToAdd = this.currentQuestion.Answers[answerNumber].Points * this.pointsMultiplier;
                this.roundPoints += pointsToAdd;
                if (this.totalAnswers == 1 && answerNumber == 0)
                {
                    this.teamWonBattle = this.currentAnsweringTeam;
                    clearPanels = true;
                }
                else if (this.totalAnswers == 1 && answerNumber > 0)
                {
                    this.currentAnsweringTeam = this.getOppositeTeam(this.currentAnsweringTeam);
                }
                else if (this.teamWonBattle == Team.None && this.totalAnswers == 2)
                {
                    if (this.roundPoints - pointsToAdd > pointsToAdd)
                    {
                        this.teamWonBattle = this.getOppositeTeam(this.currentAnsweringTeam);
                    }
                    else
                    {
                        this.teamWonBattle = this.currentAnsweringTeam;
                    }
                    this.currentAnsweringTeam = this.teamWonBattle;
                    clearPanels = true;
                }
                else if (this.correctAnswers == this.currentQuestion.Answers.length || this.currentAnsweringTeam != this.teamWonBattle)
                {
                    this.endRound(this.currentAnsweringTeam);
                    endRound = true;
                }
            }
            this.showAnswer(answerNumber, clearPanels, endRound);

            if(this.correctAnswers == this.currentQuestion.Answers.length)
            {
                this.State = FamiliadaGameStates.PickingQuestion;
                this.drawQuestion();
            }
        }
    }
    endRound(winningTeam)
    {
        this.teamPoints[winningTeam] += this.roundPoints;
        this.roundPoints = 0;
        this.isRoundOn = false;
        let payLoad = {
            "method": "endRound",
        };
        this.gameOperator.connection.emit(JSON.stringify(payLoad));
    }
    showSmallX(team, endRound)
    {
        let payLoad = {
            "method": "showSmallX",
            "team": team,
            "endRound": endRound,
            "roundPoints": this.roundPoints,
            "teamLeftPoints": this.teamPoints[Team.Left],
            "teamRightPoints": this.teamPoints[Team.Right],
        };
        this.host.connection.emit(JSON.stringify(payLoad));
        this.sendCurrentAnsweringTeam();
    }
    showBigX(team, clearPanelsDelay, endRound)
    {
        let payLoad = {
            "method": "showBigX",
            "team": team,
            "clearPanelsDelay": clearPanelsDelay,
            "endRound": endRound,
            "roundPoints": this.roundPoints,
            "teamLeftPoints": this.teamPoints[Team.Left],
            "teamRightPoints": this.teamPoints[Team.Right],
        };
        this.host.connection.emit(JSON.stringify(payLoad));
        this.sendCurrentAnsweringTeam();
    }
    proceedUncorrectAnswer()
    {
        var clearPanelsDelay = false;
        var showSmallX = false;
        var showBigX = false;
        var endRound = false;
        var teamAnswered = this.currentAnsweringTeam;
        this.totalAnswers++;
        if(this.teamWonBattle != Team.None)
        {
            this.incorrectAnswers++;
        }
        if(this.teamWonBattle != Team.None && this.currentAnsweringTeam == this.teamWonBattle)
        {
            showSmallX = true;
        }
        if(this.totalAnswers == 2 && this.teamWonBattle == Team.None)
        {
            if(this.correctAnswers > 0 )
            {
                this.teamWonBattle = this.getOppositeTeam(teamAnswered);
                clearPanelsDelay = true;
            }
            else
            {
                this.totalAnswers = 0;
            }
        }
        if(this.teamWonBattle == Team.None || (this.teamWonBattle != Team.None && this.currentAnsweringTeam != this.teamWonBattle))
        {
            showBigX = true;
            this.currentAnsweringTeam = this.getOppositeTeam(this.currentAnsweringTeam);
        }
        
        if(this.incorrectAnswers == 3)
        {
            this.currentAnsweringTeam = this.getOppositeTeam(this.currentAnsweringTeam);
        }
        if(this.incorrectAnswers == 4)
        {
            this.endRound(this.getOppositeTeam(teamAnswered));
            endRound = true;
        }
        if(showSmallX)
        {
            this.showSmallX(teamAnswered, endRound);
        }
        if(showBigX)
        {
            this.showBigX(teamAnswered, clearPanelsDelay, endRound);
        }
    }
    getAnswerNumber(answerText)
    {
        for(let i = 0; i < this.currentQuestion.Answers.length; i++)
        {
            if(this.currentQuestion.Answers[i].AnswerText == answerText)
            {
                return i;
            }
        }
    }
    sendCurrentAnsweringTeam(){
        let payLoad = {
            "method": "currentAnsweringTeam",
            "currentAnsweringTeam": this.currentAnsweringTeam,
            "isRoundOn": this.isRoundOn,
        };
        this.gameOperator.connection.emit(JSON.stringify(payLoad));
    }
}
module.exports = FamiliadaGame;