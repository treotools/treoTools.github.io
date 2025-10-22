let students = [];
let seatingGroups = [];
let suggestedAssignment = {};
let draggingStudent = null;
let draggingGroup = null;
let offsetX = 0, offsetY = 0;
let dragConstraints = {
  student: {
    left: 45,
    right: 45,
    top: 75,
    bottom: 75
  },
  group: {
    left: 126,  // Extra room for group radius
    right: 126,
    top: 156,
    bottom: 156
  }
};


let hamburgerBtn, uiDiv;
let settings = { seatsPerGroup: [3, 3, 4] };

function setup() {
  createCanvas(windowWidth, windowHeight - 39);
  textFont('Arial');
  createHamburgerMenu();
  createSettingsUI();
  applySettings();
}

function draw() {
  background(226, 236, 247);
  for (let group of seatingGroups) group.display();
  for (let s of students) {
    s.update();
    s.display();
    s.drawMenu();
  }

  //drawStudentTooltip(); // optional: you can skip tooltip if dropdown handles it
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight - 39);
}

class Student {
  constructor(name, x, y) {
    this.name = name;
    this.x = x;
    this.y = y;
    this.size = 60;
    this.menuOpen = false;
    this.attendance = true;
    this.notes = '';
    this.pairPrefs = new Set();
    this.separatePrefs = new Set();
    this.d = dist(mouseX, mouseY, this.x, this.y);
    this.isHovering = false;
    this.isDragging = false;
    this.group = null;
    this.seatIndex = null;
  }

  display() {
    strokeWeight(this.isHovering ? 3 : 0);
    fill(this.attendance ? 'lightgreen' : 'lightgray');
    stroke(this.isDragging ? 'black' : (this.attendance ? 'white' : 'red'));
    ellipse(this.x, this.y, this.size);
    fill(0);
    noStroke();
    textAlign(CENTER, CENTER);
    text(this.name, this.x, this.y);
    if (this.isHovering) {
      fill(50);
      textSize(14);
      text('▼', this.x, this.y + this.size / 3);
    }
  }

  isArrowClicked(mx, my) {
    let arrowY = this.y + this.size / 4;
    let arrowW = 20, arrowH = 20;
    let arrowX = this.x - arrowW / 2;
    return mx >= arrowX && mx <= arrowX + arrowW &&
          my >= arrowY && my <= arrowY + arrowH;
  }

  drawMenu() {
    if (!this.menuOpen) return;

    let w = 200;
    let h = 100;
    let x = constrain(this.x + this.size / 2 + 10, 0, width - w - 10);
    let y = constrain(this.y - h / 2, 0, height - h - 10);

    // Box
    fill(255);
    stroke(0);
    strokeWeight(1);
    rect(x, y, w, h, 8);

    // Content
    fill(0);
    noStroke();
    textSize(14);
    textAlign(LEFT, TOP);
    let margin = 10;
    text(`🧍 Name: ${this.name}`, x + margin, y + margin);
    text(`📝 Notes: ${this.notes || 'None'}`, x + margin, y + margin + 20);
    text(`✅ Present: ${this.attendance ? 'Yes' : 'No'}`, x + margin, y + margin + 40);
  }

  update() {
    if (this.isDragging) {
      this.x = constrain(mouseX + offsetX, 
                        dragConstraints.student.left, 
                        width - dragConstraints.student.right);
      this.y = constrain(mouseY + offsetY, 
                        dragConstraints.student.top, 
                        height - dragConstraints.student.bottom);
    }

    let d = dist(mouseX, mouseY, this.x, this.y);
    this.isHovering = d < this.size / 2;
  }

  // ADD THIS METHOD - it was missing!
  isMouseOver() {
    return dist(this.x, this.y, mouseX, mouseY) < this.size / 2;
  }
}

class SeatingGroup {
  constructor(x, y, seats) {
    this.x = x;
    this.y = y;
    this.seats = seats;
    this.radius = 90;
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
      this.x = constrain(mouseX + offsetX, 
                        dragConstraints.group.left, 
                        width - dragConstraints.group.right);
      this.y = constrain(mouseY + offsetY, 
                        dragConstraints.group.top, 
                        height - dragConstraints.group.bottom);
      this.rebuild();
    }
    
    // Move assigned students with group every frame (unless they're being dragged)
    // AND constrain their positions to stay on screen
    for (let s of students) {
      if (s.group === this && s.seatIndex !== null && !s.isDragging) {
        let targetX = this.seatPositions[s.seatIndex].x;
        let targetY = this.seatPositions[s.seatIndex].y;
        
        // Constrain student positions even when moving with group
        s.x = constrain(targetX, 
                      dragConstraints.student.left, 
                      width - dragConstraints.student.right);
        s.y = constrain(targetY, 
                      dragConstraints.student.top, 
                      height - dragConstraints.student.bottom);
      }
    }
    
    stroke(56, 152, 236);
    strokeWeight(3);
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
  let clickedAnyArrow = false;

