Object.defineProperty(exports, "__esModule", { value: true });
var Octokit = require("@octokit/rest");
var $ = require("jquery");
var textfield_1 = require("@material/textfield");
var top_app_bar_1 = require("@material/top-app-bar");
var ripple_1 = require("@material/ripple");
var octokit = new Octokit();
var originalIssue;
chrome.storage.local.get('token', function (items) {
    var token = items.token;
    if (token) {
        octokit.authenticate({
            type: 'token',
            token: token
        });
    }
    else {
        chrome.runtime.openOptionsPage();
    }
});
$('#button').get(0).onclick = createIssue;
top_app_bar_1.MDCTopAppBar.attachTo(document.querySelector('.mdc-top-app-bar'));
ripple_1.MDCRipple.attachTo(document.querySelector('.mdc-button'));
var repoField = textfield_1.MDCTextField.attachTo(document.querySelector('#repository'));
chrome.storage.local.get('form', (function (items) {
    var form = items.form;
    if (form) {
        repoField.value = form.repo;
        $('#add_reference').prop('checked', form.addReference);
        $('#copy_description').prop('checked', form.copyDescription);
    }
}));
chrome.tabs.query({
    active: true,
    currentWindow: true
}, function (tabs) {
    var tabUrl = tabs[0].url;
    if (tabUrl === undefined) {
        return;
    }
    var matches = tabUrl.match(/.+:\/\/github.com\/(.+?)\/(.+?)\/issues\/(\d+)/);
    if (matches) {
        var owner = matches[1];
        var repo = matches[2];
        var issueNumber = Number(matches[3]);
        getIssue(owner, repo, issueNumber).then(function (issue) {
            originalIssue = issue;
            $('#title').text(originalIssue.title);
            $('#form_block').removeAttr('hidden');
        });
    }
});
function getIssue(owner, repo, issueNumber) {
    return octokit.issues.get({
        number: issueNumber,
        owner: owner,
        repo: repo
    }).then(function (_a) {
        var data = _a.data, headers = _a.headers, status = _a.status;
        return data;
    });
}
function createIssue() {
    var formSetting = new FormSettings(repoField.value, $('#add_reference').prop('checked'), $('#copy_description').prop('checked'));
    var body = '';
    if (formSetting.addReference) {
        body += "ref: " + originalIssue.html_url + "\n\n";
    }
    if (formSetting.copyDescription) {
        body += originalIssue.body;
    }
    chrome.storage.local.set({
        form: formSetting
    });
    var repo = formSetting.repo.split('/');
    octokit.issues.create({
        title: originalIssue.title,
        owner: repo[0],
        repo: repo[1],
        body: body
    }).then(function (_a) {
        var data = _a.data, headers = _a.headers, status = _a.status;
        window.open(data.html_url);
    });
}
var FormSettings = /** @class */ (function () {
    function FormSettings(repo, addReference, copyDescription) {
        this.repo = repo;
        this.addReference = addReference;
        this.copyDescription = copyDescription;
    }
    return FormSettings;
}());
