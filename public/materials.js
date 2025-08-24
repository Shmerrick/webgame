document.addEventListener("DOMContentLoaded", () => {
    const materialsContainer = document.getElementById("materials-container");

    fetch("materials.json", { cache: "no-cache" })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
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

                                const stats = [
                                    { label: "Offense Slash", value: material.slash },
                                    { label: "Offense Pierce", value: material.pierce },
                                    { label: "Offense Blunt", value: material.blunt },
                                    { label: "Defense Slash", value: material.defense_slash },
                                    { label: "Defense Pierce", value: material.defense_pierce },
                                    { label: "Defense Blunt", value: material.defense_blunt },
                                    { label: "Magic", value: material.magic },
                                ];

                                stats.forEach(stat => {
                                    const p = document.createElement("p");
                                    const strong = document.createElement("strong");
                                    strong.textContent = `${stat.label}:`;
                                    p.appendChild(strong);
                                    p.appendChild(document.createTextNode(` ${stat.value}`));
                                    details.appendChild(p);
                                });

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
        })
        .catch(error => {
            console.error("Error fetching materials:", error);
            materialsContainer.innerHTML = "<p class=\"text-red-500\">Failed to load materials data.</p>";
        });
});
