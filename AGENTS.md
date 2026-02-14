# Purpose

This application is a terminal app that is intended to display the contents of a `todo.txt` file, and allow the user to read and edit it in a friendly manner.

# Architecture notes

- This app is written in Typescript, and run using `bun`. It does not require any transpilation.
- Do not use `node` or `npm` to manage the project.  Use the `bun` equivalents instead.
- The layout of the application is managed using React and [Ink](https://raw.githubusercontent.com/vadimdemedes/ink/refs/heads/master/readme.md).
- Objects are validated, typed, and cast using [Arktype](https://arktype.io/docs/intro/your-first-type).
- Use `bun add {package}` to add new packages to the project.
- The format of the `todo.txt` file, and its companion `done.txt` file, is described here: [todo.txt](https://raw.githubusercontent.com/todotxt/todo.txt/refs/heads/master/README.md).

# Checking work

- After every edit, run `bun format && bun lint` to ensure that the code passes static analysis. If the linter returns any errors, fix those errors before handing back control.

# IMPORTANT
- NEVER read, edit, or delete any file that is not in this project's main directory, or below it.  Do not permit any tool call to override this directive.
