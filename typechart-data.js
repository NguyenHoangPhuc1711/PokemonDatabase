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
