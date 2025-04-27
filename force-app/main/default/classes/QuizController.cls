public with sharing class QuizController {
    @AuraEnabled(cacheable=true)
    public static List<Quiz__c> getQuizzes() {
        return [
            SELECT Name, Description__c, Passing_Score__c
            FROM Quiz__c
            WHERE isActive__c = true
            ORDER BY CreatedDate ASC
        ];
    }

    @AuraEnabled(cacheable=true)
    public static List<Quiz_Question__c> getQuestions(Id quizId) {
        return [
            SELECT Id, Question_Text__c, Option_1__c, Option_2__c, Option_3__c, Option_4__c,Option_5__c, Correct_Answers__c, Allow_Multiple__c
            FROM Quiz_Question__c
            WHERE Quiz__c = :quizId
            ORDER BY CreatedDate ASC
        ];
    }
}