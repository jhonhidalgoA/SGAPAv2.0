document.addEventListener("DOMContentLoaded", function () {
    
    const tabs = document.querySelectorAll(".tab-nav li");
    const tabContents = document.querySelectorAll(".tab-content");

    tabs.forEach(tab => {
        tab.addEventListener("click", function () {
            const target = this.getAttribute("data-tab");

            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            tabContents.forEach(content => {
                content.style.display = content.id === target ? "block" : "none";
            });
        });
    });
});