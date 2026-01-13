let selectedSpeed = 400;
let driveTabs = [];

// Sayfa yüklendiğinde Google Drive sekmelerini bul
(async function detectDriveTabs() {
  const tabs = await chrome.tabs.query({ currentWindow: true });
  driveTabs = tabs.filter(
    (tab) =>
      tab.url &&
      tab.url.startsWith("https://drive.google.com") &&
      tab.url.match(/\/view(\?|$)/)
  );

  if (driveTabs.length > 1) {
    document.getElementById("batchButton").style.display = "block";
    document.getElementById("tabCount").textContent = driveTabs.length;
  }
})();

document.querySelectorAll(".speed-box").forEach((box) => {
  box.addEventListener("click", () => {
    document.querySelectorAll(".speed-box").forEach((b) => {
      b.classList.remove("selected");
    });

    box.classList.add("selected");

    selectedSpeed = parseInt(box.dataset.speed);
  });
});

// Toplu indirme fonksiyonu
async function processBatchDownload() {
  const batchStatus = document.getElementById("batchStatus");
  const batchButton = document.getElementById("batchButton");
  batchButton.disabled = true;
  batchButton.textContent = "İndiriliyor...";
  batchStatus.style.display = "block";

  for (let i = 0; i < driveTabs.length; i++) {
    const tab = driveTabs[i];
    batchStatus.textContent = `${i + 1}/${driveTabs.length}: ${
      tab.title || "Sekme"
    } işleniyor...`;

    // Sekmeyi aktif yap
    await chrome.tabs.update(tab.id, { active: true });

    // Biraz bekle (sekme yüklensin)
    await new Promise((r) => setTimeout(r, 500));

    // Script'i çalıştır ve tamamlanmasını bekle
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["assets/jspdf.umd.min.js"],
      });

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: runPdfDownload,
        args: [selectedSpeed],
      });

      // İndirme tamamlanana kadar bekle (progress container kaybolana kadar)
      // Maksimum 120 saniye bekle
      const maxWait = 120000;
      const checkInterval = 1000;
      let waited = 0;

      while (waited < maxWait) {
        await new Promise((r) => setTimeout(r, checkInterval));
        waited += checkInterval;

        // Progress container hala var mı kontrol et
        const result = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: () =>
            !!document.getElementById("pdf-download-progress-container"),
        });

        // Progress container yoksa indirme tamamlanmış demektir
        if (!result[0]?.result) {
          await new Promise((r) => setTimeout(r, 1000)); // Biraz bekle
          break;
        }

        batchStatus.textContent = `${i + 1}/${driveTabs.length}: ${
          tab.title || "Sekme"
        } - ${Math.round(waited / 1000)}s...`;
      }
    } catch (err) {
      console.error(`Tab ${tab.id} error:`, err);
      batchStatus.textContent = `${i + 1}/${
        driveTabs.length
      }: Hata! Sonrakine geçiliyor...`;
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  batchStatus.textContent = `Tamamlandı! ${driveTabs.length} dosya işlendi.`;
  batchButton.textContent = `Toplu İndir (${driveTabs.length} sekme)`;
  batchButton.disabled = false;
}

document
  .getElementById("batchButton")
  .addEventListener("click", processBatchDownload);

