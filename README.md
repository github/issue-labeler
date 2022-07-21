# Issue Labeler

Issue labeler will label issues based on the body content of the issue.

## Usage

### Create `.github/labeler.yml`

Create a `.github/labeler.yml` file with a list of labels and regex to match to apply the label.

The key is the name of the label in your repository that you want to add (eg: "merge conflict", "needs-updating") and the value is the regular expression for when to apply the label. Should the regular expression not match, the label will be removed.

#### Basic Examples

```yml
# Add/remove 'critical' label if issue contains the words 'urgent' or 'critical'
critical:
    - '(critical|urgent)'
```

### Create Workflow

Create a workflow (eg: `.github/workflows/labeler.yml` see [Creating a Workflow file](https://help.github.com/en/articles/configuring-a-workflow#creating-a-workflow-file)) to utilize the labeler action with content:

```
name: "Issue Labeler"
on:
  issues:
    types: [opened, edited]

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
    - uses: github/issue-labeler@v2.5 #May not be the latest version
      with:
        repo-token: "${{ secrets.GITHUB_TOKEN }}"
        configuration-path: .github/labeler.yml
        not-before: 2020-01-15T02:54:32Z
        enable-versioned-regex: 0
```

`not-before` is optional and will result in any issues prior to this timestamp to be ignored.

_Note: The above workflow grants access to the `GITHUB_TOKEN` so the action can make calls to GitHub's REST API._


### Example using versioned issue templates

As you iterate on your regular expressions, since maybe your issue template gets updated, this can have an impact on existing issues. The below allows you to version your regular expression definitions and pair them with issue templates.

Below is the body of an example issue which has the version identifier `issue_labeler_regex_version` embedded.

```
<!--
issue_labeler_regex_version=1
--!>

I have an urgent issue that requires someone's attention.
```

Below is the workflow file

```
name: "Issue Labeler"
on:
  issues:
    types: [opened, edited]

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
    - uses: github/issue-labeler@v2.5 #May not be the latest version
      with:
        repo-token: "${{ secrets.GITHUB_TOKEN }}"
        configuration-path: .github/labeler.yml
        not-before: 2020-01-15T02:54:32Z
        enable-versioned-regex: 1
        versioned-regex: 'issue_labeler_regex_version=(\d+)'
        body-missing-regex-label: 'broken-template'
```

When the issue is evaluated it'll look for `.github/labeler-v1.yml` based on the `configuration-path` and the version number set in the issue.

When you reach a point where you'd like to update your labels and regular expressions and it could cause a conflict with historic issues, simply update your issue template to include `issue_labeler_regex_version=2` and create the file `.github/labeler-v2.yml`. The issue will automatically be matched to the correct set of regular expressions.

Set `versioned-regex` to any valid regular expression that should be used to capture the version number from the issue. The first match will be used should multiple be found.

Set `body-missing-regex-label` to the name of the label that should be added to an issue where the specified `version-regex` can't be found. This is useful for when your users accidentally delete this value. Leave this blank if you don't want to use this functionality.

### Pull request support

The labeler action is also available for pull requests. Make sure the workflow is triggered by pull requests.

```
on:
  pull_request:
    types: [opened, edited]
```

### Example including the issue title in the regex target

Set `include-title` to `1` to include the issue title in addition to the body in the regular expression target.

```
name: "Issue Labeler"
on:
  issues:
    types: [opened, edited]

jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
    - uses: github/issue-labeler@v2.5 #May not be the latest version
      with:
        repo-token: "${{ secrets.GITHUB_TOKEN }}"
        configuration-path: .github/labeler.yml
        enable-versioned-regex: 0
        include-title: 1
```

### Syncing Labels

By default, labels that no longer match are removed from the issue. To disable this functionality, explicity
set `sync-labels` to `0`.

```
jobs:
  triage:
    runs-on: ubuntu-latest
    steps:
    - uses: github/issue-labeler@v2.0
      with:
        repo-token: "${{ secrets.GITHUB_TOKEN }}"
        configuration-path: .github/labeler.yml
        enable-versioned-regex: 0
        sync-labels: 0
```