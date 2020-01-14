# Issue Labeler

Issue labeler will label issues based on the body content of the issue.

## Usage

### Create `.github/labeler.yml`

Create a `.github/labeler.yml` file with a list of labels and regex to match to apply the label.

The key is the name of the label in your repository that you want to add (eg: "merge conflict", "needs-updating") and the value is the regular expression for when to apply the label. Should the regular expression not match, the label will be removed.

#### Basic Examples

```yml
# Add/remove 'critical' label if issue contains the words 'urgent' or 'critical'
impact:external:
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
    - uses: github/issue-labeler@v1
      with:
        repo-token: "${{ secrets.GITHUB_TOKEN }}"
        configuration-path: .github/labeler.yml
```

_Note: This grants access to the `GITHUB_TOKEN` so the action can make calls to GitHub's rest API_
