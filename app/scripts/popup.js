var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var Octokit = require("@octokit/rest");
var $ = require("jquery");
var textfield_1 = require("@material/textfield");
var top_app_bar_1 = require("@material/top-app-bar");
var ripple_1 = require("@material/ripple");
var form_field_1 = require("@material/form-field");
var checkbox_1 = require("@material/checkbox");
var octokit = new Octokit({
    auth: function () {
        return new Promise(function (resolve, reject) {
            chrome.storage.local.get('token', function (items) {
                var token = items.token;
                if (token) {
                    resolve("token " + token);
                }
                else {
                    chrome.runtime.openOptionsPage();
                    reject();
                }
            });
        });
    }
});
var originalIssue;
$('#button').get(0).onclick = createIssue;
top_app_bar_1.MDCTopAppBar.attachTo(document.querySelector('.mdc-top-app-bar'));
ripple_1.MDCRipple.attachTo(document.querySelector('.mdc-button'));
var repoField = textfield_1.MDCTextField.attachTo(document.querySelector('#repository'));
var addReferenceCheckbox = checkbox_1.MDCCheckbox.attachTo(document.querySelector('#add_reference'));
form_field_1.MDCFormField.attachTo(document.querySelector('#add_reference_field')).input = addReferenceCheckbox;
var copyDescriptionCheckbox = checkbox_1.MDCCheckbox.attachTo(document.querySelector('#copy_description'));
form_field_1.MDCFormField.attachTo(document.querySelector('#copy_description_field')).input = copyDescriptionCheckbox;
var assingSelfCheckbox = checkbox_1.MDCCheckbox.attachTo(document.querySelector('#self_assign'));
form_field_1.MDCFormField.attachTo(document.querySelector('#self_assign_field')).input = assingSelfCheckbox;
chrome.storage.local.get('form', (function (items) {
    var form = items.form;
    if (form) {
        repoField.value = form.repo;
        addReferenceCheckbox.checked = form.addReference;
        copyDescriptionCheckbox.checked = form.copyDescription;
        assingSelfCheckbox.checked = form.assignSelf;
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
    return __awaiter(this, void 0, void 0, function () {
        var formSetting, body, assignee, repo, response, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    formSetting = new FormSettings(repoField.value, addReferenceCheckbox.checked, copyDescriptionCheckbox.checked, assingSelfCheckbox.checked);
                    body = '';
                    if (formSetting.addReference) {
                        body += "ref: " + originalIssue.html_url + "\n\n";
                    }
                    if (formSetting.copyDescription) {
                        body += originalIssue.body;
                    }
                    assignee = undefined;
                    if (!formSetting.assignSelf) return [3 /*break*/, 2];
                    return [4 /*yield*/, octokit.users.getAuthenticated()];
                case 1:
                    assignee = [(_a.sent()).data.login];
                    _a.label = 2;
                case 2:
                    chrome.storage.local.set({
                        form: formSetting
                    });
                    repo = formSetting.repo.split('/');
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 5, , 6]);
                    return [4 /*yield*/, octokit.issues.create({
                            title: originalIssue.title,
                            owner: repo[0],
                            repo: repo[1],
                            body: body,
                            assignees: assignee
                        })];
                case 4:
                    response = _a.sent();
                    window.open(response.data.html_url);
                    return [3 /*break*/, 6];
                case 5:
                    e_1 = _a.sent();
                    console.error(e_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/];
            }
        });
    });
}
var FormSettings = /** @class */ (function () {
    function FormSettings(repo, addReference, copyDescription, assignSelf) {
        this.repo = repo;
        this.addReference = addReference;
        this.copyDescription = copyDescription;
        this.assignSelf = assignSelf;
    }
    return FormSettings;
}());
