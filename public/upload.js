const images = [

"https://picsum.photos/1920/1080?1",
"https://picsum.photos/1920/1080?2",
"https://picsum.photos/1920/1080?3",
"https://picsum.photos/1920/1080?4"

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