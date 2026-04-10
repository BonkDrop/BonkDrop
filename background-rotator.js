const backgroundImages = [
    "wallpaper/343199-landscape-nature-sea-beach-2969367691.jpg",
    "wallpaper/Beautiful_Landscape_Mountain-4235387320.jpg",
    "wallpaper/les-fleurs-en-islande-3359334573.jpg",
    "wallpaper/Beautiful-nature-landscape-mountains-trees-lake-clear-water-reflection_2560x1440-669162837.jpg",
    "wallpaper/nature-landscape-beach-sea-wallpaper-2582425400.jpg",
    "wallpaper/Cascade_-15-617280561.jpg",
    "wallpaper/shutterstock_1822583969-1330489960.jpg",
];

const backgroundLayers = document.querySelectorAll(".site-background-layer");

if (backgroundLayers.length === 2) {
    let shuffledOrder = [];
    let orderPosition = 0;
    let currentImageIndex = -1;
    let visibleLayerIndex = 0;

    function shuffleIndexes(indexes) {
        const result = [...indexes];

        for (let i = result.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [result[i], result[j]] = [result[j], result[i]];
        }

        return result;
    }

    function buildShuffledOrder(previousOrder, lastImageIndex) {
        const baseIndexes = backgroundImages.map((_, index) => index);

        if (baseIndexes.length <= 1) {
            return baseIndexes;
        }

        let attempts = 0;
        let nextOrder = shuffleIndexes(baseIndexes);

        while (attempts < 20) {
            const sameAsPrevious =
                previousOrder.length === nextOrder.length &&
                previousOrder.every((value, index) => value === nextOrder[index]);
            const startsWithCurrent = nextOrder[0] === lastImageIndex;

            if (!sameAsPrevious && !startsWithCurrent) {
                return nextOrder;
            }

            nextOrder = shuffleIndexes(baseIndexes);
            attempts += 1;
        }

        return nextOrder;
    }

    function preloadBackgrounds() {
        backgroundImages.forEach((imageUrl) => {
            const image = new Image();
            image.src = imageUrl;
        });
    }

    function applyBackground(layerIndex, imageUrl) {
        backgroundLayers[layerIndex].style.backgroundImage = `linear-gradient(rgba(5, 8, 12, 0.58), rgba(5, 8, 12, 0.78)), url("${imageUrl}")`;
    }

    function getNextImageIndex() {
        if (shuffledOrder.length === 0 || orderPosition >= shuffledOrder.length) {
            shuffledOrder = buildShuffledOrder(shuffledOrder, currentImageIndex);
            orderPosition = 0;
        }

        const nextImageIndex = shuffledOrder[orderPosition];
        orderPosition += 1;
        currentImageIndex = nextImageIndex;
        return nextImageIndex;
    }

    function rotateBackground() {
        const nextImageIndex = getNextImageIndex();
        const nextLayerIndex = visibleLayerIndex === 0 ? 1 : 0;

        applyBackground(nextLayerIndex, backgroundImages[nextImageIndex]);
        backgroundLayers[nextLayerIndex].classList.add("is-visible");
        backgroundLayers[visibleLayerIndex].classList.remove("is-visible");
        visibleLayerIndex = nextLayerIndex;
    }

    const initialImageIndex = getNextImageIndex();
    applyBackground(visibleLayerIndex, backgroundImages[initialImageIndex]);
    preloadBackgrounds();
    window.setInterval(rotateBackground, 120000);
}