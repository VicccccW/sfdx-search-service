global class BuildSearchComponentSettingList extends VisualEditor.DynamicPickList{    

    global override VisualEditor.DataRow getDefaultValue(){
        return null;
    }

    // method to return picklist value in Lightning App Builder page
    global override VisualEditor.DynamicPickListRows getValues() {

        // first check if required custom metadata and record exist

        // if no such custom metadata, return null
        Boolean isMDExists = SObjectUtil.isObjectExist(GlobalConstants.SEARCH_COMPONENT_SETTING_MD_API_NAME);
        
        if (!isMDExists) {
            return null; 
        }

        // if no custom metadata record, return null
        List<Search_Component_Setting__mdt> settingList = [SELECT Id, MasterLabel, DeveloperName FROM Search_Component_Setting__mdt];

        if (settingList.size() == 0) {
            return null;
        }

        /** 
         * if there is more than one custom metadata record, 
         * generate a VisualEditor.DynamicPickListRows and return
         */
        List<VisualEditor.DataRow> rows = new List<VisualEditor.DataRow>();
        
        for (Search_Component_Setting__mdt setting : settingList) {
            VisualEditor.DataRow row = new VisualEditor.DataRow(setting.MasterLabel, setting.DeveloperName);
            rows.add(row);
        }

        VisualEditor.DynamicPickListRows allValues = new VisualEditor.DynamicPickListRows(rows, false);

        return allValues;
    }
}