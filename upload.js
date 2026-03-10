const images = [

"https://www.mmv.fr/images/cms/paysage-montagne-ete/paysage-montagne-mont-blanc.jpg?frz-v=647",
"https://www.okvoyage.com/wp-content/uploads/2022/11/paysages-de-montagne.jpg",
"https://www.france-montagnes.com/wp-content/uploads/2024/12/panorama-lac-dallos-montagne-c-florianscala-1280x645-1734687992.jpg",
"https://img-4.linternaute.com/Eii63OQvZBqK5I5uoP9oWdyPecQ=/1240x/smart/685fdd5cfcf444e08d3ff22cde5d1581/ccmcms-linternaute/2377659.jpg"

];

let index = 0;

function changeBackground() {

document.body.style.backgroundImage = `url(${images[index]})`;

index++;

if(index >= images.length){
index = 0;
}

}

changeBackground();

setInterval(changeBackground, 120000);

const dropZone = document.getElementById("drop-zone")
const fileInput = document.getElementById("file-input")

dropZone.addEventListener("dragover", e=>{
    e.preventDefault()
    dropZone.classList.add("hover")
})

dropZone.addEventListener("dragleave", ()=>{
    dropZone.classList.remove("hover")
})

dropZone.addEventListener("drop", e=>{
    e.preventDefault()
    fileInput.files = e.dataTransfer.files
    dropZone.classList.remove("hover")
})

function generateID(){
return Math.random().toString(36).substring(2,8)
}