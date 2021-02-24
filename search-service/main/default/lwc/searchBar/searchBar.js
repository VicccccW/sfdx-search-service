import { LightningElement, api, track } from "lwc";
import buildSearchFields from "@salesforce/apex/SearchComponentSettingController.buildSearchFields";
import buildSearchObjects from "@salesforce/apex/SearchComponentSettingController.buildSearchObjects";
export default class SearchBar extends LightningElement {
  @api settingApiName;
  @api displayResultInModal;

  @track searchDataStr = undefined;
  @track searchObjects = [];
  @track searchFields = [];
  @track error = undefined;

  settingLoaded = false;
  alertObjectSelection = false;
  searchData = undefined;
  fieldOptions = [];
  objectOptions = [];

  // lifecycle method

  connectedCallback() {
    if (!this.settingLoaded) {
      Promise.all([this.getSearchObjects(), this.getSearchFields()])
        .then((data) => {
          const [objects, fields] = data;

          this.objectOptions = this.buildObjectOptions(objects);
          this.fieldOptions = this.buildFieldOptions(fields);
          this.searchFields = [{ fieldApiName: "", value: "", sequence: 0 }];
          this.settingLoaded = true;
          this.error = undefined;
        })
        .catch((error) => {
          this.objectOptions = [];
          this.fieldOptions = [];
          this.error = error;
        });
    }
  }

  disconnectedCallback() {
    this.settingLoaded = false;
  }

  get hasSetting() {
    return (
      this.objectOptions &&
      this.objectOptions.length > 0 &&
      this.fieldOptions &&
      this.fieldOptions.length > 0
    );
  }

  get hasSearchFields() {
    return this.searchFields.length > 0;
  }

  get allowAddField() {
    return this.searchFields.length < this.fieldOptions.length;
  }

  // handler methods

  objectChangeHandler(event) {
    if (event.detail.selected) {
      this.searchObjects = this.addsearchObjects(event.detail.object);
    } else if (!event.detail.selected) {
      this.searchObjects = this.searchObjects.filter(
        (obj) => obj.objectApiName !== event.detail.object
      );
    }

    // if no searchObject, display error
    this.alertObjectSelection = this.searchObjects.length === 0 ? true : false;
  }

  fieldChangeHandler(event) {
    // first put the new field in searchFields[]
    this.searchFields = this.addsearchFields("fieldApiName", event.detail);

    // second check if newly added one has conflicts with existing search fields
    const fieldValidity = this.validateSearchField(event.detail);
    // console.log('fieldValidity', fieldValidity);

    // third if invalid new field, call child cmp method custom validity
    if (!fieldValidity) {
      this.template
        .querySelector(
          `c-search-bar-field[data-sequence="${event.detail.sequence}"]`
        )
        .invalidateSearchField();
    } else {
      this.template
        .querySelector(
          `c-search-bar-field[data-sequence="${event.detail.sequence}"]`
        )
        .validateSearchField();
    }
  }

  fieldDeleteHandler(event) {
    this.searchFields = this.searchFields
      .filter((field) => field.sequence !== event.detail.sequence)
      .map((field, index) => {
        return {
          ...field,
          sequence: index
        };
      });
  }

  valueChangeHandler(event) {
    this.searchFields = this.addsearchFields("value", event.detail);
  }

  addFieldHandler() {
    this.searchFields = [
      ...this.searchFields,
      { fieldApiName: "", value: "", sequence: this.searchFields.length }
    ];
  }

  searchHandler() {
    // check validity for object selection
    if (this.searchObjects.length === 0) {
      this.alertObjectSelection = true;
      return;
    } else if (this.searchObjects.length > 0) {
      this.alertObjectSelection = false;
    }

    // check validity for each of the combobox and input field
    let validInput = true;

    this.template.querySelectorAll("c-search-bar-field").forEach((el) => {
      const valid = el.validateFields();
      validInput = validInput && valid;
    });

    if (!validInput) {
      return;
    }

    console.log("valid input and can continue build search string");
    console.log(this.searchObjects, this.searchFields);

    this.searchData = {
      ...this.searchData,
      settingApiName: this.settingApiName,
      searchObjects: this.searchObjects,
      searchFields: this.searchFields
    };

    const resultCmp = this.template.querySelector("c-search-result");

    // call child public property and decide if it is a new search str or not
    resultCmp.searchDataStr = JSON.stringify(this.searchData);

    resultCmp.searchHandler();
  }

  // helper methods

  async getSearchObjects() {
    const objects = await buildSearchObjects({
      settingAPIName: this.settingApiName
    });

    if (objects.length === 0) {
      throw new Error(
        "Search Setting has no objects available, contact system admin."
      );
    }

    return objects;
  }

  async getSearchFields() {
    const fields = await buildSearchFields({
      settingAPIName: this.settingApiName
    });

    if (fields.length === 0) {
      throw new Error(
        "Search Setting has no fields available, contact system admin."
      );
    }

    return fields;
  }

  buildObjectOptions(arr) {
    return arr.map((item) => ({
      label: item.SObject_Label__c,
      value: item.SObject_API_Name__c,
      parentApiName: item.Parent_Lookup_Field_API_Name__c
    }));
  }

  buildFieldOptions(arr) {
    return arr.map((item) => ({
      label: item.Field_Label__c,
      value: item.Field_API_Name__c
    }));
  }

  addsearchObjects(objectApiName) {
    const option = this.objectOptions.find((el) => el.value === objectApiName);

    const parentApiName = option ? option.parentApiName : "";

    return [
      ...this.searchObjects,
      { objectApiName: objectApiName, parentApiName: parentApiName }
    ];
  }

  addsearchFields(key, data) {
    return this.searchFields.map((field) => {
      if (field.sequence === data.sequence) {
        return {
          ...field,
          [key]: data.value
        };
      }

      return field;
    });
  }

  validateSearchField(data) {
    return !this.searchFields.some(
      (field) =>
        field.fieldApiName === data.value && field.sequence !== data.sequence
    );
  }
}
