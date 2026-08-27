// ========================================
// TYPE CHART DATA (Gen 6+)
// attackMultiplier[Attacker][Defender] = hệ số sát thương
// ========================================

const TYPE_ORDER = [
    "normal", "fire", "water", "electric", "grass", "ice",
    "fighting", "poison", "ground", "flying", "psychic", "bug",
    "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

const TYPE_LABEL_VI = {
    normal: "Thường", fire: "Lửa", water: "Nước", electric: "Điện",
    grass: "Cỏ", ice: "Băng", fighting: "Đấu", poison: "Độc",
    ground: "Đất", flying: "Bay", psychic: "Siêu Năng", bug: "Bọ",
    rock: "Đá", ghost: "Bóng Ma", dragon: "Rồng", dark: "Bóng Tối",
    steel: "Thép", fairy: "Tiên"
};

const TYPE_SHORT = {
    normal: "NOR", fire: "FIR", water: "WAT", electric: "ELE",
    grass: "GRA", ice: "ICE", fighting: "FIG", poison: "POI",
    ground: "GRO", flying: "FLY", psychic: "PSY", bug: "BUG",
    rock: "ROC", ghost: "GHO", dragon: "DRA", dark: "DAR",
    steel: "STE", fairy: "FAI"
};

// Chỉ khai báo ngoại lệ (không phải 1x); còn lại mặc định = 1
const TYPE_CHART_EXCEPTIONS = {
    normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
    fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
    water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
    electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
    grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
    ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
    fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
    poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
    ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
    flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
    psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
    bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
    rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
    ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
    dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
    dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
    steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
    fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 }
};

function getAttackMultiplier(attacker, defender) {
    const exceptions = TYPE_CHART_EXCEPTIONS[attacker];
    if (exceptions && Object.prototype.hasOwnProperty.call(exceptions, defender)) {
        return exceptions[defender];
    }
    return 1;
}

function formatMultiplier(value) {
    if (value === 0) return "0";
    if (value === 0.25) return "¼";
    if (value === 0.5) return "½";
    if (value === 1) return "1";
    return String(value);
}

function multiplierClass(value) {
    if (value === 0) return "mult-0";
    if (value === 0.25) return "mult-025";
    if (value === 0.5) return "mult-05";
    if (value === 1) return "mult-1";
    if (value === 2) return "mult-2";
    if (value === 4) return "mult-4";
    return "mult-1";
}


// ========================================
// RENDER TYPE PICKER
// ========================================

const typeSelectGrid = document.getElementById("type-select-grid");
let selectedType = "bug";

function renderTypePicker() {
    typeSelectGrid.innerHTML = TYPE_ORDER.map(type => `
        <button
            class="type-pick-btn ${type === selectedType ? "active" : ""}"
            data-type="${type}"
            type="button"
        >
            <span class="type ${type}">${type.toUpperCase()}</span>
            <span class="type-pick-name">${TYPE_LABEL_VI[type]}</span>
        </button>
    `).join("");
}

typeSelectGrid.addEventListener("click", event => {
    const btn = event.target.closest(".type-pick-btn");
    if (!btn) return;

    selectedType = btn.dataset.type;
    renderTypePicker();
    renderTypeDetail(selectedType);
    renderDualTypeChart(selectedType);

    document.querySelector(".type-pros-cons-grid").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});


// ========================================
// RENDER ATTACK / DEFENSE PROS & CONS
// ========================================

function typeBadge(type) {
    return `<span class="type ${type}">${type.toUpperCase()}</span>`;
}

