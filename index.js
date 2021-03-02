/*
 * MIT License
 *
 * Copyright (c) 2021 Kirill Che.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

// main initialize GitHub actions core API and GitHub API
// to start action func with specified dependencies.
// Reports action failure on error.
function main() {
  try {
    new Action(
      require('fs'),
      require('@actions/github')
    ).run(require('@actions/core'));
  } catch (err) {
    core.setFailed(err.message);
  }
}

function Action(fs, github) {
  this.fs = fs;
  this.github = github;

  this.run = function (core) {
    const evt = process.env.GITHUB_EVENT_NAME;
    if (evt !== 'pull_request') {
      this.core.error(`Unexpected event '${evt}' - only 'pull_request' is supported`);
      this.core.setFailed('Unexpected workflow event');
      return;
    }

    const payload = JSON.parse(this.fs.readFileSync(
        process.env.GITHUB_EVENT_PATH, 'utf8'));
    if (payload.action !== 'opened') {
      this.core.error(`Unexpected event action '${payload.action}' - only 'opened' is supported`);
      this.core.setFailed('Unexpected workflow event action');
    }
    const repostring = process.env.GITHUB_REPOSITORY;
    const repo = repository[0];
    const owner = repository[1];
    const pull_number = payload.number;

    const octokit = this.github.getOctokit(core.getInput('token'));

    const rev = core.getInput('reviewers').split(',');
    if (rev !== '') {
      const logins = [];
      const teams = [];
      rev.forEach(r => {
        if (r.startsWith('@')) {
          teams.push(r);
        } else {
          logins.push(r);
        }
      });
      octokit.pulls.requestReviewers({
        owner,
        repo,
        pull_number,
        reviewers: logins,
        team_reviewers: teams
      });
      core.info(`Reviewers ${reviewers} successfully added to ticket ${pull_number}`);
    }
    const assignees = core.getInput('assignees').split(',');
    if (assignees !== '') {
      octokit.issues.addAssignees({
        owner,
        repo,
        issue_number: pull_number,
        assignees
      });
      core.info(`Assignees ${assignees} successfully added to ticket ${pull_number}`);
    }
    const labels = core.getInput('labels').split(',');
    if (labels !== '') {
      octokit.issues.addLabels({
        owner,
        repo,
        issue_number: pull_number,
        labels,
      });
      core.info(`Labels ${labels} successfully added to ticket ${pull_number}`);
    }
  }
}

main();