  for (let s of students) {
    if (s.isArrowClicked(mouseX, mouseY)) {
      s.menuOpen = !s.menuOpen;
      clickedAnyArrow = true;
    } else {
      s.menuOpen = false;
    }
  }

  if (clickedAnyArrow) return;

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
  stud.group = null;
  stud.seatIndex = null;
}

function createHamburgerMenu() {
  hamburgerBtn = createButton('☰');
  hamburgerBtn.position(10, 70);
  hamburgerBtn.size(45, 45);
  hamburgerBtn.style('font-size', '20px');
  hamburgerBtn.style('background-color', '#E2ECF7');
  hamburgerBtn.style('border', '3px solid #3898EC');
  hamburgerBtn.style('border-radius', '9px');
  hamburgerBtn.style('color', '#3898EC');
  hamburgerBtn.style('text-align', 'center');
  hamburgerBtn.mousePressed(() => {
    let isVisible = uiDiv.style('display') !== 'none';
    uiDiv.style('display', isVisible ? 'none' : 'block');
  });

  uiDiv = createDiv().id('settingsUI');
  uiDiv.position(10, 70);
}

function createSettingsUI() {
  uiDiv.html(`
    <style>
      #settingsUI {
        background: #3898EC;
        padding: 0;
        border:1px solid #ccc;
        max-height: 85vh;
        overflow-y: auto;
        border-radius: 9px;
        position: relative;
      }

      #settingsHeader {
        position: sticky;
        top: 0;
        background: #3898EC;
        padding: 10px;
        z-index: 10;
        border-radius: 9px 9px 0 0;
      }

      #settingsContent {
        padding: 0 10px 10px 10px;
      }

      .treoBtn {
        background-color: #E2ECF7;
        border: 2px solid #E2ECF7;
        color: #3898EC;
        padding: 6px;
        text-align: center;
        text-decoration: none;
        display: inline-block;
        font-size: 16px;
        margin: 4px 2px;
        cursor: pointer;
        border-radius: 6px;
      }
      .treoBtn:hover {
        background-color: #3898EC;
        color: #E2ECF7;
      }
    </style>
    <div id="settingsHeader">
      <h3 style="color: #E2ECF7;margin: 0; padding-top: 4px; padding-bottom: 6px;">Seating Chart Setup</h3>
      <button id="closeSettingsBtn" style="
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 2px 6px;
        font-size: 16px;
        border: none;
        background: transparent;
        cursor: pointer;
        color: #E2ECF7;
      ">❌</button>
    </div>
    <div id="settingsContent">
      <label>Student Names (comma-separated):</label><br>
      <input type="text" id="studentNames"><br>

      <label>Tables (by # of seats, comma-separated):</label><br>
      <input type="text" id="seatsPerGroup" value="3,2,4"><br>

      <button class="treoBtn" onclick="applySettings()">Generate Classroom</button><br>
      <div id="studentPrefs"></div>

      <div style="display:flex;align-items:center;gap:10px;">
        <button class="treoBtn"id="suggestBtn">Suggest Seating</button>
        <label style="display:flex;align-items:center;gap:4px;">
          <input type="checkbox" id="allowBruteForce"> Brute-force seating (slow)
        </label>
        <span id="loadingSpinner" style="display:none;"><svg width="20" height="20" viewBox="0 0 50 50"><circle cx="25" cy="25" r="20" fill="none" stroke="#888" stroke-width="5" stroke-dasharray="31.4 31.4" transform="rotate(-90 25 25)"><animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite"/></circle></svg></span>
      </div>

      <div style="display:flex;align-items:center;gap:10px;">
        <button class="treoBtn" style="border-radius: 8px" onclick="importData()">Import Data</button>
        <button class="treoBtn" id="exportCopy">Export & Copy Data</button><br><br>
      </div>

      <textarea id="importExport" rows="8" style="width: 100%"></textarea>
    </div>
  `);

  setTimeout(() => {
    let closeBtn = select('#closeSettingsBtn');
    if (closeBtn) {
      closeBtn.mousePressed(() => {
        uiDiv.style('display', 'none');
      });
    }
    let exportCopyBtn = select('#exportCopy');
    if (exportCopyBtn) {
      exportCopyBtn.mousePressed(() => {
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
        let txt = JSON.stringify(data, null, 2);
        select('#importExport').value(txt);
        navigator.clipboard.writeText(txt).then(() => {
          exportCopyBtn.html('Copied!');
          setTimeout(() => exportCopyBtn.html('Export & Copy'), 1000);
        });
      });
    }
    let suggestBtn = select('#suggestBtn');
    let loadingSpinner = select('#loadingSpinner');
    if (suggestBtn && loadingSpinner) {
      suggestBtn.mousePressed(() => {
        loadingSpinner.style('display', 'inline-block');
        setTimeout(() => {
          generateSuggestion();
          loadingSpinner.style('display', 'none');
        }, 50);
      });
    }
  }, 100);
}

