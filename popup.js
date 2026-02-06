document.getElementById('saveBtn').addEventListener('click', saveWindows);
document.getElementById('restoreBtn').addEventListener('click', restoreWindows);
document.getElementById('copyBtn').addEventListener('click', copyToClipboard);

async function saveWindows() {
  const status = document.getElementById('status');
  const textarea = document.getElementById('data');

  try {
    // Get current window to check if we're in incognito mode
    const currentWindow = await chrome.windows.getCurrent();
    const isIncognito = currentWindow.incognito;

    const allWindows = await chrome.windows.getAll({ populate: true });

    // Filter windows based on current mode (incognito or regular)
    const filteredWindows = allWindows.filter(win => win.incognito === isIncognito);

    const data = {
      savedAt: new Date().toISOString(),
      incognito: isIncognito,
      windows: filteredWindows.map(win => ({
        state: win.state,
        left: win.left,
        top: win.top,
        width: win.width,
        height: win.height,
        focused: win.focused,
        tabs: win.tabs
          .filter(tab => !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://'))
          .map(tab => ({
            url: tab.url,
            pinned: tab.pinned,
            active: tab.active
          }))
      })).filter(win => win.tabs.length > 0)
    };

    const modeLabel = isIncognito ? 'private' : 'regular';
    textarea.value = JSON.stringify(data, null, 2);
    status.textContent = `Saved ${data.windows.length} ${modeLabel} window(s) with ${data.windows.reduce((sum, w) => sum + w.tabs.length, 0)} tab(s)`;
    status.className = 'success';

    // Show copy button
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
    const data = JSON.parse(textarea.value);

    if (!data.windows || !Array.isArray(data.windows)) {
      throw new Error('Invalid format: missing windows array');
    }

    // Get current window to check if we're in incognito mode
    const currentWindow = await chrome.windows.getCurrent();
    const isIncognito = currentWindow.incognito;

    let windowCount = 0;
    let tabCount = 0;

    for (const win of data.windows) {
      if (!win.tabs || win.tabs.length === 0) continue;

      // Create window with first tab
      // Note: state (maximized/minimized/fullscreen) cannot be combined with
      // position/size, so create with position/size first, then update state
      const needsStateChange = win.state && win.state !== 'normal';
      const createData = {
        url: win.tabs[0].url,
        left: win.left,
        top: win.top,
        width: win.width,
        height: win.height,
        focused: true,
        incognito: isIncognito
      };

      const newWindow = await chrome.windows.create(createData);

      if (needsStateChange) {
        await chrome.windows.update(newWindow.id, { state: win.state });
      }
      windowCount++;
      tabCount++;

      // Handle pinned state for first tab
      if (win.tabs[0].pinned) {
        await chrome.tabs.update(newWindow.tabs[0].id, { pinned: true });
      }

      // Create remaining tabs
      for (let i = 1; i < win.tabs.length; i++) {
        const tab = win.tabs[i];
        await chrome.tabs.create({
          windowId: newWindow.id,
          url: tab.url,
          pinned: tab.pinned,
          active: tab.active
        });
        tabCount++;
      }
    }

    const modeLabel = isIncognito ? 'private' : 'regular';
    status.textContent = `Restored ${windowCount} ${modeLabel} window(s) with ${tabCount} tab(s)`;
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
