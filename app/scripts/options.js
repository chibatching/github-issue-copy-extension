Object.defineProperty(exports, "__esModule", { value: true });
var $ = require("jquery");
$('#button').get(0).onclick = saveToken;
chrome.storage.local.get('token', function (items) {
    var token = items.token;
    if (token) {
        $('#token').val(token);
    }
});
function saveToken() {
    var token = $('#token').val();
    chrome.storage.local.set({
        token: token
    }, function () {
        window.close();
    });
}
