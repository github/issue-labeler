import * as core from '@actions/core';
import * as github from '@actions/github';
import * as yaml from 'js-yaml';

async function run() {
  try {
    // Configuration parameters
    const token = core.getInput('repo-token', { required: true });
    const configPath = core.getInput('configuration-path', { required: true });

    const issue_number = getIssueNumber();
    const issue_body = getIssueBody();

    if (!issue_number || !issue_body) {
      console.log('Could not get issue number or issue body from context, exiting');
      return;
    }

    // A client to load data from GitHub
    const client = new github.GitHub(token);
    client.issues.removeLabels
    // Load the existing labels the issue has
    const labels = getLabels(client, issue_number)

    // Load our regex rules from the configuration path
    const labelGlobs: Map<string, string[]> = await getLabelGlobs(
      client,
      configPath
    );

    const addLabel: string[] = []
    const removeLabelItems: string[] = []

    for (const [label, globs] of labelGlobs.entries()) {
      console.debug(`processing ${label}`);
      console.debug(`for globs ${globs[0]}`);
      if (checkGlobs(issue_body, globs)) {
        console.log(`Queue label for addition: ${label}` )
        addLabel.push(label)
      }
      else
      {
        removeLabelItems.push(label)
      }
    }
    if(addLabel.length > 0)
    {
      console.log(`Adding labels ${ addLabel.toString() } to issue #${ issue_number }`)
      addLabels(client, issue_number, addLabel)
    }

    removeLabelItems.forEach(function (label, index) {
      console.log(`Removing label ${label } from issue #${ issue_number }`)
      removeLabel(client, issue_number, label)
    });
  } catch (error) {
    core.error(error);
    core.setFailed(error.message);
  }
}

function getIssueNumber(): number | undefined {
  const issue = github.context.payload.issue;
  if (!issue) {
    return;
  }

  return issue.number;
}

function getIssueBody(): string | undefined {
  const issue = github.context.payload.issue;
  if (!issue) {
    return;
  }

  return issue.body;
}

async function getLabelGlobs(
  client: github.GitHub,
  configurationPath: string
): Promise<Map<string, string[]>> {
  const configurationContent: string = await fetchContent(
    client,
    configurationPath
  );

  // loads (hopefully) a `{[label:string]: string | string[]}`, but is `any`:
  const configObject: any = yaml.safeLoad(configurationContent);

  // transform `any` => `Map<string,string[]>` or throw if yaml is malformed:
  return getLabelGlobMapFromObject(configObject);
}

// Load the configuration file
async function fetchContent(
  client: github.GitHub,
  repoPath: string
): Promise<string> {
  const response = await client.repos.getContents({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    path: repoPath,
    ref: github.context.sha
  });

  const data: any = response.data
  if (!data.content) {
    console.log('The configuration path provided is not a valid file. Exiting')
    process.exit(1);
  }
  return Buffer.from(data.content, 'base64').toString('utf8');
}

function getLabelGlobMapFromObject(configObject: any): Map<string, string[]> {
  const labelGlobs: Map<string, string[]> = new Map();
  for (const label in configObject) {
    if (typeof configObject[label] === 'string') {
      labelGlobs.set(label, [configObject[label]]);
    } else if (Array.isArray(configObject[label])) {
      labelGlobs.set(label, configObject[label]);
    } else {
      throw Error(
        `found unexpected type for label ${label} (should be string or array of globs)`
      );
    }
  }

  return labelGlobs;
}

function checkGlobs(issue_body: string, globs: string[]): boolean {
  console.log(issue_body)

  // If several regex entries are provided we require all of them to match for the label to be applied.
  for (const glob of globs) {
    console.log(` checking pattern ${glob}`);
    const found = issue_body.match(glob)
    if (!found)
    {
      console.log(`Didn't find pattern`)
      return false;
    }
    console.log(`Found patterns ${found}`)
  }
  return true;
}


async function getLabels(
  client: github.GitHub,
  issue_number: number,
): Promise<string[]> {
  const response = await client.issues.listLabelsOnIssue({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issue_number,
  });
  const data = response.data
  if (response.status != 200) {
    console.log('Unable to load labels. Exiting...')
    process.exit(1);
  }
  const labels: string[] = [];
  console.log(data)
  for (let i = 0; i < Object.keys(data).length; i++) {
    console.log(`label is ${data[i].name}`)
    labels.push(data[i].name)
  }
  console.log("done")
  return labels;
}

async function addLabels(
  client: github.GitHub,
  issue_number: number,
  labels: string[]
) {
  await client.issues.addLabels({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issue_number,
    labels: labels
  });
}

async function removeLabel(
  client: github.GitHub,
  issue_number: number,
  name: string
) {
  await client.issues.removeLabel({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    issue_number: issue_number,
    name: name
  });
}

run();