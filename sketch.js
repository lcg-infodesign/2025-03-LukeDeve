let data;


let minLat, minLon, maxLat, maxLon;



function preload() {
  data = loadTable("data-vulcano.csv", "csv", "header");
}

function setup() {
  createCanvas(windowWidth, windowHeight);

  //definisco min e max per latitudine e longitudine
  let allLat = data.getColumn("Latitude");
  minLat = min(allLat);
  maxLat = max(allLat);

  let allLon = data.getColumn("Longitude");
  minLon = min(allLon);
  maxLon = max(allLon);

}

function draw() {
  background(10);

  for(let rowNumber = 0; rowNumber < data.getRowCount(); rowNumber++){
//leggo i dati di ogni singola riga
let lat = data.getNum(rowNumber, "Latitude");
let lon = data.getNum(rowNumber, "Longitude");
let name = data.getString(rowNumber, "Country");

//converto le coordinate geografiche in coordinate pixel
let x = map(lon, minLon, maxLon, 0, width);
let y = map(lat, minLat, maxLat, height, 0); //invertito perche' latitudine cresce verso nord
let radius = 20;


//calcolare la distanza 
let d = dist(x, y, mouseX, mouseY);

if(d < radius){
  fill("red");
  text(name, x, y);
}
if (d > radius){
  fill("green");
}

ellipse(x, y, radius);
  }
}
