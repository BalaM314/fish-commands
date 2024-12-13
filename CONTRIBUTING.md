
# Contributing

First: read [info.md](docs/info.md)

To get started with development:
1. Create a fork of fish-commands through the GitHub website.
2. Clone that fork into a folder of your choice by `cd`ing into the folder and running `git clone https://github.com/`(your username here)`/fish-commands .`
3. Run `npm install`
4. Run `npm watch` in one terminal. (Or, open VS Code and tell it to trust the project)
5. In another terminal, run `npm dev` to start up a Mindustry development server with fish-commands installed.

## Making changes
1. Edit the code, which is in `/src`.
2. Restart the development server. Close it by pressing Ctrl+C or typing `exit`.
3. Test your changes.

To use fish-commands with a server installed somewhere else, run `npm attach [jarfilepath.jar]`

Once you have made and tested your changes, submit a PR:
1. Commit your changes to Git by running `git add . && git commit -m "`(description of your changes here)`"`
2. Upload your changes by running `git push`. 3. You should see a link to create the PR. If not, create one through Github.