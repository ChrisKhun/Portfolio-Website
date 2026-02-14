document.addEventListener("DOMContentLoaded", () => {
    const cursor = document.createElement("div");
    cursor.className = "custom-cursor";
    document.body.appendChild(cursor);

    let mx = 0, my = 0, cx = 0, cy = 0;

    document.addEventListener("mousemove", (e) => {
        mx = e.clientX;
        my = e.clientY;
    });

    function tick() {
        cx += (mx - cx) * 0.18;
        cy += (my - cy) * 0.18;
        cursor.style.left = cx + "px";
        cursor.style.top = cy + "px";
        requestAnimationFrame(tick);
    }
    tick();

    // Grow cursor on interactive hover
    const hoverables = document.querySelectorAll("a, button, .btn, .mitem, input, textarea, select");
    hoverables.forEach(el => {
        el.addEventListener("mouseenter", () => cursor.classList.add("hover"));
        el.addEventListener("mouseleave", () => cursor.classList.remove("hover"));
    });
});
