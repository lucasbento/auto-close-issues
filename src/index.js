const fs = require("fs");
const core = require("@actions/core");
const github = require("@actions/github");
const mdjson = require("mdjson");

const ISSUE_TEMPLATE_DIR = ".github/ISSUE_TEMPLATE";

// Grab the closing message from params or fallback to a default message
const getIssueCloseMessage = () => {
  const message =
    core.getInput("issue-close-message") ||
    "@${issue.user.login}: hello! :wave:\n\nThis issue is being automatically closed because it does not follow the issue template.";

  const { payload } = github.context;

  return Function(
    ...Object.keys(payload),
    `return \`${message}\``
  )(...Object.values(payload));
};

(async () => {
  const client = new github.GitHub(
    core.getInput("github-token", { required: true })
  );

  const { payload } = github.context;

  const issueBodyMarkdown = payload.issue.body;
  // Get all the markdown titles from the issue body
  const issueBodyTitles = Object.keys(mdjson(issueBodyMarkdown));

  // Get a list of the templates
  const issueTemplates = fs.readdirSync(ISSUE_TEMPLATE_DIR);

  // Compare template titles with issue body
  const doesIssueMatchAnyTemplate = issueTemplates.some(template => {
    if (!Boolean(template.localeCompare("config.yml"))) {
      return false;
    }
    const templateMarkdown = fs.readFileSync(
      `${ISSUE_TEMPLATE_DIR}/${template}`,
      "utf-8"
    );
    const templateTitles = Object.keys(mdjson(templateMarkdown));

    return templateTitles.every(title => issueBodyTitles.includes(title));
  });

  const { issue } = github.context;
  const closedIssueLabel = core.getInput("closed-issues-label");

  if (doesIssueMatchAnyTemplate || payload.action !== "opened") {
    // Only reopen the issue if there's a `closed-issues-label` so it knows that
    // it was previously closed because of the wrong template
    if (payload.issue.state === "closed" && closedIssueLabel) {
      const labels = (
        await client.issues.listLabelsOnIssue({
          owner: issue.owner,
          repo: issue.repo,
          issue_number: issue.number
        })
      ).data.map(({ name }) => name);

      if (!labels.includes(closedIssueLabel)) {
        return;
      }

      await client.issues.removeLabel({
        owner: issue.owner,
        repo: issue.repo,
        issue_number: issue.number,
        name: closedIssueLabel
      });

      await client.issues.update({
        owner: issue.owner,
        repo: issue.repo,
        issue_number: issue.number,
        state: "open"
      });

      return;
    }

    return;
  }

  // If an closed issue label was provided, add it to the issue
  if (closedIssueLabel) {
    await client.issues.addLabels({
      owner: issue.owner,
      repo: issue.repo,
      issue_number: issue.number,
      labels: [closedIssueLabel]
    });
  }

  // Add the issue closing comment
  await client.issues.createComment({
    owner: issue.owner,
    repo: issue.repo,
    issue_number: issue.number,
    body: getIssueCloseMessage()
  });

  // Close the issue
  await client.issues.update({
    owner: issue.owner,
    repo: issue.repo,
    issue_number: issue.number,
    state: "closed"
  });
})();
