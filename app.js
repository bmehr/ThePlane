const modelViewer = document.getElementById('aircraftViewer');
const arScene = document.getElementById('arScene');
const arAircraft = document.getElementById('arAircraft');
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

// 2. WebXR AR Session Trigger
if (arToggleBtn && arScene) {
  arToggleBtn.addEventListener('click', async () => {
    if (!isARActive) {
      // --- SWITCH TO AR ---
      isARActive = true;
      arToggleBtn.textContent = 'Exit AR';
      statusHint.textContent = 'Aim at floor or table to place sculpture';

      // Pause exhibit viewer
      modelViewer.classList.add('exhibit-hidden');
      if (typeof modelViewer.pause === 'function') {
        modelViewer.pause();
      }

      // Show A-Frame scene
      arScene.classList.remove('ar-hidden');

      // Request WebXR Immersive AR mode directly from browser
      if (arScene.enterVR) {
        arScene.enterVR();
      }
    } else {
      // --- EXIT AR MODE ---
      isARActive = false;
      arToggleBtn.textContent = 'View in Space (AR)';
      statusHint.textContent = 'Drag to rotate • Pinch to zoom';

      if (arScene.exitVR) {
        arScene.exitVR();
      }

      arScene.classList.add('ar-hidden');

      // Unhide model-viewer
      modelViewer.classList.remove('exhibit-hidden');
      if (typeof modelViewer.play === 'function') {
        modelViewer.play();
      }
    }
  });

  // Listen for AR session events
  arScene.addEventListener('enter-vr', () => {
    if (arScene.is('ar-mode')) {
      statusHint.textContent = 'Scanning room... Move phone slowly';
    }
  });

  arScene.addEventListener('exit-vr', () => {
    if (isARActive) {
      arToggleBtn.click(); // Reset state if user exits via Android back button
    }
  });
}

// 3. WebXR Hit-Test Placement Event
if (arScene && arAircraft) {
  arScene.addEventListener('ar-hit-test-select', () => {
    arAircraft.setAttribute('visible', 'true');
    statusHint.textContent = 'Object placed! Walk around to inspect';
  });
}

// 4. Viewport Snapshot Capture
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