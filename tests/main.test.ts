import { checkRegexes, loadConfig } from "../src/main";

describe("TODO - Add a test suite", () => {
  it("Should extra labels", async () => {
    const labelRegexes = await loadConfig(
      undefined as any,
      "tests/extraLabels.yml",
    );
    const issueContents = ["A/index.html", "B/index.html", "C/index.html"];

    for (const issueContent of issueContents) {
      let toAdd: string[] = [];
      for (const [label, globs] of labelRegexes.entries()) {
        console.log(label);
        if (checkRegexes(issueContent, globs)) {
          toAdd.push(label);
        }
      }
      expect(toAdd).toContain("Label 1");
    }
  });

  it("Should exclude bad labels", async () => {
    const labelRegexes = await loadConfig(
      undefined as any,
      "tests/extraLabels.yml",
    );
    const issueContents = ["A/substuff/index.html"];

    for (const issueContent of issueContents) {
      let toAdd: string[] = [];
      for (const [label, globs] of labelRegexes.entries()) {
        console.log(label);
        if (checkRegexes(issueContent, globs)) {
          toAdd.push(label);
        }
      }
      expect(toAdd).not.toContain("Label 1");
      expect(toAdd).toContain("Label 2");
    }
  });

  it("Should add a allOf labels very specific", async () => {
    const labelRegexes = await loadConfig(
      undefined as any,
      "tests/extraLabels.yml",
    );
    const issueContents = [
      "This issue has a permalink to a file B/substuff/index.html and also has the magic word ABLU",
    ];

    for (const issueContent of issueContents) {
      let toAdd: string[] = [];
      for (const [label, globs] of labelRegexes.entries()) {
        console.log(label);
        if (checkRegexes(issueContent, globs)) {
          toAdd.push(label);
        }
      }
      expect(toAdd).not.toContain("Label 1");
      expect(toAdd).not.toContain("Label 2");
      expect(toAdd).toContain("ABLU LABEL");
    }
  });
});
