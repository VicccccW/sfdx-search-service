import { LightningElement, api } from "lwc";

export default class SearchResultModal extends LightningElement {
  @api displayColumns;
  @api resultData;

  isModalOpen = false;
  _isLoading = false;

  @api
  get isLoading() {
    return this._isLoading;
  }

  set isLoading(value) {
    this._isLoading = value;
  }

  @api
  openModal() {
    this._isLoading = true;
    this.isModalOpen = true;
  }

  closeModalHandler() {
    this.isModalOpen = false;
  }
}
