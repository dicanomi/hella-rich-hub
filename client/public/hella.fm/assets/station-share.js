(function () {
  var params = new URLSearchParams(window.location.search);
  var pathStation = window.location.pathname.match(/^\/hella\.fm\/(\d{2,3}(?:\.\d)?)\/?$/)?.[1];
  var requested = params.get("station") || params.get("frequency") || params.get("freq") || pathStation;
  var copyResetTimer = 0;

  var normalize = function (value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\.0$/, "")
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/^-|-$/g, "");
  };

  var target = normalize(requested);
  var targetNumber = Number.parseFloat(requested);
  var hasTargetNumber = Number.isFinite(targetNumber);
  var tuned = false;

  var getCurrentFrequency = function () {
    return String(
      document.querySelector(".station-readout strong")?.textContent ||
        document.querySelector(".station-item.selected .queue-frequency")?.textContent ||
        ""
    )
      .replace(/\s+/g, "")
      .trim();
  };

  var copyText = function (value) {
    if (navigator.clipboard?.writeText) {
      return navigator.clipboard.writeText(value);
    }

    var textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand("copy");
      return Promise.resolve();
    } finally {
      textarea.remove();
    }
  };

  var buildStationUrl = function () {
    var frequency = getCurrentFrequency() || requested || "88.1";
    var url = new URL(window.location.href);
    url.pathname = "/hella.fm/" + encodeURIComponent(frequency);
    url.search = "";
    url.hash = "";

    return url.toString();
  };

  var ensureShareButton = function () {
    if (document.querySelector(".share-station-button")) return true;
    var viewToggle = document.querySelector(".view-toggle");
    if (!viewToggle) return false;

    var button = document.createElement("button");
    button.type = "button";
    button.className = "share-station-button";
    button.textContent = "SHARE STATION";
    button.setAttribute("aria-label", "Copy station link");

    button.addEventListener("pointerdown", function (event) {
      event.stopPropagation();
    });

    button.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();

      copyText(buildStationUrl()).then(function () {
        button.textContent = "COPIED";
        window.clearTimeout(copyResetTimer);
        copyResetTimer = window.setTimeout(function () {
          button.textContent = "SHARE STATION";
        }, 2400);
      });
    });

    viewToggle.appendChild(button);

    return true;
  };

  var style = document.createElement("style");
  style.textContent = `
    .share-station-button {
      min-height: 2.75rem;
      padding: 0 clamp(.85rem, 3cqw, 1.35rem);
      border: 0;
      background: transparent;
      color: var(--muted);
      display: flex;
      align-items: center;
      gap: .45rem;
      cursor: pointer;
      font-size: clamp(.62rem, 1.8cqw, .78rem);
      font-weight: 800;
      letter-spacing: .12em;
      text-transform: uppercase;
      white-space: nowrap;
      transition: color .16s ease;
    }

    .share-station-button:hover,
    .share-station-button:focus-visible {
      color: var(--ink);
    }

    .share-station-button:before {
      content: "↗";
      color: currentColor;
      font-size: 1rem;
      line-height: 1;
    }
  `;
  document.head.appendChild(style);

  var buttonAttempts = 0;
  var buttonTimer = window.setInterval(function () {
    buttonAttempts += 1;

    if (ensureShareButton() || buttonAttempts > 80) {
      window.clearInterval(buttonTimer);
    }
  }, 125);

  if (!requested) return;

  var findStation = function () {
    var items = Array.from(document.querySelectorAll(".station-item"));

    return items.find(function (item) {
      var title = normalize(item.querySelector(".queue-copy strong")?.textContent);
      var frequency = String(item.querySelector(".queue-frequency")?.textContent || "").trim();
      var frequencyNumber = Number.parseFloat(frequency);

      return (
        normalize(frequency) === target ||
        title === target ||
        (hasTargetNumber && Number.isFinite(frequencyNumber) && Math.abs(frequencyNumber - targetNumber) < 0.06)
      );
    });
  };

  var tune = function () {
    if (tuned) return true;

    var listButton = Array.from(document.querySelectorAll(".view-toggle button")).find(function (button) {
      return /stations/i.test(button.textContent || "");
    });

    if (!document.querySelector(".station-item")) {
      listButton?.click();
      return false;
    }

    var station = findStation();
    if (!station) return false;

    station.click();
    tuned = true;

    window.setTimeout(function () {
      var dialButton = Array.from(document.querySelectorAll(".view-toggle button")).find(function (button) {
        return /dial/i.test(button.textContent || "");
      });
      dialButton?.click();
    }, 120);

    return true;
  };

  var attempts = 0;
  var timer = window.setInterval(function () {
    attempts += 1;

    if (tune() || attempts > 80) {
      window.clearInterval(timer);
    }
  }, 125);
})();
