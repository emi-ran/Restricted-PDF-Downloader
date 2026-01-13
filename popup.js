const SPEED = 200; // Hızlı mod
let driveTabs = [];
let isClassroomPage = false;
let currentTab = null;

// Sayfa yüklendiğinde Drive sekmelerini bul ve Classroom kontrolü yap
(async function init() {
  const tabs = await chrome.tabs.query({});
  const activeTabs = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  currentTab = activeTabs[0];

  driveTabs = tabs.filter(
    (tab) =>
      tab.url?.startsWith("https://drive.google.com") &&
      tab.url.match(/\/view(\?|$)/)
  );

  if (driveTabs.length > 1) {
    document.getElementById("batchButton").style.display = "flex";
    document.getElementById("tabCount").textContent = driveTabs.length;
  }

  // Classroom kontrolü - /w/ içeren URL'ler
  isClassroomPage =
    currentTab?.url?.startsWith("https://classroom.google.com") &&
    currentTab?.url?.includes("/w/");

  if (isClassroomPage) {
    // Materyal sayısını al
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: countClassroomMaterials,
      });
      const count = result[0]?.result || 0;
      if (count > 0) {
        document.getElementById("classroomButton").style.display = "flex";
        document.getElementById("materialCount").textContent = count;
      }
    } catch (e) {
      console.error("Classroom sayısı alınamadı:", e);
    }
  }
})();

// Content script: Classroom materyallerini say
function countClassroomMaterials() {
  const materials = document.querySelectorAll(
    'li.tfGBod[data-stream-item-type="5"]'
  );
  return materials.length;
}

// Content script: Tüm materyalleri yükle ve linklerini al
function getAllClassroomMaterialLinks() {
  return new Promise(async (resolve) => {
    // "Daha fazla görüntüle" butonuna tıkla (varsa)
    const loadMoreBtn = document.querySelector('button[jsname="t6Kl7b"]');
    if (loadMoreBtn) {
      loadMoreBtn.click();
      await new Promise((r) => setTimeout(r, 1500));
    }

    // Tüm materyalleri bul
    const materials = document.querySelectorAll(
      'li.tfGBod[data-stream-item-type="5"]'
    );

    // Her materyali genişlet (expand)
    for (const material of materials) {
      const expandBtn = material.querySelector(
        '[jsname="rQC7Ie"][aria-expanded="false"]'
      );
      if (expandBtn) {
        expandBtn.click();
        await new Promise((r) => setTimeout(r, 300));
      }
    }

    // Tüm materyallerin yüklenmesini bekle
    await new Promise((r) => setTimeout(r, 1000));

    // Tüm Drive linklerini topla
    const links = [];
    materials.forEach((material) => {
      const driveLinks = material.querySelectorAll(
        'a[href*="drive.google.com/file"]'
      );
      driveLinks.forEach((link) => {
        const href = link.getAttribute("href");
        if (href && !links.includes(href)) {
          links.push(href);
        }
      });
    });

    resolve(links);
  });
}

// Tekli indirme fonksiyonu (content script olarak çalışır)
function runPdfDownload(speed) {
  const documentName = (document.title || "Document").trim().split(".pdf")[0];

  const progressDiv = document.createElement("div");
  progressDiv.id = "pdf-downloader-toast";

  progressDiv.style.cssText = `
    position: fixed; top: 20px; right: 20px; min-width: 300px;
    background: white;
    color: #1e293b; 
    padding: 16px; border-radius: 12px;
    font-family: -apple-system, system-ui, sans-serif; 
    z-index: 2147483647;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
    border: 1px solid #e2e8f0;
    display: flex; flex-direction: column; gap: 8px;
    opacity: 0; transform: translateY(-20px);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  `;

  progressDiv.innerHTML = `
    <div style="display:flex; align-items:center; gap:8px;">
      <span style="font-size:20px;">📄</span>
      <div style="display:flex; flex-direction:column; overflow:hidden;">
        <div style="font-weight:600; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:220px;">${documentName}</div>
        <div id="pdf-dl-status" style="font-size:12px; color:#64748b;">Başlatılıyor...</div>
      </div>
    </div>
    <div style="width:100%; height:4px; background:#f1f5f9; border-radius:2px; overflow:hidden; margin-top:4px;">
      <div id="pdf-dl-bar" style="width:0%; height:100%; background:linear-gradient(90deg, #3b82f6, #2563eb); border-radius:2px; transition:width 0.3s ease;"></div>
    </div>
  `;

  document.body.appendChild(progressDiv);

  setTimeout(() => {
    progressDiv.style.opacity = "1";
    progressDiv.style.transform = "translateY(0)";
  }, 10);

  const statusEl = document.getElementById("pdf-dl-status");
  const barEl = document.getElementById("pdf-dl-bar");

  const updateStatus = (text, progress = null) => {
    if (statusEl) statusEl.textContent = text;
    if (progress !== null && barEl) barEl.style.width = `${progress}%`;
  };

  (async () => {
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

        const count = getLoadedImages().length;
        updateStatus(`Sayfalar taranıyor... (${count} bulundu)`);

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

      let progress = 0;
      if (totalPages) {
        progress = Math.round((currentCount / totalPages) * 100);
        updateStatus(`${currentCount}/${totalPages} sayfa yüklendi`, progress);
      } else {
        updateStatus(`${currentCount} sayfa yüklendi`);
      }

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
      statusEl.style.color = "#ef4444";
      barEl.style.background = "#ef4444";
      updateStatus("Hata: Görsel bulunamadı!");
      setTimeout(() => {
        progressDiv.style.opacity = "0";
        progressDiv.style.transform = "translateY(-20px)";
        setTimeout(() => progressDiv.remove(), 300);
      }, 3000);
      return;
    }

    updateStatus(`PDF oluşturuluyor...`, 100);

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

      barEl.style.background = "#10b981";
      statusEl.style.color = "#10b981";
      updateStatus("İndirme Tamamlandı!", 100);

      setTimeout(() => {
        progressDiv.style.opacity = "0";
        progressDiv.style.transform = "translateY(-20px)";
        setTimeout(() => progressDiv.remove(), 300);
      }, 2000);
    } catch (error) {
      barEl.style.background = "#ef4444";
      statusEl.style.color = "#ef4444";
      updateStatus("Hata: " + error.message);
      setTimeout(() => {
        progressDiv.style.opacity = "0";
        progressDiv.style.transform = "translateY(-20px)";
        setTimeout(() => progressDiv.remove(), 300);
      }, 4000);
    }
  })();
}

