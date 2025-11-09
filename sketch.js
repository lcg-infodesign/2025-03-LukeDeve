


let dataTable = null;
let worldGeo = null;

// Variabili per lo zoom
let zoomLevel = 1;
let centerX = 0;
let centerY = 0;

// bottoni zoom
let zoomInButton = {x: 0, y: 0, size: 40};
let zoomOutButton = {x: 0, y: 0, size: 40};

// Nomi delle colonne nel CSV
let COLS = {
  name: 'Volcano Name',
  country: 'Country',
  location: 'Location',
  lat: 'Latitude',
  lon: 'Longitude',
  elev: 'Elevation (m)',
  type: 'Type',
  status: 'Status',
  last: 'Last Known Eruption'
};

function preload() {
  // Carica i dati dei vulcani
  dataTable = loadTable('data-vulcano.csv', 'csv', 'header');
  
  // Carica la mappa del mondo dal file json 
  worldGeo = loadJSON('asset/mappa/countries.geo.json');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  textSize(12);
  textFont('Arial');
  rectMode(CORNER);
  noSmooth(); //bordi netti, non sfumati
}

function draw() {
  background(20); 

  push(); //salva dove sono ora

  // Applica zoom e centratura
  translate(width/2 + centerX, height/2 + centerY); // sposta il centro al centro e poi gi aggiunge dove ho trascinato
  scale(zoomLevel); // ingrandisce tutto di zoomLevel (1x, 2x, 5x, 10x)
  translate(-width/2, -height/2); // riporta l'origine in alto a sinistra

  // disegna la mappa
  drawWorld();

  // vulcani
  drawVolcanoes();
  
  pop();

  // tooltip (fuori dalla trasformazione per rimanere fisso)
  drawHoverTooltip();
  
  // pulsanti zoom, leggenda e istruzioni per lo zoom
  drawZoomButtons();
  drawLegend();
  drawZoomInstructions();
}

// --------------------
// SICUREZZA NECESSARIA - perchè alcune celle sono vuote o assenti quindi qui le rende sempre presenti e con un valore null
// --------------------
function safeGetString(row, colName) {
  if (!dataTable) return '';
  let v = dataTable.getString(row, colName);
  if (v === undefined || v === null) return '';
  return String(v);
}

// --------------------
// Disegno mondo
// --------------------
function drawWorld() {
  if (!worldGeo || !worldGeo.features) return;  // sicurezza per non far crashare se i dati del mondo non sono caricati

  push();
  fill(120, 100, 80); // colore della terra
  stroke(0);
  strokeWeight(0.4);

  //funzione per estrarre e disegnare i poligoni della terra dal file JSON
  for (let f of worldGeo.features) {
    let geom = f.geometry;
    if (!geom) continue;

    if (geom.type === 'Polygon') {
      drawPolygon(geom.coordinates);
    } else if (geom.type === 'MultiPolygon') {
      for (let poly of geom.coordinates) drawPolygon(poly);
    }
  }

  pop();
}
// Disegna un poligono dato un array di coordinate
//fa la conversione da coordinate geografiche a coordinate schermo
function drawPolygon(coordArray) {
  beginShape();
  for (let ring of coordArray) {
    for (let c of ring) {
      let lon = c[0];
      let lat = c[1];
      let x = map(lon, -180, 180, 0, width);
      let y = map(lat, 85, -85, 0, height); // Uso range lat ridotto per evitare distorsioni polari
      vertex(x, y);
    }
  }
  endShape(CLOSE);
}

// --------------------
// Volcanoes + hover
// --------------------
function drawVolcanoes() {
  if (!dataTable) return;

  // disegna tutti i simboli
  for (let r = 0; r < dataTable.getRowCount(); r++) {
    let lat = Number(safeGetString(r, COLS.lat));
    let lon = Number(safeGetString(r, COLS.lon));
    if (isNaN(lat) || isNaN(lon)) continue;

    let x = map(lon, -180, 180, 0, width);
    let y = map(lat, 85, -85, 0, height);

    drawSymbolForTypeSafe(safeGetString(r, COLS.type), x, y);
  }
}