// PDF indirme fonksiyonu - hem tekli hem toplu indirmede kullanılır
function runPdfDownload(speed) {
  function autoScrollAndGeneratePDF() {
    const currentURL = window.location.href;

    if (
      !currentURL.startsWith("https://drive.google.com") ||
      !currentURL.match(/\/view(\?|$)/)
    ) {
      // Modern hata bildirimi göster
      const errorNotification = document.createElement("div");
      errorNotification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        min-width: 400px;
        max-width: 500px;
        background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%);
        color: white;
        padding: 0;
        border-radius: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        z-index: 999999;
        box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3);
        animation: errorPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        overflow: hidden;
      `;

      const errorStyle = document.createElement("style");
      errorStyle.textContent = `
        @keyframes errorPop {
          0% {
            transform: translate(-50%, -50%) scale(0.7);
            opacity: 0;
          }
          100% {
            transform: translate(-50%, -50%) scale(1);
            opacity: 1;
          }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-10px); }
          75% { transform: translateX(10px); }
        }
      `;
      document.head.appendChild(errorStyle);

      const errorContent = document.createElement("div");
      errorContent.style.cssText = `
        padding: 30px;
        text-align: center;
      `;

      const errorIcon = document.createElement("div");
      errorIcon.style.cssText = `
        font-size: 64px;
        margin-bottom: 20px;
        line-height: 1;
        animation: shake 0.5s ease-in-out;
      `;
      errorIcon.textContent = "⚠️";

      const errorTitle = document.createElement("div");
      errorTitle.style.cssText = `
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 16px;
        line-height: 1.3;
      `;
      errorTitle.textContent = "Geçersiz Sayfa!";

      const errorMessage = document.createElement("div");
      errorMessage.style.cssText = `
        font-size: 14px;
        line-height: 1.6;
        opacity: 0.95;
        margin-bottom: 20px;
      `;
      errorMessage.innerHTML = `
        Bu uzantı sadece Google Drive PDF görüntüleyicide çalışır.<br>
        <br>
        <strong>Gerekli URL formatı:</strong><br>
        <code style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 4px; font-size: 12px;">
          https://drive.google.com/.../view
        </code>
      `;

      const closeButton = document.createElement("button");
      closeButton.style.cssText = `
        background: rgba(255,255,255,0.9);
        color: #eb3349;
        border: none;
        padding: 12px 32px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
      `;
      closeButton.textContent = "Anladım";

      closeButton.onmouseover = () => {
        closeButton.style.background = "white";
        closeButton.style.transform = "scale(1.05)";
      };
      closeButton.onmouseout = () => {
        closeButton.style.background = "rgba(255,255,255,0.9)";
        closeButton.style.transform = "scale(1)";
      };
      closeButton.onclick = () => {
        errorNotification.style.animation = "errorPop 0.2s reverse";
        setTimeout(() => errorNotification.remove(), 200);
      };

      errorContent.appendChild(errorIcon);
      errorContent.appendChild(errorTitle);
      errorContent.appendChild(errorMessage);
      errorContent.appendChild(closeButton);
      errorNotification.appendChild(errorContent);
      document.body.appendChild(errorNotification);

      // 8 saniye sonra otomatik kapat
      setTimeout(() => {
        if (document.body.contains(errorNotification)) {
          errorNotification.style.animation = "errorPop 0.2s reverse";
          setTimeout(() => errorNotification.remove(), 200);
        }
      }, 8000);

      return;
    }

    const documentName = (document.title || "Document").trim();
    let processedDocumentName = documentName.split(".pdf")[0];

    // Modern progress göstergesi oluştur
    const progressContainer = document.createElement("div");
    progressContainer.id = "pdf-download-progress-container";
    progressContainer.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      min-width: 320px;
      max-width: 400px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 0;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      z-index: 999999;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2);
      animation: slideIn 0.3s ease-out;
      overflow: hidden;
    `;

    // Animasyon tanımla
    const style = document.createElement("style");
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(400px);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(400px);
          opacity: 0;
        }
      }
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `;
    document.head.appendChild(style);

    const progressContent = document.createElement("div");
    progressContent.style.cssText = `
      padding: 20px;
    `;

    const progressHeader = document.createElement("div");
    progressHeader.style.cssText = `
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    `;

    const spinnerIcon = document.createElement("div");
    spinnerIcon.id = "progress-icon";
    spinnerIcon.textContent = "⚡";
    spinnerIcon.style.cssText = `
      font-size: 24px;
      animation: pulse 1.5s ease-in-out infinite;
    `;

    const progressTitle = document.createElement("div");
    progressTitle.id = "progress-title";
    progressTitle.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      flex: 1;
    `;
    progressTitle.textContent = "PDF İndiriliyor";

    progressHeader.appendChild(spinnerIcon);
    progressHeader.appendChild(progressTitle);

    const progressMessage = document.createElement("div");
    progressMessage.id = "progress-message";
    progressMessage.style.cssText = `
      font-size: 13px;
      opacity: 0.9;
      line-height: 1.4;
      margin-bottom: 12px;
    `;
    progressMessage.textContent = "İndirme işlemi başlatılıyor...";

    const progressBarContainer = document.createElement("div");
    progressBarContainer.style.cssText = `
      width: 100%;
      height: 4px;
      background: rgba(255,255,255,0.2);
      border-radius: 2px;
      overflow: hidden;
    `;

    const progressBar = document.createElement("div");
    progressBar.id = "progress-bar";
    progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #fff, #f0f0f0);
      border-radius: 2px;
      transition: width 0.3s ease;
    `;

    progressBarContainer.appendChild(progressBar);
    progressContent.appendChild(progressHeader);
    progressContent.appendChild(progressMessage);
    progressContent.appendChild(progressBarContainer);
    progressContainer.appendChild(progressContent);
    document.body.appendChild(progressContainer);

    function updateProgress(message, percent = null, icon = "⚡") {
      progressMessage.textContent = message;
      spinnerIcon.textContent = icon;

      if (percent !== null) {
        progressBar.style.width = percent + "%";
      }
    }

    async function generatePDF(images) {
      try {
        updateProgress(
          `PDF oluşturuluyor... (${images.length} sayfa)`,
          10,
          "📄"
        );

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "px",
          format: "a4",
        });

        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = doc.internal.pageSize.getHeight();

        for (let i = 0; i < images.length; i++) {
          const progress = 10 + Math.round((i / images.length) * 70);
          updateProgress(
            `Sayfa ${i + 1}/${images.length} işleniyor...`,
            progress,
            "⚙️"
          );

          const img = images[i];
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          context.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);

          const imgData = canvas.toDataURL("image/jpeg", 0.95);

          const imgRatio = img.naturalWidth / img.naturalHeight;
          let imgWidth = pdfWidth;
          let imgHeight = imgWidth / imgRatio;

          if (imgHeight > pdfHeight) {
            imgHeight = pdfHeight;
            imgWidth = imgHeight * imgRatio;
          }

          const x = (pdfWidth - imgWidth) / 2;
          const y = (pdfHeight - imgHeight) / 2;

          if (i > 0) {
            doc.addPage();
          }

          doc.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);

          // Her 5 sayfada bir kısa pause (UI donmaması için)
          if (i % 5 === 0 && i > 0) {
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
        }

        updateProgress("PDF kaydediliyor...", 90, "💾");
        doc.save(processedDocumentName + ".pdf");

        updateProgress("İndirme tamamlandı!", 100, "✅");
        progressContainer.style.background =
          "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)";
        setTimeout(() => {
          progressContainer.style.animation = "slideOut 0.3s ease-out";
          setTimeout(() => progressContainer.remove(), 300);
        }, 2000);
      } catch (error) {
        console.error("PDF generation error:", error);
        updateProgress("Hata oluştu!", 0, "❌");
        progressContainer.style.background =
          "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)";

        // Detaylı hata mesajı ekle
        const errorDetail = document.createElement("div");
        errorDetail.style.cssText = `
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(0,0,0,0.2);
          border-radius: 6px;
          font-size: 11px;
          font-family: monospace;
          word-break: break-word;
        `;
        errorDetail.textContent = error.message;
        progressContent.appendChild(errorDetail);

        setTimeout(() => progressContainer.remove(), 5000);
      }
    }

    // Scroll container'ı bul
    const allElements = document.querySelectorAll("*");
    let chosenElement = null;
    let heightOfScrollableElement = 0;

    for (let i = 0; i < allElements.length; i++) {
      if (allElements[i].scrollHeight >= allElements[i].clientHeight) {
        if (heightOfScrollableElement < allElements[i].scrollHeight) {
          heightOfScrollableElement = allElements[i].scrollHeight;
          chosenElement = allElements[i];
        }
      }
    }

    const checkURLString = "blob:https://drive.google.com/";
    let loadedImages = [];
    let lastImageCount = 0;
    let stableCount = 0;

    function checkImages() {
      const imgTags = document.getElementsByTagName("img");
      loadedImages = [];

      for (let i = 0; i < imgTags.length; i++) {
        if (
          imgTags[i].src.substring(0, checkURLString.length) ===
            checkURLString &&
          imgTags[i].complete &&
          imgTags[i].naturalHeight > 0
        ) {
          loadedImages.push(imgTags[i]);
        }
      }

      return loadedImages.length;
    }

    async function smartScroll() {
      if (!chosenElement) {
        // Scroll yoksa direkt işle
        updateProgress("Görüntüler yükleniyor...", 5, "🔍");
        await new Promise((resolve) => setTimeout(resolve, 1500));

        const count = checkImages();
        if (count > 0) {
          await generatePDF(loadedImages);
        } else {
          updateProgress("Dönüştürülecek görsel bulunamadı!", 0, "❌");
          progressContainer.style.background =
            "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)";

          // Bilgilendirme mesajı ekle
          const infoMessage = document.createElement("div");
          infoMessage.style.cssText = `
            margin-top: 8px;
            padding: 8px 12px;
            background: rgba(0,0,0,0.2);
            border-radius: 6px;
            font-size: 12px;
          `;
          infoMessage.textContent =
            "Lütfen sayfayı yeniden yükleyip tekrar deneyin.";
          progressContent.appendChild(infoMessage);

          setTimeout(() => progressContainer.remove(), 4000);
        }
        return;
      }

      updateProgress("Sayfalar yükleniyor...", 0, "📥");

      // Hızlı scroll stratejisi: Büyük adımlarla scroll et
      const totalHeight = chosenElement.scrollHeight;
      const viewHeight = chosenElement.clientHeight;
      const scrollStep = viewHeight * 1.5; // Daha büyük adımlar
      let currentScroll = 0;

      async function scrollNext() {
        currentScroll += scrollStep;

        if (currentScroll < totalHeight) {
          chosenElement.scrollTo(0, currentScroll);
          const currentCount = checkImages();
          const scrollProgress = Math.min(
            Math.round((currentScroll / totalHeight) * 100),
            100
          );
          updateProgress(
            `Yükleniyor... (${currentCount} sayfa bulundu)`,
            Math.min(scrollProgress * 0.08, 8),
            "📥"
          );

          // Daha kısa bekleme süresi
          await new Promise((resolve) => setTimeout(resolve, speed / 2));
          await scrollNext();
        } else {
          // Sona geldi, en alta scroll et
          chosenElement.scrollTo(0, totalHeight);
          await new Promise((resolve) => setTimeout(resolve, 500));

          // Tüm görüntülerin yüklendiğinden emin ol
          await waitForAllImages();
        }
      }

      await scrollNext();
    }

    async function waitForAllImages() {
      updateProgress("Tüm görüntüler kontrol ediliyor...", 8, "🔍");

      // Google Drive'dan toplam sayfa sayısını al
      const totalPageElement = document.querySelector('span[jsname="Dt5gRb"]');
      const totalPages = totalPageElement
        ? parseInt(totalPageElement.textContent)
        : null;

      if (totalPages) {
        updateProgress(`Toplam ${totalPages} sayfa bekleniyor...`, 8, "🔍");
      }

      // Maksimum bekleme: 60 saniye (hız ayarına göre)
      const maxAttempts = Math.ceil(60000 / speed);
      const waitTime = speed;

      for (let i = 0; i < maxAttempts; i++) {
        const currentCount = checkImages();

        const checkProgress =
          8 +
          Math.round((currentCount / (totalPages || currentCount || 1)) * 2);

        if (totalPages) {
          updateProgress(
            `${currentCount}/${totalPages} sayfa yüklendi...`,
            checkProgress,
            "🔍"
          );

          // Tüm sayfalar yüklendiyse devam et
          if (currentCount >= totalPages) {
            await generatePDF(loadedImages);
            return;
          }
        } else {
          // Toplam sayfa bilinmiyorsa stabilite kontrolü yap
          if (currentCount === lastImageCount) {
            stableCount++;
          } else {
            stableCount = 0;
            lastImageCount = currentCount;
          }

          updateProgress(
            `${currentCount} sayfa bulundu...`,
            checkProgress,
            "🔍"
          );

          // 5 kez üst üste aynı sayıda kaldıysa yükleme tamamlandı
          if (stableCount >= 5 && currentCount > 0) {
            await generatePDF(loadedImages);
            return;
          }
        }

        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }

      // Timeout: Yine de bulunanları işle
      if (loadedImages.length > 0) {
        const msg = totalPages
          ? `Zaman aşımı! ${loadedImages.length}/${totalPages} sayfa ile devam ediliyor...`
          : `${loadedImages.length} sayfa ile devam ediliyor...`;
        updateProgress(msg, 9, "⚠️");
        await new Promise((resolve) => setTimeout(resolve, 1000));
        await generatePDF(loadedImages);
      } else {
        updateProgress("Dönüştürülecek görsel bulunamadı!", 0, "❌");
        progressContainer.style.background =
          "linear-gradient(135deg, #eb3349 0%, #f45c43 100%)";

        // Bilgilendirme mesajı ekle
        const infoMessage = document.createElement("div");
        infoMessage.style.cssText = `
          margin-top: 8px;
          padding: 8px 12px;
          background: rgba(0,0,0,0.2);
          border-radius: 6px;
          font-size: 12px;
        `;
        infoMessage.textContent =
          "Sayfayı yeniden yükleyip biraz bekledikten sonra tekrar deneyin.";
        progressContent.appendChild(infoMessage);

        setTimeout(() => progressContainer.remove(), 4000);
      }
    }

    smartScroll();
  }
  autoScrollAndGeneratePDF();
}

document.getElementById("convertButton").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting
      .executeScript({
        target: { tabId: tabs[0].id },
        files: ["assets/jspdf.umd.min.js"],
      })
      .then(() => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: runPdfDownload,
          args: [selectedSpeed],
        });
      })
      .catch((err) => {
        console.error("Script injection error:", err);
      });
  });
});
