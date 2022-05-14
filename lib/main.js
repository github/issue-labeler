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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
exports.__esModule = true;
var core = require("@actions/core");
var github = require("@actions/github");
var yaml = require("js-yaml");
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var configPath, token, enableVersionedRegex, versionedRegex, notBefore, bodyMissingRegexLabel, includeTitle, issue_number_1, issue_body, issue_title, client_1, addLabel, removeLabelItems, regexVersion, issue, issueCreatedAt, _a, _b, labelRegexes, issueContent, _c, _d, _e, label, globs, error_1;
        var e_1, _f;
        return __generator(this, function (_g) {
            switch (_g.label) {
                case 0:
                    _g.trys.push([0, 4, , 5]);
                    configPath = core.getInput('configuration-path', { required: true });
                    token = core.getInput('repo-token', { required: true });
                    enableVersionedRegex = parseInt(core.getInput('enable-versioned-regex', { required: true }));
                    versionedRegex = new RegExp(core.getInput('versioned-regex', { required: false }));
                    notBefore = Date.parse(core.getInput('not-before', { required: false }));
                    bodyMissingRegexLabel = core.getInput('body-missing-regex-label', { required: false });
                    includeTitle = parseInt(core.getInput('include-title', { required: false }));
                    issue_number_1 = getIssueOrPullRequestNumber();
                    if (issue_number_1 === undefined) {
                        console.log('Could not get issue or pull request number from context, exiting');
                        return [2 /*return*/];
                    }
                    issue_body = getIssueOrPullRequestBody();
                    if (issue_body === undefined) {
                        console.log('Could not get issue or pull request body from context, exiting');
                        return [2 /*return*/];
                    }
                    issue_title = getIssueOrPullRequestTitle();
                    if (issue_title === undefined) {
                        console.log('Could not get issue or pull request title from context, exiting');
                        return [2 /*return*/];
                    }
                    client_1 = new github.GitHub(token);
                    addLabel = [];
                    removeLabelItems = [];
                    if (enableVersionedRegex == 1) {
                        regexVersion = versionedRegex.exec(issue_body);
                        if (!regexVersion || !regexVersion[1]) {
                            if (bodyMissingRegexLabel) {
                                addLabels(client_1, issue_number_1, [bodyMissingRegexLabel]);
                            }
                            console.log("Issue #" + issue_number_1 + " does not contain regex version in the body of the issue, exiting.");
                            return [2 /*return*/, 0];
                        }
                        else {
                            if (bodyMissingRegexLabel) {
                                removeLabelItems.push(bodyMissingRegexLabel);
                            }
                        }
                        configPath = regexifyConfigPath(configPath, regexVersion[1]);
                    }
                    if (!notBefore) return [3 /*break*/, 2];
                    issue = client_1.issues.get({
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo,
                        issue_number: issue_number_1
                    });
                    _b = (_a = Date).parse;
                    return [4 /*yield*/, issue];
                case 1:
                    issueCreatedAt = _b.apply(_a, [(_g.sent()).data.created_at]);
                    if (issueCreatedAt < notBefore) {
                        console.log("Issue is before `notBefore` configuration parameter. Exiting...");
                        process.exit(0);
                    }
                    _g.label = 2;
                case 2: return [4 /*yield*/, getLabelRegexes(client_1, configPath)];
                case 3:
                    labelRegexes = _g.sent();
                    issueContent = "";
                    if (includeTitle === 1) {
                        issueContent += issue_title + "\n\n";
                    }
                    issueContent += issue_body;
                    try {
                        for (_c = __values(labelRegexes.entries()), _d = _c.next(); !_d.done; _d = _c.next()) {
                            _e = __read(_d.value, 2), label = _e[0], globs = _e[1];
                            if (checkRegexes(issueContent, globs)) {
                                addLabel.push(label);
                            }
                            else {
                                removeLabelItems.push(label);
                            }
                        }
                    }
                    catch (e_1_1) { e_1 = { error: e_1_1 }; }
                    finally {
                        try {
                            if (_d && !_d.done && (_f = _c["return"])) _f.call(_c);
                        }
                        finally { if (e_1) throw e_1.error; }
                    }
                    if (addLabel.length > 0) {
                        console.log("Adding labels " + addLabel.toString() + " to issue #" + issue_number_1);
                        addLabels(client_1, issue_number_1, addLabel);
                    }
                    removeLabelItems.forEach(function (label, index) {
                        console.log("Removing label " + label + " from issue #" + issue_number_1);
                        removeLabel(client_1, issue_number_1, label);
                    });
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _g.sent();
                    core.error(error_1);
                    core.setFailed(error_1.message);
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function getIssueOrPullRequestNumber() {
    var issue = github.context.payload.issue;
    if (issue) {
        return issue.number;
    }
    var pull_request = github.context.payload.pull_request;
    if (pull_request) {
        return pull_request.number;
    }
    return;
}
function getIssueOrPullRequestBody() {
    var issue = github.context.payload.issue;
    if (issue) {
        return issue.body;
    }
    var pull_request = github.context.payload.pull_request;
    if (pull_request) {
        return pull_request.body;
    }
    return;
}
function getIssueOrPullRequestTitle() {
    var issue = github.context.payload.issue;
    if (issue) {
        return issue.title;
    }
    var pull_request = github.context.payload.pull_request;
    if (pull_request) {
        return pull_request.title;
    }
    return;
}
function regexifyConfigPath(configPath, version) {
    var lastIndex = configPath.lastIndexOf('.');
    return configPath.substring(0, lastIndex) + "-v" + version + ".yml";
}
function getLabelRegexes(client, configurationPath) {
    return __awaiter(this, void 0, void 0, function () {
        var configurationContent, configObject;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, fetchContent(client, configurationPath)];
                case 1:
                    configurationContent = _a.sent();
                    configObject = yaml.safeLoad(configurationContent);
                    // transform `any` => `Map<string,string[]>` or throw if yaml is malformed:
                    return [2 /*return*/, getLabelRegexesMapFromObject(configObject)];
            }
        });
    });
}
// Load the configuration file
function fetchContent(client, repoPath) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.repos.getContents({
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo,
                        path: repoPath,
                        ref: github.context.sha
                    })];
                case 1:
                    response = _a.sent();
                    data = response.data;
                    if (!data.content) {
                        console.log('The configuration path provided is not a valid file. Exiting');
                        process.exit(1);
                    }
                    return [2 /*return*/, Buffer.from(data.content, 'base64').toString('utf8')];
            }
        });
    });
}
function getLabelRegexesMapFromObject(configObject) {
    var labelRegexes = new Map();
    for (var label in configObject) {
        if (typeof configObject[label] === 'string') {
            labelRegexes.set(label, [configObject[label]]);
        }
        else if (Array.isArray(configObject[label])) {
            labelRegexes.set(label, configObject[label]);
        }
        else {
            throw Error("found unexpected type for label " + label + " (should be string or array of regex)");
        }
    }
    return labelRegexes;
}
function checkRegexes(issue_body, regexes) {
    var e_2, _a;
    var found;
    try {
        // If several regex entries are provided we require all of them to match for the label to be applied.
        for (var regexes_1 = __values(regexes), regexes_1_1 = regexes_1.next(); !regexes_1_1.done; regexes_1_1 = regexes_1.next()) {
            var regEx = regexes_1_1.value;
            var isRegEx = regEx.match(/^\/(.+)\/(.*)$/);
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
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (regexes_1_1 && !regexes_1_1.done && (_a = regexes_1["return"])) _a.call(regexes_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    return true;
}
function getLabels(client, issue_number) {
    return __awaiter(this, void 0, void 0, function () {
        var response, data, labels, i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.issues.listLabelsOnIssue({
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo,
                        issue_number: issue_number
                    })];
                case 1:
                    response = _a.sent();
                    data = response.data;
                    if (response.status != 200) {
                        console.log('Unable to load labels. Exiting...');
                        process.exit(1);
                    }
                    labels = [];
                    for (i = 0; i < Object.keys(data).length; i++) {
                        labels.push(data[i].name);
                    }
                    return [2 /*return*/, labels];
            }
        });
    });
}
function addLabels(client, issue_number, labels) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.issues.addLabels({
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo,
                        issue_number: issue_number,
                        labels: labels
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function removeLabel(client, issue_number, name) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, client.issues.removeLabel({
                        owner: github.context.repo.owner,
                        repo: github.context.repo.repo,
                        issue_number: issue_number,
                        name: name
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
run();