function drawHoverTooltip() {
  if (!dataTable) return;

  const hoverRadius = 15 * zoomLevel; // raggio di hover di 15 pixel ed è scalato con lo zoom (x2 diventa 30 pixel, ecc)
  let nearest = {index: -1, d: Infinity, x: 0, y: 0}; //memorizza il vulcano più vicino

  // trova il vulcano più vicino al mouse (con coordinate trasformate)
  for (let r = 0; r < dataTable.getRowCount(); r++) {
    let lat = Number(safeGetString(r, COLS.lat));
    let lon = Number(safeGetString(r, COLS.lon));
    if (isNaN(lat) || isNaN(lon)) continue;

    // coordinate del mondo
    let worldX = map(lon, -180, 180, 0, width);
    let worldY = map(lat, 85, -85, 0, height);
    
    // trasforma in coordinate schermo (tenendo conto di zoom e spostamento)
    let screenX = (worldX - width/2) * zoomLevel + width/2 + centerX;
    let screenY = (worldY - height/2) * zoomLevel + height/2 + centerY;

    let d = dist(mouseX, mouseY, screenX, screenY); // dista () calcola la distanza tra due punti in questo caso mouse e vulcano
    if (d < hoverRadius && d < nearest.d) { //il mouse è abbastanza vicino per attivare l'hover?
      nearest = {index: r, d: d, x: screenX, y: screenY}; //questo vulcano è più vicino di quello che avevo trovato prima?

    }
  }

  // se trovato, mostra tooltip
  if (nearest.index >= 0) {
    //posizionamento del tooltip
    let tx = mouseX + 12; 
    let ty = mouseY + 12;
    showTooltipForRow(nearest.index, tx, ty);
  }
}

function drawSymbolForTypeSafe(type, x, y) {
  let size = 8;
  let t = (type || '').toLowerCase(); (type || '') //se type è null o undefined, usa una stringa vuota
  //converte tutto in minuscolo per confronti più facili

  push();
  strokeWeight(1.5);
  
  if (t.includes('strato')) { //stratovolcano
    // Triangolo pieno rosso
    fill(255, 100, 100);
    stroke(200, 50, 50);
    triangle(x, y - size/2, x - size/2, y + size/2, x + size/2, y + size/2);
  } else if (t.includes('shield')) {
    // Cerchio pieno verde
    fill(100, 200, 100);
    stroke(50, 150, 50);
    ellipse(x, y, size, size);
  } else if (t.includes('dome')) {
    // Quadrato pieno giallo
    fill(255, 200, 100);
    stroke(200, 150, 50);
    rectMode(CENTER);
    rect(x, y, size, size);
  } else if (t.includes('submarine')) {
    // Rombo pieno blu
    fill(100, 150, 255);
    stroke(50, 100, 200);
    beginShape();
    vertex(x, y - size/2);
    vertex(x + size/2, y);
    vertex(x, y + size/2);
    vertex(x - size/2, y);
    endShape(CLOSE);
  } else if (t.includes('field')) {
    // Esagono pieno viola
    fill(200, 100, 200);
    stroke(150, 50, 150);
    beginShape();
    for (let i = 0; i < 6; i++) {
      let angle = TWO_PI / 6 * i;
      let px = x + cos(angle) * size/2;
      let py = y + sin(angle) * size/2;
      vertex(px, py);
    }
    endShape(CLOSE);
  } else {
    // Cerchio pieno grigio
    fill(180);
    stroke(120);
    ellipse(x, y, size * 0.8, size * 0.8);
  }
  
  pop();
}

