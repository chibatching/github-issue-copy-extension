import * as Octokit from '@octokit/rest';
import * as $ from 'jquery';
import {MDCTextField} from '@material/textfield';
import {MDCTopAppBar} from '@material/top-app-bar';
import {MDCRipple} from '@material/ripple';

const octokit = new Octokit();
let originalIssue: Issue;

chrome.storage.local.get('token', items => {
  let token = items.token as string;
  if (token) {
    octokit.authenticate({
      type: 'token',
      token: token
    });
  } else {
    chrome.runtime.openOptionsPage();
  }
});

$('#button').get(0).onclick = createIssue;

MDCTopAppBar.attachTo(document.querySelector('.mdc-top-app-bar')!);
MDCRipple.attachTo(document.querySelector('.mdc-button')!);
const repoField = MDCTextField.attachTo(document.querySelector('#repository')!);

chrome.storage.local.get('form', (items => {
  let form = items.form as FormSettings;
  if (form) {
    repoField.value = form.repo;
    $('#add_reference').prop('checked', form.addReference);
    $('#copy_description').prop('checked', form.copyDescription);
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

function createIssue() {
  const formSetting = new FormSettings(
    repoField.value,
    $('#add_reference').prop('checked'),
    $('#copy_description').prop('checked')
  );

  let body = '';
  if (formSetting.addReference) {
    body += `ref: ${originalIssue.html_url}\n\n`;
  }
  if (formSetting.copyDescription) {
    body += originalIssue.body;
  }

  chrome.storage.local.set({
    form: formSetting
  });

  let repo = formSetting.repo.split('/');

  octokit.issues.create({
    title: originalIssue.title,
    owner: repo[0],
    repo: repo[1],
    body: body
  }).then(({data, headers, status}) => {
    window.open(data.html_url);
  });
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

  constructor(repo: string, addReference: boolean, copyDescription: boolean) {
    this.repo = repo;
    this.addReference = addReference;
    this.copyDescription = copyDescription;
  }
}
