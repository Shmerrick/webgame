function updateAspectRatio() {
    const aspect_ratio = window.innerWidth / window.innerHeight;
    const html_element = document.documentElement;

    let aspectRatioName = "standard";

    if (aspect_ratio >= 21 / 9) {
        aspectRatioName = "ultrawide";
    } else if (aspect_ratio >= 16 / 9) {
        aspectRatioName = "widescreen";
    } else if (aspect_ratio <= 2 / 3) {
        aspectRatioName = "mobile";
    }

    html_element.setAttribute("data-aspect-ratio", aspectRatioName);
}

window.addEventListener("resize", updateAspectRatio);
document.addEventListener("DOMContentLoaded", updateAspectRatio);
