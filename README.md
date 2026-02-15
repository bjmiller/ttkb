# ttkb

Terminal Kanban viewer/editor for `todo.txt` files.

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
- `cursorStyle` (string): cursor rendering mode for command input.
  - `native` (default): best-effort native terminal behavior.
  - `block`
  - `bar`
  - `underline`
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

`done.txt` is always written in the same directory as the resolved `todo.txt`.

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
- `?`: show help overlay

### Other commands

- `Esc`: cancel current prompt/confirmation
- `Shift+Q`: open quit confirmation