// Hata toast'ı göster (content script olarak)
function showErrorToast(message) {
  // Backdrop (Arkaplan karartma ve blur)
  const backdrop = document.createElement("div");
  backdrop.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(8px);
    z-index: 2147483646;
    opacity: 0;
    transition: opacity 0.3s ease;
  `;
  document.body.appendChild(backdrop);

  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%) scale(0.9);
    min-width: 320px; max-width: 400px;
    background: rgba(255, 255, 255, 0.98);
    color: #1e293b; padding: 32px; border-radius: 20px; text-align: center;
    font-family: -apple-system, system-ui, sans-serif; 
    z-index: 2147483647;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    opacity: 0;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  `;

  toast.innerHTML = `
    <div style="font-size:48px; margin-bottom:20px;">⚠️</div>
    <div style="font-size:20px; font-weight:700; margin-bottom:12px; color:#1e293b;">Geçersiz Sayfa</div>
    <div style="font-size:15px; color:#64748b; line-height:1.6;">${message}</div>
  `;
  document.body.appendChild(toast);

  // Giriş animasyonu
  setTimeout(() => {
    backdrop.style.opacity = "1";
    toast.style.opacity = "1";
    toast.style.transform = "translate(-50%, -50%) scale(1)";
  }, 10);

  // Çıkış animasyonu
  setTimeout(() => {
    backdrop.style.opacity = "0";
    toast.style.opacity = "0";
    toast.style.transform = "translate(-50%, -50%) scale(0.9)";
    setTimeout(() => {
      backdrop.remove();
      toast.remove();
    }, 300);
  }, 3500);
}

// Tekli indirme butonu
document.getElementById("convertButton").addEventListener("click", async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const currentTab = tabs[0];

  // Aktif sekme Drive PDF değilse hata göster
  const isValidDriveUrl =
    currentTab?.url?.startsWith("https://drive.google.com") &&
    currentTab?.url?.match(/\/view(\?|$)/);

  if (!isValidDriveUrl) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: showErrorToast,
        args: [
          "Bu eklenti sadece <b>Google Drive PDF Görüntüleyici</b> sayfalarında çalışır.",
        ],
      });
    } catch (e) {
      document.body.innerHTML = `
        <div style="padding:40px 20px; text-align:center; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
          <div style="font-size:48px; margin-bottom:16px;">🚫</div>
          <div style="font-weight:700; font-size:16px; margin-bottom:8px; color:#1e293b;">Çalıştırılamadı</div>
          <div style="font-size:13px; color:#64748b; line-height:1.5;">Bu sayfada eklenti çalıştırılamaz.<br>Lütfen bir Google Drive sekmesine geçin.</div>
        </div>
      `;
      return;
    }
    window.close();
    return;
  }

  await chrome.scripting.executeScript({
    target: { tabId: currentTab.id },
    files: ["assets/jspdf.umd.min.js"],
  });

  await chrome.scripting.executeScript({
    target: { tabId: currentTab.id },
    function: runPdfDownload,
    args: [SPEED],
  });

  window.close();
});

// Toplu indirme butonu
document.getElementById("batchButton").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "openBatchWindow" });
  window.close();
});

// Classroom materyalleri butonu
document
  .getElementById("classroomButton")
  .addEventListener("click", async () => {
    if (!currentTab) return;

    const btn = document.getElementById("classroomButton");
    const originalText = btn.innerHTML;

    // Loading state
    btn.disabled = true;
    btn.innerHTML = `<span>⏳ Materyaller yükleniyor...</span>`;
    btn.style.opacity = "0.7";
    btn.style.cursor = "not-allowed";

    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId: currentTab.id },
        function: getAllClassroomMaterialLinks,
      });

      const links = result[0]?.result || [];

      if (links.length === 0) {
        btn.innerHTML = `<span>❌ Materyal bulunamadı</span>`;
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.disabled = false;
          btn.style.opacity = "1";
          btn.style.cursor = "pointer";
        }, 2000);
        return;
      }

      btn.innerHTML = `<span>📂 ${links.length} sekme açılıyor...</span>`;

      // Tüm linkleri yeni sekmelerde aç
      for (const link of links) {
        await chrome.tabs.create({ url: link, active: false });
      }

      window.close();
    } catch (e) {
      console.error("Materyaller açılamadı:", e);
      btn.innerHTML = `<span>❌ Hata oluştu</span>`;
      setTimeout(() => {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.style.cursor = "pointer";
      }, 2000);
    }
  });
