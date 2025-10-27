public with sharing class MovieSearchController {
    @AuraEnabled(cacheable=true)
    public static string getMovies(String searchText){
        try {
            HttpRequest req = new HttpRequest();
            String encodedSearch = EncodingUtil.urlEncode(searchText, 'UTF-8');
            req.setEndpoint('callout:IMDB/imdb/imdbSearchByName?query=' + encodedSearch);
            //req.setEndpoint('https://api.collectapi.com/imdb/imdbSearchByName?query=' + encodedSearch);
            req.setMethod('GET');
            req.setMethod('GET');
            //req.setHeader('Content-Type', 'application/json');
            //req.setHeader('authorization', 'apikey 2FyFMNrDiUjtrrOwnDuHRf:0Whz0XXqC1eL4rE1z7OlFc');

        Http http = new Http();
        HttpResponse res;
            try {
                res = http.send(req);
                Integer statusCode = res.getStatusCode();
            
                if (statusCode >= 200 && statusCode < 300) {
                    return res.getBody();
                } else {
                    return 'External API call failed: ' + statusCode + ' - ' + res.getBody();
                }
            } catch (Exception e) {
                System.debug('❌ Exception during API call: ' + e.getMessage());
                return 'exception occured: ' + e.getMessage();
            }

        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }
}