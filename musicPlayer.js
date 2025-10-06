//audio player control variables
var audio = new Audio()
var i = 0;
var playing = false;

//track, title, and thumbnail playlist arrays
const playlist = new Array('music/01eyedolContact.mp3', 'music/06emanuel.mp3', 'music/16remember.wav', 'music/17scary.wav', 'music/18scary.wav');
const titles = new Array("Eyedol Contact", "Oh Come Emanuel", "Thesis Title Screen", "Come Lay Down with Me", "Eliza's Theme");
const thumbnails = new Array("images/thumbnails/01.png", "images/thumbnails/06.png", "images/thumbnails/06.png", "images/thumbnails/17.png", "images/thumbnails/17.png", "break test");
//play button, track title, and thumbnail references
var x = document.getElementById("playAudio");
var y = document.getElementById("trackTitle").innerHTML = titles[i];
var z = document.getElementById("thumbnail");

//start audio settings
audio.volume = 0.9;
audio.loop = false;
audio.src = playlist[i];

//play next song in playlist on somng end
audio.addEventListener("ended", function() {
  if (i < playlist.length - 1) {
    i++;
    audio.src = playlist[i];
    z.src = thumbnails[i];
    document.getElementById("trackTitle").innerHTML = titles[i];
    audio.play();
  }
  else {
    playing = false;
    x.src="images/buttons/play.png";
  }
});

//play/pause function
playAudio.onclick = function() {
  playing = !playing;
  if (playing && i < playlist.length) {
    x.src="images/buttons/pause.png";
    document.getElementById("trackTitle").innerHTML = titles[i];
    audio.play();
  }
  else {
    x.src="images/buttons/play.png";
    audio.pause();
  }
};

//rewind function
rewindAudio.onclick = function() {
  playing = true;
  x.src="images/buttons/pause.png";
  if (i > 0 && audio.currentTime < 1) {
    i--;
    audio.src = playlist[i];
    z.src = thumbnails[i];
    document.getElementById("trackTitle").innerHTML = titles[i];
    audio.play();
  }
  else {
    audio.currentTime = 0;
    audio.play();
  }
};

//skip function
skipAudio.onclick = function() {
  if (i < playlist.length - 1) {
    i++;
    audio.src = playlist[i];
    z.src = thumbnails[i];
    document.getElementById("trackTitle").innerHTML = titles[i];
    if (playing) {
      audio.play();
    }
  }
};