// --------------------
// Tooltip/menu - che si apre con hoover
// --------------------
function showTooltipForRow(rowIndex, x, y) {
  if (!dataTable) return;

  // safeGetString Controlla se la tabella dati esiste, Prende un valore dal CSV, Se il valore è vuoto/mancante, restituisce una stringa vuota, Altrimenti restituisce il valore come stringa

  // Ottieni i dati del vulcano direttamente dal CSV
  let volcanoName = safeGetString(rowIndex, COLS.name);
  let lines = [
    'Country: ' + safeGetString(rowIndex, COLS.country),
    'Lat/Lon: ' + safeGetString(rowIndex, COLS.lat) + ', ' + safeGetString(rowIndex, COLS.lon),
    'Elevation: ' + safeGetString(rowIndex, COLS.elev),
    'Status: ' + safeGetString(rowIndex, COLS.status),
  ];

  // nome del vulcano in grassetto, ne calcola la larghezza e torna normale
  textSize(12);
  textStyle(BOLD);
  let nameWidth = textWidth(volcanoName);
  textStyle(NORMAL);
  
  let w = nameWidth; //nameWidth è la larghezza del nome del vulcano e sarà la larghezza minima del box
  for (let li of lines) w = max(w, textWidth(li));
  let h = (lines.length + 1) * 16;

  // riposiziona il box per rimanere dentro il canvas
  let bx = x;
  let by = y;
  if (bx + w + 18 > width) bx = x - (w + 18); //Se supera width (bordo destro), sposta il tooltip a sinistra del mouse
  if (by + h + 12 > height) by = height - (h + 12); //Se supera height (bordo inferiore), lo posiziona in alto
  //Se va troppo a sinistra o in alto, lo riporta a 6 pixel dal bordo
  if (bx < 6) bx = 6;
  if (by < 6) by = 6;

  // box semplice
  push();
  fill(40, 200);
  stroke(255);
  rect(bx, by, w + 12, h + 8, 6);

  fill(255);
  noStroke();
  
  // nome in grassetto fisso 
  textStyle(BOLD);
  text(volcanoName, bx + 6, by + 16);
  
  // altre righe normali
  textStyle(NORMAL);
  for (let i = 0; i < lines.length; i++) {
    text(lines[i], bx + 6, by + 32 + i * 16);
    //by = top del tooltip
    //+ 32 = spazio per il nome del vulcano (che è a by + 16) + un po' di padding
    //+ i * 16 = ogni riga successiva è 16 pixel più in basso
  }
  pop();
}

function drawZoomButtons() {
  // Posiziona i pulsanti sopra al menu informazioni in basso a sinistra
  zoomInButton.x = 10;
  zoomInButton.y = height - 120;
  zoomOutButton.x = 60;
  zoomOutButton.y = height - 120;
  
  push();
  
  // Pulsante zoom in (+)
  if (zoomLevel < 10) {
    fill(0, 150);
    stroke(255);
  } else {
    fill(100);
    stroke(150);
  }
  rect(zoomInButton.x, zoomInButton.y, zoomInButton.size, zoomInButton.size, 5);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(20);
  text('+', zoomInButton.x + zoomInButton.size/2, zoomInButton.y + zoomInButton.size/2);
  
  // Pulsante zoom out (-)
  if (zoomLevel > 1) {
    fill(0, 150);
    stroke(255);
  } else {
    fill(100);
    stroke(150);
  }
  rect(zoomOutButton.x, zoomOutButton.y, zoomOutButton.size, zoomOutButton.size, 5);
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(20);
  text('-', zoomOutButton.x + zoomOutButton.size/2, zoomOutButton.y + zoomOutButton.size/2);
  
  pop();
}

function drawLegend() {
  let legendX = width - 220;
  let legendY = 20;
  let legendWidth = 200;
  let legendHeight = 180;
  
  // Sfondo leggenda
  push();
  fill(0, 180);
  stroke(255);
  strokeWeight(1);
  rect(legendX, legendY, legendWidth, legendHeight, 5);
  
  // Titolo leggenda
  fill(255);
  textAlign(LEFT);
  textSize(13);
  textStyle(BOLD);
  text('Volcano Types', legendX + 12, legendY + 25);
  
  // Lista dei tipi con simboli
  let types = [
    {name: 'Stratovolcano', type: 'strato'},
    {name: 'Shield', type: 'shield'},
    {name: 'Dome', type: 'dome'},
    {name: 'Submarine', type: 'submarine'},
    {name: 'Volcanic field', type: 'field'},
    {name: 'Other', type: 'other'}
  ];
  
  textStyle(NORMAL);
  textSize(11);
  
  // posizionamento di ogni riga della leggenda
  for (let i = 0; i < types.length; i++) {
    let y = legendY + 45 + i * 22;
    let symbolX = legendX + 18;
    let textX = legendX + 40;
    
    // Disegna il simbolo
    drawSymbolForTypeSafe(types[i].type, symbolX, y - 2);
    
    // Scrivi il nome del simbolo
    fill(255);
    textAlign(LEFT);
    text(types[i].name, textX, y + 3);
  }
  
  pop();
}

