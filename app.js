const viewer = document.getElementById('aircraftViewer');
const shutterBtn = document.getElementById('shutterBtn');
const customArBtn = document.getElementById('customArBtn');
const nativeArBtn = document.getElementById('nativeArBtn');
const flash = document.getElementById('flash');
const progressBar = document.getElementById('progressBar');
const progressFill = document.getElementById('progressFill');

// 1. Loading Progress Tracking
viewer.addEventListener('progress', (event) => {
  const percentage = event.detail.totalProgress * 100;
  if (progressFill) {
    progressFill.style.width = `${percentage}%`;
  }
  if (percentage >= 100 && progressBar) {
    setTimeout(() => {
      progressBar.classList.add('hide');
    }, 250);
  }
});

// 2. AR Activation Handler
if (customArBtn) {
  customArBtn.addEventListener('click', async () => {
    try {
      // Ensure element definition is ready before calling activateAR
      await customElements.whenDefined('model-viewer');

      if (typeof viewer.activateAR === 'function') {
        await viewer.activateAR();
      } else if (nativeArBtn) {
        nativeArBtn.click();
      }
    } catch (err) {
      console.warn('activateAR() failed, attempting fallback click:', err);
      if (nativeArBtn) {
        nativeArBtn.click();
      }
    }
  });
}

// 3. High-Res Snapshot Capture
if (shutterBtn && viewer) {
  shutterBtn.addEventListener('click', async () => {
    if (flash) {
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 120);
    }

    try {
      const blob = await viewer.toBlob({
        mimeType: 'image/png',
        idealAspect: true,
        qualityArgument: 1.0
      });

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Chrome_Aircraft_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
    } catch (err) {
      console.error('Snapshot failed:', err);
    }
  });
}