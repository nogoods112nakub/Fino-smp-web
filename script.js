(function () {
  "use strict";

  var SERVER_ADDRESS = "play.finosmp.goods112.pp.ua:26121";
  var STATUS_API = "https://api.mcsrvstat.us/2/" + SERVER_ADDRESS;

  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* Nav shadow on scroll */
  var nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 12);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* Reveal on scroll */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* Copy to clipboard */
  function copy(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(function () {});
    } else {
      var t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      try { document.execCommand("copy"); } catch (e) {}
      document.body.removeChild(t);
    }
  }

  function bindCopy(cardId, valueId, copyId) {
    var card = document.getElementById(cardId);
    var value = document.getElementById(valueId);
    var hint = document.getElementById(copyId);
    if (!card || !value) return;
    card.addEventListener("click", function () {
      copy(value.textContent.trim());
      if (hint) {
        var prev = hint.textContent;
        hint.textContent = "Copied!";
        setTimeout(function () { hint.textContent = prev; }, 1200);
      }
    });
  }
  bindCopy("ipCard", "ipValue", "ipCopy");
  bindCopy("ipCard2", "ipValue2", "ipCopy2");

  /* Live server status + player count */
  function setStatus(online, players) {
    var statusEls = document.querySelectorAll("#status");
    statusEls.forEach(function (el) {
      el.classList.add(online ? "online" : "offline");
      var txt = el.querySelector("#statusText");
      if (txt) txt.textContent = online ? (players + " online") : "Offline";
    });
    var stat = document.getElementById("statPlayers");
    if (stat) stat.textContent = online ? players : "0";
  }

  var statusEl = document.getElementById("status");
  if (statusEl) {
    var xhr = new XMLHttpRequest();
    xhr.open("GET", STATUS_API, true);
    xhr.timeout = 6000;
    xhr.onload = function () {
      try {
        var d = JSON.parse(xhr.responseText);
        if (d && d.online) {
          setStatus(true, (d.players && d.players.online) || 0);
        } else {
          setStatus(false, 0);
        }
      } catch (e) {
        if (statusEl.querySelector("#statusText"))
          statusEl.querySelector("#statusText").textContent = "Status unavailable";
      }
    };
    xhr.onerror = function () {
      if (statusEl.querySelector("#statusText"))
        statusEl.querySelector("#statusText").textContent = "Status unavailable";
    };
    xhr.ontimeout = function () {
      if (statusEl.querySelector("#statusText"))
        statusEl.querySelector("#statusText").textContent = "Status unavailable";
    };
    xhr.send();
  }
})();
