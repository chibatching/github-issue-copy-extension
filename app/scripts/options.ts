import * as $ from 'jquery';
import {MDCTextField} from '@material/textfield';

$('#button').get(0).onclick = saveToken;

const tokenField = MDCTextField.attachTo(document.querySelector('#token')!);

chrome.storage.local.get('token', items => {
  let token = items.token as string;
  if (token) {
    tokenField.value = token;
  }
});

function saveToken() {
  chrome.storage.local.set({
    token: tokenField.value
  }, () => {
    window.close();
  });
}
