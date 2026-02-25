# 🔌 MCP Server Switcher for Claude

A lightweight desktop app to manage your Claude MCP servers — no more digging through JSON files.

---

## 🤔 Why This Exists

Claude is incredibly powerful, but it's primarily a terminal-based tool. Managing MCP servers means manually editing your `claude.json` config file — finding the right keys, toggling entries, avoiding typos. It's tedious and error-prone, especially when you have a lot of servers.

**MCP Server Switcher** gives you a clean, interactive UI to manage all of that in seconds, on both **macOS** and **Windows**.

---

## ✨ Features

- **📂 Custom config path** — Point the app to your `claude.json` file (or any config file at a custom location). The default `~/.claude.json` is pre-filled for convenience.

- **🔁 Toggle servers on/off** — Enable or disable individual MCP servers with a single click. No need to delete entries — disabled servers are preserved in your config.

- **✏️ Edit server config in-app** — View and edit the JSON configuration of any MCP server directly inside the app, without opening an external editor.

- **➕ Add new servers** — Add new MCP server entries to your config right from the UI.

- **🗑️ Delete servers** — Remove servers you no longer need.

- **🔍 Search** — Fuzzy search across all your MCP servers to quickly find what you're looking for.

- **🧪 Test servers** — Test any MCP server directly from the app to verify it's working correctly. Supports both `stdio` and `http` type servers.

  - **Batch testing** — Test all enabled servers, all servers, or re-test previously tested ones with a single click.
  - **Tool count display** — See how many tools each server exposes after a successful test.

- **🛠️ PATH management** — Some MCP servers require specific binaries (like `node`, `uvx`, `python`) to be on your PATH. You can add custom PATH directories in the app so tests and validations work even if your shell's PATH isn't picked up by the desktop environment.

- **📊 Tools gauge** — A visual summary showing total tools available across all tested, enabled servers — useful for staying within Claude's tool limit.

---

## 🚀 Getting Started

1. Launch the app.
2. Enter the path to your `claude.json` file (default: `~/.claude.json`).
3. Click **Load** — all your MCP servers will appear.
4. Toggle, edit, test, or add servers as needed.

> ⚠️ **Changes take effect after restarting Claude.** Run `/exit` in Claude, then reopen with `claude --resume`.

---

## 🖥️ Platform Support

| Platform | Status |
|----------|--------|
| macOS    | ✅ Supported |
| Windows  | ✅ Supported |
| Linux    | ✅ Supported |

---

## 🏗️ Tech Stack

- [Electron](https://www.electronjs.org/) — Desktop app shell
- [React](https://react.dev/) + [Vite](https://vitejs.dev/) — UI
- [Tailwind CSS](https://tailwindcss.com/) — Styling
- [Fuse.js](https://www.fusejs.io/) — Fuzzy search

---

## 🛠️ Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build the app
npm run build
```

---

## 📄 License

[ISC](./LICENSE)
