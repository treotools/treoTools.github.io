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
    // New properties for seat assignment
    this.group = null; // SeatingGroup instance
    this.seatIndex = null; // index in group's seatPositions
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
    // Move assigned students with group every frame (unless they're being dragged)
    for (let s of students) {
      if (s.group === this && s.seatIndex !== null && !s.isDragging) {
        s.x = this.seatPositions[s.seatIndex].x;
        s.y = this.seatPositions[s.seatIndex].y;
      }
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
    // After group drag ends, update all assigned students' positions
    for (let i = 0; i < seatingGroups.length; i++) {
      let group = seatingGroups[i];
      for (let j = 0; j < group.seats; j++) {
        for (let s of students) {
          if (s.group === group && s.seatIndex === j && !s.isDragging) {
            s.x = group.seatPositions[j].x;
            s.y = group.seatPositions[j].y;
          }
        }
      }
    }
    draggingGroup = null;
  }
}

function snapStudentToSeat(stud) {
  let threshold = 30;
  for (let group of seatingGroups) {
    for (let i = 0; i < group.seatPositions.length; i++) {
      let seat = group.seatPositions[i];
      if (dist(stud.x, stud.y, seat.x, seat.y) < threshold) {
        stud.x = seat.x;
        stud.y = seat.y;
        stud.group = group;
        stud.seatIndex = i;
        return;
      }
    }
  }
  // If not snapped to any seat, clear assignment
  stud.group = null;
  stud.seatIndex = null;
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
    <input type="text" id="seatsPerGroup" value="3,2,4"><br><br>

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
  names.sort((a, b) => a.localeCompare(b));
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

    if (!window.pairCheckboxRefs) window.pairCheckboxRefs = {};
    students.forEach(other => {
      if (other.name !== s.name) {
        let checked = s.pairPrefs.has(other.name);
        let cb = createCheckbox(other.name, checked).parent(pairDiv);
        // Store reference for bidirectional update
        window.pairCheckboxRefs[s.name + '_' + other.name] = cb;
        cb.changed(() => {
          if (cb.checked()) {
            s.pairPrefs.add(other.name);
            other.pairPrefs.add(s.name);
            // Update the paired checkbox for the other student directly
            let otherCb = window.pairCheckboxRefs[other.name + '_' + s.name];
            if (otherCb) otherCb.checked(true);
          } else {
            s.pairPrefs.delete(other.name);
            other.pairPrefs.delete(s.name);
            let otherCb = window.pairCheckboxRefs[other.name + '_' + s.name];
            if (otherCb) otherCb.checked(false);
          }
        });
      }
    });

    let sepToggle = createButton("🚫 Separation").parent(div);
    let sepDiv = createDiv().parent(div);
    sepDiv.hide();
    sepToggle.mousePressed(() => sepDiv.style('display', sepDiv.style('display') === 'none' ? 'block' : 'none'));

    if (!window.sepCheckboxRefs) window.sepCheckboxRefs = {};
    students.forEach(other => {
      if (other.name !== s.name) {
        let checked = s.separatePrefs.has(other.name);
        let cb = createCheckbox(other.name, checked).parent(sepDiv);
        window.sepCheckboxRefs[s.name + '_' + other.name] = cb;
        cb.changed(() => {
          if (cb.checked()) {
            s.separatePrefs.add(other.name);
            other.separatePrefs.add(s.name);
            let otherCb = window.sepCheckboxRefs[other.name + '_' + s.name];
            if (otherCb) otherCb.checked(true);
          } else {
            s.separatePrefs.delete(other.name);
            other.separatePrefs.delete(s.name);
            let otherCb = window.sepCheckboxRefs[other.name + '_' + s.name];
            if (otherCb) otherCb.checked(false);
          }
        });
      }
    });

    createDiv('Notes:').parent(div);
    let note = createInput('').style('width: 150px').parent(div);
    note.input(() => s.notes = note.value());
  }
}

