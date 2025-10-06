let students = [];
let seatingGroups = [];
let suggestedAssignment = {};
let draggingStudent = null;
let draggingGroup = null;
let offsetX = 0, offsetY = 0;

let hamburgerBtn, uiDiv;
let settings = { numGroups: 3, seatsPerGroup: [3, 3, 4] };

function setup() {
  createCanvas(windowWidth, windowHeight);
  textFont('Arial');
  createHamburgerMenu();
  createSettingsUI();
  applySettings();
}

function draw() {
  background(240);
  for (let group of seatingGroups) group.display();
  for (let s of students) {
    s.update();
    s.display();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

class Student {
  constructor(name, x, y) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.size = 40;
    this.attendance = true;
    this.notes = '';
    this.pairPrefs = new Set();
    this.separatePrefs = new Set();
    this.isDragging = false;
  }

  display() {
    strokeWeight(1);
    fill(this.attendance ? 'lightgreen' : 'lightgray');
    stroke(this.attendance ? 0 : 'red');
    ellipse(this.x, this.y, this.size);
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    text(this.name, this.x, this.y);
  }

  update() {
    if (this.isDragging) {
      this.x = mouseX + offsetX;
      this.y = mouseY + offsetY;
    }
  }

  isMouseOver() {
    return dist(this.x, this.y, mouseX, mouseY) < this.size / 2;
  }
}

class SeatingGroup {
  constructor(x, y, seats) {
    this.x = x;
    this.y = y;
    this.seats = seats;
    this.radius = 80;
    this.seatPositions = [];
    this.isDragging = false;
    this.rebuild();
  }

  rebuild() {
    this.seatPositions = [];
    for (let i = 0; i < this.seats; i++) {
      let angle = TWO_PI * i / this.seats - HALF_PI;
      let sx = this.x + cos(angle) * this.radius;
      let sy = this.y + sin(angle) * this.radius;
      this.seatPositions.push({ x: sx, y: sy });
    }
  }

  display() {
    if (this.isDragging) {
      this.x = mouseX + offsetX;
      this.y = mouseY + offsetY;
      this.rebuild();
    }

    stroke(0);
    fill(255, 100);
    beginShape();
    for (let p of this.seatPositions) vertex(p.x, p.y);
    endShape(CLOSE);

    for (let pos of this.seatPositions) {
      fill(255);
      ellipse(pos.x, pos.y, 20);
    }
  }

  isMouseOver() {
    return dist(this.x, this.y, mouseX, mouseY) < this.radius;
  }
}

function mousePressed() {
  for (let s of students) {
    if (s.isMouseOver()) {
      draggingStudent = s;
      offsetX = s.x - mouseX;
      offsetY = s.y - mouseY;
      s.isDragging = true;
      return;
    }
  }
  for (let g of seatingGroups) {
    if (g.isMouseOver()) {
      draggingGroup = g;
      offsetX = g.x - mouseX;
      offsetY = g.y - mouseY;
      g.isDragging = true;
      return;
    }
  }
}

function mouseReleased() {
  if (draggingStudent) {
    draggingStudent.isDragging = false;
    snapStudentToSeat(draggingStudent);
    draggingStudent = null;
  }
  if (draggingGroup) {
    draggingGroup.isDragging = false;
    draggingGroup = null;
  }
}

function snapStudentToSeat(stud) {
  let threshold = 30;
  for (let group of seatingGroups) {
    for (let pos of group.seatPositions) {
      if (dist(stud.x, stud.y, pos.x, pos.y) < threshold) {
        stud.x = pos.x;
        stud.y = pos.y;
        return;
      }
    }
  }
}

function createHamburgerMenu() {
  hamburgerBtn = createButton('☰');
  hamburgerBtn.position(10, 10);
  hamburgerBtn.size(30, 30);
  hamburgerBtn.style('font-size', '20px');
  hamburgerBtn.mousePressed(() => {
    let isVisible = uiDiv.style('display') !== 'none';
    uiDiv.style('display', isVisible ? 'none' : 'block');
  });

  uiDiv = createDiv().id('settingsUI');
  uiDiv.position(10, 50);
  uiDiv.style('background', '#fff');
  uiDiv.style('padding', '10px');
  uiDiv.style('border', '1px solid #ccc');
  uiDiv.style('max-height', '85vh');
  uiDiv.style('overflow-y', 'auto');
}

function createSettingsUI() {
  uiDiv.html(`
    <h3>Seating Chart Setup</h3>
    <label>Student Names (comma-separated):</label><br>
    <input type="text" id="studentNames"><br><br>

    <label>Number of Groups:</label><br>
    <input type="number" id="numGroups" value="3"><br><br>

    <label>Seats per Group (comma-separated):</label><br>
    <input type="text" id="seatsPerGroup" value="3,3,4"><br><br>

    <button onclick="applySettings()">Apply Settings</button><br><br>
    <div id="studentPrefs"></div>

    <button onclick="generateSuggestion()">Suggest Seating</button>
    <button onclick="exportData()">Export Data</button><br><br>
    <textarea id="importExport" rows="8" style="width:100%"></textarea><br>
    <button onclick="importData()">Import Data</button>
  `);
}

function applySettings() {
  students = [];
  seatingGroups = [];
  suggestedAssignment = {};

  settings.numGroups = int(select('#numGroups').value());
  settings.seatsPerGroup = select('#seatsPerGroup').value().split(',').map(s => int(s.trim()));

  let names = select('#studentNames').value().split(',').map(n => n.trim()).filter(n => n.length > 0);
  names.forEach((name, i) => {
    let x = 100 + (i * 60);
    let y = height - 100;
    students.push(new Student(name, x, y));
  });

  if (settings.seatsPerGroup.length !== settings.numGroups) {
    alert("Mismatch between number of groups and seat counts.");
    return;
  }

  for (let g = 0; g < settings.numGroups; g++) {
    let gx = 300 + (g % 3) * 200;
    let gy = 150 + Math.floor(g / 3) * 200;
    seatingGroups.push(new SeatingGroup(gx, gy, settings.seatsPerGroup[g]));
  }

  generatePreferenceUI();
}

function generatePreferenceUI() {
  let container = select('#studentPrefs');
  container.html('<h4>Student Preferences</h4>');

  for (let s of students) {
    let div = createDiv().parent(container);
    div.style('margin-bottom', '15px');

    createDiv(`<strong>${s.name}</strong>`).parent(div);
    let att = createCheckbox(' Present', true).parent(div);
    att.changed(() => s.attendance = att.checked());

    let pairToggle = createButton("👯 Pairing").parent(div);
    let pairDiv = createDiv().parent(div);
    pairDiv.hide();
    pairToggle.mousePressed(() => pairDiv.style('display', pairDiv.style('display') === 'none' ? 'block' : 'none'));

    students.forEach(other => {
      if (other.name !== s.name) {
        let cb = createCheckbox(other.name, false).parent(pairDiv);
        cb.changed(() => cb.checked() ? s.pairPrefs.add(other.name) : s.pairPrefs.delete(other.name));
      }
    });

    let sepToggle = createButton("🚫 Separation").parent(div);
    let sepDiv = createDiv().parent(div);
    sepDiv.hide();
    sepToggle.mousePressed(() => sepDiv.style('display', sepDiv.style('display') === 'none' ? 'block' : 'none'));

    students.forEach(other => {
      if (other.name !== s.name) {
        let cb = createCheckbox(other.name, false).parent(sepDiv);
        cb.changed(() => cb.checked() ? s.separatePrefs.add(other.name) : s.separatePrefs.delete(other.name));
      }
    });

    createDiv('Notes:').parent(div);
    let note = createInput('').style('width: 150px').parent(div);
    note.input(() => s.notes = note.value());
  }
}

function generateSuggestion() {
  suggestedAssignment = {};
  let availableSeats = [];
  seatingGroups.forEach((group, gIdx) => {
    group.seatPositions.forEach((_, i) => availableSeats.push({ groupIdx: gIdx, seatIdx: i }));
  });

  let presentStudents = students.filter(s => s.attendance);
  shuffle(presentStudents, true);

  presentStudents.forEach(s => {
    let bestSeat = null;
    let bestScore = -Infinity;

    availableSeats.forEach(seat => {
      let score = 0;

      for (let buddyName of s.pairPrefs) {
        let buddy = students.find(b => b.name === buddyName);
        if (buddy && suggestedAssignment[buddy.name]) {
          score += (suggestedAssignment[buddy.name].groupIdx === seat.groupIdx) ? 5 : -3;
        }
      }

      for (let avoidName of s.separatePrefs) {
        let other = students.find(b => b.name === avoidName);
        if (other && suggestedAssignment[other.name]) {
          score -= (suggestedAssignment[other.name].groupIdx === seat.groupIdx) ? 6 : 0;
        }
      }

      if (score > bestScore) {
        bestScore = score;
        bestSeat = seat;
      }
    });

    if (bestSeat) {
      suggestedAssignment[s.name] = bestSeat;
      let pos = seatingGroups[bestSeat.groupIdx].seatPositions[bestSeat.seatIdx];
      s.x = pos.x;
      s.y = pos.y;
      availableSeats = availableSeats.filter(seat => !(seat.groupIdx === bestSeat.groupIdx && seat.seatIdx === bestSeat.seatIdx));
    }
  });
}

function exportData() {
  let data = {
    settings,
    students: students.map(s => ({
      name: s.name,
      attendance: s.attendance,
      notes: s.notes,
      pairPrefs: [...s.pairPrefs],
      separatePrefs: [...s.separatePrefs]
    }))
  };
  select('#importExport').value(JSON.stringify(data, null, 2));
}

function importData() {
  try {
    let data = JSON.parse(select('#importExport').value());
    settings = data.settings;
    select('#numGroups').value(settings.numGroups);
    select('#seatsPerGroup').value(settings.seatsPerGroup.join(','));
    select('#studentNames').value(data.students.map(s => s.name).join(','));
    applySettings();
    data.students.forEach(saved => {
      let s = students.find(st => st.name === saved.name);
      if (s) {
        s.attendance = saved.attendance;
        s.notes = saved.notes;
        s.pairPrefs = new Set(saved.pairPrefs);
        s.separatePrefs = new Set(saved.separatePrefs);
      }
    });
    generatePreferenceUI();
  } catch (e) {
    alert("Import failed: " + e.message);
  }
}
