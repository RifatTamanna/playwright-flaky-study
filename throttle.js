// Optional CPU / network throttling for the study (Chromium only, via the DevTools Protocol).
// All settings come from environment variables; with none set, nothing is throttled.
//   THROTTLE_CPU         CPU slowdown factor, e.g. 4 means 4x slower (1 or unset = off)
//   THROTTLE_LATENCY_MS  added network latency per request in ms, e.g. 200
//   THROTTLE_KBPS        download/upload cap in kilobits per second, e.g. 1600 (unset = no cap)

function throttleSettings() {
  return {
    cpu: Number(process.env.THROTTLE_CPU || 1),
    latencyMs: Number(process.env.THROTTLE_LATENCY_MS || 0),
    kbps: Number(process.env.THROTTLE_KBPS || 0),
  };
}

async function applyThrottling(page) {
  const { cpu, latencyMs, kbps } = throttleSettings();
  if (cpu <= 1 && latencyMs <= 0 && kbps <= 0) return;

  const client = await page.context().newCDPSession(page);
  if (cpu > 1) {
    await client.send('Emulation.setCPUThrottlingRate', { rate: cpu });
  }
  if (latencyMs > 0 || kbps > 0) {
    const bytesPerSec = kbps > 0 ? Math.round((kbps * 1000) / 8) : -1;
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      latency: latencyMs,
      downloadThroughput: bytesPerSec,
      uploadThroughput: bytesPerSec,
    });
  }
}

module.exports = { applyThrottling, throttleSettings };
