define([
    'jquery', 
    'underscore', 
    'backbone', 
    'router',
    'audioController'
], 
function($, _, Backbone, Router, AudioController) {

    var init = function() {

        // Fire up the router on DOMReady
        $(function() {
            Router.initialize();
        });

        // Patch in vendor specific prefixed methods on window if necessary
        window.requestAnimationFrame = requestAnimationFramePolyfill();
        window.cancelAnimationFrame = cancelAnimationFramePolyfill(); 
        window.audioContext = audioContextPolyfill();

        AudioController.load([
            '/sketches/erosion/assets/audio/Erosion Bass.wav',
            '/sketches/erosion/assets/audio/Erosion Drums.wav',
            '/sketches/erosion/assets/audio/Erosion Lead.wav',
            '/sketches/erosion/assets/audio/Erosion Pad.wav'
        ]);

        document.addEventListener('keyup', function(e) {

            if (e.keyCode === 32) {
                if (AudioController.isPlaying()) {
                    AudioController.pause();
                } else {
                    AudioController.play();
                }
            }

        });



    };

    var requestAnimationFramePolyfill = function() {
        return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame;
    };

    var cancelAnimationFramePolyfill = function() {
        return window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame;
    };

    var audioContextPolyfill = function() {
        return window.audioContext || window.webkitAudioContext;
    };

    return {
        initialize: init
    };

});
