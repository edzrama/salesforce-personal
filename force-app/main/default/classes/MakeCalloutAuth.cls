public with sharing class MakeCalloutAuth {

    @AuraEnabled
    public static String getAccessToken(String authCode) {
        try {
            String body = 'grant_type=authorization_code'
                        + '&client_id=[id]'
                        + '&client_secret=[secret]'
                        + '&redirect_uri=[calling_org]&code='+ authCode;

            Http http = new Http();
            HttpRequest request = new HttpRequest();
            request.setEndpoint('https://login.salesforce.com/services/oauth2/token');
            request.setMethod('POST');
            request.setHeader('Content-Type', 'application/x-www-form-urlencoded');
            request.setBody(body);

            HttpResponse response = http.send(request);
            return response.getBody();

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static String createAccount(String accessToken, String accName) {
        try {
            String endPoint = '[client_org]/services/data/v65.0/sobjects/Account';
            
            Http http = new Http();
            HttpRequest request = new HttpRequest();
            request.setEndpoint(endPoint);
            request.setMethod('POST');
            request.setHeader('Content-Type', 'application/json');
            request.setHeader('Authorization', 'Bearer ' + accessToken);
            request.setBody(JSON.serialize(new Map<String, String>{ 'Name' => accName }));

            HttpResponse response = http.send(request);
            return response.getBody();

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}
