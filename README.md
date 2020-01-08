# Close issues that don't follow the issue template

## How it works

This GitHub action will fetch all the files inside of `.github/ISSUE_TEMPLATE`, parse the titles and compare those titles with the content of the opened/edited issue, if they don't match, it will:

1. Add a label to the issue (configurable with the input property `closed-issues-label`);
   > This step won't run if no label is provided.
1. Add a message to the issue;
1. Close it.

If the user happens to edit the issue to match the template, the action will run again and, if it matches, it will remove the label and reopen the issue automatically.

> This will only work if you have the input property `closed-issues-label` provided.

## Installation

Put the following content in the file `.github/workflows/main.yml`:

```yml
on:
  issues:
    types: [opened, edited]

jobs:
  auto_close_issues:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v1
      - name: Automatically close issues that don't follow the issue template
        uses: lucasbento/auto-close-issues@v1.0.1
        with:
          github-token: ${{ secrets.GITHUB_TOKEN }}
          issue-close-message: "@${issue.user.login}: hello! :wave:\n\nThis issue is being automatically closed because it does not follow the issue template." # optional property
          closed-issues-label: "🙁 Not following issue template" # optional property
```

## Configuration

You can configure `issue-close-message` and `closed-issues-label`, which are, respectively, the message that is shown when closing the issue and the label added to the issue when it being closed.

For `issue-close-message` the example configuration uses `issue.user.login` to mention the user's username, you can check what you can specify on the message on [GitHub webhook documentation](https://developer.github.com/v3/activity/events/types/#webhook-payload-example-15).

## License

This project is released under the MIT license.
