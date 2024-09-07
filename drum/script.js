const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const tracks = [];

document.getElementById('sample-upload').addEventListener('change', handleFileUpload);
document.getElementById('play-pause').addEventListener('click', togglePlayback);
document.getElementById('measures').addEventListener('change', () => updateTracks());
document.getElementById('time-signature').addEventListener('change', () => updateTracks());

function handleFileUpload(event) {
    const files = event.target.files;
    for (let file of files) {
        const reader = new FileReader();
        reader.onload = function(e) {
            audioContext.decodeAudioData(e.target.result, function(buffer) {
                const track = {
                    buffer: buffer,
                    beats: new Array(getTotalSteps()).fill(false),
                    name: file.name
                };
                tracks.push(track);
                updateTracks(false);
            });
        };
        reader.readAsArrayBuffer(file);
    }
}

function createTrackUI(track) {
    const trackContainer = document.createElement('div');
    trackContainer.className = 'track-container';

    const trackName = document.createElement('div');
    trackName.className = 'track-name';
    trackName.textContent = track.name;

    const trackElement = document.createElement('div');
    trackElement.className = 'track';

    const measures = getMeasures();
    const beatsPerMeasure = getBeatsPerMeasure();
    const stepsPerBeat = 4; // 16분음표 기준

    for (let measure = 0; measure < measures; measure++) {
        for (let beat = 0; beat < beatsPerMeasure; beat++) {
            for (let step = 0; step < stepsPerBeat; step++) {
                const index = (measure * beatsPerMeasure * stepsPerBeat) + (beat * stepsPerBeat) + step;
                const beatElement = document.createElement('div');
                beatElement.className = 'beat';
                beatElement.title = `마디 ${measure + 1}, 박자 ${beat + 1}, 스텝 ${step + 1}`;
                beatElement.addEventListener('click', () => toggleBeat(track, index, beatElement));
                
                if (step === 0) {
                    beatElement.classList.add('beat-start');
                }
                if (beat === 0 && step === 0) {
                    beatElement.classList.add('measure-start');
                }
                if (track.beats[index]) {
                    beatElement.classList.add('active');
                }

                trackElement.appendChild(beatElement);
            }
        }
    }

    trackContainer.appendChild(trackName);
    trackContainer.appendChild(trackElement);
    document.getElementById('tracks-container').appendChild(trackContainer);
}

function toggleBeat(track, index, element) {
    track.beats[index] = !track.beats[index];
    element.classList.toggle('active');
}

let isPlaying = false;
let currentStep = 0;
let intervalId = null;

function togglePlayback() {
    isPlaying = !isPlaying;
    const playPauseButton = document.getElementById('play-pause');
    if (isPlaying) {
        playPauseButton.textContent = '정지';
        playStep();
    } else {
        playPauseButton.textContent = '재생';
        clearTimeout(intervalId);
    }
}

function playStep() {
    const time = audioContext.currentTime;

    tracks.forEach(track => {
        if (track.beats[currentStep]) {
            const source = audioContext.createBufferSource();
            source.buffer = track.buffer;
            source.connect(audioContext.destination);
            source.start(time);
        }
    });

    const totalSteps = getTotalSteps();
    currentStep = (currentStep + 1) % totalSteps;

    const bpm = getBPM();
    const millisecondsPerStep = (60000 / bpm) / 4;

    intervalId = setTimeout(playStep, millisecondsPerStep);
}

function getBPM() {
    return parseInt(document.getElementById('bpm').value);
}

function getTimeSignature() {
    return document.getElementById('time-signature').value;
}

function getBeatsPerMeasure() {
    return parseInt(getTimeSignature().split('/')[0]);
}

function getMeasures() {
    return parseInt(document.getElementById('measures').value);
}

function getTotalSteps() {
    return getMeasures() * getBeatsPerMeasure() * 4;  // 16분음표 기준으로 4배
}

function updateTracks(resetPatterns = true) {
    const totalSteps = getTotalSteps();

    tracks.forEach(track => {
        if (resetPatterns) {
            track.beats = new Array(totalSteps).fill(false);
        } else {
            const newBeats = new Array(totalSteps).fill(false);
            track.beats.forEach((beat, index) => {
                if (index < totalSteps) {
                    newBeats[index] = beat;
                }
            });
            track.beats = newBeats;
        }
    });

    document.getElementById('tracks-container').innerHTML = '';
    tracks.forEach(createTrackUI);
}

updateTracks();