document
  .getElementById("downloadButton")
  .addEventListener("click", function () {
    window.open(
      "https://github.com/emi-ran/tpdf-to-pdf/releases/download/tpdfconverter/Converter.exe",
      "_blank"
    );
  });
document.getElementById("convertButton").addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      function: autoScrollAndGeneratePDF,
    });
  });
});

// Renamed function to avoid duplicate declaration
function autoScrollAndGeneratePDF() {
  const currentURL = window.location.href; // Sayfanın URL'sini al
  // URL kontrolü
  if (
    !currentURL.startsWith("https://drive.google.com") ||
    !currentURL.endsWith("/view")
  ) {
    alert("Lütfen geçerli bir pdf sayfası açınız!"); // Uyarı mesajı
    return; // Fonksiyonu sonlandır
  }

  alert("İndirme işlemi başlatılıyor"); // İndirme işlemi mesajı

  const documentName = (document.title || "Document").trim();
  let processedDocumentName = documentName.split(".pdf")[0]; // .pdf varsa, onu ve sonrasını sil
  let documentContent = "";

  function generatePDFDataFile() {
    const imgTags = document.getElementsByTagName("img");
    const checkURLString = "blob:https://drive.google.com/";
    let validImgTagCounter = 0;

    for (let i = 0; i < imgTags.length; i++) {
      if (
        imgTags[i].src.substring(0, checkURLString.length) === checkURLString
      ) {
        validImgTagCounter++;
        const img = imgTags[i];
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        context.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
        const imgDataURL = canvas.toDataURL();

        documentContent += documentContent ? "\n" + imgDataURL : imgDataURL;
      }
    }

    const anchorElement = document.createElement("a");
    const file = new Blob([documentContent], { type: "text/plain" });
    const url = URL.createObjectURL(file);
    anchorElement.href = url;
    anchorElement.download = processedDocumentName + ".tpdf"; // Güncellenmiş isim
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
  }

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

  if (
    chosenElement &&
    chosenElement.scrollHeight > chosenElement.clientHeight
  ) {
    console.log("Auto Scroll");
    const scrollDistance = Math.round(chosenElement.clientHeight / 2);
    let loopCounter = 0;

    function myLoop(remainingHeightToScroll, scrollToLocation) {
      loopCounter++;
      console.log(loopCounter);

      setTimeout(function () {
        if (remainingHeightToScroll === 0) {
          scrollToLocation = scrollDistance;
          chosenElement.scrollTo(0, scrollToLocation);
          remainingHeightToScroll = chosenElement.scrollHeight - scrollDistance;
        } else {
          scrollToLocation = scrollToLocation + scrollDistance;
          chosenElement.scrollTo(0, scrollToLocation);
          remainingHeightToScroll = remainingHeightToScroll - scrollDistance;
        }

        if (remainingHeightToScroll >= chosenElement.clientHeight) {
          myLoop(remainingHeightToScroll, scrollToLocation);
        } else {
          setTimeout(function () {
            generatePDFDataFile();
          }, 1500);
        }
      }, 400);
    }

    myLoop(0, 0);
  } else {
    console.log("No Scroll");
    setTimeout(function () {
      generatePDFDataFile();
    }, 1500);
  }
}
