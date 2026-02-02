import { LightningElement } from 'lwc';
import pubsub from 'omnistudio/pubsub';
import { OmniscriptBaseMixin } from 'omnistudio/omniscriptBaseMixin';
import OmniscriptLookup from 'omnistudio/omniscriptLookup';
export default class accountLookupLWC extends OmniscriptBaseMixin(OmniscriptLookup) {
selectOption(event) {
let attr = event.target.getAttribute('data-option-index');
const inputIndex = parseInt(attr, 10);
this.setSelected(inputIndex).then(()=> {
pubsub.fire("newAccountSelected", 'data', {"AccountId": this.lookupValue});
});
this.hideOptions();
}
}