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

### Keys

- `todoDirectoryPath` (string): directory containing your `todo.txt`. ttkb always uses `todo.txt` as the filename.
- `todoFilePath` (string): optional legacy path value. If set to a non-`todo.txt` filename, ttkb will still use `todo.txt` in that same directory.
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
