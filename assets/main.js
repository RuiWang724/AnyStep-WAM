"use strict";

const modelNames = {fastwam: "AnyStep-FastWAM", lingbotva: "AnyStep-LingBotVA", motus: "AnyStep-Motus"};
const galleryVersion = "nolabel-20260930";
const tabs = [...document.querySelectorAll("[data-model]")];
const demoVideos = [...document.querySelectorAll("video[data-task]")];
const heroVideo = document.querySelector("#hero-video");
const panel = document.querySelector("#demo-panel");

function selectModel(tab) {
  if (tab.getAttribute("aria-selected") === "true") return;
  const model = tab.dataset.model;
  tabs.forEach(item => {
    const selected = item === tab;
    item.setAttribute("aria-selected", String(selected));
    item.tabIndex = selected ? 0 : -1;
  });
  panel.setAttribute("aria-labelledby", tab.id);
  demoVideos.forEach(video => {
    video.pause();
    video.playbackRate = 1;
    video.poster = `assets/${model}-${video.dataset.task}.jpg?v=${galleryVersion}`;
    video.querySelector("source").src = `assets/${model}-${video.dataset.task}.mp4?v=${galleryVersion}`;
    video.setAttribute("aria-label", `${modelNames[model]}: ${video.closest("article").querySelector("h3").textContent}, recorded at 1× speed`);
    video.load();
  });
  document.querySelector("#demo-status").textContent = `Showing six ${modelNames[model]} demonstrations.`;
}

tabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectModel(tab));
  tab.addEventListener("keydown", event => {
    let next;
    if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
    if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = tabs.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    tabs[next].focus();
    selectModel(tabs[next]);
  });
});

// Keep simultaneous playback manageable without changing recording speed.
demoVideos.forEach(video => video.addEventListener("play", () => {
  heroVideo.pause();
  demoVideos.forEach(other => { if (other !== video) other.pause(); });
}));
document.addEventListener("visibilitychange", () => {
  if (document.hidden) document.querySelectorAll("video").forEach(video => video.pause());
});
if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  heroVideo.autoplay = false;
  heroVideo.pause();
}
if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (!entry.isIntersecting) heroVideo.pause(); });
  }, {threshold: 0});
  observer.observe(heroVideo);
}

const dialog = document.querySelector("#figure-dialog");
document.querySelectorAll("[data-figure]").forEach(button => {
  button.addEventListener("click", () => {
    const image = document.querySelector("#dialog-image");
    image.src = button.dataset.figure;
    image.alt = button.querySelector("img").alt;
    document.querySelector("#figure-dialog-title").textContent = button.dataset.caption;
    dialog.showModal();
    document.body.classList.add("dialog-open");
  });
});
document.querySelector("#close-figure").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
dialog.addEventListener("close", () => document.body.classList.remove("dialog-open"));

document.querySelector("#copy-citation").addEventListener("click", async () => {
  const text = document.querySelector("#bibtex").textContent;
  const status = document.querySelector("#copy-status");
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      if (!copied) throw new Error("Clipboard unavailable");
    }
    status.textContent = "Citation copied to clipboard.";
  } catch {
    const range = document.createRange();
    range.selectNodeContents(document.querySelector("#bibtex"));
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = "Citation selected. Press Ctrl+C (or Command+C) to copy.";
  }
});
