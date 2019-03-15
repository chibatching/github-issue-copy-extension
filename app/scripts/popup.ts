import * as Octokit from '@octokit/rest';
import * as $ from 'jquery';
import {MDCTextField} from '@material/textfield';
import {MDCTopAppBar} from '@material/top-app-bar';
import {MDCRipple} from '@material/ripple';
import {MDCFormField} from '@material/form-field';
import {MDCCheckbox} from '@material/checkbox';
import {UsersGetByUsernameResponse} from '@octokit/rest';

const octokit = new Octokit({
  auth() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get('token', items => {
        const token = items.token as string;
        if (token) {
          resolve(`token ${token}`);
        } else {
          chrome.runtime.openOptionsPage();
          reject();
        }
      });
    });
  }
});
let originalIssue: Issue;

$('#button').get(0).onclick = createIssue;

MDCTopAppBar.attachTo(document.querySelector('.mdc-top-app-bar')!);
MDCRipple.attachTo(document.querySelector('.mdc-button')!);

const repoField = MDCTextField.attachTo(document.querySelector('#repository')!);
const addReferenceCheckbox = MDCCheckbox.attachTo(document.querySelector('#add_reference')!);
MDCFormField.attachTo(document.querySelector('#add_reference_field')!).input = addReferenceCheckbox;
const copyDescriptionCheckbox = MDCCheckbox.attachTo(document.querySelector('#copy_description')!);
MDCFormField.attachTo(document.querySelector('#copy_description_field')!).input = copyDescriptionCheckbox;
const assingSelfCheckbox = MDCCheckbox.attachTo(document.querySelector('#self_assign')!);
MDCFormField.attachTo(document.querySelector('#self_assign_field')!).input = assingSelfCheckbox;

chrome.storage.local.get('form', (items => {
  let form = items.form as FormSettings;
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
}, (tabs) => {
  let tabUrl = tabs[0].url;
  if (tabUrl === undefined) {
    return;
  }
  let matches = tabUrl.match(/.+:\/\/github.com\/(.+?)\/(.+?)\/issues\/(\d+)/);
  if (matches) {
    const owner: string = matches[1];
    const repo: string = matches[2];
    const issueNumber: number = Number(matches[3]);
    getIssue(owner, repo, issueNumber).then((issue) => {
      originalIssue = issue;
      $('#title').text(originalIssue.title);
      $('#form_block').removeAttr('hidden');
    });
  }
});

function getIssue(owner: string, repo: string, issueNumber: number): Promise<Issue> {
  return octokit.issues.get({
    number: issueNumber,
    owner: owner,
    repo: repo
  }).then(({data, headers, status}) => {
    return data as Issue;
  });
}

async function createIssue() {
  const formSetting = new FormSettings(
    repoField.value,
    addReferenceCheckbox.checked,
    copyDescriptionCheckbox.checked,
    assingSelfCheckbox.checked
  );

  let body = '';
  if (formSetting.addReference) {
    body += `ref: ${originalIssue.html_url}\n\n`;
  }
  if (formSetting.copyDescription) {
    body += originalIssue.body;
  }
  let assignee: string[] | undefined = undefined;
  if (formSetting.assignSelf) {
    assignee = [((await octokit.users.getAuthenticated()).data as UsersGetByUsernameResponse).login];
  }

  chrome.storage.local.set({
    form: formSetting
  });

  let repo = formSetting.repo.split('/');

  try {
    const response = await octokit.issues.create({
      title: originalIssue.title,
      owner: repo[0],
      repo: repo[1],
      body: body,
      assignees: assignee
    });
    window.open(response.data.html_url);
  } catch (e) {
    console.error(e);
  }
}

interface Issue {
  number: number;
  title: string;
  body: string;
  html_url: string;
}

class FormSettings {
  repo: string;
  addReference: boolean;
  copyDescription: boolean;
  assignSelf: boolean;

  constructor(repo: string, addReference: boolean, copyDescription: boolean, assignSelf: boolean) {
    this.repo = repo;
    this.addReference = addReference;
    this.copyDescription = copyDescription;
    this.assignSelf = assignSelf;
  }
}
