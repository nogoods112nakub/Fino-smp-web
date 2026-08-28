(function () {
  "use strict";

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

  function bindRowCopy(row) {
    if (!row) return;
    var addr = row.getAttribute("data-address");
    var value = row.querySelector(".server-ip");
    var hint = row.querySelector(".copy-hint");
    var text = (addr || (value ? value.textContent.trim() : ""));
    if (!text) return;
    row.addEventListener("click", function () {
      copy(text);
      if (hint) {
        var prev = hint.textContent;
        hint.textContent = "Copied!";
        setTimeout(function () { hint.textContent = prev; }, 1200);
      }
    });
  }
  document.querySelectorAll(".server-row").forEach(bindRowCopy);

  /* Live server status (Java + Bedrock) */
  var HOST = "play.finosmp.goods112.pp.ua";
  var EDITIONS = {
    java: { port: 26121, base: "java" },
    bedrock: { port: 26194, base: "bedrock" }
  };
  var state = { java: null, bedrock: null };

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function javaPlayers() {
    return state.java ? state.java.players : 0;
  }

  function renderAggregate() {
    var count = javaPlayers();
    var stat = document.getElementById("statPlayers");
    if (stat) stat.textContent = count;
    var javaTxt = document.getElementById("statusTextJava");
    if (javaTxt && state.java) {
      javaTxt.textContent = state.java.online ? (count + " online") : "Offline";
    }
  }

  function applyEdition(ed, online, players, list) {
    state[ed] = { online: online, players: players, list: list };
    var status = document.getElementById("status" + cap(ed));
    var txt = document.getElementById("statusText" + cap(ed));
    if (status) status.classList.add(online ? "online" : "offline");
    if (txt) {
      if (ed === "bedrock") {
        txt.textContent = online ? "Supported" : "Unsupported";
      } else {
        txt.textContent = online ? (javaPlayers() + " online") : "Offline";
      }
    }
    renderAggregate();
  }

  var POLL_MS = 15000;
  var inflight = {};

  function fetchEdition(ed) {
    if (inflight[ed]) return;
    inflight[ed] = true;
    var url = "https://api.mcstatus.io/v2/status/" + EDITIONS[ed].base + "/" +
      HOST + ":" + EDITIONS[ed].port + "?_=" + Date.now();
    var xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.timeout = 6000;
    xhr.onload = function () {
      inflight[ed] = false;
      try {
        var d = JSON.parse(xhr.responseText);
        if (d && d.online) {
          applyEdition(ed, true, (d.players && d.players.online) || 0, (d.players && d.players.list) || []);
        } else {
          applyEdition(ed, false, 0, []);
        }
      } catch (e) {
        applyEdition(ed, false, 0, []);
      }
    };
    xhr.onerror = function () { inflight[ed] = false; applyEdition(ed, false, 0, []); };
    xhr.ontimeout = function () { inflight[ed] = false; applyEdition(ed, false, 0, []); };
    xhr.send();
  }

  function pollAll() {
    Object.keys(EDITIONS).forEach(fetchEdition);
  }

  pollAll();
  setInterval(pollAll, POLL_MS);
  document.addEventListener("visibilitychange", function () {
    if (!document.hidden) pollAll();
  });
})();
