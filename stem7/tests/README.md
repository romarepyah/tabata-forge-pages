# Browser checks

`browser.cjs` serves the saved STEM 7 site on localhost and drives a real
headless browser. It requires Node.js and Playwright; Edge is the default.
Use `STEM7_PLAYWRIGHT_MODULE` to select an already installed Playwright module
and `STEM7_BROWSER_CHANNEL` to select a different installed browser channel.

Run from the repository: `node stem7/tests/browser.cjs`.

Checks cover all 50 rebuilt topics: mobile topic selection; range controls
at both extremes; empty, incorrect and correct numeric input (comma and Unicode
minus included); conceptual multi-select answers; sequential mission steps;
reload; legacy progress retention; repeated-answer protection; both lesson
entry paths; navigation at 360, 390, 768 and 1280 px; equation balance buttons;
all required offline scripts; JavaScript page errors. Representative SVG
screenshots are written to a temporary directory.

On 2026-10-10, the complete browser run passed with 300 practice answers,
50 models, 100 conceptual questions and 100 mission stages. The unchanged
equation module also passed its earlier 8-answer and balance-step checks.
Mobile screenshots were inspected; the mobile header was made non-sticky
to stop it covering lesson headings while scrolling, and navigation was
checked again after that CSS change.

These checks validate saved answers and interaction behavior. They do not
replace human review of lesson quality or assert playback of authenticated
VSHO videos. Source verification is described in `../LESSON-SOURCES.md`.

## Biology and chemistry, cache v24

`node stem7/tests/natural.browser.cjs` checks all 25 added topics, 150 practice tasks, 50 conceptual questions, 50 mission steps, all activities, legacy progress and offline loading. `node stem7/tests/natural.visual.cjs` checks SVG text bounds and captures topic-specific diagrams. Both use the same Playwright environment variables as the original runner. The original runner continues to test the 50 mathematics, geometry, physics and STEM topics separately.
