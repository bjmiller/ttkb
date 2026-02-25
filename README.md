# ttkb

Terminal Kanban viewer/editor for `todo.txt` files.

## Requirements

For ttkb to look correct, you should be using a modern terminal program, and you must also use a [Nerd Font](https://www.nerdfonts.com) in your terminal.

You can place your todo.txt file in any directory, but the file must be named "todo.txt", and its companion file "done.txt" must be in the same directory, and must have the name "done.txt".

## Installation

Installation is a bit manual at the moment. You can follow these steps:

- Make sure that you have the most recent version of [Bun](https://bun.com/) installed.
- Clone this repository.
- Use `cd` to go to the project root.
- Run `bun install` to bring in dependencies.
- Run `bun run build` to create a binary that targets your local system.
- Copy the resulting `ttkb` executable file from the /dist directory into a directory that's on your path.

At some point, there may be pre-built executables, which will make all of this a lot simpler.

## Configuration

ttkb loads config from the first file found in:

- macOS: `~/Library/Application Support/ttkb/` then `~/.config/ttkb/`
- Linux: `$XDG_CONFIG_HOME/ttkb/` then `~/.config/ttkb/`
- Windows: `%APPDATA%\\ttkb\\` then `%LOCALAPPDATA%\\ttkb\\` then `%USERPROFILE%\\AppData\\Roaming\\ttkb\\`

Supported filenames/formats:

- `config.json`
- `config.json5`
- `config.yaml`
- `config.yml`
- `config.toml`

### Configuration options

- `todoDirectoryPath` (string): directory containing your `todo.txt`. ttkb always uses `todo.txt` as the filename.
- `cursorStyle` (string): cursor rendering mode for command input. Options are: `native` (default, best-effort native terminal behavior), `block`, `bar`, or `underline`.
- `cursorBlink` (boolean): whether command cursor blinks. Default: `false`.

If `cursorStyle` is set to `block`, `bar`, or `underline`, that explicit style is used and terminal detection is skipped.
If `cursorStyle` is `native` (or unset), ttkb attempts to detect shape/blink from the terminal and falls back to
`block` + non-blinking when detection is unavailable.
If `cursorBlink` is set, it overrides detected/default blink behavior.

### Example

```json
{
  "todoDirectoryPath": "~",
  "cursorStyle": "bar",
  "cursorBlink": true
}
```

## Commands

### Navigation

- `↑` / `↓` / `←` / `→`: move selection across tasks and columns

### Task actions

- `a`: add a task
- `e`: edit selected task description
- `;`: edit selected task dates
  - active task: edit created date
  - done task: edit completed date; press `Tab` to switch between completed/created date
- `p`: set/clear selected task priority
- `x`: toggle completion (backlog/doing ↔ done)
- `d`: toggle selected active task between backlog and doing
- `Delete` (or `Ctrl+D` in terminals that map forward delete): delete selected task with confirmation
- `c`: move all completed tasks from `todo.txt` to `done.txt`

### Search and overlays

- `f`: open filter prompt; `Esc` clears active filter
- `v`: toggle card/table view
- `?`: show help overlay

### Other commands

- `Esc`: cancel current prompt/confirmation
- `Shift+Q`: open quit confirmation

## Notes and design decisions

- A task is in the "doing" state if it has a metadata key of `status:doing`.
- Tasks that are marked "done" lose their priority indicator, but preserve it as a metadata tag called `pri`.
- The concept of "recurring" tasks is intentionally not supported.
