"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
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
            const issue_number = getIssueNumber();
            const issue_body = getIssueBody();
            if (!issue_number || !issue_body) {
                console.log('Could not get issue number or issue body from context, exiting');
                return;
            }
            if (enableVersionedRegex == 1) {
                const regexVersion = versionedRegex.exec(issue_body);
                if (!regexVersion || !regexVersion[1]) {
                    console.log(`Issue #${issue_number} does not contain regex version in the body of the issue, exiting.`);
                    return 0;
                }
                configPath = regexifyConfigPath(configPath, regexVersion[1]);
            }
            // A client to load data from GitHub
            const client = new github.GitHub(token);
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
            const addLabel = [];
            const removeLabelItems = [];
            for (const [label, globs] of labelRegexes.entries()) {
                if (checkRegexes(issue_body, globs)) {
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
            removeLabelItems.forEach(function (label, index) {
                console.log(`Removing label ${label} from issue #${issue_number}`);
                removeLabel(client, issue_number, label);
            });
        }
        catch (error) {
            core.error(error);
            core.setFailed(error.message);
        }
    });
}
function getIssueNumber() {
    const issue = github.context.payload.issue;
    if (!issue) {
        return;
    }
    return issue.number;
}
function getIssueBody() {
    const issue = github.context.payload.issue;
    if (!issue) {
        return;
    }
    return issue.body;
}
function regexifyConfigPath(configPath, version) {
    var lastIndex = configPath.lastIndexOf('.');
    return `${configPath.substr(0, lastIndex)}-v${version}.yml`;
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
    // If several regex entries are provided we require all of them to match for the label to be applied.
    for (const regEx of regexes) {
        const found = issue_body.match(regEx);
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
