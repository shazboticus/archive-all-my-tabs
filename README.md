# TabEx
Chromium extension (developed using Microsoft Edge) designed to export links, icons, and titles from each tab in the active window. 

User options include the ability to export from each tab: 
- the full text (inner text), 
- a screenshot, and
- a description.

## User Flow
(after installing extension and enabling)
1. Select the extension (sidebar opens)
2. Select optional extras, specify maximum screenshots 
3. Select "Export Tabs" Button
4. Wait for export to complete (after completion, report should load in a new tab)
5. Peruse export report, optionally display as table
6. Save as HTML / print as PDF / copy and paste into external application

## Structure

### manifest.json
- Details of extension
- Permissions required/optional

### background.js
- Code that runs in the background getting data and icons, etc

### sidepanel.js/html
- Displays options for selection
- Buttons for export and abort
- Shows notes on usage

### report.js/html
- Displays report after completion of export
- Allows toggle of view from list to table

## Caveats
- This is not fully tested for most edge cases or any browser other than MS Edge
- Due to memory/API query limitations, recommend against using Screenshots in a window with more than 25 tabs
- Additional permissions may be requested if options are selected
- If tabs are not loaded, the screenshot/description/body text may not be captured - recommend loading all tabs before exporting
