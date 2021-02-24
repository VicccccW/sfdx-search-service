public with sharing class SearchComponentSettingController {
    static final String EMPTY_SPACE = ' ';
    @TestVisible static Boolean UNIT_TEST_EXCEPTION = false;

    @AuraEnabled
    public static List<Search_Component_Field_Setting__mdt> buildSearchFields(String settingAPIName) {
        try {
            Search_Component_Setting__mdt setting = [SELECT Id, (SELECT Field_Label__c, Field_API_Name__c FROM Search_Component_Field_Settings__r) FROM Search_Component_Setting__mdt WHERE DeveloperName = :settingAPIName LIMIT 1];

            if(UNIT_TEST_EXCEPTION) {
                AuraHandledException e = new AuraHandledException('Exception');
                e.setMessage('Exception');
                throw e;
            }

            return setting.Search_Component_Field_Settings__r;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Search_Component_Object_Setting__mdt> buildSearchObjects(String settingAPIName) {
        try {
            Search_Component_Setting__mdt setting = [SELECT Id, (SELECT SObject_Label__c, SObject_API_Name__c, Parent_Lookup_Field_API_Name__c, Display_Icon__c FROM Search_Component_Object_Settings__r) FROM Search_Component_Setting__mdt WHERE DeveloperName = :settingAPIName LIMIT 1];

            if(UNIT_TEST_EXCEPTION) {
                AuraHandledException e = new AuraHandledException('Exception');
                e.setMessage('Exception');
                throw e;
            }

            return setting.Search_Component_Object_Settings__r;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Search_Component_Display_Setting__mdt> buildDisplayFields(String settingAPIName) {
        try {
            Search_Component_Setting__mdt setting = [SELECT Id, (SELECT Field_Label__c, Field_API_Name__c, Field_Type__c, Display_Order__c FROM Search_Component_Display_Settings__r) FROM Search_Component_Setting__mdt WHERE DeveloperName = :settingAPIName LIMIT 1];

            if(UNIT_TEST_EXCEPTION) {
                AuraHandledException e = new AuraHandledException('Exception');
                e.setMessage('Exception');
                throw e;
            }

            return setting.Search_Component_Display_Settings__r;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled(Cacheable=true)
    public static String searchObjectsWithFields(String searchDataStr){
        try {
            SearchDataWrapper searchData = (SearchDataWrapper)JSON.deserialize(searchDataStr, SearchDataWrapper.class);
            
            List<ResultData> baseData = getBaseSearchData(searchData);
            
            if(UNIT_TEST_EXCEPTION) {
                AuraHandledException e = new AuraHandledException('Exception');
                e.setMessage('Exception');
                throw e;
            }

            return JSON.serialize(baseData);
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    // return a list of sobject record that are direct result of search
    private static List<ResultData> getBaseSearchData(SearchDataWrapper searchData) {
        List<ResultData> baseData = new List<ResultData>();

        List<QueryData> baseQueries = buildBaseSearchQueries(searchData);
        
        for (QueryData query : baseQueries) {
            ResultData sobjectRecords = new ResultData();
            sobjectRecords.sobjectType = query.sobjectType;
            sobjectRecords.parentApiName = query.parentApiName;

            List<SObject> records = Database.query(query.queryString);
            sobjectRecords.records = records;
            
            baseData.add(sobjectRecords);
        }

        return baseData;
    }

    private static List<QueryData> buildBaseSearchQueries(SearchDataWrapper searchData) {
        List<QueryData> queries = new List<QueryData>();

        Map<String, Schema.SObjectType> sobjectTypes = Schema.getGlobalDescribe();

        for (SearchObjectWrapper obj : searchData.searchObjects) {
            // if the org does not has the sobject type, skip this one.
            if(!sobjectTypes.keySet().contains(obj.objectAPIName.toLowerCase())) {
                continue;
            }
            
            List<String> displayFields = getDisplayFieldsFromSetting(searchData);
  
            if(displayFields == null) {
                continue;
            }

            Map<String, Schema.SObjectField> fieldsMap = sobjectTypes.get(obj.objectAPIName.toLowerCase()).getDescribe().fields.getMap();

            String displayFieldsQueryStr = SObjectUtil.buildFilteredObjectFieldsAStr(obj.objectAPIName, displayFields, fieldsMap);

            if(displayFieldsQueryStr == null) {
                continue;
            }

            String query = 'SELECT' + EMPTY_SPACE + displayFieldsQueryStr + EMPTY_SPACE + ',' + obj.parentAPIName.toLowerCase() + EMPTY_SPACE + 'FROM' + EMPTY_SPACE + obj.objectAPIName + EMPTY_SPACE + 'WHERE'; 

            for(Integer i = 0; i < searchData.searchFields.size(); i++ ){
                SearchFieldWrapper fld = searchData.searchFields[i];

                if(!fieldsMap.keySet().contains(fld.fieldAPIName.toLowerCase())) {
                    continue;
                }

                if(i != searchData.searchFields.size() - 1) {
                    query = query + EMPTY_SPACE + fld.fieldAPIName + EMPTY_SPACE + 'LIKE' + EMPTY_SPACE + '\'%' + fld.value + '%\'' + EMPTY_SPACE + 'AND' + EMPTY_SPACE;
                } else {
                    query = query + EMPTY_SPACE + fld.fieldAPIName + EMPTY_SPACE + 'LIKE' + EMPTY_SPACE + '\'%' + fld.value + '%\'';
                }
            }

            queries.add(new QueryData(obj.objectAPIName, obj.parentAPIName, query));
        }

        return queries;
    }

    private static List<String> getDisplayFieldsFromSetting(SearchDataWrapper searchData) {
        String settingAPIName = searchData.settingAPIName;

        Search_Component_Setting__mdt setting = [SELECT Id, (SELECT Field_API_Name__c FROM Search_Component_Display_Settings__r) FROM Search_Component_Setting__mdt WHERE DeveloperName = :settingAPIName LIMIT 1];

        List<String> fieldsStr = new List<String>();

        if(setting.Search_Component_Display_Settings__r.size() == 0) {
            return null;
        }

        for(Search_Component_Display_Setting__mdt st : setting.Search_Component_Display_Settings__r) {
            fieldsStr.add(st.Field_API_Name__c);
        }

        return fieldsStr;
    }

    public class SearchDataWrapper {
        @AuraEnabled
        public String settingApiName;

        @AuraEnabled 
        public List<SearchObjectWrapper> searchObjects;

        @AuraEnabled 
        public List<SearchFieldWrapper> searchFields;
    }

    public class SearchObjectWrapper{
        @AuraEnabled 
        public String objectApiName;

        @AuraEnabled 
        public String parentApiName;
    }

    public class SearchFieldWrapper{
        @AuraEnabled 
        public String fieldApiName;

        @AuraEnabled 
        public String value;

        @AuraEnabled 
        public String sequence;
    }

    public class ResultData {
        @AuraEnabled 
        public String sobjectType;

        @AuraEnabled 
        public String parentApiName;

        @AuraEnabled 
        public List<SObject> records;
    }

    public class QueryData {
        public String sobjectType;

        public String parentApiName;

        public String queryString;

        public QueryData(String sobjectType, String parentApiName, String queryString) {
            this.sobjectType = sobjectType;
            this.parentApiName = parentApiName;
            this.queryString = queryString;
        }
    }
}
