public with sharing class SObjectUtil {
	
    public static boolean isObjectExist(String objectNameParam){
     for (Schema.SObjectType sObjectType : Schema.getGlobalDescribe().values() ) {
        String sobjName = String.valueOf(sObjectType);
        if (sobjName.contains(objectNameParam)) {
            return true;
        }
     }

     return false;
   }

   public static String buildFilteredObjectFieldsAStr(String objectAPIName, List<String> sourceFields, Map<String, Schema.SObjectField> fieldsMap) {
        String queryStr;

        List<String> fieldAPINames = new List<String>();

        String idAPIName = 'Id';

        if(!sourceFields.contains(idAPIName.toLowerCase())) {
            sourceFields.add(idAPIName);
        }

        for(String sourceField : sourceFields) {
            if(fieldsMap.keySet().contains(sourceField.toLowerCase())){
                DescribeFieldResult describeFieldResult = fieldsMap.get(sourceField).getDescribe();

                if (describeFieldResult.isAccessible() && describeFieldResult.getType() != Schema.DisplayType.LOCATION) {
                    fieldAPINames.add(sourceField);
                    continue;
                }
            }
        }

        if (fieldAPINames.size() > 0){
            queryStr = String.join(fieldAPINames, ',');
        }

        return queryStr;
    }
}