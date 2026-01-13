const SPEED = 200; // Hızlı mod
let driveTabs = [];

// Sayfa yüklendiğinde Drive sekmelerini bul
(async function init() {
  const tabs = await chrome.tabs.query({});
  driveTabs = tabs.filter(
    (tab) =>
      tab.url?.startsWith("https://drive.google.com") &&
      tab.url.match(/\/view(\?|$)/)
  );
  document.getElementById("tabCount").textContent = driveTabs.length;

  if (driveTabs.length === 0) {
    document.getElementById("statusText").textContent =
      "Açık Google Drive PDF sekmesi bulunamadı!";
    document.getElementById("startBtn").disabled = true;
  }
})();

function updateStatus(text, progress = null) {
  document.getElementById("statusText").textContent = text;
  if (progress !== null) {
    document.getElementById("progressFill").style.width = progress + "%";
  }
}

// Content script: PDF oluştur ve base64 döndür
function generatePdfBase64(speed) {
  return new Promise(async (resolve) => {
    const documentName = (document.title || "Document").trim().split(".pdf")[0];

    const progressDiv = document.createElement("div");
    progressDiv.id = "pdf-batch-progress";
    progressDiv.style.cssText = `
      position: fixed; top: 20px; right: 20px; min-width: 280px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; padding: 16px; border-radius: 10px;
      font-family: -apple-system, sans-serif; z-index: 999999;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    `;
    progressDiv.innerHTML = `<div style="font-weight:600;margin-bottom:8px;">📄 ${documentName}</div><div id="pdf-batch-status">Yükleniyor...</div>`;
    document.body.appendChild(progressDiv);

    const statusEl = document.getElementById("pdf-batch-status");
    const updateStatus = (text) => {
      if (statusEl) statusEl.textContent = text;
    };

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
          ? `${currentCount}/${totalPages} sayfa`
          : `${currentCount} sayfa`
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
      progressDiv.remove();
      resolve(null);
      return;
    }

    updateStatus(`PDF oluşturuluyor...`);

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

      const pdfBase64 = doc.output("datauristring").split(",")[1];

      progressDiv.style.background =
        "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)";
      updateStatus("✓ Tamamlandı!");
      setTimeout(() => progressDiv.remove(), 1000);

      resolve({ pdfBase64, fileName: documentName });
    } catch (error) {
      progressDiv.remove();
      resolve(null);
    }
  });
}

// Toplu indirme başlat
async function startBatchDownload() {
  const startBtn = document.getElementById("startBtn");
  startBtn.disabled = true;
  startBtn.textContent = "İşleniyor...";

  const pdfFiles = [];
  let firstFileName = null;

  for (let i = 0; i < driveTabs.length; i++) {
    const tab = driveTabs[i];
    const progress = Math.round(((i + 1) / driveTabs.length) * 90);
    updateStatus(
      `${i + 1}/${driveTabs.length}: ${
        tab.title?.substring(0, 30) || "PDF"
      }...`,
      progress
    );

    try {
      await chrome.windows.update(tab.windowId, { focused: true });
      await chrome.tabs.update(tab.id, { active: true });
      await new Promise((r) => setTimeout(r, 500));

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["assets/jspdf.umd.min.js"],
      });

      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: generatePdfBase64,
        args: [SPEED],
      });

      if (result[0]?.result) {
        const { pdfBase64, fileName } = result[0].result;
        pdfFiles.push({ name: fileName + ".pdf", data: pdfBase64 });
        if (!firstFileName) firstFileName = fileName;
      }
    } catch (err) {
      console.error(`Tab error:`, err);
    }
  }

  if (pdfFiles.length > 0) {
    updateStatus(`ZIP oluşturuluyor (${pdfFiles.length} dosya)...`, 95);

    const zip = new JSZip();
    for (const file of pdfFiles) {
      zip.file(file.name, file.data, { base64: true });
    }

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (firstFileName || "pdf_collection") + ".zip";
    a.click();
    URL.revokeObjectURL(url);

    updateStatus(`✓ Tamamlandı! ${pdfFiles.length} PDF indirildi.`, 100);
    startBtn.textContent = "✓ Tamamlandı";
    startBtn.classList.add("btn-success");
  } else {
    updateStatus("Hiçbir PDF oluşturulamadı!", 0);
    startBtn.disabled = false;
    startBtn.textContent = `🚀 Tekrar Dene`;
  }
}

document
  .getElementById("startBtn")
  .addEventListener("click", startBatchDownload);
