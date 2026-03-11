let aborted = false;
let granted = false;

// On installation, set side panel to open on action click
chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// Listen for messages from side panel
chrome.runtime.onMessage.addListener((message) => {
  console.log("loaded background.js onMessage listener");
  if (message.type === 'startExport') {
    aborted = false;
    performExport(message.options);
  } else if (message.type === 'stopExport') {
    aborted = true;
  }
});

// Sleep helper
function sleep(ms) {
  console.log("loaded background.js sleep helper");
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Check if a URL is restricted
function isRestricted(url) {
  console.log("loaded background.js isRestricted");
  const restrictedPrefixes = ['chrome://', 'edge://', 'about:', 'devtools://'];
  for (let prefix of restrictedPrefixes) {
    if (url.startsWith(prefix)) return true;
  }
  // Check for PDF URLs
  if (url.toLowerCase().endsWith('.pdf')) return true;
  return false;
}

// Main export function
async function performExport(options) {
  console.log("loaded background.js performExport");
  try {
    const tabs = await chrome.tabs.query({ currentWindow: true });
    const totalTabs = tabs.length;
    let exportData = [];

    // Check permissions to access tab content if required
    if (options.descriptions || options.bodytext || options.screenshots) {
      granted = await chrome.permissions.contains({
        origins: ["<all_urls>"]
      });
    }

    // Process each tab
    for (let i = 0; i < totalTabs; i++) {
      if (aborted) {
        chrome.runtime.sendMessage({ type: 'done', text: 'Export aborted by user' });
        break;
      }

      const tab = tabs[i];
      console.log("Processing tab:", tab.title, "with favIconUrl:", tab.favIconUrl);

      let entry = {
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        note: '',
        screenshot: options.screenshots ? 'Pending' : '',
        description: options.descriptions ? 'Pending' : '',
        bodytext: options.bodytext ? 'Pending' : ''
      };

      // Skip restricted URLs
      if (isRestricted(tab.url)) {
        entry.note += "Skipped restricted URL.";
        exportData.push(entry);
        continue;
      }

      if (!granted && (options.descriptions || options.bodytext || options.screenshots)) {
        console.warn("Permission to access all URLs was denied.");
        entry.note = "Permission to access page content was denied.";
      } else {
        // Capture screenshot if enabled
        if (options.screenshots) {
          try {
            await chrome.windows.update(tab.windowId, { focused: true });
            await chrome.tabs.update(tab.id, { active: true });
            await sleep(1000);

            const screenshot = await chrome.tabs.captureVisibleTab(undefined, { format: 'png' });
            entry.screenshot = screenshot || "Screenshot capture failed";
          } catch (error) {
            console.error("Error capturing screenshot:", error);
            chrome.runtime.sendMessage({ type: 'done', text: 'Error capturing screenshot: ' + error.message });
            entry.screenshot = null;
            entry.note += "Failed to capture screenshot. ";
          }
        }


        // If Descriptions option is enabled, inject content script to extract
        if (options.descriptions) {
          try {
            const [injection] = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                return (
                  document.querySelector('meta[name="description"]')?.content ||
                  document.querySelector('meta[property="og:description"]')?.content ||
                  document.querySelector('meta[name="twitter:description"]')?.content ||
                  document.querySelector('p')?.innerText ||
                  "no description found"
                );
              }
            });

            entry.description = injection.result;
          } catch (error) {
            console.error("Failed to extract description:", error.message);
            entry.note += "Failed to extract description. ", error.message;
          }
        }

        // If Body Text option is enabled, inject content script to extract
        if (options.bodytext) {
          try {
            const [injection] = await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => {
                return document.body?.innerText || "";
              }
            });
            console.log("Injected Result:", injection.result);

            entry.bodytext = injection.result || "no body text found";

          } catch (e) {
            console.error("Failed to extract body text:", e);
            entry.note += "Failed to extract body text. ";
          }
        }
        /* Future refactors:
            Consider batching scripting executions to reduce overhead
            Abstract these conditional statements into separate functions for clarity
        */
      }

      // Finalize entry
      exportData.push(entry);
      const percent = Math.round(((i + 1) / totalTabs) * 100);
      chrome.runtime.sendMessage({ type: 'progress', text: `Processing: ${tab.title}`, percent });
    }

    // Complete the export
    if (!aborted) {
      chrome.storage.local.set({ exportData }, () => {
        chrome.runtime.sendMessage({ type: 'done', text: 'Export completed successfully' });
        chrome.tabs.create({ url: 'report.html' });
      });
    } else {
      chrome.storage.local.set({ exportData }, () => {
        chrome.runtime.sendMessage({ type: 'done', text: 'Export aborted, partial results saved' });
      });
    }
  } catch (error) {
    chrome.runtime.sendMessage({ type: 'done', text: 'Error during export process' + error.message });
  }
}
