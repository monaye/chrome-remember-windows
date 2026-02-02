# Remember Windows - Developer Guide

## Local Testing

### Install the Extension

1. Open Chrome and navigate to `chrome://extensions`
2. Enable **Developer mode** (toggle in the top right corner)
3. Click **Load unpacked**
4. Select the `chrome-remember-windows` folder
5. The extension icon will appear in your toolbar

### Test Save/Restore

1. Open several browser windows at different screen positions
2. Open multiple tabs in each window
3. Click the extension icon to open the popup
4. Click **Save All Windows** - JSON will appear in the textarea
5. Copy the JSON using the Copy button
6. Close some or all windows
7. Click the extension icon again
8. Paste the JSON into the textarea
9. Click **Restore Windows** - your windows will reopen at their saved positions

### Testing Incognito Mode

1. Go to `chrome://extensions`
2. Click **Details** on the extension
3. Enable **Allow in Incognito**
4. Open incognito windows and test save/restore separately

### What Gets Saved

- Window position (x, y coordinates)
- Window size (width, height)
- Window state (normal, maximized, minimized, fullscreen)
- All tabs with their URLs
- Tab pinned status

### Notes

- Internal Chrome pages (`chrome://`) are excluded from save/restore
- The extension requires the `tabs` permission to access tab URLs
- Restored windows open unfocused to prevent focus stealing
- Regular and incognito windows are saved/restored separately
