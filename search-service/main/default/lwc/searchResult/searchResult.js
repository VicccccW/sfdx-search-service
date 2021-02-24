import { LightningElement, api, track, wire } from "lwc";
import buildSearchObjects from "@salesforce/apex/SearchComponentSettingController.buildSearchObjects";
import buildDisplayFields from "@salesforce/apex/SearchComponentSettingController.buildDisplayFields";
import searchObjectsWithFields from "@salesforce/apex/SearchComponentSettingController.searchObjectsWithFields";
export default class SearchResult extends LightningElement {
  @api displayInModal;
  @api settingApiName;

  @track resultData;
  @track error;

  isNewSearch = true;
  currentSearchStr = undefined;
  displayColumns;
  searchObjects;
  _searchDataStr = undefined;

  @api
  get searchDataStr() {
    return this._searchDataStr;
  }

  set searchDataStr(value) {
    if (value !== this.currentSearchStr) {
      // if new value passed from parent is different from existing one, this is a new search string
      // set the _searchDataStr to trigger the wire service to reload the data from server
      this.isNewSearch = true;
      this._searchDataStr = value;
    } else {
      this.isNewSearch = false;
    }
  }

  // lifecycle methods

  async connectedCallback() {
    Promise.all([
      buildSearchObjects({
        settingAPIName: this.settingApiName
      }),
      buildDisplayFields({
        settingAPIName: this.settingApiName
      })
    ])
      .then((data) => {
        const [objects, fields] = data;
        this.searchObjects = objects;
        this.displayColumns = this.buildDisplayColumns(fields);
        this.error = undefined;
      })
      .catch((error) => {
        this.error = error;
      });

    // if (fields.length === 0) {
    //   throw new Error(
    //     "Display Setting has no fields available, contact system admin."
    //   );
    // }
  }

  @wire(searchObjectsWithFields, { searchDataStr: "$_searchDataStr" })
  wiredResultData({ error, data }) {
    // when first rendered, exit
    if (!this._searchDataStr) {
      return;
    }

    if (data) {
      const resultArray = this.buildResultArray(data, this.searchObjects);

      this.resultData = this.buildResultHierarchy(resultArray);

      // this.resultData = JSON.stringify(resultHierarchy);
    } else if (error) {
      console.log("has error");
      console.log(error);
      //TODO: display error in either the modal or in the table
    }

    // store this new _searchDataStr as currentSearchStr
    this.currentSearchStr = this._searchDataStr;

    // stop child cmp loading to display the resultData
    if (this.displayInModal) {
      this.template.querySelector("c-search-result-modal").isLoading = false;
    } else {
      this.template.querySelector("c-search-result-table").isLoading = false;
    }
  }

  clickHandler() {
    // notify parent and generate latest search str
    this.dispatchEvent(new CustomEvent("search"));
  }

  @api
  searchHandler() {
    // first call open the child modal / table anyway
    if (this.displayInModal) {
      const modalCmp = this.template.querySelector("c-search-result-modal");

      // call child to open the modal and start loading
      modalCmp.openModal();

      // if this is not a new serach, stop child loading to display the resultData
      if (!this.isNewSearch) {
        modalCmp.isLoading = false;
      }
    } else {
      const tableCmp = this.template.querySelector("c-search-result-table");

      // call child to open the card and start loading
      tableCmp.openTable();

      // if this is not a new serach, stop child loading to display the resultData
      if (!this.isNewSearch) {
        tableCmp.isLoading = false;
      }
    }
  }

  buildDisplayColumns(fields) {
    return fields
      .map((item) => {
        let column = {
          type: item.Field_Type__c,
          fieldName: item.Field_API_Name__c,
          label: item.Field_Label__c,
          order: item.Display_Order__c
        };

        // dynamic calculate the first column display icon
        if (item.Display_Order__c === 1) {
          column = {
            ...column,
            type: "url",
            fieldName: "recordUrl",
            typeAttributes: {
              label: { fieldName: item.Field_API_Name__c }
            },
            cellAttributes: {
              iconName: { fieldName: "displayIcon" }
            }
          };
        }

        return column;
      })
      .sort(this.sortByOrder);
  }

  buildResultArray(data, objectSettings) {
    const dataArray = JSON.parse(data);

    const resultArray = dataArray.reduce(
      (acc, { records, parentApiName, sobjectType }) => {
        const displayIcon = objectSettings.find(
          (setting) => setting.SObject_API_Name__c === sobjectType
        ).Display_Icon__c;

        // loop each sobject records[] in the server returned data array
        const formatedRecords = records.map((obj) => {
          obj.displayIcon = displayIcon;
          obj.recordUrl = "/" + obj.Id;

          delete obj.attributes;

          const objStr = JSON.stringify(obj).replaceAll(
            parentApiName,
            "ParentId"
          );

          return JSON.parse(objStr);
        });

        return [...acc, ...formatedRecords];
      },
      []
    );

    return resultArray;
  }

  buildResultHierarchy(dataArr) {
    // first get top level parents
    const dataHierarchy = this.getTopLevelParents(dataArr);

    // second build up hierarchy
    this.transform(dataHierarchy, dataArr);

    return dataHierarchy;
  }

  getTopLevelParents(dataArr) {
    return dataArr.reduce((acc, cur, index, arr) => {
      const parent = this.getParent(acc, cur, arr);

      // if this id is not in the acc arr yet, put it in
      if (parent && acc.indexOf(parent) === -1) {
        return [...acc, parent].sort();
      }

      return acc;
    }, []);
  }

  getParent(acc, cur, arr) {
    if (!cur) {
      return undefined;
    }

    // if a) record does not have ParentId property
    // or b) parentId is not in arr,
    // this is a top level parent, put in the acc arr
    if (!("ParentId" in cur) || !arr.find((item) => item.Id === cur.ParentId)) {
      return cur;
    }

    const parent = arr.find((item) => item.Id === cur.ParentId);

    return this.getParent(acc, parent, arr);
  }

  transform(parents, dataArr) {
    parents.forEach((parent) => {
      const children = dataArr.filter(
        (record) => record.ParentId === parent.Id
      );

      if (children.length > 0) {
        parent._children = children;

        this.transform(children, dataArr);
      }
    });
  }

  sortByOrder = (a, b) => (a.order < b.order ? -1 : a.order > b.order ? 1 : 0);
}
