Object.defineProperty(exports, "__esModule", { value: true });
var $ = require("jquery");
var textfield_1 = require("@material/textfield");
$('#button').get(0).onclick = saveToken;
var tokenField = textfield_1.MDCTextField.attachTo(document.querySelector('#token'));
chrome.storage.local.get('token', function (items) {
    var token = items.token;
    if (token) {
        tokenField.value = token;
    }
});
function saveToken() {
    chrome.storage.local.set({
        token: tokenField.value
    }, function () {
        window.close();
    });
}
