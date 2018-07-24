import * as $ from 'jquery';

$('#button').get(0).onclick = saveToken;

chrome.storage.local.get('token', items => {
  let token = items.token as string;
  if (token) {
    $('#token').val(token);
  }
});

function saveToken() {
  let token = $('#token').val() as string;
  chrome.storage.local.set({
    token: token
  }, () => {
    window.close();
  });
}
