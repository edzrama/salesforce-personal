public with sharing class QuizController {
    @AuraEnabled(cacheable=true)
    public static List<Quiz_Question__c> getQuestions(Id quizId) {
        return [
            SELECT Id, Question_Text__c, Option_A__c, Option_B__c, Option_C__c, Option_D__c, Correct_Answers__c, Allow_Multiple__c
            FROM Quiz_Question__c
            WHERE Quiz__c = :quizId
            ORDER BY CreatedDate ASC
        ];
    }
}