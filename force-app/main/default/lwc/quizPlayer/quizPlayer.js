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
    shuffledOptions = [];
    selectedQuizId;
    isLoaded = false;
    randomizeQuestions = false;
    randomizeOptions = false;
    currentQuestion;
    currentQuestionCount;
    error;

    @wire(getQuestions, { quizId: '$quizId' })
    wiredQuestions({ error, data }) {
        if (data) {
            let shuffled = [...data];
            if (this.randomizeQuestions) {shuffled = this.shuffle(shuffled);}
            this.questions = shuffled;
            this.isLoaded = true;
            this.initializeFirstQuestion(); 
        } else if (error) {
            this.error = error;
            console.error('Error loading quiz questions', error);
        }
    }

    get showSubmitButton() {
        return !this.submitted;
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
        return this.shuffledOptions || [];
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

    handleRandomizeQuestionsToggle(event) {
        this.randomizeQuestions = event.target.checked;
    }

    handleRandomizeOptionsToggle(event) {
        this.randomizeOptions = event.target.checked;
    }

    startQuiz() {
        this.quizId = this.selectedQuizId;
    }
    submitAnswer() {
        if (this.selectedAnswers.length === 0) {
            this.feedback = '⚠️ Please select an answer before submitting.';
            return;
        }
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

    initializeFirstQuestion() {
        if (this.questions && this.questions.length > 0) {
            this.currentIndex = 0;
            this.currentQuestion = this.questions[this.currentIndex];
    
            this.selectedAnswers = [];
            this.submitted = false;
    
            if (this.randomizeOptions) {
                this.shuffledOptions = this.shuffle(this.generateOptions(this.currentQuestion));
            } else {
                this.shuffledOptions = this.generateOptions(this.currentQuestion);
            }
            this.currentQuestionCount = 1;
        }
    }

    nextQuestion() {
        // Clear manually in the DOM
        const inputs = this.template.querySelectorAll('lightning-input');
        inputs.forEach(input => {
            input.checked = false;
        });

        this.feedback = '';
        this.selectedAnswers = [];
        this.submitted = false;
        this.currentIndex++;
        this.currentQuestionCount++;
    
        if (this.currentIndex < this.questions.length) {
            this.currentQuestion = this.questions[this.currentIndex];
    
            if (this.randomizeOptions) {
                this.shuffledOptions = this.shuffle(this.generateOptions(this.currentQuestion));
            } else {
                this.shuffledOptions = this.generateOptions(this.currentQuestion);
            }
        } else {
            this.currentQuestion = null;
        }
    }

    generateOptions(question) {
        const opts = [];
    
        function buildOption(label, value) {
            return {
                label,
                value,
                key: question.Id + value,
                class: 'option-item'
            };
        }
    
        if (question.Option_1__c) opts.push(buildOption(question.Option_1__c, '1'));
        if (question.Option_2__c) opts.push(buildOption(question.Option_2__c, '2'));
        if (question.Option_3__c) opts.push(buildOption(question.Option_3__c, '3'));
        if (question.Option_4__c) opts.push(buildOption(question.Option_4__c, '4'));
        if (question.Option_5__c) opts.push(buildOption(question.Option_5__c, '5'));
    
        return opts;
    }

    shuffle(values) {
        const arr = [...values];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
