@isTest
public class SearchComponentSettingControllerTest {

    @IsTest
    static void testBuildSearchFields(){
        Test.startTest();
        List<Search_Component_Field_Setting__mdt> fieldSettings = SearchComponentSettingController.buildSearchFields('Sample_Search_Setting');
        Test.stopTest();
        
        System.assertEquals(1, fieldSettings.size(), 'Should have 1 fields settings.');
    }

    @IsTest
    static void testBuildSearchFieldsException(){
        SearchComponentSettingController.UNIT_TEST_EXCEPTION = true;

        Test.startTest();
        try{
            List<Search_Component_Field_Setting__mdt> fieldSettings = SearchComponentSettingController.buildSearchFields('Sample_Search_Setting');
        } catch(Exception ex) {
            System.assert(ex != null);
        }
        Test.stopTest();
    }

    @IsTest
    static void testBuildSearchObjects(){
        Test.startTest();
        List<Search_Component_Object_Setting__mdt> objectSettings = SearchComponentSettingController.buildSearchObjects('Sample_Search_Setting');
        Test.stopTest();
        
        System.assertEquals(1, objectSettings.size(), 'Should have 1 objects settings.');
    }


    @IsTest
    static void testBuildSearchObjectsException(){
        SearchComponentSettingController.UNIT_TEST_EXCEPTION = true;

        Test.startTest();
        try{
            List<Search_Component_Object_Setting__mdt> objectSettings = SearchComponentSettingController.buildSearchObjects('Sample_Search_Setting');
        } catch(Exception ex) {
            System.assert(ex != null);
        }

        Test.stopTest();
    }

    @IsTest
    static void testBuildDisplayFields(){
        Test.startTest();
        List<Search_Component_Display_Setting__mdt> displaySettings = SearchComponentSettingController.buildDisplayFields('Sample_Search_Setting');
        Test.stopTest();
        
        System.assertEquals(2, displaySettings.size(), 'Should have 2 display settings.');
    }

    @IsTest
    static void testBuildDisplayFieldsException(){
        SearchComponentSettingController.UNIT_TEST_EXCEPTION = true;

        Test.startTest();
        try {
            List<Search_Component_Display_Setting__mdt> displaySettings = SearchComponentSettingController.buildDisplayFields('Sample_Search_Setting');
        } catch(Exception ex) {
            System.assert(ex != null);
        }
        Test.stopTest();    
    }

    @IsTest
    static void testSearchAccountObjectNameField(){
        Account newAcc = new Account();
        newAcc.Name = 'Test';
        insert newAcc;

        Account newAcc2 = new Account();
        newAcc2.Name = 'Test2';
        insert newAcc2;
        
        Test.startTest();
        String searchDataStr = '{"settingApiName":"Sample_Search_Setting","searchObjects":[{"objectApiName":"Account","parentApiName":"ParentId"},{"objectApiName":"Bill__c","parentApiName":"Account__c"}],"searchFields":[{"fieldApiName":"Name","value":"Test","sequence":0}]}';
        String result = SearchComponentSettingController.searchObjectsWithFields(searchDataStr);
        Test.stopTest();

        List<SearchComponentSettingController.ResultData> data = (List<SearchComponentSettingController.ResultData>)JSON.deserialize(result, List<SearchComponentSettingController.ResultData>.class);
        System.assertEquals(1, data.size(), 'should have 1 ResultData');
        System.assertEquals('ParentId', data[0].parentApiName, 'should parentApiName be ParentId');
        System.assertEquals('Account', data[0].sobjectType, 'should sobjectType be Account');
        System.assertEquals(2, data[0].records.size(), 'should have 2 search result');
    }

    @IsTest
    static void testSearchAccountObjectPhoneField(){
        Account newAcc = new Account();
        newAcc.Name = 'Test';
        insert newAcc;
        
        Test.startTest();
        String searchDataStr = '{"settingApiName":"Sample_Search_Setting","searchObjects":[{"objectApiName":"Account","parentApiName":"ParentId"},{"objectApiName":"Bill__c","parentApiName":"Account__c"}],"searchFields":[{"fieldApiName":"Name","value":"Test","sequence":0},{"fieldApiName":"Phone","value":"123","sequence":1}]}';
        String result = SearchComponentSettingController.searchObjectsWithFields(searchDataStr);
        Test.stopTest();

        List<SearchComponentSettingController.ResultData> data = (List<SearchComponentSettingController.ResultData>)JSON.deserialize(result, List<SearchComponentSettingController.ResultData>.class);
        System.assertEquals(1, data.size(), 'should have 1 ResultData');
        System.assertEquals('ParentId', data[0].parentApiName, 'should parentApiName be ParentId');
        System.assertEquals('Account', data[0].sobjectType, 'should sobjectType be Account');
        System.assertEquals(0, data[0].records.size(), 'should have 0 search result');
    }
}
