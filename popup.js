let selectedSpeed = 400;
let driveTabs = [];

// Sayfa yüklendiğinde Drive sekmelerini bul
(async function init() {
  const tabs = await chrome.tabs.query({});
  driveTabs = tabs.filter(
    (tab) =>
      tab.url?.startsWith("https://drive.google.com") &&
      tab.url.match(/\/view(\?|$)/)
  );

  if (driveTabs.length > 1) {
    document.getElementById("batchButton").style.display = "block";
    document.getElementById("tabCount").textContent = driveTabs.length;
  }
})();

// Hız seçimi
document.querySelectorAll(".speed-box").forEach((box) => {
  box.addEventListener("click", () => {
    document
      .querySelectorAll(".speed-box")
      .forEach((b) => b.classList.remove("selected"));
    box.classList.add("selected");
    selectedSpeed = parseInt(box.dataset.speed);
  });
});

// Tekli indirme fonksiyonu (content script olarak çalışır)
function runPdfDownload(speed) {
  const documentName = (document.title || "Document").trim().split(".pdf")[0];

  // Progress göstergesi
  const progressDiv = document.createElement("div");
  progressDiv.id = "pdf-download-progress";
  progressDiv.style.cssText = `
    position: fixed; top: 20px; right: 20px; min-width: 280px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white; padding: 16px; border-radius: 10px;
    font-family: -apple-system, sans-serif; z-index: 999999;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  `;
  progressDiv.innerHTML = `<div style="font-weight:600;margin-bottom:8px;">📄 ${documentName}</div><div id="pdf-dl-status">Yükleniyor...</div>`;
  document.body.appendChild(progressDiv);

  const statusEl = document.getElementById("pdf-dl-status");
  const updateStatus = (text) => {
    if (statusEl) statusEl.textContent = text;
  };

  (async () => {
    // Scroll container bul
    let chosenElement = null;
    let maxHeight = 0;
    document.querySelectorAll("*").forEach((el) => {
      if (el.scrollHeight >= el.clientHeight && el.scrollHeight > maxHeight) {
        maxHeight = el.scrollHeight;
        chosenElement = el;
      }
    });

    const checkURLString = "blob:https://drive.google.com/";

    function getLoadedImages() {
      return [...document.getElementsByTagName("img")].filter(
        (img) =>
          img.src.startsWith(checkURLString) &&
          img.complete &&
          img.naturalHeight > 0
      );
    }

    // Scroll ve yükle
    if (chosenElement) {
      const totalHeight = chosenElement.scrollHeight;
      const scrollStep = chosenElement.clientHeight * 1.2;
      let currentScroll = 0;

      while (currentScroll < totalHeight) {
        currentScroll += scrollStep;
        chosenElement.scrollTo(0, currentScroll);
        updateStatus(`Kaydırılıyor... (${getLoadedImages().length} sayfa)`);
        await new Promise((r) => setTimeout(r, speed / 2));
      }
      chosenElement.scrollTo(0, totalHeight);
    }

    // Toplam sayfa sayısını al ve bekle
    const totalPageEl = document.querySelector('span[jsname="Dt5gRb"]');
    const totalPages = totalPageEl ? parseInt(totalPageEl.textContent) : null;

    const maxWait = 60000;
    let waited = 0;
    let lastCount = 0;
    let stableCount = 0;

    while (waited < maxWait) {
      await new Promise((r) => setTimeout(r, speed));
      waited += speed;

      const currentCount = getLoadedImages().length;
      updateStatus(
        totalPages
          ? `${currentCount}/${totalPages} sayfa yüklendi`
          : `${currentCount} sayfa yüklendi`
      );

      if (totalPages && currentCount >= totalPages) break;
      if (!totalPages) {
        if (currentCount === lastCount) stableCount++;
        else {
          stableCount = 0;
          lastCount = currentCount;
        }
        if (stableCount >= 5 && currentCount > 0) break;
      }
    }

    const loadedImages = getLoadedImages();
    if (loadedImages.length === 0) {
      progressDiv.style.background =
        "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)";
      updateStatus("Görsel bulunamadı!");
      setTimeout(() => progressDiv.remove(), 3000);
      return;
    }

    // PDF oluştur
    updateStatus(`PDF oluşturuluyor (${loadedImages.length} sayfa)...`);

    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
      });
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();

      for (let i = 0; i < loadedImages.length; i++) {
        const img = loadedImages[i];
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        ctx.drawImage(img, 0, 0);

        const imgData = canvas.toDataURL("image/jpeg", 0.92);
        const imgRatio = img.naturalWidth / img.naturalHeight;
        let imgWidth = pdfWidth;
        let imgHeight = imgWidth / imgRatio;

        if (imgHeight > pdfHeight) {
          imgHeight = pdfHeight;
          imgWidth = imgHeight * imgRatio;
        }

        if (i > 0) doc.addPage();
        doc.addImage(
          imgData,
          "JPEG",
          (pdfWidth - imgWidth) / 2,
          (pdfHeight - imgHeight) / 2,
          imgWidth,
          imgHeight
        );
      }

      doc.save(documentName + ".pdf");

      progressDiv.style.background =
        "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)";
      updateStatus("✓ İndirildi!");
      setTimeout(() => progressDiv.remove(), 2000);
    } catch (error) {
      progressDiv.style.background =
        "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)";
      updateStatus("Hata: " + error.message);
      setTimeout(() => progressDiv.remove(), 4000);
    }
  })();
}

// Tekli indirme butonu
document.getElementById("convertButton").addEventListener("click", async () => {
  // Aktif Drive sekmesini bul
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  let targetTab = tabs[0];

  // Eğer aktif sekme Drive değilse, ilk Drive sekmesini kullan
  if (!targetTab?.url?.startsWith("https://drive.google.com")) {
    if (driveTabs.length > 0) {
      targetTab = driveTabs[0];
      await chrome.tabs.update(targetTab.id, { active: true });
    } else {
      alert("Açık Google Drive PDF sekmesi bulunamadı!");
      return;
    }
  }

  await chrome.scripting.executeScript({
    target: { tabId: targetTab.id },
    files: ["assets/jspdf.umd.min.js"],
  });

  await chrome.scripting.executeScript({
    target: { tabId: targetTab.id },
    function: runPdfDownload,
    args: [selectedSpeed],
  });

  window.close(); // Popup'ı kapat
});

// Toplu indirme butonu - pencere aç
document.getElementById("batchButton").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "openBatchWindow" });
  window.close();
});
