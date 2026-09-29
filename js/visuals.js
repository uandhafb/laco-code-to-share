// Bridge to the Hydra iframe (hydra.html). Messages are queued until it is ready.
window.Visuals = (() => {
  const frame = document.getElementById("hydra-frame");
  const queue = [];
  let ready = false;
  const listeners = { error: [], ok: [], fatal: [] };

  const send = (msg) => {
    if (ready) frame.contentWindow.postMessage(msg, location.origin);
    else queue.push(msg);
  };

  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin || e.source !== frame.contentWindow) return;
    const msg = e.data || {};
    if (msg.type === "ready") {
      if (ready) return;
      ready = true;
      queue.splice(0).forEach(send);
    } else if (listeners[msg.type]) {
      listeners[msg.type].forEach((fn) => fn(msg.message));
    }
  });

  // The iframe may have loaded before this script: ask it to announce itself again.
  frame.contentWindow.postMessage({ type: "hello" }, location.origin);
  frame.addEventListener("load", () => frame.contentWindow.postMessage({ type: "hello" }, location.origin));

  // Forward the pointer so hydra code can use pointer.x / pointer.y.
  let pending = null;
  const onPointer = (e) => {
    const x = e.clientX / innerWidth;
    const y = e.clientY / innerHeight;
    if (!pending) {
      requestAnimationFrame(() => {
        if (ready) send({ type: "pointer", ...pending });
        pending = null;
      });
    }
    pending = { x, y };
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  return {
    run: (code) => send({ type: "code", code }),
    pulse: (value = 1) => ready && send({ type: "pulse", value }),
    // Effects chained after whatever the scene draws, e.g. ".kaleid(5).invert()".
    // Only pass fixed strings from our own code, never text a visitor typed.
    post: (chain) => send({ type: "post", chain }),
    speed: (value) => send({ type: "speed", value }),
    on: (type, fn) => listeners[type].push(fn),
  };
})();
