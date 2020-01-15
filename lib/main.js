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
            client.issues.removeLabels;
            // Load the existing labels the issue has
            const labels = getLabels(client, issue_number);
            // Load our regex rules from the configuration path
            const labelGlobs = yield getLabelGlobs(client, configPath);
            const addLabel = [];
            const removeLabelItems = [];
            for (const [label, globs] of labelGlobs.entries()) {
                console.debug(`processing ${label}`);
                console.debug(`for globs ${globs[0]}`);
                if (checkGlobs(issue_body, globs)) {
                    console.log(`Queue label for addition: ${label}`);
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
function getLabelGlobs(client, configurationPath) {
    return __awaiter(this, void 0, void 0, function* () {
        const configurationContent = yield fetchContent(client, configurationPath);
        // loads (hopefully) a `{[label:string]: string | string[]}`, but is `any`:
        const configObject = yaml.safeLoad(configurationContent);
        // transform `any` => `Map<string,string[]>` or throw if yaml is malformed:
        return getLabelGlobMapFromObject(configObject);
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
function getLabelGlobMapFromObject(configObject) {
    const labelGlobs = new Map();
    for (const label in configObject) {
        if (typeof configObject[label] === 'string') {
            labelGlobs.set(label, [configObject[label]]);
        }
        else if (Array.isArray(configObject[label])) {
            labelGlobs.set(label, configObject[label]);
        }
        else {
            throw Error(`found unexpected type for label ${label} (should be string or array of globs)`);
        }
    }
    return labelGlobs;
}
function checkGlobs(issue_body, globs) {
    console.log(issue_body);
    // If several regex entries are provided we require all of them to match for the label to be applied.
    for (const glob of globs) {
        console.log(` checking pattern ${glob}`);
        const found = issue_body.match(glob);
        if (!found) {
            console.log(`Didn't find pattern`);
            return false;
        }
        console.log(`Found patterns ${found}`);
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
        console.log(data);
        for (let i = 0; i < Object.keys(data).length; i++) {
            console.log(`label is ${data[i].name}`);
            labels.push(data[i].name);
        }
        console.log("done");
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
