export function renderStars(container, rating = 0, onRate) {
    console.log("🌟 Render stars chiamato per container:", container);
    
    if (!container) {
        console.log("❌ Container non trovato per stars");
        return;
    }

    container.innerHTML = "";

    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";
    wrapper.style.gap = "6px";

    const starsBox = document.createElement("div");
    starsBox.style.display = "flex";
    starsBox.style.gap = "2px";

    const text = document.createElement("span");
    text.style.fontSize = "14px";
    text.style.color = "#666";

    function draw(r) {
        console.log("⭐ Disegno stelle con rating:", r);
        starsBox.innerHTML = "";

        for (let i = 1; i <= 5; i++) {
            const star = document.createElement("span");
            star.textContent = "⭐";
            star.style.cursor = "pointer";
            star.style.fontSize = "16px";
            star.style.color = i <= r ? "gold" : "#999";

            star.addEventListener("click", () => {
                console.log("🌟 Click stella:", i);
                if (onRate) onRate(i);
                draw(i);
                text.textContent = `${i}/5`;
            });

            starsBox.appendChild(star);
        }

        text.textContent = `${r}/5`;
    }

    draw(rating);

    wrapper.appendChild(starsBox);
    wrapper.appendChild(text);

    container.appendChild(wrapper);
    console.log("✅ Render stars completato");
}

export function updateHeart(el, liked) {
    if (!el) return;
    el.textContent = liked ? "❤️" : "🤍";
}