# Post to X (Twitter) via Playwright

Post content to X/Twitter using Playwright browser automation MCP tools.

## Prerequisites

- Playwright MCP server must be available (`plugin:playwright`)
- User must be able to authenticate via passkey/TouchID when prompted
- Character limit: 280 characters (count BEFORE posting)

## Workflow

### 1. Navigate to compose page

```
browser_navigate → https://x.com/compose/post
```

If not logged in, the user will need to authenticate manually:
- Navigate to `https://x.com` first
- Enter username when prompted (user's X handle: `winmonaye`)
- User authenticates via passkey/TouchID (cannot be automated)
- Once logged in, navigate to `https://x.com/compose/post`

### 2. Take a snapshot and find the compose textbox

```
browser_snapshot
```

Look for a textbox element (typically `ref` is a contenteditable div with role "textbox" or placeholder "What is happening?!").

### 3. Type the post content

**Important**: Use `slowly: true` to trigger key handlers properly.

```
browser_type → ref: <textbox_ref>, text: "<post content>", slowly: true
```

### 4. Dismiss autocomplete suggestions

After typing, an autocomplete/suggestion popup may appear. Press Escape to dismiss it:

```
browser_press_key → key: Escape
```

### 5. Verify and click Post button

Take a snapshot to find the Post button, then click it:

```
browser_snapshot
browser_click → ref: <post_button_ref>, element: "Post button"
```

### 6. Confirm success

Wait for confirmation and take a snapshot:

```
browser_wait_for → time: 2
browser_snapshot
```

Look for confirmation text like "ポストを送信しました" (Post sent) or the post appearing in the timeline.

## Important Notes

- **Always count characters before posting.** If over 280, shorten the content first.
- **Use `slowly: true`** when typing — without it, X's compose box may not register the input correctly.
- **Press Escape after typing** to dismiss autocomplete suggestions that may overlay the Post button.
- **Anti-bot detection**: X may show a spinner or challenge during login. The user must handle authentication manually via passkey.
- **Ask user to confirm** before clicking the Post button — posts cannot be easily undone.

## Example Post Format

```
Shipped [Product Name] - a free Chrome extension that [value prop].

[Key feature 1]. [Key feature 2].

[Trust signal - e.g., "No account, works offline."]

#ChromeExtension #Productivity
```