function applySettings() {
  students = [];
  seatingGroups = [];
  suggestedAssignment = {};

  settings.seatsPerGroup = select('#seatsPerGroup').value().split(',').map(s => int(s.trim()));

  let names = select('#studentNames').value().split(',').map(n => n.trim()).filter(n => n.length > 0);
  names.sort((a, b) => a.localeCompare(b));
  
  // Calculate student positions in a grid centered at bottom
  let studentSize = 60;
  let padding = 20;
  let maxWidth = width * 0.6; // Use 60% of screen width for students
  let cols = Math.floor(maxWidth / (studentSize + padding));
  cols = Math.max(1, cols); // At least 1 column
  
  let rows = Math.ceil(names.length / cols);
  let gridWidth = cols * (studentSize + padding);
  let startX = (width - gridWidth) / 2; // Center the grid horizontally
  
  names.forEach((name, i) => {
    let col = i % cols;
    let row = Math.floor(i / cols);
    let x = startX + col * (studentSize + padding) + studentSize / 2;
    let y = height - 80 - row * (studentSize + padding); // Start 80px from bottom
    students.push(new Student(name, x, y));
  });

  // Position groups within visible area with proper spacing
  let groupMargin = 150;
  let groupSpacing = 250;
  
  for (let g = 0; g < settings.seatsPerGroup.length; g++) {
    let col = g % 3;
    let row = Math.floor(g / 3);
    let gx = groupMargin + col * groupSpacing;
    let gy = groupMargin + row * groupSpacing;
    
    // Ensure groups don't go off-screen
    gx = constrain(gx, groupMargin, width - groupMargin);
    gy = constrain(gy, groupMargin, height - 250); // Leave more room for students at bottom
    
    seatingGroups.push(new SeatingGroup(gx, gy, settings.seatsPerGroup[g]));
  }

  generatePreferenceUI();
}

function generatePreferenceUI() {
  let container = select('#studentPrefs');
  container.html('<h4 style="color: #E2ECF7;">Classroom Preferences</h4>');

  for (let s of students) {
    let div = createDiv().parent(container);
    div.style('margin-bottom', '5px');

    createDiv(`<strong>${s.name}</strong>`).parent(div);
  let att = createCheckbox(' Present', s.attendance).parent(div);
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
  let note = createInput(s.notes).style('width: 150px').parent(div);
  note.input(() => s.notes = note.value());
  }
}

function generateSuggestion() {
  // Brute-force or greedy based on checkbox
  suggestedAssignment = {};
  let presentStudents = students.filter(s => s.attendance);
  let seatCount = settings.seatsPerGroup.reduce((a, b) => a + b, 0);
  let allowBruteForce = select('#allowBruteForce') && select('#allowBruteForce').checked();
  if (presentStudents.length > 8 && !allowBruteForce) {
    // Greedy algorithm for large groups
    // Assign students to seats, prioritizing pair/separation prefs
    let availableSeats = [];
    seatingGroups.forEach((group, gIdx) => {
      group.seatPositions.forEach((_, i) => availableSeats.push({ groupIdx: gIdx, seatIdx: i }));
    });
    // Sort students by number of pairPrefs (descending), then separationPrefs
    let sorted = [...presentStudents].sort((a, b) => b.pairPrefs.size - a.pairPrefs.size || b.separatePrefs.size - a.separatePrefs.size);
    let seatAssignments = {};
    let usedSeats = new Set();
    for (let s of sorted) {
      // Try to find a seat in a group with most pairPrefs
      let bestSeat = null;
      let bestScore = -Infinity;
      for (let seat of availableSeats) {
        if (usedSeats.has(seat.groupIdx + '-' + seat.seatIdx)) continue;
        let score = 0;
        // Pairing: prefer seats in groups with buddies
        for (let buddyName of s.pairPrefs) {
          let buddy = sorted.find(b => b.name === buddyName);
          if (buddy && seatAssignments[buddy.name] && seatAssignments[buddy.name].groupIdx === seat.groupIdx) {
            score += 5;
          }
        }
        // Separation: penalize seats in groups with separated
        for (let other of sorted) {
          if (other !== s && seatAssignments[other.name] && seatAssignments[other.name].groupIdx === seat.groupIdx) {
            if (s.separatePrefs.has(other.name) || other.separatePrefs.has(s.name)) {
              score -= 50;
            }
          }
        }
        if (score > bestScore) {
          bestScore = score;
          bestSeat = seat;
        }
      }
      if (bestSeat) {
        seatAssignments[s.name] = bestSeat;
        usedSeats.add(bestSeat.groupIdx + '-' + bestSeat.seatIdx);
      }
    }
    // Assign positions
    for (let s of sorted) {
      let seat = seatAssignments[s.name];
      if (seat) {
        let group = seatingGroups[seat.groupIdx];
        let pos = group.seatPositions[seat.seatIdx];
        s.x = pos.x;
        s.y = pos.y;
        s.group = group;
        s.seatIndex = seat.seatIdx;
      }
    }
    return;
  }
  // Brute-force for small groups or if allowed
  let availableSeats = [];
  seatingGroups.forEach((group, gIdx) => {
    group.seatPositions.forEach((_, i) => availableSeats.push({ groupIdx: gIdx, seatIdx: i }));
  });
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