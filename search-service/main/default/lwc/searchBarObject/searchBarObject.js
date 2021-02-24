import { LightningElement, api } from "lwc";

export default class SearchBarObject extends LightningElement {
  @api label;

  @api apiName;

  isSelected = false;

  clickHandler() {
    this.isSelected = !this.isSelected;

    // dispatch an event to notify partent cmp this object isSelected changed
    const clickEvent = new CustomEvent("selectedchange", {
      detail: {
        selected: this.isSelected,
        object: this.apiName
      }
    });

    this.dispatchEvent(clickEvent);
  }
}
