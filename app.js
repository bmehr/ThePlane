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

// 2. Hybrid Mode Switcher (Resolves GPU conflicts & black screen)
if (arToggleBtn) {
  arToggleBtn.addEventListener('click', async () => {
    if (!isARActive) {
      // --- SWITCH TO AR ---
      isARActive = true;
      arToggleBtn.textContent = 'Exit AR';
      statusHint.textContent = 'Tap floor or table to place sculpture';

      // 1. Relieve mobile WebGL pressure: pause model-viewer rendering
      modelViewer.classList.add('exhibit-hidden');
      if (typeof modelViewer.pause === 'function') {
        modelViewer.pause();
      }

      // 2. Reveal A-Frame scene with transparent background for camera passthrough
      arScene.classList.remove('ar-hidden');
      arAircraft.setAttribute('visible', 'false');

      // 3. Ensure the underlying WebGL renderer is set to transparent
      if (arScene.renderer) {
        arScene.renderer.setClearColor(0x000000, 0);
      }

      // 4. Start 8th Wall tracking pipeline
      if (window.XR8) {
        if (typeof XR8.resume === 'function') {
          XR8.resume();
        } else if (typeof XR8.run === 'function') {
          XR8.run({ canvas: arScene.renderer ? arScene.renderer.domElement : undefined });
        }
      }
    } else {
      // --- EXIT AR MODE ---
      isARActive = false;
      arToggleBtn.textContent = 'View in Space (AR)';
      statusHint.textContent = 'Drag to rotate • Pinch to zoom';

      // Stop 8th Wall camera stream to free hardware resources
      if (window.XR8 && typeof XR8.pause === 'function') {
        XR8.pause();
      }

      arScene.classList.add('ar-hidden');

      // Unhide model-viewer and resume playback
      modelViewer.classList.remove('exhibit-hidden');
      if (typeof modelViewer.play === 'function') {
        modelViewer.play();
      }
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