function drawZoomInstructions() { //quello sotto ai due bottoni
  push();
  fill(0, 150);
  rect(10, height - 70, 180, 50, 5);
  
  // scritta che ti dice quando puoi trascinare e quando no
  fill(255);
  textAlign(LEFT);
  textSize(11);
  if (zoomLevel > 1) {
    text('Drag to pan', 15, height - 50);
  } else {
    fill(150);
    text('Drag disabled at 1x', 15, height - 50);
  }

  // scritta con lo zoom a cui sei
  fill(255);
  text('Current zoom: ' + zoomLevel + 'x', 15, height - 35);
  pop();
}

function mousePressed() {
  let oldZoom = zoomLevel; //salva lo zoom attuale
  
  // Funzione helper per controllare se il mouse è dentro un pulsante
  function isMouseInButton(button) {
    return mouseX >= button.x && mouseX <= button.x + button.size &&
           mouseY >= button.y && mouseY <= button.y + button.size;
  }
  
  // Zoom in (pulsante +)
  if (isMouseInButton(zoomInButton) && zoomLevel < 10) {
    // Livelli di zoom: 1 -> 2 -> 5 -> 10
    if (zoomLevel === 1) zoomLevel = 2;
    else if (zoomLevel === 2) zoomLevel = 5;
    else if (zoomLevel === 5) zoomLevel = 10;
  }
  
  // Zoom out (pulsante -)
  if (isMouseInButton(zoomOutButton) && zoomLevel > 1) {
    // Livelli di zoom: 10 -> 5 -> 2 -> 1
    if (zoomLevel === 10) zoomLevel = 5;
    else if (zoomLevel === 5) zoomLevel = 2;
    else if (zoomLevel === 2) zoomLevel = 1;
  }
  
  // Se lo zoom è cambiato, aggiusta la posizione per mantenerla centrata
  if (oldZoom !== zoomLevel) {
    let zoomRatio = zoomLevel / oldZoom;
    centerX = centerX * zoomRatio;
    centerY = centerY * zoomRatio;
    
    // Limita la posizione per non uscire dalla mappa
    let maxOffsetX = (width * (zoomLevel - 1)) / 2;
    let maxOffsetY = (height * (zoomLevel - 1)) / 2;
    centerX = constrain(centerX, -maxOffsetX, maxOffsetX);
    centerY = constrain(centerY, -maxOffsetY, maxOffsetY);
  }
  //Se valore è tra minimo e massimo lo lascia com'è
    //Se valore è troppo piccolo lo porta al minimo
    //Se valore è troppo grande lo porta al massimo
}

function mouseDragged() { //funzione preimpostata di p5 per mouse premuto e spostato mentre premuto
  // Non permettere drag se zoom è 1x
  if (zoomLevel <= 1) return;
  
  // Calcola il nuovo centro
  let newCenterX = centerX + mouseX - pmouseX; //pmouseX è la posizione precedente del mouse, variabile automatica di p5
  let newCenterY = centerY + mouseY - pmouseY;
  
  // Calcola i limiti massimi per non uscire dalla mappa
  let maxOffsetX = (width * (zoomLevel - 1)) / 2;
  let maxOffsetY = (height * (zoomLevel - 1)) / 2;
  
  // Applica i limiti
  centerX = constrain(newCenterX, -maxOffsetX, maxOffsetX);
  centerY = constrain(newCenterY, -maxOffsetY, maxOffsetY);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}