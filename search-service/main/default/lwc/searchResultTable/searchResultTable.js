import { LightningElement, api } from "lwc";

export default class SearchResultTable extends LightningElement {
  @api displayColumns;
  @api resultData;

  isTableOpen = false;
  _isLoading = false;

  @api
  get isLoading() {
    return this._isLoading;
  }

  set isLoading(value) {
    this._isLoading = value;
  }

  @api
  openTable() {
    this._isLoading = true;
    this.isTableOpen = true;
  }

  clickHandler() {
    // open modal
    const modalCmp = this.template.querySelector("c-search-result-modal");

    modalCmp.openModal();
    modalCmp.isLoading = false;
  }
}
