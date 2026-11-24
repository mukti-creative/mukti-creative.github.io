(function() {
  "use strict";
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    root.classList.remove("motion");
    return;
  }
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var hasGsap = !!(window.gsap && window.ScrollTrigger);
  if (hasGsap) root.classList.add("motion-ready");
  else root.classList.remove("motion");
  var $ = function(s, c) {
    return Array.prototype.slice.call((c || document).querySelectorAll(s));
  };
  var $1 = function(s, c) {
    return (c || document).querySelector(s);
  };
  var clamp = function(v, a, b) {
    return Math.min(b, Math.max(a, v));
  };
  var damp = function(a, b, k, dt) {
    return a + (b - a) * (1 - Math.exp(-k * dt));
  };
  var pointer = { x: innerWidth / 2, y: innerHeight / 2, nx: 0, ny: 0, seen: false, moved: false };
  if (fine) {
    window.addEventListener("pointermove", function(e) {
      if (e.pointerType === "touch") return;
      pointer.x = e.clientX;
      pointer.y = e.clientY;
      pointer.nx = e.clientX / innerWidth * 2 - 1;
      pointer.ny = e.clientY / innerHeight * 2 - 1;
      pointer.moved = true;
      if (!pointer.seen) {
        pointer.seen = true;
        cur.rx = spot.x = e.clientX;
        cur.ry = spot.y = e.clientY;
        root.classList.add("has-cursor", "has-spotlight");
        root.classList.remove("cursor-hidden");
      }
    }, { passive: true });
    root.addEventListener("mouseleave", function() {
      root.classList.add("cursor-hidden");
      pointer.seen = false;
    });
    root.addEventListener("mouseenter", function() {
      root.classList.remove("cursor-hidden");
    });
  }
  var dot = $1(".cursor-dot"), ring = $1(".cursor-ring"), spotEl = $1(".spotlight");
  var cur = { rx: pointer.x, ry: pointer.y, s: 1, target: 1, down: false };
  var spot = { x: pointer.x, y: pointer.y };
  var LINK_SEL = "a, button, [data-magnetic], [role='button'], summary";
  if (fine) {
    document.addEventListener("pointerover", function(e) {
      if (e.pointerType === "touch" || !e.target.closest) return;
      var t = e.target.closest(LINK_SEL);
      cur.target = t ? 2 : 1;
      if (ring) ring.classList.toggle("is-link", !!t);
    });
    document.addEventListener("pointerdown", function(e) {
      if (e.pointerType !== "touch") cur.down = true;
    });
    document.addEventListener("pointerup", function() {
      cur.down = false;
    });
  }
  function cursorUpdate(dt) {
    if (!fine || !pointer.seen) return;
    if (dot) dot.style.transform = "translate3d(" + (pointer.x - 4) + "px," + (pointer.y - 4) + "px,0)";
    if (ring) {
      cur.rx = damp(cur.rx, pointer.x, 16, dt);
      cur.ry = damp(cur.ry, pointer.y, 16, dt);
      cur.s = damp(cur.s, cur.target * (cur.down ? 0.7 : 1), 14, dt);
      ring.style.transform = "translate3d(" + (cur.rx - 18).toFixed(1) + "px," + (cur.ry - 18).toFixed(1) + "px,0) scale(" + cur.s.toFixed(3) + ")";
    }
    if (spotEl) {
      spot.x = damp(spot.x, pointer.x, 5, dt);
      spot.y = damp(spot.y, pointer.y, 5, dt);
      spotEl.style.transform = "translate3d(" + (spot.x - 320).toFixed(1) + "px," + (spot.y - 320).toFixed(1) + "px,0)";
    }
  }
  var magnets = fine ? $("[data-magnetic]").map(function(el) {
    return { el, x: 0, y: 0, tx: 0, ty: 0 };
  }) : [];
  function magnetUpdate(dt) {
    for (var i = 0; i < magnets.length; i++) {
      var m = magnets[i];
      var resting = Math.abs(m.x) < 0.05 && Math.abs(m.y) < 0.05 && m.tx === 0 && m.ty === 0;
      if (resting && !pointer.moved) continue;
      var r = m.el.getBoundingClientRect();
      var cx = r.left + r.width / 2 - m.x, cy = r.top + r.height / 2 - m.y;
      var dx = pointer.x - cx, dy = pointer.y - cy;
      var near = pointer.seen && Math.abs(dx) < r.width / 2 + 36 && Math.abs(dy) < r.height / 2 + 36;
      m.tx = near ? clamp(dx * 0.32, -16, 16) : 0;
      m.ty = near ? clamp(dy * 0.4, -12, 12) : 0;
      m.x = damp(m.x, m.tx, 10, dt);
      m.y = damp(m.y, m.ty, 10, dt);
      m.el.style.translate = m.x.toFixed(2) + "px " + m.y.toFixed(2) + "px";
      m.el.style.setProperty("--ix", (m.x * 0.35).toFixed(2) + "px");
      m.el.style.setProperty("--iy", (m.y * 0.35).toFixed(2) + "px");
    }
  }
  var cards = $("[data-card]");
  var tilt = [];
  if (fine) {
    cards.forEach(function(c) {
      var st = { el: c, rx: 0, ry: 0, lift: 0, trx: 0, tr: 0, tl: 0 };
      tilt.push(st);
      c.addEventListener("pointermove", function(e) {
        if (e.pointerType === "touch") return;
        var r = c.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        c.style.setProperty("--mx", (e.clientX - r.left).toFixed(1) + "px");
        c.style.setProperty("--my", (e.clientY - r.top).toFixed(1) + "px");
        st.tr = (px - 0.5) * 8;
        st.trx = -(py - 0.5) * 8;
        st.tl = -4;
      });
      c.addEventListener("pointerleave", function() {
        st.tr = st.trx = st.tl = 0;
      });
    });
  }
  function tiltUpdate(dt) {
    for (var i = 0; i < tilt.length; i++) {
      var s = tilt[i];
      if (Math.abs(s.rx - s.trx) < 2e-3 && Math.abs(s.ry - s.tr) < 2e-3 && Math.abs(s.lift - s.tl) < 0.01) continue;
      s.rx = damp(s.rx, s.trx, 9, dt);
      s.ry = damp(s.ry, s.tr, 9, dt);
      s.lift = damp(s.lift, s.tl, 9, dt);
      s.el.style.setProperty("--rx", s.rx.toFixed(3) + "deg");
      s.el.style.setProperty("--ry", s.ry.toFixed(3) + "deg");
      s.el.style.setProperty("--lift", s.lift.toFixed(2) + "px");
    }
  }
  var hero = $1("[data-hero]");
  var layers = hero ? $("[data-depth]", hero) : [];
  var tiltEl = hero ? $1("[data-hero-tilt]", hero) : null;
  var heroVisible = true, hx = 0, hy = 0;
  layers.forEach(function(l) {
    if (l.hasAttribute("data-ring")) l.style.transformOrigin = "500px 220px";
  });
  if (hero && "IntersectionObserver" in window) {
    new IntersectionObserver(function(en) {
      heroVisible = en[0].isIntersecting;
    }, { threshold: 0 }).observe(hero);
  }
  function heroUpdate(dt, t) {
    if (!hero || !heroVisible) return;
    var tx, ty;
    if (pointer.seen) {
      tx = pointer.nx;
      ty = pointer.ny;
    } else {
      tx = Math.sin(t * 0.35) * 0.4;
      ty = Math.cos(t * 0.27) * 0.3;
    }
    hx = damp(hx, tx, 3.5, dt);
    hy = damp(hy, ty, 3.5, dt);
    for (var i = 0; i < layers.length; i++) {
      var l = layers[i], d = parseFloat(l.getAttribute("data-depth")) || 0;
      var tr = "translate(" + (hx * d * 16).toFixed(2) + "px," + (hy * d * 10).toFixed(2) + "px)";
      if (l.hasAttribute("data-ring")) {
        var base = parseFloat(l.getAttribute("data-base")) || 0;
        var amp = parseFloat(l.getAttribute("data-amp")) || 0;
        var mouse = parseFloat(l.getAttribute("data-mouse")) || 0;
        var target = base + Math.sin(t * 0.45 + i) * amp + hx * mouse;
        l._a = damp(l._a === void 0 ? target : l._a, target, 6, dt);
        tr += " rotate(" + l._a.toFixed(3) + "deg)";
      }
      l.style.transform = tr;
    }
    if (tiltEl) tiltEl.style.transform = "rotateX(" + (-hy * 4.5).toFixed(2) + "deg) rotateY(" + (hx * 6).toFixed(2) + "deg)";
  }
  var mq = $1("[data-marquee]");
  var mqTrack = mq && $1("[data-marquee-track]", mq);
  var mqGroupW = 0, mqX = 0, mqDir = 1, mqVel = 0, mqVisible = true, lastY = window.scrollY;
  function mqSetup() {
    if (!mqTrack) return;
    var groups = $("[data-marquee-group]", mqTrack);
    var first = groups[0];
    mqGroupW = first.getBoundingClientRect().width;
    if (!mqGroupW) return;
    var need = Math.ceil(innerWidth / mqGroupW) + 1;
    while (groups.length < need) {
      var c = first.cloneNode(true);
      c.setAttribute("aria-hidden", "true");
      mqTrack.appendChild(c);
      groups.push(c);
    }
    mq.classList.add("is-js");
  }
  if (mq && mqTrack) {
    mqSetup();
    var rz;
    window.addEventListener("resize", function() {
      clearTimeout(rz);
      rz = setTimeout(mqSetup, 150);
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(mqSetup);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function(en) {
        mqVisible = en[0].isIntersecting;
      }).observe(mq);
    }
  }
  function mqUpdate(dt) {
    var y = window.scrollY;
    var v = (y - lastY) / Math.max(dt, 1e-3);
    lastY = y;
    if (!mq || !mqGroupW || !mqVisible) return;
    mqVel = damp(mqVel, v, 6, dt);
    if (Math.abs(v) > 40) mqDir = v > 0 ? 1 : -1;
    var speed = 60 * (1 + Math.min(Math.abs(mqVel) / 350, 7));
    mqX -= mqDir * speed * dt;
    mqX = mqX % mqGroupW;
    if (mqX > 0) mqX -= mqGroupW;
    var skew = clamp(-mqVel * 4e-3, -8, 8);
    mqTrack.style.transform = "translate3d(" + mqX.toFixed(2) + "px,0,0) skewX(" + skew.toFixed(2) + "deg)";
  }
  var last = performance.now();
  function frame(now) {
    var dt = Math.min((now - last) / 1e3, 0.05);
    last = now;
    var t = now / 1e3;
    cursorUpdate(dt);
    magnetUpdate(dt);
    tiltUpdate(dt);
    heroUpdate(dt, t);
    mqUpdate(dt);
    pointer.moved = false;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  function splitText(el, withChars) {
    if (!el.getAttribute("aria-label")) {
      el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    }
    var walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n, charIdx = 0;
    while (n = walker.nextNode()) if (n.nodeValue.trim()) nodes.push(n);
    nodes.forEach(function(node) {
      var frag = document.createDocumentFragment();
      node.nodeValue.split(/(\s+)/).forEach(function(tok) {
        if (!tok) return;
        if (/^\s+$/.test(tok)) {
          frag.appendChild(document.createTextNode(" "));
          return;
        }
        var w = document.createElement("span");
        w.className = "w";
        var inn = document.createElement("span");
        inn.className = "w-in";
        inn.setAttribute("aria-hidden", "true");
        if (withChars) {
          for (var c = 0; c < tok.length; c++) {
            var sp = document.createElement("span");
            sp.className = "h-char";
            sp.textContent = tok[c];
            var sign = charIdx % 2 === 0 ? -1 : 1;
            sp.style.setProperty("--ct", sign * 2.2 + "deg");
            sp.style.setProperty("--ct-n", -sign * 1.1 + "deg");
            sp.setAttribute("data-ci", String(charIdx++));
            inn.appendChild(sp);
          }
        } else {
          inn.textContent = tok;
        }
        w.appendChild(inn);
        frag.appendChild(w);
      });
      node.parentNode.replaceChild(frag, node);
    });
    el.classList.add("is-split");
  }
  var heroTitle = $1("[data-split-hero]");
  if (heroTitle) {
    splitText(heroTitle, fine);
    if (!hasGsap) heroTitle.classList.add("is-revealed");
    if (fine) {
      var heroLines = $(".hero-line", heroTitle).map(function(line) {
        return { el: line, chars: $(".h-char", line) };
      });
      var activeLine = -1, activeChar = -1;
      var clearWave = function() {
        if (activeLine === -1) return;
        heroLines[activeLine].chars.forEach(function(ch) {
          ch.removeAttribute("data-wave");
        });
        activeLine = -1;
        activeChar = -1;
      };
      heroTitle.addEventListener("pointermove", function(e) {
        if (e.pointerType === "touch") return;
        var lIdx = -1, bestLineDist = Infinity;
        for (var i = 0; i < heroLines.length; i++) {
          var lr = heroLines[i].el.getBoundingClientRect();
          if (e.clientY >= lr.top - 8 && e.clientY <= lr.bottom + 8) {
            lIdx = i;
            break;
          }
          var dy = Math.abs(e.clientY - (lr.top + lr.height / 2));
          if (dy < bestLineDist) {
            bestLineDist = dy;
            lIdx = i;
          }
        }
        if (lIdx === -1) return;
        var chars = heroLines[lIdx].chars;
        var cIdx = -1, bestX = Infinity;
        for (var j = 0; j < chars.length; j++) {
          var cr = chars[j].getBoundingClientRect();
          var dx = Math.abs(e.clientX - (cr.left + cr.width / 2));
          if (dx < bestX) {
            bestX = dx;
            cIdx = j;
          }
        }
        if (cIdx === -1 || bestX > 48) {
          clearWave();
          return;
        }
        if (lIdx === activeLine && cIdx === activeChar) return;
        if (activeLine !== -1 && activeLine !== lIdx) {
          heroLines[activeLine].chars.forEach(function(ch) {
            ch.removeAttribute("data-wave");
          });
        }
        activeLine = lIdx;
        activeChar = cIdx;
        for (var k = 0; k < chars.length; k++) {
          var dist = Math.abs(k - cIdx);
          if (dist <= 2) chars[k].setAttribute("data-wave", String(dist));
          else chars[k].removeAttribute("data-wave");
        }
      });
      heroTitle.addEventListener("pointerleave", clearWave);
    }
  }
  if (!hasGsap) return;
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  var splits = $("[data-split]");
  splits.forEach(function(el) {
    splitText(el, false);
  });
  var allSplitTargets = heroTitle ? [heroTitle].concat(splits) : splits;
  allSplitTargets.forEach(function(el) {
    gsap.set($(".w-in", el), { yPercent: 118 });
  });
  function revealWords(el, delay, onDone) {
    var words = $(".w-in", el);
    gsap.to(words, {
      yPercent: 0,
      duration: 1.1,
      ease: "power4.out",
      delay: delay || 0,
      stagger: Math.min(0.07, 0.9 / Math.max(words.length, 1)),
      clearProps: "transform",
      onComplete: onDone
    });
  }
  splits.forEach(function(el) {
    ScrollTrigger.create({ trigger: el, start: "top 88%", once: true, onEnter: function() {
      revealWords(el, 0);
    } });
  });
  var fontsReady = document.fonts && document.fonts.ready || Promise.resolve();
  Promise.race([fontsReady, new Promise(function(r) {
    setTimeout(r, 1200);
  })]).then(function() {
    if (heroTitle) revealWords(heroTitle, 0.1, function() {
      heroTitle.classList.add("is-revealed");
    });
    gsap.from(".header-pill", { y: -28, opacity: 0, duration: 1, ease: "power3.out", clearProps: "transform,opacity" });
    gsap.from("[data-hero-stage]", { opacity: 0, scale: 0.93, duration: 1.6, ease: "power3.out", delay: 0.25, clearProps: "transform,opacity" });
  });
  gsap.set(cards, { opacity: 0, "--ty": "56px" });
  ScrollTrigger.batch(cards, {
    start: "top 90%",
    once: true,
    onEnter: function(batch) {
      batch.forEach(function(b) {
        b.classList.add("card-in");
      });
      gsap.to(batch, { opacity: 1, "--ty": "0px", duration: 0.95, ease: "power3.out", stagger: 0.12, overwrite: true });
    }
  });
  window.addEventListener("load", function() {
    ScrollTrigger.refresh();
  });
})();
