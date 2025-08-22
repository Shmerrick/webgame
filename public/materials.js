document.addEventListener("DOMContentLoaded", () => {
    const materialsContainer = document.getElementById("materials-container");

    fetch("db.json")
        .then(response => response.json())
        .then(data => {
            for (const category in data) {
                const categoryCard = document.createElement("div");
                categoryCard.className = "bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg";

                const categoryTitle = document.createElement("h2");
                categoryTitle.className = "text-2xl font-bold mb-4";
                categoryTitle.textContent = category;

                const categoryContent = document.createElement("div");
                categoryContent.className = "grid grid-cols-1 md:grid-cols-2 gap-8";

                const imageContainer = document.createElement("div");
                const image = document.createElement("img");
                image.src = `https://via.placeholder.com/150/0f172a/e2e8f0?text=${category}`;
                image.alt = category;
                image.className = "rounded-lg";
                imageContainer.appendChild(image);

                const materialsList = document.createElement("ul");
                materialsList.className = "list-disc list-inside";

                for (const tier in data[category]) {
                    const tierItem = document.createElement("li");
                    tierItem.className = "font-semibold text-lg mt-2";
                    tierItem.textContent = tier;

                    const tierList = document.createElement("ul");
                    tierList.className = "list-disc list-inside ml-4";

                    data[category][tier].forEach(material => {
                        const materialItem = document.createElement("li");
                        materialItem.textContent = material.name;
                        tierList.appendChild(materialItem);
                    });
                    tierItem.appendChild(tierList);
                    materialsList.appendChild(tierItem);
                }

                categoryContent.appendChild(imageContainer);
                categoryContent.appendChild(materialsList);
                categoryCard.appendChild(categoryTitle);
                categoryCard.appendChild(categoryContent);
                materialsContainer.appendChild(categoryCard);
            }
        });
});
