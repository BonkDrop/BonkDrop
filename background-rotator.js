const backgroundImages = [
    "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fwww.photo-paysage.com%2Falbums%2Fuserpics%2F10001%2FCascade_-15.JPG&f=1&nofb=1&ipt=bca2a519e093c7cada821e49997903fb0467c6e70847f5f3a02d401071e4806d",
    "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwallup.net%2Fwp-content%2Fuploads%2F2014%2F10%2Fnature%2FBeautiful_Landscape_Mountain.jpg&f=1&nofb=1&ipt=ba70367f037ebaea982e576fccd2b6670367b2a26e7ea2709ba28e75284894bd",
    "https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fwallup.net%2Fwp-content%2Fuploads%2F2016%2F03%2F10%2F343199-landscape-nature-sea-beach.jpg&f=1&nofb=1&ipt=64928b13a86b45422a726b24d355d65117aea53492225eba70b9e837e669b0be",
    "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.okvoyage.com%2Fwp-content%2Fuploads%2F2024%2F04%2Fles-fleurs-en-islande.jpg&f=1&nofb=1&ipt=66157958fafbff60df3f2af7f5c19365111c6a61fbcc46e0222e1d470961d4db",
    "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fs2.best-wallpaper.net%2Fwallpaper%2F2560x1440%2F1902%2FBeautiful-nature-landscape-mountains-trees-lake-clear-water-reflection_2560x1440.jpg&f=1&nofb=1&ipt=1b7ac250f5fe0541503afb16b32f890ed2aae7fad2061daa84102776658d73cb",
    "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.wallpaperflare.com%2Fstatic%2F453%2F767%2F635%2Fnature-landscape-beach-sea-wallpaper.jpg&f=1&nofb=1&ipt=410447f1fe6171beffd6f9ab0b224abc4e53055df775b0774686ade807bbb942",
    "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fwww.cherifaistesvalises.com%2Fwp-content%2Fuploads%2F2022%2F07%2Fshutterstock_1822583969.jpg&f=1&nofb=1&ipt=e1e9bb5af42b5b3d788aa71013e0c0f24d27cf8614447d57673db70587c08c41"
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