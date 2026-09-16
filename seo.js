(function setupPageSeo() {
    const pageSeo = {
        "index.html": {
            title: "Pokémon Information | Pokédex",
            description: "Khám phá Pokédex, chỉ số, hệ, tiến hóa và dữ liệu Pokémon chính xác cho mọi Trainer."
        },
        "PokemonDatabase.html": {
            title: "Pokémon Database | Pokédex",
            description: "Tra cứu thông tin, chỉ số, hệ, tiến hóa, chiêu thức và sprite của Pokémon."
        },
        "Types.html": {
            title: "Pokémon Type Chart | PokemonInformation",
            description: "Bảng tương khắc 18 hệ Pokémon với sát thương, điểm mạnh, điểm yếu và miễn nhiễm."
        },
        "Meta.html": {
            title: "Pokémon Champions Meta | PokemonInformation",
            description: "Theo dõi Pokémon, move, item và đồng đội được sử dụng nhiều trong meta Pokémon Champions."
        },
        "Moves.html": {
            title: "Move Database | PokemonInformation",
            description: "Tra cứu move Pokémon theo type, power, accuracy, PP và usage thực chiến."
        },
        "Abilities.html": {
            title: "Ability Database | PokemonInformation",
            description: "Tra cứu ability Pokémon, mô tả hiệu ứng và danh sách Pokémon sở hữu."
        },
        "Breeding.html": {
            title: "Breeding & Egg Groups | PokemonInformation",
            description: "Tìm Egg Group và Pokémon có thể breeding cùng nhau trong Pokémon."
        },
        "EVIV.html": {
            title: "EV IV Calculator | PokemonInformation",
            description: "Tính stat Pokémon theo base stat, level, EV, IV và nature."
        },
        "Compare.html": {
            title: "Compare Pokémon | PokemonInformation",
            description: "So sánh song song stats, type và sức mạnh tổng quan của hai Pokémon."
        },
        "TeamBuilder.html": {
            title: "Pokémon Team Builder | PokemonInformation",
            description: "Xây dựng đội Pokémon, phân tích weakness, coverage và xuất team Showdown."
        },
        "TrainerCard.html": {
            title: "Trainer Card Generator | PokemonInformation",
            description: "Tạo Trainer Card Pokémon cá nhân với avatar, rank, team và Pokémon đồng hành."
        },
        "Chatbot.html": {
            title: "Pokémon Chatbot | PokemonInformation",
            description: "Hỏi chatbot về build, item, đồng đội và tương khắc hệ Pokémon."
        },
        "DamageCalc.html": {
            title: "Pokémon Damage Calculator | PokemonInformation",
            description: "Tính sát thương Pokémon theo attacker, defender, move, item, nature và battle conditions."
        }
    };

    const fileName = window.location.pathname.split("/").pop() || "index.html";
    const data = pageSeo[fileName] || pageSeo["index.html"];
    const canonicalUrl = `${window.location.origin}${window.location.pathname}`;

    document.title = data.title;

    function setMeta(name, content) {
        let element = document.querySelector(`meta[name="${name}"]`);
        if (!element) {
            element = document.createElement("meta");
            element.setAttribute("name", name);
            document.head.appendChild(element);
        }
        element.setAttribute("content", content);
    }

    function setProperty(property, content) {
        let element = document.querySelector(`meta[property="${property}"]`);
        if (!element) {
            element = document.createElement("meta");
            element.setAttribute("property", property);
            document.head.appendChild(element);
        }
        element.setAttribute("content", content);
    }

    setMeta("description", data.description);
    setMeta("robots", "index,follow");
    setProperty("og:type", "website");
    setProperty("og:title", data.title);
    setProperty("og:description", data.description);
    setProperty("og:url", canonicalUrl);
    setProperty("og:site_name", "PokemonInformation");
    setProperty("og:image", `${window.location.origin}/hero-pokemon.png`);
    setProperty("og:image:alt", "PokemonInformation Pokédex");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", data.title);
    setMeta("twitter:description", data.description);
    setMeta("twitter:image", `${window.location.origin}/hero-pokemon.png`);

    let canonical = document.querySelector("link[rel=canonical]");
    if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;
})();
