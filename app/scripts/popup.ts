import * as Octokit from '@octokit/rest';
import * as $ from 'jquery';

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

chrome.storage.local.get('form', (items => {
  let form = items.form as FormSettings;
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
    $('#owner').val(),
    $('#repository').val(),
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

  octokit.issues.create({
    title: originalIssue.title,
    owner: formSetting.owner,
    repo: formSetting.repo,
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
  owner: string;
  repo: string;
  addReference: boolean;
  copyDescription: boolean;

  constructor(owner: string, repo: string, addReference: boolean, copyDescription: boolean) {
    this.owner = owner;
    this.repo = repo;
    this.addReference = addReference;
    this.copyDescription = copyDescription;
  }
}
