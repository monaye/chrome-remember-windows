# Remember Windows

Save and restore your browser workspace in seconds.

## What It Does

Remember Windows captures your entire browser setup - all windows, tabs, positions, and sizes - and lets you restore it anytime with a simple copy/paste.

## Features

- **Save All Windows** - Capture every open window with exact screen positions and sizes
- **Human-Readable Format** - Saved data is plain text, easy to read and edit
- **Selective Restore** - Delete lines you don't need, keep only the tabs you want to reopen
- **Paste Any URLs** - Paste a list of URLs from anywhere and open them all at once
- **Portable** - Save your workspace as text to store anywhere (notes, files, cloud)
- **Privacy Aware** - Regular and private windows are handled separately
- **Pinned Tabs** - Preserves your pinned tab setup

## How to Use

### Save your workspace
1. Click the extension icon
2. Click **Save All Windows** to capture your current setup
3. Click **Copy** to copy the data to clipboard
4. Save the text wherever you like (notes app, text file, etc.)

### Restore your workspace
1. Paste the saved text back into the extension
2. Click **Restore Windows** to recreate all windows and tabs

### Restore selectively
You can edit the saved text before restoring:
- Delete any URLs you don't want to reopen
- Delete a window marker line to open those tabs in your current window instead of a new one
- Paste just a list of URLs from anywhere - they'll open as new tabs in your current window

## Saved Format

```
/* Window 1 |left:0|top:23|width:1200|height:800|state:normal| */
https://google.com [pinned]
https://github.com/user/project
https://stackoverflow.com/questions

/* Window 2 |left:100|top:50|width:1000|height:600|state:maximized| */
https://docs.google.com/spreadsheet/abc
https://figma.com/file/design-project
```

- Window markers define position, size, and state for each window
- URLs are listed one per line under each window
- `[pinned]` marks pinned tabs
- Window markers are optional - bare URLs open in your current window

## Use Cases

- **Work Contexts** - Save different window layouts for different projects
- **Daily Reset** - Start each day with your preferred browser setup
- **Share Setups** - Send your research tab collection to a colleague
- **Backup** - Never lose your carefully arranged workspace again
- **Quick Open** - Paste a list of URLs from any source to open them all at once

## Privacy

- No data is collected or sent anywhere
- Everything stays on your device
- Works offline
