"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const yaml = __importStar(require("js-yaml"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Configuration parameters
            var configPath = core.getInput('configuration-path', { required: true });
            const token = core.getInput('repo-token', { required: true });
            const enableVersionedRegex = parseInt(core.getInput('enable-versioned-regex', { required: true }));
            const versionedRegex = new RegExp(core.getInput('versioned-regex', { required: false }));
            const notBefore = Date.parse(core.getInput('not-before', { required: false }));
            const bodyMissingRegexLabel = core.getInput('body-missing-regex-label', { required: false });
            const includeTitle = parseInt(core.getInput('include-title', { required: false }));
            const syncLabels = parseInt(core.getInput('sync-labels', { required: false }));
            const issue_number = getIssueOrPullRequestNumber();
            if (issue_number === undefined) {
                console.log('Could not get issue or pull request number from context, exiting');
                return;
            }
            const issue_body = getIssueOrPullRequestBody();
            if (issue_body === undefined) {
                console.log('Could not get issue or pull request body from context, exiting');
                return;
            }
            const issue_title = getIssueOrPullRequestTitle();
            if (issue_title === undefined) {
                console.log('Could not get issue or pull request title from context, exiting');
                return;
            }
            // A client to load data from GitHub
            const client = new github.GitHub(token);
            const addLabel = [];
            const removeLabelItems = [];
            if (enableVersionedRegex == 1) {
                const regexVersion = versionedRegex.exec(issue_body);
                if (!regexVersion || !regexVersion[1]) {
                    if (bodyMissingRegexLabel) {
                        addLabels(client, issue_number, [bodyMissingRegexLabel]);
                    }
                    console.log(`Issue #${issue_number} does not contain regex version in the body of the issue, exiting.`);
                    return 0;
                }
                else {
                    if (bodyMissingRegexLabel) {
                        removeLabelItems.push(bodyMissingRegexLabel);
                    }
                }
                configPath = regexifyConfigPath(configPath, regexVersion[1]);
            }
            // If the notBefore parameter has been set to a valid timestamp, exit if the current issue was created before notBefore
            if (notBefore) {
                const issue = client.issues.get({
                    owner: github.context.repo.owner,
                    repo: github.context.repo.repo,
                    issue_number: issue_number,
                });
                const issueCreatedAt = Date.parse((yield issue).data.created_at);
                if (issueCreatedAt < notBefore) {
                    console.log("Issue is before `notBefore` configuration parameter. Exiting...");
                    process.exit(0);
                }
            }
            // Load our regex rules from the configuration path
            const labelRegexes = yield getLabelRegexes(client, configPath);
            let issueContent = "";
            if (includeTitle === 1) {
                issueContent += `${issue_title}\n\n`;
            }
            issueContent += issue_body;
            for (const [label, globs] of labelRegexes.entries()) {
                if (checkRegexes(issueContent, globs)) {
                    addLabel.push(label);
                }
                else {
                    removeLabelItems.push(label);
                }
            }
            if (addLabel.length > 0) {
                console.log(`Adding labels ${addLabel.toString()} to issue #${issue_number}`);
                addLabels(client, issue_number, addLabel);
            }
            if (syncLabels) {
                removeLabelItems.forEach(function (label, index) {
                    console.log(`Removing label ${label} from issue #${issue_number}`);
                    removeLabel(client, issue_number, label);
                });
            }
        }
        catch (error) {
            core.error(error);
            core.setFailed(error.message);
        }
    });
}
function getIssueOrPullRequestNumber() {
    const issue = github.context.payload.issue;
    if (issue) {
        return issue.number;
    }
    const pull_request = github.context.payload.pull_request;
    if (pull_request) {
        return pull_request.number;
    }
    return;
}
function getIssueOrPullRequestBody() {
    const issue = github.context.payload.issue;
    if (issue) {
        return issue.body;
    }
    const pull_request = github.context.payload.pull_request;
    if (pull_request) {
        return pull_request.body;
    }
    return;
}
function getIssueOrPullRequestTitle() {
    const issue = github.context.payload.issue;
    if (issue) {
        return issue.title;
    }
    const pull_request = github.context.payload.pull_request;
    if (pull_request) {
        return pull_request.title;
    }
    return;
}
function regexifyConfigPath(configPath, version) {
    var lastIndex = configPath.lastIndexOf('.');
    return `${configPath.substring(0, lastIndex)}-v${version}.yml`;
}
function getLabelRegexes(client, configurationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const configurationContent = yield fetchContent(client, configurationPath);
        // loads (hopefully) a `{[label:string]: string | string[]}`, but is `any`:
        const configObject = yaml.safeLoad(configurationContent);
        // transform `any` => `Map<string,string[]>` or throw if yaml is malformed:
        return getLabelRegexesMapFromObject(configObject);
    });
}
// Load the configuration file
function fetchContent(client, repoPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield client.repos.getContents({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            path: repoPath,
            ref: github.context.sha
        });
        const data = response.data;
        if (!data.content) {
            console.log('The configuration path provided is not a valid file. Exiting');
            process.exit(1);
        }
        return Buffer.from(data.content, 'base64').toString('utf8');
    });
}
function getLabelRegexesMapFromObject(configObject) {
    const labelRegexes = new Map();
    for (const label in configObject) {
        if (typeof configObject[label] === 'string') {
            labelRegexes.set(label, [configObject[label]]);
        }
        else if (Array.isArray(configObject[label])) {
            labelRegexes.set(label, configObject[label]);
        }
        else {
            throw Error(`found unexpected type for label ${label} (should be string or array of regex)`);
        }
    }
    return labelRegexes;
}
function checkRegexes(issue_body, regexes) {
    var found;
    // If several regex entries are provided we require all of them to match for the label to be applied.
    for (const regEx of regexes) {
        const isRegEx = regEx.match(/^\/(.+)\/(.*)$/);
        if (isRegEx) {
            found = issue_body.match(new RegExp(isRegEx[1], isRegEx[2]));
        }
        else {
            found = issue_body.match(regEx);
        }
        if (!found) {
            return false;
        }
    }
    return true;
}
function getLabels(client, issue_number) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield client.issues.listLabelsOnIssue({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: issue_number,
        });
        const data = response.data;
        if (response.status != 200) {
            console.log('Unable to load labels. Exiting...');
            process.exit(1);
        }
        const labels = [];
        for (let i = 0; i < Object.keys(data).length; i++) {
            labels.push(data[i].name);
        }
        return labels;
    });
}
function addLabels(client, issue_number, labels) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.issues.addLabels({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: issue_number,
            labels: labels
        });
    });
}
function removeLabel(client, issue_number, name) {
    return __awaiter(this, void 0, void 0, function* () {
        yield client.issues.removeLabel({
            owner: github.context.repo.owner,
            repo: github.context.repo.repo,
            issue_number: issue_number,
            name: name
        });
    });
}
run();
