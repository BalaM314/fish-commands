
# Contributing

What kind of changes do you want to make?

## I want to make small changes (just change some text)

You can make these changes entirely through the Github website. You will need a Github account.

1. Open the file that you want to edit. If you are unsure of which file to edit, try using Github's search feature.
2. Click the edit icon in the toolbar. If Github tells you to create a fork, do that.
3. Make your change, then click "Commit changes..."
4. Write a message, then click Propose changes.
  - If you are a member of the Fish-Community org, you will see a message about branch protection. Select "Create a new branch and start a pull request".
  - If you are not a member, you will also need to manually edit the corresponding .js file, which is located in `build/scripts`. For example, if you edited `src/config.ts`, you will need to make the same change to `build/scripts/config.js`.
5. Create a pull request and request a review. If you see a message about failing checks, there may be a problem with your changes.

## I want to make significant code changes (in VSCode)

First: read [info.md](docs/info.md)

To get started with development:
1. Create a fork of fish-commands through the GitHub website.
2. Clone that fork into a folder of your choice by `cd`ing into the folder and running `git clone https://github.com/`(your username here)`/fish-commands .`
3. Run `npm install`
4. Run `npm watch` in one terminal. (Or, open VS Code and tell it to trust the project)
5. In another terminal, run `npm dev` to start up a Mindustry development server with fish-commands installed.

### Making changes
1. Edit the code, which is in `/src`.
2. Restart the development server. Close it by pressing Ctrl+C or typing `exit`.
3. Test your changes.

To use fish-commands with a server installed somewhere else, run `npm attach [jarfilepath.jar]`

Once you have made and tested your changes, submit a PR:
1. Commit your changes to Git by running `git add . && git commit -m "`(description of your changes here)`"`
2. Upload your changes by running `git push`. 3. You should see a link to create the PR. If not, create one through Github.