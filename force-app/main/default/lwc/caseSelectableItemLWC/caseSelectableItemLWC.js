import { LightningElement, track } from 'lwc';
import pubsub from 'omnistudio/pubsub';
import { OmniscriptBaseMixin } from 'omnistudio/omniscriptBaseMixin';
import { OmniscriptActionCommonUtil } from 'omnistudio/omniscriptActionUtils';
export default class CaseSelectableItemLWC extends OmniscriptBaseMixin(LightningElement) {
accountId;
caseList;
model;
omniJsonData;
showOS;
connectedCallback() {
// Register pubsub to listen to event from lookup component to fetch cases when a new account is selected
this._fetchCasesFromAccount = {
data: this.fetchCasesFromAccount.bind(this)
};
pubsub.register("newAccountSelected", this._fetchCasesFromAccount);
// Register pubsub to listen to event from the Flexcard component to select a case and navigate to the next step when a new case is selected
this._selectCase = {
data: this.selectCase.bind(this)
};
pubsub.register("newCaseSelected", this._selectCase);
// Register pubsub to listen to event from create case child OS to close the modal and refresh case list
this._createCaseCallback = {
data: this.createCaseCallback.bind(this)
};
pubsub.register("omniscript_action", this._createCaseCallback);
}

fetchCasesFromAccount(pubsubResult) {
// If pubsub result is not defined, default to the accountId in the data JSON
this.accountId = pubsubResult? pubsubResult.AccountId : this.omniJsonData["SelectAccountAndCase"]["SelectAccount"];
this.prefill = { "AccountId": this.accountId };
}
selectCase(evt) {
if (evt && evt.CaseId) {
this.omniApplyCallResp({"SelectedCaseId": evt.CaseId});
this.omniNextStep();
}
}
// Open Create Case Modal
openNewCaseModal() {
// this.prefill = { "AccountId": this.accountId };
this.showOS = true;
let modal = this.template.querySelector("Omnistudio-modal");
modal.openModal();
}
// Close Create Case Modal
closeNewCaseModal() {
let modal = this.template.querySelector("Omnistudio-modal");
modal.closeModal();
this.showOS = false;
}
createCaseCallback() {
// Fetch cases from account with the newly created case record
// Close Modal
this.closeNewCaseModal();
}
disconnectedCallback() {
// Unregister pubsub event on disconnect
pubsub.unregister("newAccountSelected", this._fetchCasesFromAccount);
pubsub.unregister("omniscript_action", this._createCaseCallback);
pubsub.unregister("newCaseSelected", this._createCaseCallback);
}
}