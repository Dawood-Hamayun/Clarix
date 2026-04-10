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

  // Sizing
  var CLOSED_WIDTH = 260;
  var CLOSED_HEIGHT = 88;
  var OPEN_WIDTH = 400;
  var OPEN_HEIGHT_MAX = 640;

  function openHeight() {
    // Leave a little breathing room on small viewports.
    return Math.min(OPEN_HEIGHT_MAX, window.innerHeight - 24);
  }

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

  var baseStyle = {
    position: "fixed",
    bottom: "0px",
    border: "0",
    background: "transparent",
    "color-scheme": "normal",
    "z-index": "2147483647",
    transition: "width .28s ease, height .28s ease",
    "pointer-events": "auto",
    width: CLOSED_WIDTH + "px",
    height: CLOSED_HEIGHT + "px",
  };
  if (position === "bottom-left") {
    baseStyle.left = "0px";
  } else {
    baseStyle.right = "0px";
  }
  Object.keys(baseStyle).forEach(function (k) {
    iframe.style.setProperty(k, baseStyle[k]);
  });

  function mount() {
    if (!document.body) {
      // DOM not ready yet — defer.
      document.addEventListener("DOMContentLoaded", mount, { once: true });
      return;
    }
    document.body.appendChild(iframe);
  }
  mount();

  // Listen for open/close messages from the embed page so we can grow/shrink
  // the iframe. Only accept messages from our own origin for safety.
  window.addEventListener("message", function (event) {
    if (event.origin !== origin) return;
    var data = event.data;
    if (!data || data.type !== "clarix") return;

    if (data.action === "open") {
      iframe.style.width = OPEN_WIDTH + "px";
      iframe.style.height = openHeight() + "px";
    } else if (data.action === "close") {
      iframe.style.width = CLOSED_WIDTH + "px";
      iframe.style.height = CLOSED_HEIGHT + "px";
    }
  });

  // Keep the open-state height responsive to viewport changes.
  window.addEventListener("resize", function () {
    if (parseInt(iframe.style.width, 10) === OPEN_WIDTH) {
      iframe.style.height = openHeight() + "px";
    }
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
