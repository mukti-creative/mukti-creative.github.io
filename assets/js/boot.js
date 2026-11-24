(function(d) {
  var r = d.documentElement;
  r.classList.replace("no-js", "js");
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
    r.classList.add("motion");
    setTimeout(function() {
      if (!r.classList.contains("motion-ready")) r.classList.remove("motion");
    }, 4e3);
  }
})(document);
