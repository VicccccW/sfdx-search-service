import { LightningElement, api } from "lwc";
export default class SearchBarField extends LightningElement {
  @api options;
  @api searchField;
  @api searchValue;
  @api sequence;

  get sequenceNotZero() {
    return this.sequence !== 0;
  }

  fieldChangeHandler(event) {
    const changeEvent = new CustomEvent("fieldchange", {
      detail: {
        value: event.target.value,
        sequence: this.sequence
      }
    });

    this.dispatchEvent(changeEvent);
  }

  deleteHandler() {
    const deleteEvent = new CustomEvent("fielddelete", {
      detail: {
        sequence: this.sequence
      }
    });

    this.dispatchEvent(deleteEvent);
  }

  valueChangeHandler(event) {
    const validity = event.target.checkValidity();

    if (validity) {
      const changeEvent = new CustomEvent("valuechange", {
        detail: {
          value: event.target.value,
          sequence: this.sequence
        }
      });

      this.dispatchEvent(changeEvent);
    }
  }

  @api
  invalidateSearchField() {
    const el = this.template.querySelector("lightning-combobox");
    el.setCustomValidity("Field has been selected, change to a new one.");
    el.reportValidity();
  }

  @api
  validateSearchField() {
    const el = this.template.querySelector("lightning-combobox");
    el.setCustomValidity("");
    el.reportValidity();
  }

  @api
  validateFields() {
    let validInput = true;

    this.template
      .querySelectorAll(`*[data-field-sequence="${this.sequence}"]`)
      .forEach((el) => {
        el.reportValidity();
        validInput = validInput && el.validity.valid;
      });

    return validInput;
  }
}
