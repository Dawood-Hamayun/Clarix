(function () {
  "use strict";

  // Prevent double-injection if the script tag is accidentally included twice.
  if (window.__clarixWidgetLoaded) return;
  window.__clarixWidgetLoaded = true;

  // Find the <script> tag that loaded us so we can read its data-* attributes
  // and derive the Clarix origin. document.currentScript works during the
  // initial synchronous parse; fall back to scanning by src for deferred loads.
  var script =
    document.currentScript ||
    (function () {
      var all = document.getElementsByTagName("script");
      for (var i = all.length - 1; i >= 0; i--) {
        if (all[i].src && all[i].src.indexOf("/widget.js") !== -1) {
          return all[i];
        }
      }
      return null;
    })();

  if (!script) return;

  var projectId = script.getAttribute("data-project") || "proj_demo";
  var position = script.getAttribute("data-position") || "bottom-right";
  var origin;
  try {
    origin = new URL(script.src).origin;
  } catch (_) {
    return; // Can't determine origin — bail.
  }

  // Sizing constants. These are the *desktop* targets; on narrow or short
  // viewports we clamp and switch to a near-fullscreen panel so mobile users
  // get a usable chat surface instead of a cramped floating card.
  var CLOSED_WIDTH = 260;
  var CLOSED_HEIGHT = 88;
  var OPEN_WIDTH = 400;
  var OPEN_HEIGHT_MAX = 640;
  var MOBILE_BREAKPOINT = 520;

  function isMobile() {
    return window.innerWidth < MOBILE_BREAKPOINT;
  }

  function closedSize() {
    // Shrink the launcher footprint on very narrow screens so it doesn't eat
    // into the customer's UI.
    if (window.innerWidth < 360) {
      return { width: 220, height: 80 };
    }
    return { width: CLOSED_WIDTH, height: CLOSED_HEIGHT };
  }

  function openSize() {
    if (isMobile()) {
      // Leave a small top gutter so browser chrome / notches don't clip.
      return {
        width: window.innerWidth,
        height: Math.max(360, window.innerHeight - 12),
      };
    }
    return {
      width: Math.min(OPEN_WIDTH, window.innerWidth - 16),
      height: Math.min(OPEN_HEIGHT_MAX, window.innerHeight - 24),
    };
  }

  var state = "closed"; // "closed" | "open"

  var iframe = document.createElement("iframe");
  iframe.id = "clarix-widget-frame";
  iframe.title = "Clarix chat";
  iframe.allow = "clipboard-write";
  iframe.setAttribute("aria-label", "Clarix chat widget");
  iframe.src =
    origin +
    "/embed?project=" +
    encodeURIComponent(projectId) +
    "&position=" +
    encodeURIComponent(position);

  var initialClosed = closedSize();
  var baseStyle = {
    position: "fixed",
    bottom: "0px",
    border: "0",
    background: "transparent",
    "color-scheme": "normal",
    "z-index": "2147483647",
    transition: "width .28s ease, height .28s ease, left .28s ease, right .28s ease",
    "pointer-events": "auto",
    width: initialClosed.width + "px",
    height: initialClosed.height + "px",
  };
  if (position === "bottom-left") {
    baseStyle.left = "0px";
  } else {
    baseStyle.right = "0px";
  }
  Object.keys(baseStyle).forEach(function (k) {
    iframe.style.setProperty(k, baseStyle[k]);
  });

  function applySize() {
    if (state === "open") {
      var s = openSize();
      iframe.style.width = s.width + "px";
      iframe.style.height = s.height + "px";
      // On mobile, pin to both edges so the panel spans the full width.
      if (isMobile()) {
        iframe.style.left = "0px";
        iframe.style.right = "0px";
      } else if (position === "bottom-left") {
        iframe.style.left = "0px";
        iframe.style.right = "auto";
      } else {
        iframe.style.right = "0px";
        iframe.style.left = "auto";
      }
    } else {
      var c = closedSize();
      iframe.style.width = c.width + "px";
      iframe.style.height = c.height + "px";
      if (position === "bottom-left") {
        iframe.style.left = "0px";
        iframe.style.right = "auto";
      } else {
        iframe.style.right = "0px";
        iframe.style.left = "auto";
      }
    }
  }

  function mount() {
    if (!document.body) {
      // DOM not ready yet — defer.
      document.addEventListener("DOMContentLoaded", mount, { once: true });
      return;
    }
    document.body.appendChild(iframe);
    applySize();
  }
  mount();

  // Listen for open/close messages from the embed page so we can grow/shrink
  // the iframe. Only accept messages from our own origin for safety.
  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    var data = event.data;
    if (!data || data.type !== "clarix") return;

    if (data.action === "open") {
      state = "open";
      applySize();
    } else if (data.action === "close") {
      state = "closed";
      applySize();
    }
  });

  // Keep the iframe sized correctly across orientation changes, soft
  // keyboard appearance, and breakpoint crossings (e.g. rotating a tablet).
  var resizeTimer = null;
  window.addEventListener("resize", function () {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(applySize, 60);
  });

  // Expose a tiny API for programmatic control: window.Clarix.open() / .close()
  window.Clarix = {
    open: function () {
      iframe.contentWindow &&
        iframe.contentWindow.postMessage(
          { type: "clarix-host", action: "open" },
          origin
        );
    },
    close: function () {
      iframe.contentWindow &&
        iframe.contentWindow.postMessage(
          { type: "clarix-host", action: "close" },
          origin
        );
    },
  };

})();
