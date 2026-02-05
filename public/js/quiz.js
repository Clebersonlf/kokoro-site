class Quiz {
    constructor(questions) {
        this.questions = questions;
        this.currentQuestion = 0;
        this.score = 0;
    }

    getCurrentQuestion() {
        return this.questions[this.currentQuestion];
    }

    answerQuestion(answer) {
        const question = this.getCurrentQuestion();
        if (question.correctAnswer === answer) {
            this.score++;
        }
        this.currentQuestion++;
    }

    isFinished() {
        return this.currentQuestion >= this.questions.length;
    }

    getScore() {
        return this.score;
    }
}