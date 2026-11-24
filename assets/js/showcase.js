(function() {
  "use strict";
  var root = document.querySelector("[data-showcase]");
  if (!root) return;
  var slides = Array.prototype.slice.call(root.querySelectorAll("[data-slide]"));
  var bars = Array.prototype.slice.call(root.querySelectorAll("[data-bar]"));
  var fills = bars.map(function(b) {
    return b.querySelector("[data-fill]");
  });
  var playBtn = root.querySelector("[data-play]");
  var prevBtn = root.querySelector("[data-prev]");
  var nextBtn = root.querySelector("[data-next]");
  var live = root.querySelector("[data-live]");
  var count = slides.length;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var DURATION = 6500;
  var index = 0, elapsed = 0, last = performance.now();
  var playing = !reduce;
  var hovering = false, focused = false, inView = false;
  var px = 0, py = 0, tpx = 0, tpy = 0;
  function setPlayUI() {
    if (!playBtn) return;
    playBtn.setAttribute("aria-label", playing ? "Pause auto-slide" : "Play auto-slide");
    playBtn.setAttribute("aria-pressed", String(!playing));
    playBtn.querySelector("[data-icon-pause]").style.display = playing ? "" : "none";
    playBtn.querySelector("[data-icon-play]").style.display = playing ? "none" : "";
    root.setAttribute("aria-live", playing ? "off" : "polite");
  }
  function paintBars() {
    fills.forEach(function(f, k) {
      var p = k < index ? 1 : k === index ? Math.min(elapsed / DURATION, 1) : 0;
      f.style.transform = "scaleX(" + p.toFixed(4) + ")";
      bars[k].setAttribute("aria-current", k === index ? "true" : "false");
    });
  }
  function go(i, dir, announce) {
    var next = (i + count) % count;
    if (next === index && slides[index].classList.contains("is-active")) return;
    dir = dir || (next >= index ? 1 : -1);
    root.style.setProperty("--dir", dir);
    var old = slides[index];
    old.classList.remove("is-active");
    old.classList.add("is-leaving");
    old.setAttribute("aria-hidden", "true");
    old.inert = true;
    setTimeout(function() {
      old.classList.remove("is-leaving");
    }, 1100);
    index = next;
    var cur = slides[index];
    cur.classList.remove("is-leaving");
    cur.classList.add("is-active");
    cur.setAttribute("aria-hidden", "false");
    cur.inert = false;
    elapsed = 0;
    paintBars();
    if (announce && live) live.textContent = "Slide " + (index + 1) + " of " + count + ": " + cur.getAttribute("data-title");
  }
  slides.forEach(function(s, k) {
    var on = k === 0;
    s.classList.toggle("is-active", on);
    s.setAttribute("aria-hidden", String(!on));
    s.inert = !on;
  });
  root.style.setProperty("--dir", 1);
  setPlayUI();
  paintBars();
  if (playBtn) playBtn.addEventListener("click", function() {
    playing = !playing;
    setPlayUI();
  });
  if (prevBtn) prevBtn.addEventListener("click", function() {
    go(index - 1, -1, true);
  });
  if (nextBtn) nextBtn.addEventListener("click", function() {
    go(index + 1, 1, true);
  });
  bars.forEach(function(b, k) {
    b.addEventListener("click", function() {
      go(k, k > index ? 1 : -1, true);
    });
  });
  root.addEventListener("keydown", function(e) {
    if (e.key === "ArrowRight") {
      go(index + 1, 1, true);
    } else if (e.key === "ArrowLeft") {
      go(index - 1, -1, true);
    }
  });
  root.addEventListener("pointerenter", function(e) {
    if (e.pointerType === "mouse") hovering = true;
  });
  root.addEventListener("pointerleave", function() {
    hovering = false;
    tpx = tpy = 0;
  });
  root.addEventListener("focusin", function() {
    focused = true;
  });
  root.addEventListener("focusout", function() {
    focused = false;
  });
  root.addEventListener("pointermove", function(e) {
    if (e.pointerType !== "mouse" || !fine || reduce) return;
    var r = root.getBoundingClientRect();
    tpx = (e.clientX - r.left) / r.width * 2 - 1;
    tpy = (e.clientY - r.top) / r.height * 2 - 1;
  });
  var sx = null, sy = null;
  root.addEventListener("pointerdown", function(e) {
    if (e.pointerType === "mouse") return;
    sx = e.clientX;
    sy = e.clientY;
  });
  root.addEventListener("pointerup", function(e) {
    if (sx === null) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    sx = sy = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) go(index + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1, true);
  });
  root.addEventListener("pointercancel", function() {
    sx = sy = null;
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function(en) {
      inView = en[0].isIntersecting;
    }, { threshold: 0.25 }).observe(root);
  } else {
    inView = true;
  }
  function tick(now) {
    var dt = Math.min(now - last, 100);
    last = now;
    if (inView && !reduce) {
      px += (tpx - px) * Math.min(1, dt / 220);
      py += (tpy - py) * Math.min(1, dt / 220);
      root.style.setProperty("--px", px.toFixed(3));
      root.style.setProperty("--py", py.toFixed(3));
    }
    if (playing && inView && !hovering && !focused && !document.hidden) {
      elapsed += dt;
      if (elapsed >= DURATION) go(index + 1, 1, false);
      else paintBars();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
