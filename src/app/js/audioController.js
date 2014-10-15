define([
    'jquery',
    'underscore',
    'backbone',
    'asq'
], function ($, _, Backbone, ASQ) {

    var audioControllerSingleton = function () {
        var state, audioContext, audioAnalysers, frequencyData, bufferData, bufferSources, decodedData;

        var blankState = function() {
            return {
                loaded: false,
                playing: false,
                playHead: 0,
                startTime: 0,
                startOffset: 0,
                bufferData: null
            };
        };

        // Initialize state properties and private properties/instances
        var state = blankState();
        var audioContext = new window.AudioContext();

        var emptyBuffers = function() {
            audioAnalysers = [];
            frequencyData = [];
            bufferData = [];
            bufferSources = [];
            decodedData = [];
        };

        var initBuffers = function(done, i, source, fftSize) {
            var bufferSource, audioAnalyser, frequencyDatum;

            bufferSource = audioContext.createBufferSource();
            audioAnalyser = audioContext.createAnalyser();
            audioAnalyser.fftSize = fftSize || 128;
            frequencyDatum = new Uint8Array(audioAnalyser.frequencyBitCount);

            bufferSources[i] = bufferSource;
            audioAnalysers[i] = audioAnalyser;
            frequencyData[i] = frequencyDatum; 
            done(i, source);
        };

        var loadAudioData = function(done, i, source) {
            var request = new XMLHttpRequest();

            request.open("GET", source, true);
            request.responseType = "arraybuffer";
            request.onload = function() {
                done(i, request.response)
            };

            request.send();
        };

        var decodeAudioData = function(done, i, audioData) {
            bufferData[i] = audioData;
            audioContext.decodeAudioData(bufferData[i], function(buffer) {
                decodedData[i] = buffer;
                done(i, buffer);
            });
        };

        var connectSource = function(done, i, audioBuffer) {
            bufferSources[i].buffer = audioBuffer;
            bufferSources[i].connect(audioAnalysers[i]);
            audioAnalysers[i].connect(audioContext.destination);
            bufferSources[i].loop = true;
            done();
        };

        var load = function(sources, fftSize) {
            var loadSequence = [];

            state = blankState();
            emptyBuffers();

            // For each source (a list of stems, or composited tracks)
            // create an audio analyzer and load the file into an audio buffer.
            sources.forEach(function(source, i) {
                loadSequence.push(
                    ASQ(i, source, fftSize)
                    .then(initBuffers)
                    .then(loadAudioData)
                    .then(decodeAudioData)
                    .then(connectSource)
                );
            });

            ASQ().gate.apply(this, loadSequence)
            .then(function() {
                console.log("ALL LOAD EVENTS COMPLETE!");
            })
            .or(function(err) {
                console.log("THERE WAS AN ERROR!", err);
            });
        };

        var setPosition = function(position) {
            state.playHead = position;
        };

        var getPosition = function(position) {
            return state.playHead;
        };

        var update = function() {
            audioAnalysers.forEach(function(analyser, i) {
                analyser.getByteFrequencyData(frequencyData[i]);
            });
        };

        var getFrequencyData = function() {
            var dataSet = [];
            update();

            frequencyData.forEach(function(data, i) {
                dataSet.push(Array.prototype.slice.call(data));
            });

            return dataSet;
        };

        var play = function() {
            state.startTime = audioContext.currentTime;

            bufferSources.forEach(function(bufferSource, i) {
                // Add a tiny delay just to make sure all sources start at the same time
                // yet should hopefully be unnoticeable. Also add start offset (if we are resuming from pause)
                bufferSource.start(state.startTime + 0.05, state.startOffset % bufferSource.buffer.duration);
            });

            state.playing = true;
        };

        var pause = function() {
            var newBufferSources = [];

            bufferSources.forEach(function(bufferSource, i) {
                // Stop the source
                bufferSource.stop();

                // But then create a new one so we are ready to restart
                // (You are only allowed to call 'start' once on each AudioBuffer ...
                var newBufferSource = audioContext.createBufferSource();
                newBufferSource.buffer = decodedData[i];
                newBufferSource.loop = true;
                newBufferSource.connect(audioContext.destination);
                newBufferSources.push(newBufferSource);

            });

            bufferSources = newBufferSources;

            // update startoffset so restart happens at the right time in the buffer
            state.startOffset += audioContext.currentTime - state.startTime;
            state.playing = false;
        };

        var isPlaying = function() {
            return state.playing;
        };

        return {
            load: load,
            play: play,
            pause: pause,
            getFrequencyData: getFrequencyData,
            isPlaying: isPlaying
        };
    };

    return audioControllerSingleton();
});
