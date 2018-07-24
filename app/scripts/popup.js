Object.defineProperty(exports, "__esModule", { value: true });
var Octokit = require("@octokit/rest");
var $ = require("jquery");
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
chrome.storage.local.get('form', (function (items) {
    var form = items.form;
    if (form) {
        $('#owner').val(form.owner);
        $('#repository').val(form.repo);
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
    var formSetting = new FormSettings($('#owner').val(), $('#repository').val(), $('#add_reference').prop('checked'), $('#copy_description').prop('checked'));
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
    octokit.issues.create({
        title: originalIssue.title,
        owner: formSetting.owner,
        repo: formSetting.repo,
        body: body
    }).then(function (_a) {
        var data = _a.data, headers = _a.headers, status = _a.status;
        window.open(data.html_url);
    });
}
var FormSettings = /** @class */ (function () {
    function FormSettings(owner, repo, addReference, copyDescription) {
        this.owner = owner;
        this.repo = repo;
        this.addReference = addReference;
        this.copyDescription = copyDescription;
    }
    return FormSettings;
}());
