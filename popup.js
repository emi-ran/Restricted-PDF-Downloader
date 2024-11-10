let selectedSpeed = 400;

document.querySelectorAll(".speed-box").forEach((box) => {
  box.addEventListener("click", () => {
    document.querySelectorAll(".speed-box").forEach((b) => {
      b.classList.remove("selected");
    });

    box.classList.add("selected");

    selectedSpeed = parseInt(box.dataset.speed);
  });
});

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
          function: (speed) => {
            function autoScrollAndGeneratePDF() {
              const currentURL = window.location.href;

              if (
                !currentURL.startsWith("https://drive.google.com") ||
                !currentURL.endsWith("/view")
              ) {
                alert("Geçerli bir PDF sayfası açmadınız.");
                return;
              }

              alert("İndirme işlemi başlatılıyor");

              const documentName = (document.title || "Document").trim();
              let processedDocumentName = documentName.split(".pdf")[0];

              async function generatePDF() {
                try {
                  const { jsPDF } = window.jspdf;
                  const doc = new jsPDF({
                    orientation: "portrait",
                    unit: "px",
                    format: "a4",
                  });

                  const imgTags = document.getElementsByTagName("img");
                  const checkURLString = "blob:https://drive.google.com/";
                  let validImgTagCounter = 0;
                  let pageCounter = 0;

                  for (let i = 0; i < imgTags.length; i++) {
                    if (
                      imgTags[i].src.substring(0, checkURLString.length) ===
                      checkURLString
                    ) {
                      validImgTagCounter++;
                      const img = imgTags[i];

                      const canvas = document.createElement("canvas");
                      const context = canvas.getContext("2d");
                      canvas.width = img.naturalWidth;
                      canvas.height = img.naturalHeight;
                      context.drawImage(
                        img,
                        0,
                        0,
                        img.naturalWidth,
                        img.naturalHeight
                      );

                      const imgData = canvas.toDataURL("image/jpeg", 0.95);

                      const pdfWidth = doc.internal.pageSize.getWidth();
                      const pdfHeight = doc.internal.pageSize.getHeight();

                      const imgRatio = img.naturalWidth / img.naturalHeight;
                      let imgWidth = pdfWidth;
                      let imgHeight = imgWidth / imgRatio;

                      if (imgHeight > pdfHeight) {
                        imgHeight = pdfHeight;
                        imgWidth = imgHeight * imgRatio;
                      }

                      const x = (pdfWidth - imgWidth) / 2;
                      const y = (pdfHeight - imgHeight) / 2;

                      if (pageCounter > 0) {
                        doc.addPage();
                      }

                      doc.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);
                      pageCounter++;
                    }
                  }

                  if (validImgTagCounter > 0) {
                    doc.save(processedDocumentName + ".pdf");
                  } else {
                    alert("Dönüştürülecek görsel bulunamadı!");
                  }
                } catch (error) {
                  console.error("PDF generation error:", error);
                  alert("PDF oluşturulurken bir hata oluştu: " + error.message);
                }
              }

              const allElements = document.querySelectorAll("*");
              let chosenElement = null;
              let heightOfScrollableElement = 0;

              for (let i = 0; i < allElements.length; i++) {
                if (
                  allElements[i].scrollHeight >= allElements[i].clientHeight
                ) {
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
                const scrollDistance = Math.round(
                  chosenElement.clientHeight / 2
                );
                let loopCounter = 0;

                function myLoop(remainingHeightToScroll, scrollToLocation) {
                  loopCounter++;
                  console.log(loopCounter);

                  setTimeout(function () {
                    if (remainingHeightToScroll === 0) {
                      scrollToLocation = scrollDistance;
                      chosenElement.scrollTo(0, scrollToLocation);
                      remainingHeightToScroll =
                        chosenElement.scrollHeight - scrollDistance;
                    } else {
                      scrollToLocation = scrollToLocation + scrollDistance;
                      chosenElement.scrollTo(0, scrollToLocation);
                      remainingHeightToScroll =
                        remainingHeightToScroll - scrollDistance;
                    }

                    if (remainingHeightToScroll >= chosenElement.clientHeight) {
                      myLoop(remainingHeightToScroll, scrollToLocation);
                    } else {
                      setTimeout(function () {
                        generatePDF();
                      }, 500);
                    }
                  }, speed);
                }

                myLoop(0, 0);
              } else {
                console.log("No Scroll");
                setTimeout(function () {
                  generatePDF();
                }, 1500);
              }
            }
            autoScrollAndGeneratePDF();
          },
          args: [selectedSpeed],
        });
      })
      .catch((err) => {
        console.error("Script injection error:", err);
      });
  });
});
