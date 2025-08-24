document.addEventListener("DOMContentLoaded", () => {
    const materialsContainer = document.getElementById("materials-container");

    fetch("materials.json", { cache: "no-cache" })
        .then(response => response.json())
        .then(data => {
            for (const category in data) {
                const categoryCard = document.createElement("div");
                categoryCard.className = "bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-lg";

                const categoryTitle = document.createElement("h2");
                categoryTitle.className = "text-2xl font-bold mb-4 break-words";
                categoryTitle.textContent = category;

                const categoryContent = document.createElement("div");
                categoryContent.className = "grid grid-cols-1 md:grid-cols-2 aspect-widescreen:grid-cols-2 aspect-ultrawide:grid-cols-2 gap-8";

                const imageContainer = document.createElement("div");
                const image = document.createElement("img");
                image.src = `https://via.placeholder.com/150/0f172a/e2e8f0?text=${category}`;
                image.alt = category;
                image.className = "rounded-lg";
                imageContainer.appendChild(image);

                const materialsList = document.createElement("ul");
                materialsList.className = "list-disc list-inside";

                const tierKeys = Object.keys(data[category]).sort((a, b) => {
                    const numA = parseInt(a.replace(/[^0-9]/g, ""));
                    const numB = parseInt(b.replace(/[^0-9]/g, ""));
                    return numA - numB;
                });

                tierKeys.forEach(tier => {
                    const tierItem = document.createElement("li");
                    tierItem.className = "font-semibold text-lg mt-2 break-words";
                    tierItem.textContent = tier;

                    const tierList = document.createElement("ul");
                    tierList.className = "list-disc list-inside ml-4";

                    data[category][tier].forEach(material => {
                        const materialItem = document.createElement("li");
                        materialItem.className = "break-words";
                        materialItem.textContent = material.name;
                        materialItem.style.cursor = "pointer";
                        materialItem.addEventListener("click", () => {
                            const existingDetails = materialItem.querySelector(".details");
                            if (existingDetails) {
                                existingDetails.remove();
                            } else {
                                const details = document.createElement("div");
                                details.className = "details p-2 pl-4 text-slate-400 bg-slate-800/50 rounded-lg mt-2 break-words whitespace-normal";
                                details.style.paddingLeft = "20px";
                                details.innerHTML = `
                                    <p><strong>Offense Slash:</strong> ${material.slash}</p>
                                    <p><strong>Offense Pierce:</strong> ${material.pierce}</p>
                                    <p><strong>Offense Blunt:</strong> ${material.blunt}</p>
                                    <p><strong>Defense Slash:</strong> ${material.defense_slash}</p>
                                    <p><strong>Defense Pierce:</strong> ${material.defense_pierce}</p>
                                    <p><strong>Defense Blunt:</strong> ${material.defense_blunt}</p>
                                    <p><strong>Magic:</strong> ${material.magic}</p>
                                `;
                                materialItem.appendChild(details);
                            }
                        });
                        tierList.appendChild(materialItem);
                    });
                    tierItem.appendChild(tierList);
                    materialsList.appendChild(tierItem);
                });

                categoryContent.appendChild(imageContainer);
                categoryContent.appendChild(materialsList);
                categoryCard.appendChild(categoryTitle);
                categoryCard.appendChild(categoryContent);
                materialsContainer.appendChild(categoryCard);
            }
        });
});
