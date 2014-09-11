function Analyzer(audioContext) {
    // Get instance of default AnalyserNode
    this.parentInstance = audioContext.createAnalyser();
    // console.log(this.parentInstance.__proto__);
    // console.log(this.parentInstance.__proto__.__proto__);

    // Add AnalyserNode specific properties and methods
    for (var i in this.parentInstance) {
        if (this.parentInstance.hasOwnProperty(i)) {
            this[i] = this.parentInstance[i];
        }
        /* else {
                    this.__proto__[i] = this.parentInstance[i];
                }*/
    }

    this.__proto__ = this.parentInstance.__proto__;

    // Append prototypical methods to new prototype
    /*for (var i in this.parentInstance.__proto__) {
        this.__proto__[i] = this.parentInstance.__proto__[i];
    }*/

    // Anything inherited deeper than one level, completely inherit by reference
    this.__proto__.__proto__ = this.parentInstance.__proto__.__proto__;
}

Analyzer.prototype.newMethod = function() {
    console.log("IS THIS METHOD AVAILABLE???");
};

(function(AudioContext, requestAnimationFrame, cancelAnimationFrame) {

    var audioContext = new AudioContext();
    var drawingContext, canvas;
    var state = {
        loaded: true,
        playing: false,
        playHead: 0,
        bufferData: null
    };

    // Create the analyser
    var source = audioContext.createBufferSource();
    var analyserOrig = audioContext.createAnalyser();
    var analyser = audioContext.createAnalyser(); //new Analyzer(context);
    analyser.fftSize = 128;
    var frequencyData = new Uint8Array(analyser.frequencyBinCount);
    var movements = [];
    var center;
    var radius = 10;
    var scalingX = 0;
    var scalingY = 0;
    var highestY = 0;
    var movementMult = 0;

    // Get the frequency data and update the visualisation
    function update() {
        requestAnimationFrame(update);

        analyser.getByteFrequencyData(frequencyData);
        canvas.width = canvas.width;

        Array.prototype.forEach.call(frequencyData, function(data, i) {
            var data = Math.log(i + 1) * data;
            var normalized = (data / (Math.log(analyser.frequencyBinCount) * 255)).toFixed(2) * 2;
            drawingContext.fillStyle = 'rgba(255, 255, 255,' + normalized + ')';

            var adjustment = Math.PI * (i % 2 === 0 ? 0.5 : -0.5);
            var movement = movements[i];
            var speed = i.map(0, analyser.frequencyBinCount - 1, 0.25, 0.75);
            var scaling = i.map(0, analyser.frequencyBinCount - 1, scalingX * 0.5, scalingX);
            var motion = Lemniscate((source.context.currentTime * speed) + adjustment);
            motion.x = center.x + motion.x * scaling;
            motion.y = center.y + motion.y * scaling;

            movement.unshift(motion);
            if (movement.length > 30) {
                movement.pop();
            }

            drawingContext.beginPath();
            for (var j = 0; j < movement.length; j++) {
                var m = movement[j];
                if (!j) {
                    drawingContext.moveTo(m.x, m.y);
                } else {
                    drawingContext.lineTo(m.x, m.y);
                }
            }

            drawingContext.lineWidth = normalized * radius + 1;
            drawingContext.lineCap = 'round';
            drawingContext.strokeStyle = 'rgba(255, 255, 255,' + normalized + ')';
            drawingContext.stroke();
        });
    };

    var source;

    document.addEventListener('DOMContentLoaded', function() {

        console.log("ANALYSER", analyser);

        canvas = document.getElementsByClassName('analyser-container')[0];
        canvas.width = window.innerWidth * 0.85;
        canvas.height = canvas.width * 0.66;
        canvas.style.marginLeft = canvas.width * -0.5 + 'px';
        canvas.style.marginTop = canvas.height * -0.5 + 'px';
        radius = canvas.width / (analyser.frequencyBinCount * 2);
        drawingContext = canvas.getContext('2d');

        for (var i = 0; i < analyser.frequencyBinCount; i++) {
            movements.push([]);
        }

        scalingX = canvas.width * 0.5 - radius;
        scalingY = scalingX * 0.35355;
        center = {
            x: canvas.width / 2,
            y: (canvas.height / 2)
        };

        var fileName = 'Erosion';
        var request = new XMLHttpRequest();
        request.open("GET", '/assets/audio/' + fileName + '.wav', true);
        request.responseType = "arraybuffer";

        request.onload = function() {
            state.bufferData = request.response;

            audioContext.decodeAudioData(state.bufferData, function(buffer) {
                source.buffer = buffer;
                source.connect(analyser);
                analyser.connect(audioContext.destination);
                source.loop = true;
            });

            update();
        }

        request.send();

    });

    document.addEventListener('keyup', function(e) {

        if (state.loaded) {
            if (e.keyCode === 32) {
                if (state.playing) {

                    source.stop(0);
                    state.playing = false;
                    state.playHead = source.context.currentTime;
                    console.log("SOURCE STOPPED", source);

                } else {

                    source.start(0);
                    state.playing = true;
                    console.log("SOURCE PLAYING AT TIME", state.playHead);

                }
            }
        }

    });

    function Lemniscate(t) {
        scale = 2 / (3 - Math.cos(2 * t));
        x = scale * Math.cos(t);
        y = scale * Math.sin(2 * t) / 2;

        return {
            x: x,
            y: y
        };
    }

    Number.prototype.map = function(in_min, in_max, out_min, out_max) {
        return (this - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
    }

})(window.AudioContext || window.webkitAudioContext,
    window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame,
    window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame);
