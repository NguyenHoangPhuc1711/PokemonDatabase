const evivBase = document.getElementById("eviv-base");
const evivIv = document.getElementById("eviv-iv");
const evivEv = document.getElementById("eviv-ev");
const evivLevel = document.getElementById("eviv-level");
const evivNature = document.getElementById("eviv-nature");
const evivResult = document.getElementById("eviv-result");

function calculateStat(base, iv, ev, level, natureMultiplier) {
  const stat = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + 5;
  return Math.floor(stat * natureMultiplier);
}

function renderEvivResult() {
  const base = Number(evivBase.value) || 0;
  const iv = Number(evivIv.value) || 0;
  const ev = Number(evivEv.value) || 0;
  const level = Number(evivLevel.value) || 1;
  const natureMultiplier = Number(evivNature.value) || 1;

  const hp = Math.floor(((2 * base + iv + Math.floor(ev / 4)) * level) / 100) + level + 10;
  const other = calculateStat(base, iv, ev, level, natureMultiplier);

  evivResult.innerHTML = `
    <div class="result-stat-box">
      <span>HP</span>
      <strong>${hp}</strong>
    </div>
    <div class="result-stat-box">
      <span>Other stats</span>
      <strong>${other}</strong>
    </div>
  `;
}

[evivBase, evivIv, evivEv, evivLevel, evivNature].forEach(input => input.addEventListener("input", renderEvivResult));
renderEvivResult();
