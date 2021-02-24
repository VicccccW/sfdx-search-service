import { LightningElement, api } from "lwc";
export default class SearchResultData extends LightningElement {
  @api resultData;

  _columns;
  keyField;

  @api
  get columns() {
    return this._columns;
  }

  set columns(value) {
    this._columns = value;
    this.keyField = this._columns[0].fieldName;
  }

  get hasResultData() {
    return this.resultData && this.resultData.length !== 0;
  }

  renderedCallback() {
    const gridCmp = this.template.querySelector("lightning-tree-grid");

    if (gridCmp) {
      gridCmp.expandAll();
    }
  }
}
