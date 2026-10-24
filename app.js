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

// 2. Custom AR Launch Trigger with Safe Handoff
if (customArBtn) {
  customArBtn.addEventListener('click', async () => {
    try {
      if (typeof viewer.activateAR === 'function') {
        await viewer.activateAR();
      } else if (nativeArBtn) {
        nativeArBtn.click();
      }
    } catch (err) {
      console.warn('activateAR() direct call failed, attempting fallback click:', err);
      if (nativeArBtn) {
        nativeArBtn.click();
      }
    }
  });
}

// 3. Viewport Screenshot Capture
if (shutterBtn) {
  shutterBtn.addEventListener('click', async () => {
    if (flash) {
      flash.classList.add('active');
      setTimeout(() => flash.classList.remove('active'), 120);
    }

    try {
      const blob = await viewer.toBlob({
        mimeType: 'image/png',
        idealAspect: true,
        qualityArgument: 0.95
      });

      const downloadUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement('a');
      downloadLink.href = downloadUrl;
      downloadLink.download = `Chrome_Aircraft_${Date.now()}.png`;
      downloadLink.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Snapshot failed:', error);
    }
  });
}