let tableMode = false;

// Render the report
async function render() {
  console.log("loaded report.js render"); 

  // get favicon URL for special icons
  const fontAwesomeUrl = "https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.5.0/svgs/solid/";
  const iconMap = {
    pdf: "https://icons.getbootstrap.com/assets/icons/filetype-pdf.svg",
    default: "https://icons.getbootstrap.com/assets/icons/globe.svg"
  };

  const { exportData } = await chrome.storage.local.get("exportData");
  const { screenshots, descriptions, bodytext } = await chrome.storage.sync.get([
    "screenshots",
    "descriptions",
    "bodytext"
  ]);

  const container = document.getElementById("report");
  container.innerHTML = "";

  if (!exportData) return;

  if (tableMode) {
    // Table format
    const table = document.createElement("table");
    const header = table.insertRow();

    // Always show Title + URL
    ["Title", "URL"].forEach(h => {
      const th = document.createElement("th");
      th.textContent = h;
      header.appendChild(th);
    });

    // Conditionally add Description/Body
    if (descriptions) {
      const th = document.createElement("th");
      th.textContent = "Description";
      header.appendChild(th);
    }
    if (bodytext) {
      const th = document.createElement("th");
      th.textContent = "Body";
      header.appendChild(th);
    }

    // Screenshot/Note column
    const thScreenshot = document.createElement("th");
    thScreenshot.textContent = "Screenshot / Note";
    header.appendChild(thScreenshot);

    exportData.forEach(item => {
      const row = table.insertRow();
      const titleCell = row.insertCell();
      titleCell.textContent = item.title;
      const icon = document.createElement("img");
      icon.className = "favicon";
      icon.height = 16;
      icon.width = 16;

      // Set favicon with fallback logic for pdf and default
      if (item.favIconUrl) {
        console.log("loaded report.js set favicon from favIconUrl");
        icon.src = item.favIconUrl;
      } else if (item.url && item.url.toLowerCase().endsWith(".pdf")) {
        console.log("loaded report.js set favicon to pdf icon");
        icon.src = iconMap.pdf;
      } else {
        console.log("loaded report.js set favicon to default icon");
        icon.src = iconMap.default;
      }
      
      titleCell.prepend(icon);
      row.insertCell().textContent = item.url;

      if (descriptions) {
        row.insertCell().textContent = item.description || "";
      }
      if (bodytext) {
        row.insertCell().textContent = item.bodytext || "";
      }
      
      // Screenshot or note
      const imgCell = row.insertCell();
      if (item.screenshot) {
        const img = document.createElement("img");
        img.src = item.screenshot;
        img.style.maxWidth = "200px";
        imgCell.appendChild(img);
      } else if (item.note) {
        imgCell.textContent = item.note;
      }
    });

    container.appendChild(table);
  } else {
    console.log("loaded report.js render list format (else)");
    // List format with favicon + title + URL
    exportData.forEach(item => {
      const entryDiv = document.createElement("div");
      entryDiv.className = "entry-div";

      const detailsDiv = document.createElement("div");
      detailsDiv.className = "sub-entry-div";
      detailsDiv.className = "details-div";

      // icon
      const iconDiv = document.createElement("div");
      iconDiv.className = "icon-div";
      const icon = document.createElement("img");
      icon.className = "favicon";
      if (item.favIconUrl) {
        console.log("loaded report.js set favicon from favIconUrl");
        icon.src = item.favIconUrl;
      } else if (item.url && item.url.toLowerCase().endsWith(".pdf")) {
        console.log("loaded report.js set favicon to pdf icon");
        icon.src = iconMap.pdf;
      } else {
        console.log("loaded report.js set favicon to default icon");
        icon.src = iconMap.default;
      }
      iconDiv.appendChild(icon);

      // title line (icon inline with title)
      const titleLine = document.createElement("div");
      titleLine.className = "title-line";
      // titleLine.appendChild(icon);
      const titleText = document.createElement("span");
      titleText.textContent = " " + item.title;
      titleLine.appendChild(titleText);

      // url line
      const urlLine = document.createElement("div");
      urlLine.className = "url-line";
      const urlText = document.createElement("span");
      urlText
      urlText.textContent = `<${item.url}>`;
      urlLine.appendChild(urlText);

      detailsDiv.appendChild(titleLine);
      detailsDiv.appendChild(urlLine);

      if (descriptions && item.description) {
        const desc = document.createElement("div");
        desc.textContent = 'Description: ' +item.description;
        detailsDiv.appendChild(desc);
      }
      if (bodytext && item.bodytext) {
        const body = document.createElement("div");
        body.textContent = 'Body Text: ' + item.bodytext;
        detailsDiv.appendChild(body);
      }

      const screenshotNoteDiv = document.createElement("div");
      screenshotNoteDiv.className = "sub-entry-div";
      // note if available
      if (item.note) {
        const note = document.createElement("div");
        note.className = "note-line";
        note.textContent = item.note;
        screenshotNoteDiv.appendChild(note);
      }
      // screenshot if available
      if (item.screenshot) {
        const imgDiv = document.createElement("div");
        imgDiv.className = "screenshotDiv";
        const img = document.createElement("img");
        img.className = "screenshot";
        img.src = item.screenshot;
        imgDiv.appendChild(img);
        screenshotNoteDiv.appendChild(imgDiv);
      }
      
      entryDiv.appendChild(iconDiv);
      entryDiv.appendChild(detailsDiv);
      entryDiv.appendChild(screenshotNoteDiv)
      container.appendChild(entryDiv); 
    });
  }
}

document.getElementById("toggleFormat").addEventListener("click", () => {
  console.log("loaded report.js toggleFormat click");
  tableMode = !tableMode;
  document.getElementById("toggleFormat").textContent = tableMode ? "Switch to List View" : "Switch to Table View";
  render();
});

// Request clipboard permission if not already granted
async function ensureClipboardPermission() {
  console.log("loaded report.js ensureClipboardPermission");
  return new Promise(resolve => {
    chrome.permissions.request(
      { permissions: ["clipboardWrite"] },
      granted => resolve(granted)
    );
  });
}

// Copy all content to clipboard
document.getElementById("copyAll").addEventListener("click", async () => {
  console.log("loaded report.js copyAll click");
  const granted = await ensureClipboardPermission();
  if (!granted) {
    alert("❌ Clipboard permission not granted. Please copy manually (Ctrl+A, Ctrl+C).");
    return;
  }

  const container = document.getElementById("report");
  const range = document.createRange();
  range.selectNode(container);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(range);
  document.execCommand("copy");
  alert("✅ Copied report to clipboard!");
});

render();
