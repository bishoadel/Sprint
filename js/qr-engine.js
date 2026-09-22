/**
 * Toma el Rasol - QR Code Generator & Batch Exporter Engine
 */

window.TomaQR = {
  // Get Target User Portal URL for a Child
  getUserPortalUrl: function (childCode) {
    let baseUrl = window.location.origin + window.location.pathname;
    // Replace admin/index.html or Toma_elrasol.html with user/index.html
    baseUrl = baseUrl.replace(/\/(admin|Toma_elrasol\.html|index\.html).*/, '/user/index.html');
    if (!baseUrl.endsWith('/user/index.html')) {
      baseUrl = window.location.origin + '/user/index.html';
    }
    return `${baseUrl}?id=${encodeURIComponent(childCode)}`;
  },

  // Render QR Code into a target DOM Element ID
  renderQRCode: function (containerId, childCode, width = 180) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = ''; // Clear existing
    const url = this.getUserPortalUrl(childCode);

    // If QRCode.js library is available from CDN
    if (typeof QRCode !== 'undefined') {
      new QRCode(container, {
        text: url,
        width: width,
        height: width,
        colorDark: "#0D2040",
        colorLight: "#FFFFFF",
        correctLevel: QRCode.CorrectLevel.H
      });
    } else {
      // SVG / Canvas Fallback via Google Chart QR API or Canvas element
      const qrImg = document.createElement('img');
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=${width}x${width}&data=${encodeURIComponent(url)}&color=0D2040`;
      qrImg.alt = `QR Code for ${childCode}`;
      qrImg.style.borderRadius = '8px';
      container.appendChild(qrImg);
    }
  },

  // Download Single QR Code image
  downloadQR: function (containerId, childCode) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const img = container.querySelector('img') || container.querySelector('canvas');
    if (!img) return;

    let imageSrc = '';
    if (img.tagName === 'CANVAS') {
      imageSrc = img.toDataURL("image/png");
    } else {
      imageSrc = img.src;
    }

    const a = document.createElement('a');
    a.href = imageSrc;
    a.download = `QRCode_${childCode}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  // Batch Export All QR Codes into a downloaded ZIP file
  exportAllQRCodesZip: async function () {
    const children = await TomaDB.getChildren();

    if (!children || children.length === 0) {
      TomaUtils.showToast('No registered children found to export QR codes.', 'warning');
      return;
    }

    if (typeof JSZip === 'undefined' || typeof saveAs === 'undefined') {
      TomaUtils.showToast('ZIP Exporter libraries are loading, please try again.', 'error');
      return;
    }

    TomaUtils.showToast(`Generating ${children.length} QR Code images for ZIP export...`, 'info');

    const zip = new JSZip();
    const qrFolder = zip.folder("Toma_el_Rasol_QRCodes");

    // Off-screen canvas helper for generating PNG blobs
    const canvas = document.createElement('canvas');
    const size = 300;
    canvas.width = size;
    canvas.height = size;

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const url = this.getUserPortalUrl(child.child_code);

      // Create QR Code image blob
      const qrDataUrl = await new Promise((resolve) => {
        const tempDiv = document.createElement('div');
        if (typeof QRCode !== 'undefined') {
          new QRCode(tempDiv, {
            text: url,
            width: size,
            height: size,
            colorDark: "#0D2040",
            colorLight: "#FFFFFF",
            correctLevel: QRCode.CorrectLevel.H
          });
          setTimeout(() => {
            const canvasOrImg = tempDiv.querySelector('canvas') || tempDiv.querySelector('img');
            if (canvasOrImg.tagName === 'CANVAS') {
              resolve(canvasOrImg.toDataURL("image/png"));
            } else {
              resolve(canvasOrImg.src);
            }
          }, 50);
        } else {
          resolve(`https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&color=0D2040`);
        }
      });

      // Convert Data URL to base64 for JSZip
      let base64Data = '';
      if (qrDataUrl.startsWith('data:image/png;base64,')) {
        base64Data = qrDataUrl.replace(/^data:image\/png;base64,/, '');
      } else {
        // Fetch image blob if remote URL
        const response = await fetch(qrDataUrl);
        const blob = await response.blob();
        base64Data = await new Promise((res) => {
          const reader = new FileReader();
          reader.onloadend = () => res(reader.result.replace(/^data:.+;base64,/, ''));
          reader.readAsDataURL(blob);
        });
      }

      // Format filename as Name_ChildID.png (e.g. "Ahmed Boutros_CH-0001.png")
      const safeName = child.name.replace(/[\/\\?%*:|"<>]/g, '_');
      const filename = `${safeName}_${child.child_code}.png`;

      qrFolder.file(filename, base64Data, { base64: true });
    }

    // Generate ZIP file and trigger download
    const zipBlob = await zip.generateAsync({ type: "blob" });
    saveAs(zipBlob, "Toma_el_Rasol_Children_QRCodes.zip");

    TomaUtils.showToast(`Export Complete! Downloaded ZIP containing ${children.length} QR Code images.`, 'success');
  }
};
