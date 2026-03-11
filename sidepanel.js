// Set default options
const defaultOptions = {
  screenshots: false,
  descriptions: false,
  bodytext: false,
  maxScreenshots: 5
};

// DOM elements
const screenshotsCheckbox = document.getElementById('screenshots');
const descriptionsCheckbox = document.getElementById('descriptions');
const bodytextCheckbox = document.getElementById('bodytext');
const maxScreenshotsInput = document.getElementById('maxScreenshots');
const exportBtn = document.getElementById('exportBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');
const progressBar = document.getElementById('progressBar');

// Load options from chrome.storage.sync
function loadOptions() {
  console.log("loaded sidepanel.js loadOptions");
  chrome.storage.sync.get(defaultOptions, (options) => {
    screenshotsCheckbox.checked = options.screenshots;
    descriptionsCheckbox.checked = options.descriptions;
    bodytextCheckbox.checked = options.bodytext;
    maxScreenshotsInput.value = options.maxScreenshots;
  });
}

// Save options to chrome.storage.sync
function saveOptions() {
  console.log("loaded sidepanel.js saveOptions");
  const options = {
    screenshots: screenshotsCheckbox.checked,
    descriptions: descriptionsCheckbox.checked,
    bodytext: bodytextCheckbox.checked,
    maxScreenshots: Number(maxScreenshotsInput.value)
  };
  chrome.storage.sync.set(options);
}

// Update UI status and progress
function updateStatus(text, percent) {
  console.log("loaded sidepanel.js updateStatus");
  statusDiv.textContent = `Status: ${text}`;
  progressBar.style.width = `${percent}%`;
}

// Listen for messages from background (progress updates, done message)
chrome.runtime.onMessage.addListener((message) => {
  console.log("loaded sidepanel.js addlistener message");
  if (message.type === 'progress') {
    updateStatus(message.text, message.percent);
  } else if (message.type === 'done') {
    updateStatus(message.text, 100);
    // Re-enable export button and disable stop button
    exportBtn.disabled = false;
    stopBtn.disabled = true;
  }
});

// Start export process
exportBtn.addEventListener('click', async () => {
  console.log("loaded sidepanel.js add event listener click");
  saveOptions();
  exportBtn.disabled = true;
  stopBtn.disabled = false;
  updateStatus('Export started', 0);
  // Get options
  const options = {
    screenshots: screenshotsCheckbox.checked,
    descriptions: descriptionsCheckbox.checked,
    bodytext: bodytextCheckbox.checked,
    maxScreenshots: Number(maxScreenshotsInput.value)
  }; 
  // Request permissions if necessary
  if (options.descriptions || options.bodytext || options.screenshots) {
    granted = await chrome.permissions.request({
      origins: ["<all_urls>"]
    });
  }
  // Send message to background to start export
  chrome.runtime.sendMessage({
    type: 'startExport',
    options
  });
});

// Stop/Abort export process
stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'stopExport' });
  updateStatus('Export aborted', 0);
  exportBtn.disabled = false;
  stopBtn.disabled = true;
});

// Initial load
loadOptions();