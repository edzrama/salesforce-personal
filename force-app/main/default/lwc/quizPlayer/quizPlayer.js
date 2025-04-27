import { LightningElement, api, wire, track } from 'lwc';
import getQuizzes from '@salesforce/apex/QuizController.getQuizzes';
import getQuestions from '@salesforce/apex/QuizController.getQuestions';

export default class QuizPlayer extends LightningElement {
    @api quizId;
    @track questions = [];
    @track currentIndex = 0;
    @track selectedAnswers = [];
    @track feedback = '';
    @track submitted = false;
    @track score = 0;
    quizOptions = [];
    selectedQuizId;
    isLoaded = false;
    error;

    @wire(getQuestions, { quizId: '$quizId' })
    wiredQuestions({ error, data }) {
        if (data) {
            this.questions = data;
            this.isLoaded = true;
        } else if (error) {
            this.error = error;
            console.error('Error loading quiz questions', error);
        }
    }

    get showSubmitButton() {
        return !this.submitted;
    }

    get currentQuestion() {
        return this.questions[this.currentIndex];
    }

    get isMultipleChoice() {
        return this.currentQuestion?.Allow_Multiple__c;
    }

    get showStartButton() {
        return this.selectedQuizId;
    }

    get selectedLabel() {
        const selected = this.quizOptions.find(opt => opt.value === this.selectedQuizId);
        return this.isLoaded && selected ? selected.label : 'Quiz';
    }

    get options() {
        if (!this.currentQuestion) return [];
        const opts = [];
        if (this.currentQuestion.Option_1__c) {
            opts.push({ label: this.currentQuestion.Option_1__c, value: '1' , key: this.currentQuestion.Id + '1', class: 'option-item'});
        }
        if (this.currentQuestion.Option_2__c) {
            opts.push({ label: this.currentQuestion.Option_2__c, value: '2', key: this.currentQuestion.Id + '2', class: 'option-item' });
        }
        if (this.currentQuestion.Option_3__c) {
            opts.push({ label: this.currentQuestion.Option_3__c, value: '3', key: this.currentQuestion.Id + '3', class: 'option-item'});
        }
        if (this.currentQuestion.Option_4__c) {
            opts.push({ label: this.currentQuestion.Option_4__c, value: '4', key: this.currentQuestion.Id + '4', class: 'option-item'});
        }
        if (this.currentQuestion.Option_5__c) {
            opts.push({ label: this.currentQuestion.Option_5__c, value: '5', key: this.currentQuestion.Id + '5', class: 'option-item'});
        }
        return opts;
    }

    get optionsWithStatus() {
        if (!this.submitted) {
            return this.options;
        }

        return this.options.map(option => {
            const correctAnswers = this.currentQuestion.Correct_Answers__c.split(';');
            let isCorrect = correctAnswers.includes(option.value);
            let isSelected = this.selectedAnswers.includes(option.value);
            let styleClass = 'option-item';

            if (isCorrect) {
                styleClass += ' correct-answer';
            } else if (isSelected && !isCorrect) {
                styleClass += ' wrong-answer';
            }

            return { ...option, class: styleClass };
        });
    }

    connectedCallback() {
        getQuizzes()
            .then((data) => {
                this.quizOptions = data.map((quiz) => ({
                    label: quiz.Name, // Displayed name
                    value: quiz.Id    // ID used as value
                }));
            })
            .catch((error) => {
                // Handle errors here
                console.error('Error fetching quizzes:', error);
            });
    }


    // Handle change of selection
    handleQuizChange(event) {
        this.selectedQuizId = event.target.value;
    }

    handleSelection(event) {
        const value = event.target.value;
        if (this.isMultipleChoice) {
            if (event.target.checked) {
                this.selectedAnswers = [...this.selectedAnswers, value];
            } else {
                this.selectedAnswers = this.selectedAnswers.filter(val => val !== value);
            }
        } else {
            this.selectedAnswers = [value];
        }
    }

    startQuiz() {
        this.quizId = this.selectedQuizId;
    }
    submitAnswer() {
        const correctAnswers = this.currentQuestion.Correct_Answers__c.split(';').sort();
        const userAnswers = [...this.selectedAnswers].sort();

        this.submitted = true;

        if (JSON.stringify(correctAnswers) === JSON.stringify(userAnswers)) {
            this.feedback = '✅ Correct!';
            this.score++;
        } else {
            this.feedback = '❌ Incorrect!';
        }
    }

    nextQuestion() {
        this.feedback = '';
        this.selectedAnswers = [];
        this.submitted = false;
        this.currentIndex++;
    }
}