function renderTypeDetail(type) {
    const label = `${TYPE_LABEL_VI[type]} (${type.toUpperCase()})`;

    document.querySelectorAll("#attack-type-label, #defense-type-label, #dual-type-label")
        .forEach(el => el.textContent = label);
    document.querySelectorAll("#attack-name-1, #attack-name-2, #attack-name-3")
        .forEach(el => el.textContent = TYPE_LABEL_VI[type]);
    document.querySelectorAll("#defense-name-1, #defense-name-2, #defense-name-3")
        .forEach(el => el.textContent = TYPE_LABEL_VI[type]);

    // --- Tấn công (type là kẻ tấn công) ---
    const superList = [];
    const notVeryList = [];
    const noEffectAtkList = [];

    TYPE_ORDER.forEach(defender => {
        if (defender === type) return;
        const mult = getAttackMultiplier(type, defender);
        if (mult > 1) superList.push(defender);
        else if (mult === 0) noEffectAtkList.push(defender);
        else if (mult < 1) notVeryList.push(defender);
    });

    document.getElementById("attack-super-list").innerHTML =
        superList.map(typeBadge).join("") || `<span class="type-badge-empty">Không có</span>`;
    document.getElementById("attack-notvery-list").innerHTML =
        notVeryList.map(typeBadge).join("") || `<span class="type-badge-empty">Không có</span>`;

    const noEffectAtkBlock = document.getElementById("attack-noeffect-block");
    if (noEffectAtkList.length > 0) {
        noEffectAtkBlock.hidden = false;
        document.getElementById("attack-noeffect-list").innerHTML = noEffectAtkList.map(typeBadge).join("");
    } else {
        noEffectAtkBlock.hidden = true;
    }

    // --- Phòng thủ (type là người bị tấn công) ---
    const resistList = [];
    const weakList = [];
    const immuneList = [];

    TYPE_ORDER.forEach(attacker => {
        if (attacker === type) return;
        const mult = getAttackMultiplier(attacker, type);
        if (mult > 1) weakList.push(attacker);
        else if (mult === 0) immuneList.push(attacker);
        else if (mult < 1) resistList.push(attacker);
    });

    document.getElementById("defense-resist-list").innerHTML =
        resistList.map(typeBadge).join("") || `<span class="type-badge-empty">Không có</span>`;
    document.getElementById("defense-weak-list").innerHTML =
        weakList.map(typeBadge).join("") || `<span class="type-badge-empty">Không có</span>`;

    const immuneBlock = document.getElementById("defense-immune-block");
    if (immuneList.length > 0) {
        immuneBlock.hidden = false;
        document.getElementById("defense-immune-list").innerHTML = immuneList.map(typeBadge).join("");
    } else {
        immuneBlock.hidden = true;
    }
}


// ========================================
// RENDER DUAL-TYPE ATTACK CHART
// ========================================

function renderDualTypeChart(attacker) {
    document.getElementById("dual-type-desc").innerHTML =
        `Biểu đồ này cho biết sức mạnh của hệ <strong>${TYPE_LABEL_VI[attacker]} (${attacker.toUpperCase()})</strong> khi tấn công mọi tổ hợp hệ đôi. ` +
        `Số thể hiện lượng sát thương gây ra - ví dụ ½ nghĩa là 50% sát thương (không hiệu quả), 2 nghĩa là 200% (hiệu quả cao).`;

    const table = document.getElementById("type-chart-table");

    let thead = `<thead><tr><th></th>`;
    TYPE_ORDER.forEach(type => {
        thead += `<th><span class="type-chart-head type ${type}">${TYPE_SHORT[type]}</span></th>`;
    });
    thead += `</tr></thead>`;

    let tbody = `<tbody>`;
    TYPE_ORDER.forEach(rowType => {
        tbody += `<tr>`;
        tbody += `<th><span class="type-chart-head type ${rowType}">${TYPE_SHORT[rowType]}</span></th>`;

        TYPE_ORDER.forEach(colType => {
            if (colType === rowType) {
                tbody += `<td class="type-chart-cell mult-blocked"></td>`;
                return;
            }

            const combined = getAttackMultiplier(attacker, rowType) * getAttackMultiplier(attacker, colType);
            const displayValue = combined === 1 ? "" : formatMultiplier(combined);
            const cellClass = combined === 1 ? "mult-1-blank" : multiplierClass(combined);

            tbody += `<td class="type-chart-cell ${cellClass}">${displayValue}</td>`;
        });

        tbody += `</tr>`;
    });
    tbody += `</tbody>`;

    table.innerHTML = thead + tbody;
}


// ========================================
// INIT
// ========================================

renderTypePicker();
renderTypeDetail(selectedType);
renderDualTypeChart(selectedType);
