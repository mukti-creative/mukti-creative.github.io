(function() {
  "use strict";
  var doc = document;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var pill = doc.querySelector("[data-header-pill]");
  function onScroll() {
    if (pill) pill.classList.toggle("is-scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  var burger = doc.querySelector("[data-burger]");
  var drawer = doc.querySelector("[data-drawer]");
  function setDrawer(open) {
    if (!burger || !drawer) return;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", String(!open));
    if (open) {
      drawer.removeAttribute("inert");
    } else {
      drawer.setAttribute("inert", "");
    }
  }
  if (burger && drawer) {
    setDrawer(false);
    burger.addEventListener("click", function() {
      setDrawer(burger.getAttribute("aria-expanded") !== "true");
    });
    drawer.addEventListener("click", function(e) {
      if (e.target.closest("a")) setDrawer(false);
    });
    doc.addEventListener("keydown", function(e) {
      if (e.key === "Escape" && burger.getAttribute("aria-expanded") === "true") {
        setDrawer(false);
        burger.focus();
      }
    });
    doc.addEventListener("click", function(e) {
      if (burger.getAttribute("aria-expanded") === "true" && !e.target.closest("[data-drawer]") && !e.target.closest("[data-burger]")) {
        setDrawer(false);
      }
    });
    window.matchMedia("(min-width: 1024px)").addEventListener("change", function(m) {
      if (m.matches) setDrawer(false);
    });
  }
  var links = Array.prototype.slice.call(doc.querySelectorAll("[data-nav-link]"));
  var targets = [];
  links.forEach(function(a) {
    var id = (a.getAttribute("href") || "").replace("#", "");
    var el = id && doc.getElementById(id);
    if (el && !targets.some(function(t) {
      return t.id === id;
    })) targets.push(el);
  });
  function setActive(id) {
    links.forEach(function(a) {
      var on = a.getAttribute("href") === "#" + id;
      if (on) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  }
  var ticking = false;
  function spy() {
    ticking = false;
    var line = window.innerHeight * 0.32;
    var current = null;
    if (window.innerHeight + window.scrollY >= doc.documentElement.scrollHeight - 4) {
      current = targets.length ? targets[targets.length - 1].id : null;
    } else {
      targets.forEach(function(t) {
        if (t.getBoundingClientRect().top <= line) current = t.id;
      });
    }
    setActive(current || "");
  }
  window.addEventListener("scroll", function() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(spy);
    }
  }, { passive: true });
  window.addEventListener("resize", spy);
  spy();
  var revealEls = doc.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function(entries) {
      entries.forEach(function(en) {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    revealEls.forEach(function(el) {
      io.observe(el);
    });
  } else {
    revealEls.forEach(function(el) {
      el.classList.add("is-visible");
    });
  }
  if (reduceMotion) {
    doc.querySelectorAll("svg").forEach(function(s) {
      if (s.pauseAnimations) s.pauseAnimations();
    });
  }
  var wa = doc.querySelector("[data-wa-float]");
  if (wa) {
    var waShown = false, waPeeked = false;
    var waCheck = function() {
      var show = window.scrollY > 520;
      if (show === waShown) return;
      waShown = show;
      wa.classList.toggle("is-shown", show);
      if (show && !waPeeked && !reduceMotion) {
        waPeeked = true;
        setTimeout(function() {
          wa.classList.add("is-open");
        }, 600);
        setTimeout(function() {
          wa.classList.remove("is-open");
        }, 4200);
      }
    };
    window.addEventListener("scroll", waCheck, { passive: true });
    waCheck();
  }
  var y = doc.querySelector("[data-year]");
  if (y) y.textContent = String(new Date().getFullYear());
})();