function generateSuggestion() {
  // Deterministic brute-force for small groups
  suggestedAssignment = {};
  let presentStudents = students.filter(s => s.attendance);
  let seatCount = settings.seatsPerGroup.reduce((a, b) => a + b, 0);
  if (presentStudents.length > 8) {
    alert('Too many students for brute-force seating.');
    return;
  }
  // Generate all seat objects
  let availableSeats = [];
  seatingGroups.forEach((group, gIdx) => {
    group.seatPositions.forEach((_, i) => availableSeats.push({ groupIdx: gIdx, seatIdx: i }));
  });
  // Generate all permutations
  function permute(arr) {
    if (arr.length <= 1) return [arr];
    let out = [];
    for (let i = 0; i < arr.length; i++) {
      let rest = arr.slice(0, i).concat(arr.slice(i + 1));
      for (let p of permute(rest)) {
        out.push([arr[i]].concat(p));
      }
    }
    return out;
  }
  let bestScore = -Infinity;
  let bestAssignments = [];
  let perms = permute(presentStudents);
  for (let perm of perms) {
    let score = 0;
    let assignment = {};
    for (let i = 0; i < perm.length; i++) {
      assignment[perm[i].name] = availableSeats[i];
    }
    // Score this assignment
    for (let s of perm) {
      let seat = assignment[s.name];
      let groupSeats = settings.seatsPerGroup[seat.groupIdx];
      // Pairing
      for (let buddyName of s.pairPrefs) {
        let buddy = students.find(b => b.name === buddyName);
        if (buddy && assignment[buddy.name]) {
          if (assignment[buddy.name].groupIdx === seat.groupIdx && assignment[buddy.name].seatIdx !== seat.seatIdx && groupSeats === 2) {
            score += 10;
          } else if (assignment[buddy.name].groupIdx === seat.groupIdx) {
            score += 5;
          } else {
            score -= 3;
          }
        }
      }
      // Separation
      for (let other of students) {
        if (other !== s && assignment[other.name]) {
          let wantsSeparation = s.separatePrefs.has(other.name) || other.separatePrefs.has(s.name);
          if (wantsSeparation) {
            if (assignment[other.name].groupIdx === seat.groupIdx && assignment[other.name].seatIdx !== seat.seatIdx && groupSeats === 2) {
              score -= 100;
            } else if (assignment[other.name].groupIdx === seat.groupIdx) {
              score -= 50;
            }
          }
        }
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestAssignments = [assignment];
    } else if (score === bestScore) {
      bestAssignments.push(assignment);
    }
  }
  // Randomly select one of the best assignments
  if (bestAssignments.length > 0) {
    let chosen = bestAssignments[Math.floor(Math.random() * bestAssignments.length)];
    for (let s of presentStudents) {
      let seat = chosen[s.name];
      let group = seatingGroups[seat.groupIdx];
      let pos = group.seatPositions[seat.seatIdx];
      s.x = pos.x;
      s.y = pos.y;
      s.group = group;
      s.seatIndex = seat.seatIdx;
    }
  }
}

function exportData() {
  let data = {
    settings,
    groups: seatingGroups.map(g => ({ x: g.x, y: g.y })),
    students: students.map(s => ({
      name: s.name,
      attendance: s.attendance,
      notes: s.notes,
      pairPrefs: [...s.pairPrefs],
      separatePrefs: [...s.separatePrefs],
      groupIdx: s.group ? seatingGroups.indexOf(s.group) : null,
      seatIdx: s.seatIndex
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
    // Restore group positions
    if (data.groups && data.groups.length === seatingGroups.length) {
      for (let i = 0; i < seatingGroups.length; i++) {
        seatingGroups[i].x = data.groups[i].x;
        seatingGroups[i].y = data.groups[i].y;
        seatingGroups[i].rebuild();
      }
    }
    // Restore student assignments and preferences
    data.students.forEach(saved => {
      let s = students.find(st => st.name === saved.name);
      if (s) {
        s.attendance = saved.attendance;
        s.notes = saved.notes;
        s.pairPrefs = new Set(saved.pairPrefs);
        s.separatePrefs = new Set(saved.separatePrefs);
        if (saved.groupIdx !== null && saved.seatIdx !== null && seatingGroups[saved.groupIdx]) {
          s.group = seatingGroups[saved.groupIdx];
          s.seatIndex = saved.seatIdx;
          let pos = s.group.seatPositions[s.seatIndex];
          s.x = pos.x;
          s.y = pos.y;
        }
      }
    });
    generatePreferenceUI();
  } catch (e) {
    alert("Import failed: " + e.message);
  }
}