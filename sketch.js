let data;
let world;

function preload() {
  data = loadTable("data-vulcano.csv", "csv", "header");
  world = loadJSON("countries.geo.json");   // il file GeoJSON
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  noLoop(); // la mappa non cambia, non serve ridisegnare
}

function draw() {
  background(20);

  drawWorld();      // continenti veri
  drawWorldGrid();  
  drawVolcanoes();  
}


// ----------------------------
// 1. Disegno del mondo (da GeoJSON)
// ----------------------------
function drawWorld() {
  fill(40, 120, 60);
  stroke(0);
  strokeWeight(0.5);

  let features = world.features;

  for (let f of features) {
    let geom = f.geometry;

    if (geom.type === "Polygon") {
      drawPolygon(geom.coordinates);
    } 
    else if (geom.type === "MultiPolygon") {
      for (let poly of geom.coordinates) {
        drawPolygon(poly);
      }
    }
  }
}

function drawPolygon(coordArray) {
  beginShape();
  for (let ring of coordArray) {
    for (let c of ring) {
      let lon = c[0];
      let lat = c[1];
      let x = map(lon, -180, 180, 0, width);
      let y = map(lat, 90, -90, 0, height);
      vertex(x, y);
    }
  }
  endShape(CLOSE);
}


// ----------------------------
// 2. Griglia
// ----------------------------
function drawWorldGrid() {
  stroke(100, 150);
  strokeWeight(1);

  for (let lon = -180; lon <= 180; lon += 20) {
    let x = map(lon, -180, 180, 0, width);
    line(x, 0, x, height);
  }

  for (let lat = -90; lat <= 90; lat += 20) {
    let y = map(lat, 90, -90, 0, height);
    line(0, y, width, y);
  }
}


// ----------------------------
// 3. Vulcani
// ----------------------------
function drawVolcanoes() {
  noFill();
  stroke(255);
  strokeWeight(1.5);

  for (let r = 0; r < data.getRowCount(); r++) {
    let lat = Number(data.getString(r, "Latitude"));
    let lon = Number(data.getString(r, "Longitude"));
    let type = data.getString(r, "Type");

    if (isNaN(lat) || isNaN(lon)) continue;
    if (!type) type = "Unknown";

    let x = map(lon, -180, 180, 0, width);
    let y = map(lat, 90, -90, 0, height);

    drawSymbolForType(type, x, y);
  }
}


// ----------------------------
// 4. Resize finestra
// ----------------------------
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  redraw();
}