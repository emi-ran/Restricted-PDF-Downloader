// Toplu indirme penceresi ID'sini takip et
let batchWindowId = null;

// Mesaj dinle - popup'tan gelen "openBatchWindow" mesajı
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "openBatchWindow") {
    if (batchWindowId !== null) {
      // Pencere zaten açıksa öne getir
      chrome.windows.update(batchWindowId, { focused: true }, (win) => {
        if (chrome.runtime.lastError) {
          // Pencere kapanmış, yeniden aç
          batchWindowId = null;
          openBatchWindow();
        }
      });
    } else {
      openBatchWindow();
    }
  } else if (message.action === "focusBatchWindow") {
    if (batchWindowId !== null) {
      chrome.windows.update(batchWindowId, { focused: true });
    }
  }
});

function openBatchWindow() {
  chrome.windows.create(
    {
      url: chrome.runtime.getURL("batch.html"),
      type: "popup",
      width: 350,
      height: 380,
    },
    (win) => {
      batchWindowId = win.id;
    }
  );
}

// Pencere kapandığında ID'yi temizle
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === batchWindowId) {
    batchWindowId = null;
  }
});
