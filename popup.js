document.getElementById('saveBtn').addEventListener('click', saveWindows);
document.getElementById('restoreBtn').addEventListener('click', restoreWindows);
document.getElementById('copyBtn').addEventListener('click', copyToClipboard);

// Parse text into window groups: [{ props: {…} | null, urls: [{ url, pinned }] }]
// Supports our export format (window markers + URLs) and plain text with URLs anywhere
function parseText(text) {
  const windows = [];
  let currentWin = null;

  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^\/\*.*\*\/$/.test(trimmed)) {
      // Window marker — parse key:value pairs between pipes
      const props = {};
      for (const m of trimmed.matchAll(/(\w+):([^|*]+)/g)) {
        props[m[1]] = m[2].trim();
      }
      currentWin = { props, urls: [] };
      windows.push(currentWin);
    } else {
      // Extract all URLs from the line
      const urlMatches = trimmed.match(/https?:\/\/[^\s"'<>]+/g);
      if (!urlMatches) continue;

      if (!currentWin) {
        currentWin = { props: null, urls: [] };
        windows.push(currentWin);
      }

      const linePinned = /\[pinned\]/.test(trimmed);
      const lineActive = /\[active\]/.test(trimmed);

      for (const url of urlMatches) {
        // tags apply to the last URL on the line
        const isLast = url === urlMatches[urlMatches.length - 1];
        currentWin.urls.push({ url, pinned: linePinned && isLast, active: lineActive && isLast });
      }
    }
  }

  return windows;
}

async function saveWindows() {
  const status = document.getElementById('status');
  const textarea = document.getElementById('data');

  try {
    const currentWindow = await chrome.windows.getCurrent();
    const isIncognito = currentWindow.incognito;

    const allWindows = await chrome.windows.getAll({ populate: true });
    const filteredWindows = allWindows.filter(win => win.incognito === isIncognito);

    const lines = [];
    let windowCount = 0;
    let tabCount = 0;

    for (const win of filteredWindows) {
      const tabs = win.tabs
        .filter(tab => !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://'));
      if (tabs.length === 0) continue;

      if (windowCount > 0) lines.push('');
      windowCount++;

      lines.push(`/* Window ${windowCount} |left:${win.left}|top:${win.top}|width:${win.width}|height:${win.height}|state:${win.state}| */`);
      for (const tab of tabs) {
        let line = tab.url;
        if (tab.pinned) line += ' [pinned]';
        if (tab.active) line += ' [active]';
        lines.push(line);
        tabCount++;
      }
    }

    const modeLabel = isIncognito ? 'private' : 'regular';
    textarea.value = lines.join('\n');
    status.textContent = `Saved ${windowCount} ${modeLabel} window(s) with ${tabCount} tab(s)`;
    status.className = 'success';

    document.getElementById('copyBtn').classList.remove('hidden');
  } catch (err) {
    status.textContent = 'Error: ' + err.message;
    status.className = 'error';
  }
}

async function restoreWindows() {
  const status = document.getElementById('status');
  const textarea = document.getElementById('data');

  try {
    const text = textarea.value.trim();
    if (!text) throw new Error('No data to restore');

    const currentWindow = await chrome.windows.getCurrent();
    const isIncognito = currentWindow.incognito;

    const windows = parseText(text);

    let windowCount = 0;
    let tabCount = 0;

    for (const win of windows) {
      if (win.urls.length === 0) continue;

      if (win.props === null) {
        // Bare URLs — open in current window (active:false keeps popup alive)
        for (const tab of win.urls) {
          await chrome.tabs.create({
            windowId: currentWindow.id,
            url: tab.url,
            pinned: tab.pinned,
            active: false
          });
          tabCount++;
        }
      } else {
        // Window with properties — create a new window
        const left = parseInt(win.props.left);
        const top = parseInt(win.props.top);
        const width = parseInt(win.props.width);
        const height = parseInt(win.props.height);
        const state = win.props.state || 'normal';
        const needsStateChange = state !== 'normal';

        const createData = {
          url: win.urls[0].url,
          focused: true,
          incognito: isIncognito
        };
        if (!isNaN(left)) createData.left = left;
        if (!isNaN(top)) createData.top = top;
        if (!isNaN(width)) createData.width = width;
        if (!isNaN(height)) createData.height = height;

        const newWindow = await chrome.windows.create(createData);

        if (needsStateChange) {
          await chrome.windows.update(newWindow.id, { state });
        }
        windowCount++;
        tabCount++;

        if (win.urls[0].pinned) {
          await chrome.tabs.update(newWindow.tabs[0].id, { pinned: true });
        }

        let activeTabId = win.urls[0].active ? newWindow.tabs[0].id : null;

        for (let i = 1; i < win.urls.length; i++) {
          const created = await chrome.tabs.create({
            windowId: newWindow.id,
            url: win.urls[i].url,
            pinned: win.urls[i].pinned
          });
          if (win.urls[i].active) activeTabId = created.id;
          tabCount++;
        }

        if (activeTabId) {
          await chrome.tabs.update(activeTabId, { active: true });
        }
      }
    }

    const modeLabel = isIncognito ? 'private' : 'regular';
    const parts = [];
    if (windowCount > 0) parts.push(`${windowCount} ${modeLabel} window(s)`);
    status.textContent = `Restored ${parts.length ? parts.join(' and ') + ' with ' : ''}${tabCount} tab(s)`;
    status.className = 'success';
  } catch (err) {
    status.textContent = 'Error: ' + err.message;
    status.className = 'error';
  }
}

async function copyToClipboard() {
  const textarea = document.getElementById('data');
  const copyBtn = document.getElementById('copyBtn');
  const status = document.getElementById('status');

  try {
    await navigator.clipboard.writeText(textarea.value);
    copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      copyBtn.textContent = 'Copy';
    }, 1500);
  } catch (err) {
    status.textContent = 'Failed to copy: ' + err.message;
    status.className = 'error';
  }
}

if (typeof module !== 'undefined') module.exports = { parseText };
