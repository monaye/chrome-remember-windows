const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

// Stub browser globals so popup.js can load in Node
global.document = { getElementById: () => ({ addEventListener() {} }) };

const { parseText } = require('../popup.js');

describe('parseText', () => {

  it('parses our export format with window markers', () => {
    const text = `/* Window 1 |left:0|top:23|width:1200|height:800|state:normal| */
https://google.com
https://github.com`;

    const result = parseText(text);
    assert.equal(result.length, 1);
    assert.equal(result[0].props.left, '0');
    assert.equal(result[0].props.top, '23');
    assert.equal(result[0].props.width, '1200');
    assert.equal(result[0].props.height, '800');
    assert.equal(result[0].props.state, 'normal');
    assert.equal(result[0].urls.length, 2);
    assert.equal(result[0].urls[0].url, 'https://google.com');
    assert.equal(result[0].urls[1].url, 'https://github.com');
  });

  it('parses multiple windows', () => {
    const text = `/* Window 1 |left:0|top:0|width:800|height:600|state:normal| */
https://google.com

/* Window 2 |left:100|top:50|width:1000|height:700|state:maximized| */
https://github.com
https://example.com`;

    const result = parseText(text);
    assert.equal(result.length, 2);
    assert.equal(result[0].urls.length, 1);
    assert.equal(result[0].props.state, 'normal');
    assert.equal(result[1].urls.length, 2);
    assert.equal(result[1].props.state, 'maximized');
  });

  it('bare URLs without window marker get props: null', () => {
    const text = `https://google.com
https://github.com`;

    const result = parseText(text);
    assert.equal(result.length, 1);
    assert.equal(result[0].props, null);
    assert.equal(result[0].urls.length, 2);
  });

  it('extracts URLs embedded in surrounding text', () => {
    const text = `- BestJavPorn: https://www.bestjavporn.com/video/ftkd-032/
Some title text - BestJavPorn: https://www.bestjavporn.com/video/ftkd-030/`;

    const result = parseText(text);
    assert.equal(result.length, 1);
    assert.equal(result[0].props, null);
    assert.equal(result[0].urls.length, 2);
    assert.equal(result[0].urls[0].url, 'https://www.bestjavporn.com/video/ftkd-032/');
    assert.equal(result[0].urls[1].url, 'https://www.bestjavporn.com/video/ftkd-030/');
  });

  it('handles double-quoted URLs', () => {
    const text = `"https://www.example.com/page"`;
    const result = parseText(text);
    assert.equal(result[0].urls[0].url, 'https://www.example.com/page');
  });

  it('handles single-quoted URLs', () => {
    const text = `'https://www.example.com/page'`;
    const result = parseText(text);
    assert.equal(result[0].urls[0].url, 'https://www.example.com/page');
  });

  it('handles URLs in angle brackets', () => {
    const text = `<https://www.example.com/page>`;
    const result = parseText(text);
    assert.equal(result[0].urls[0].url, 'https://www.example.com/page');
  });

  it('handles pinned tabs', () => {
    const text = `https://google.com [pinned]
https://github.com`;

    const result = parseText(text);
    assert.equal(result[0].urls[0].pinned, true);
    assert.equal(result[0].urls[0].url, 'https://google.com');
    assert.equal(result[0].urls[1].pinned, false);
  });

  it('handles pinned tabs under window markers', () => {
    const text = `/* Window 1 |left:0|top:0|width:800|height:600|state:normal| */
https://google.com [pinned]
https://github.com`;

    const result = parseText(text);
    assert.equal(result[0].urls[0].pinned, true);
    assert.equal(result[0].urls[0].url, 'https://google.com');
    assert.equal(result[0].urls[1].pinned, false);
  });

  it('multiple URLs on one line', () => {
    const text = `check https://google.com and https://github.com here`;
    const result = parseText(text);
    assert.equal(result[0].urls.length, 2);
    assert.equal(result[0].urls[0].url, 'https://google.com');
    assert.equal(result[0].urls[1].url, 'https://github.com');
  });

  it('skips lines with no URLs', () => {
    const text = `some random text
no urls here
https://google.com
more random text`;

    const result = parseText(text);
    assert.equal(result.length, 1);
    assert.equal(result[0].urls.length, 1);
    assert.equal(result[0].urls[0].url, 'https://google.com');
  });

  it('returns empty array for empty input', () => {
    assert.deepEqual(parseText(''), []);
    assert.deepEqual(parseText('   '), []);
    assert.deepEqual(parseText('\n\n\n'), []);
  });

  it('returns empty array for text with no URLs', () => {
    assert.deepEqual(parseText('just some text\nno links here'), []);
  });

  it('handles http:// URLs (not just https)', () => {
    const text = `http://example.com`;
    const result = parseText(text);
    assert.equal(result[0].urls[0].url, 'http://example.com');
  });

  it('handles window marker with missing properties gracefully', () => {
    const text = `/* Window 1 |left:0|top:23| */
https://google.com`;

    const result = parseText(text);
    assert.equal(result[0].props.left, '0');
    assert.equal(result[0].props.top, '23');
    assert.equal(result[0].props.width, undefined);
    assert.equal(result[0].props.state, undefined);
  });

  it('window marker with no URLs below has empty urls array', () => {
    const text = `/* Window 1 |left:0|top:0|width:800|height:600|state:normal| */

/* Window 2 |left:100|top:50|width:1000|height:700|state:normal| */
https://google.com`;

    const result = parseText(text);
    assert.equal(result.length, 2);
    assert.equal(result[0].urls.length, 0);
    assert.equal(result[1].urls.length, 1);
  });

  it('bare URLs before a window marker are a separate group', () => {
    const text = `https://bare-url.com

/* Window 1 |left:0|top:0|width:800|height:600|state:normal| */
https://google.com`;

    const result = parseText(text);
    assert.equal(result.length, 2);
    assert.equal(result[0].props, null);
    assert.equal(result[0].urls[0].url, 'https://bare-url.com');
    assert.notEqual(result[1].props, null);
    assert.equal(result[1].urls[0].url, 'https://google.com');
  });

  it('handles URLs with query params and fragments', () => {
    const text = `https://example.com/page?foo=bar&baz=1#section`;
    const result = parseText(text);
    assert.equal(result[0].urls[0].url, 'https://example.com/page?foo=bar&baz=1#section');
  });

  it('handles URL with encoded characters', () => {
    const text = `https://www.microsoft.com/en-us/outlook?deeplink=%2Fmail%2F0%2F&sdf=0`;
    const result = parseText(text);
    assert.equal(result[0].urls[0].url, 'https://www.microsoft.com/en-us/outlook?deeplink=%2Fmail%2F0%2F&sdf=0');
  });

  it('handles active tab marker', () => {
    const text = `https://google.com
https://github.com [active]
https://example.com`;

    const result = parseText(text);
    assert.equal(result[0].urls[0].active, false);
    assert.equal(result[0].urls[1].active, true);
    assert.equal(result[0].urls[1].url, 'https://github.com');
    assert.equal(result[0].urls[2].active, false);
  });

  it('handles pinned and active on same tab', () => {
    const text = `https://google.com [pinned] [active]
https://github.com`;

    const result = parseText(text);
    assert.equal(result[0].urls[0].pinned, true);
    assert.equal(result[0].urls[0].active, true);
    assert.equal(result[0].urls[0].url, 'https://google.com');
    assert.equal(result[0].urls[1].pinned, false);
    assert.equal(result[0].urls[1].active, false);
  });

  it('handles active tab under window marker', () => {
    const text = `/* Window 1 |left:0|top:0|width:800|height:600|state:normal| */
https://google.com
https://github.com [active]`;

    const result = parseText(text);
    assert.equal(result[0].urls[0].active, false);
    assert.equal(result[0].urls[1].active, true);
  });

  it('parses markdown-style links', () => {
    const text = `[Google](https://google.com)
[GitHub](https://github.com)`;

    const result = parseText(text);
    assert.equal(result.length, 1);
    assert.equal(result[0].urls.length, 2);
    assert.equal(result[0].urls[0].url, 'https://google.com');
    assert.equal(result[0].urls[1].url, 'https://github.com');
  });

  it('parses markdown links with pinned and active tags', () => {
    const text = `[Google](https://google.com) [pinned]
[GitHub](https://github.com) [active]`;

    const result = parseText(text);
    assert.equal(result[0].urls[0].url, 'https://google.com');
    assert.equal(result[0].urls[0].pinned, true);
    assert.equal(result[0].urls[0].active, false);
    assert.equal(result[0].urls[1].url, 'https://github.com');
    assert.equal(result[0].urls[1].pinned, false);
    assert.equal(result[0].urls[1].active, true);
  });

  it('parses markdown links under window markers', () => {
    const text = `/* Window 1 |left:0|top:23|width:1200|height:800|state:normal| */
[Google](https://google.com) [pinned]
[My Project - GitHub](https://github.com/user/project) [active]
[Stack Overflow](https://stackoverflow.com/questions)`;

    const result = parseText(text);
    assert.equal(result.length, 1);
    assert.equal(result[0].props.left, '0');
    assert.equal(result[0].urls.length, 3);
    assert.equal(result[0].urls[0].url, 'https://google.com');
    assert.equal(result[0].urls[0].pinned, true);
    assert.equal(result[0].urls[1].url, 'https://github.com/user/project');
    assert.equal(result[0].urls[1].active, true);
    assert.equal(result[0].urls[2].url, 'https://stackoverflow.com/questions');
  });

  it('parses markdown links with query params', () => {
    const text = `[Outlook](https://www.microsoft.com/en-us/outlook?deeplink=%2Fmail%2F0%2F&sdf=0)`;
    const result = parseText(text);
    assert.equal(result[0].urls[0].url, 'https://www.microsoft.com/en-us/outlook?deeplink=%2Fmail%2F0%2F&sdf=0');
  });

  it('handles markdown link with pinned and active on same tab', () => {
    const text = `[Google](https://google.com) [pinned] [active]`;
    const result = parseText(text);
    assert.equal(result[0].urls[0].url, 'https://google.com');
    assert.equal(result[0].urls[0].pinned, true);
    assert.equal(result[0].urls[0].active, true);
  });
});
