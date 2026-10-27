const modelViewer = document.getElementById('aircraftViewer');
const arScene = document.getElementById('arScene');
const arAircraft = document.getElementById('arAircraft');
const arGroundPlane = document.getElementById('arGroundPlane');
const arToggleBtn = document.getElementById('arToggleBtn');
const shutterBtn = document.getElementById('shutterBtn');
const statusHint = document.getElementById('statusHint');
const flash = document.getElementById('flash');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');

let isARActive = false;

// 1. Loading Bar for model-viewer
if (modelViewer) {
  modelViewer.addEventListener('progress', (event) => {
    const percentage = event.detail.totalProgress * 100;
    if (progressFill) progressFill.style.width = `${percentage}%`;
    if (percentage >= 100 && progressBar) {
      setTimeout(() => progressBar.classList.add('hide'), 200);
    }
  });
}

// 2. Direct AR Toggle Handler
if (arToggleBtn) {
  arToggleBtn.addEventListener('click', () => {
    if (!isARActive) {
      // --- SWITCH TO AR ---
      isARActive = true;
      arToggleBtn.textContent = 'Exit AR';
      statusHint.textContent = 'Tap floor or table to place sculpture';

      // Hide & pause model-viewer
      modelViewer.classList.add('exhibit-hidden');
      modelViewer.removeAttribute('auto-rotate');

      // Unhide A-Frame scene
      arScene.classList.remove('ar-hidden');
      arAircraft.setAttribute('visible', 'false');

      // Start 8th Wall AR Engine
      if (window.XR8) {
        arScene.setAttribute('xrweb', 'allowedDevices: any;');
      } else {
        console.warn('XR8 not detected; starting default WebXR');
        arScene.setAttribute('webxr', '');
      }
    } else {
      // --- EXIT AR MODE ---
      isARActive = false;
      arToggleBtn.textContent = 'View in Space (AR)';
      statusHint.textContent = 'Drag to rotate • Pinch to zoom';

      // Stop camera tracking and hide AR scene
      if (window.XR8 && typeof XR8.stop === 'function') {
        XR8.stop();
      }
      arScene.removeAttribute('xrweb');
      arScene.classList.add('ar-hidden');

      // Unhide model-viewer and resume auto-rotation
      modelViewer.classList.remove('exhibit-hidden');
      modelViewer.setAttribute('auto-rotate', '');
    }
  });
}

// 3. AR Surface Tap-to-Place
if (arGroundPlane && arAircraft) {
  arGroundPlane.addEventListener('click', (event) => {
    if (!isARActive) return;

    const touchPoint = event.detail.intersection ? event.detail.intersection.point : null;
    if (touchPoint) {
      arAircraft.setAttribute('position', touchPoint);
      arAircraft.setAttribute('visible', 'true');
      statusHint.textContent = 'Pinch to scale • Twist two fingers to rotate';
    }
  });
}

// 4. Viewport Screenshot Capture
if (shutterBtn) {
  shutterBtn.addEventListener('click', async () => {
    if (flash) {
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 120);
    }

    try {
      let downloadUrl = null;

      if (!isARActive && modelViewer) {
        const blob = await modelViewer.toBlob({
          mimeType: 'image/png',
          idealAspect: true,
          qualityArgument: 1.0
        });
        downloadUrl = URL.createObjectURL(blob);
      } else if (isARActive && arScene && arScene.renderer) {
        arScene.render();
        const canvas = arScene.renderer.domElement;
        const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
        if (blob) downloadUrl = URL.createObjectURL(blob);
      }

      if (downloadUrl) {
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = `Chrome_Aircraft_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      }
    } catch (err) {
      console.error('Snapshot failed:', err);
    }
  });
}