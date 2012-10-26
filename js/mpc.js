/**
 * Created with JetBrains PhpStorm.
 * User: erik.moldovan
 * Date: 10/12/12
 * Time: 12:23 PM
 * To change this template use File | Settings | File Templates.
 */
var sampler;

var soundjs = createjs.SoundJS; // Instantiate local soundjs instance
soundjs.AUDIO_TIMEOUT = 0;      // Set default soundjs audio timeout
var soundLibrary = {};          // Initialize manifest object for PreloadJS
soundLibrary.assetsPath = 'sounds/';    // Set root for audio files relative to HTML file (not js)
// Assign manifest of audio files for PreloadJS.  Also includes custom values: title & fileName for use in my code
soundLibrary.manifest= [
    {src:soundLibrary.assetsPath+"kick.mp3", id:1, title: 'Kick', fileName: 'kick.mp3'},
    {src:soundLibrary.assetsPath+"4dsnare.mp3", id:2, title: '4D Snare', fileName: '4dsnare.mp3'},
    {src:soundLibrary.assetsPath+"2001-Chronic.mp3", id:3, title: '2001 Chronic', fileName: '2001-Chronic.mp3'},
    {src:soundLibrary.assetsPath+"harp1.mp3", id:4, title: 'Harp 1', fileName: 'harp1.mp3'},
    {src:soundLibrary.assetsPath+"harp2.mp3", id:5, title: 'Harp 2', fileName: 'harp2.mp3'},
    {src:soundLibrary.assetsPath+"AfricanChipmunks.mp3", id:6, title: 'African Chipmunks', fileName: 'AfricanChipmunks.mp3'},
    {src:soundLibrary.assetsPath+"keepthechange.mp3", id:7, title: 'Keep The Change', fileName: 'keepthechange.mp3'},
    {src:soundLibrary.assetsPath+"pitchedsnare.mp3", id:8, title: 'Pitched Snare', fileName: 'pitchedsnare.mp3'},
    {src:soundLibrary.assetsPath+"snaphats.mp3", id:9, title: 'Snap Hats', fileName: 'snaphats.mp3'},
    {src:soundLibrary.assetsPath+"vinylblip.mp3", id:10, title: 'Vinyl Blip', fileName: 'vinylblip.mp3'},
    {src:soundLibrary.assetsPath+"comedown.mp3", id:11, title: 'Come Down', fileName: 'comedown.mp3'},
    {src:soundLibrary.assetsPath+"fourletter.mp3", id:12, title: 'Four Letter', fileName: 'fourletter.mp3'},
    {src:soundLibrary.assetsPath+"mouthsofdelight.mp3", id:13, title: 'Mouths of Delight', fileName: 'mouthsofdelight.mp3'},
    {src:soundLibrary.assetsPath+"musicbox1.mp3", id:14, title: 'Music Box 1', fileName: 'musicbox1.mp3'},
    {src:soundLibrary.assetsPath+"musicbox2.mp3", id:15, title: 'Music Box 2', fileName: 'musicbox2.mp3'},
    {src:soundLibrary.assetsPath+"woodenrandarp.mp3", id:16, title: 'Wooden Rand Arp', fileName: 'woodenrandarp.mp3'}
];

// Initialize Parent Class
mpcDisplay = Class.extend({
    currentInterval: null, // Holds interval which updates percentage completed of track
    currentInstance: null, // Holds current SoundInstance of most recently played sound
    currentId: null, // Current ID of most recently played sound
    preload: undefined, // Holds PreloadJS Instantiation
    preloadDone: false,
    soundBank: [], // Holds data for each pad and all associated sounds
    lastSoundBtn: null, // Last sound button pressed
    /**
     * Function to load on instantiation
     */
    init:function(){
        var that = this, // Create Local this
            defaultSound; // Use defaultSound to hold the default manifest info for each pad while looping through;
        // For each pad in the dom
        $.each($('.soundBtn'), function(i){
            defaultSound = soundLibrary.manifest[i]; // Default sound for pad index i equals manifest index i
            that.soundBank.push({
                triggerPad: $(this).attr('data-button'), // Pad # is determined from attribute data-button of pad element
                element: $(this), // jQuery instance of dom element
                soundTitle: defaultSound.title, // Title of the sound
                fileName: defaultSound.fileName, // Filename of the sound
                soundId: defaultSound.id, // PreloadJs ID of sound
                sLength: null, // Length of sound file (will be loaded in later)
                isPlaying: false, // Play state of sound
                isDown: false // Is pad currently being pressed (key held down or click held down)
            });
        });

        this.padNum = $('#padNum'); // DOM element for pad # display
        this.initClickHandlers(); // Initialize click handlers (mouse)
        this.initKeyHandlers(); // Initialize key press handlers (keyboard)
        this.initCreateJs(); // Initialize CreateJS implementation
        this.preloadWaveforms(); // Preload sound files for waveform display
        $('.mpc-wrapper').draggable();
    },
    /**
     *
     */
    initClickHandlers:function(){
        var that = this;

        // On mousedown of pads
        $('.soundBtn').mousedown(function(e){
            // Begin Play sequence using pad's data-button attribute to ID button
            that.processInput($(this).attr('data-button'));
        });
        // On mouseup of pads
        $('.soundBtn').mouseup(function(e){
            // Remove soundBtnActive class that makes the button look depressed in
            $(this).removeClass('soundBtnActive');
        })
    },
    /**
     * Initialize CreateJS: Preload JS & Sound JS
     */
    initCreateJs: function(){
        var that = this;
        // Set location of FlashAudioPlugin.swf in relation to SoundJS.js
        createjs.FlashPlugin.BASE_PATH = './';
        // Determine if SoundJS has been initialized.  If not, initialize it.
        if (!soundjs.checkPlugin(true)) {
            console.error('createjs error');
            return;
        }
        // Initialize local preload js
        this.preload = new createjs.PreloadJS();
        //Install SoundJS as a plugin, then PreloadJS will initialize it automatically.
        this.preload.installPlugin(soundjs);

        // On completion of loading for each sound file
        this.preload.onFileLoad = function(event) {
            // Assign associated audio file to the pad library after loading completed
            that.soundBank[event.id-1].audioFile = event.result;
            // Add class to light button
            that.soundBank[event.id-1].element.addClass('loaded');

        };
        this.preload.onComplete = function(event) {
          that.preloadDone = true;
          // Run loadingComplete function
          that.doneLoading();
        };

        //Load the manifest and pass 'true' to start loading immediately. Otherwise, you can call load() manually.
        this.preload.loadManifest(soundLibrary.manifest, true);
    },
  /**
   * Loading complete callback
   */
    doneLoading: function(){
      if (this.waveforms.doneLoading && this.preloadDone) {
      $('#soundBtnDrawArea').removeClass('loading', 1000, 'swing', function () {
        $('#soundBtnDrawArea').addClass('loading', 1000, 'swing', function () {
          $('.soundBtn').removeClass('loaded');
          $('#soundBtnDrawArea').removeClass('loading');
          $('#loadingMsg').fadeOut();
        });


      });
      }
    },
    initKeyHandlers:function(){
        var that = this;

        $(document).keydown(function(e){
            var keyPressed = that.keycodeToCell(e.keyCode);
            if(keyPressed){
                if(!that.soundBank[keyPressed-1].isDown){
                    that.soundBank[keyPressed-1].isDown = true;
                    that.soundBank[keyPressed-1].element.addClass('soundBtnActive');
                    that.processInput(keyPressed);
                }
            }
        });
        $(document).keyup(function(e){
            var keyPressed = that.keycodeToCell(e.keyCode);
            if(keyPressed){
                that.soundBank[keyPressed-1].isDown = false;
                that.soundBank[keyPressed-1].element.removeClass('soundBtnActive');
            }
        })
    },
  /**
   * Play the target pad and update display
   * @param target SoundBank object
   */
    playSound: function(target){
      // Clear interval for progress percentage
      // Clear interval for progress bar
        window.clearInterval(this.currentInterval);
        window.clearInterval(mpcDisplay.progressInterval);
        var that = this;
      // Bugfix to allow repitition of the same sound quicker
        if(target.soundId == this.currentId)
          // Set position to 0 rather than replayin sound
            this.currentInstance.setPosition(0);
        else{
          // Play the sound: play (src, interrupt, delay, offset, loop, volume, pan)
          var instance = createjs.SoundJS.play(target.soundId, soundjs.INTERRUPT_ANY, 0, 0, false, 1);
          this.currentInstance = instance;
          // If errors, don't continue
          if (instance == null || instance.playState == soundjs.PLAY_FAILED) { return; }
          // Fade out old title
          $('#soundTitle').fadeOut('fast',function(){
          // Fade in new title
              $('#soundTitle').text(target.soundTitle).fadeIn('fast');
          });
          // If sound bank has not yet included the length, add it
          if (!target.sLength)
              target.sLength = instance.getDuration();
          // Display the sounds length
          $('#soundLength').text(convertMS(target.sLength));
        }
        // Set interval for percentage update
        this.currentInterval = window.setInterval(function(){
            $('#soundPos').text(((instance.getPosition()/target.sLength).toFixed(2)*100).toFixed(0) + '%');
        },100);
        target.isPlaying = true;
        // Draw the waveform ( returns the interval for progress)
        mpcDisplay.progressInterval = this.waveforms.drawSpecifiedWaveform(target.soundId,this.currentInstance.getDuration());
      // After sound completed
      instance.onComplete = function(instance) {
        // Stop remove lit class
            target.element.removeClass('playing');
            target.isPlaying = false;
        // If this is the last sound played
            if(instance == that.currentInstance){
              //Clear the progress interval
                window.clearInterval(that.currentInterval);
              // Set progress to 100
                $('#soundPos').text('100%');
            }
        }
    },
    processInput:function(keyCode){
        var btnKey = this.soundBank[keyCode - 1];

        btnKey.element.addClass('playing');
        this.lastSoundBtn = btnKey.element.attr('data-button');

        this.padNum.text(keyCode);
        this.playSound(btnKey);
        this.pulseButton(btnKey);
    },
    pulseButton:function(button, initialPulse){
        var that = this;
        $('div',button.element).effect('pulsate','easeInOutBack',1000,function(){
            if(button.isPlaying || initialPulse)
                that.pulseButton(button);
            else
                return;
        });
    },
    preloadWaveforms:function(){
        var fileArray = [];
        $.each(soundLibrary.manifest,function(){
            fileArray.push(this.src);
        });
        this.waveforms = Waveform({
            fileArray: fileArray,
            canvas: $('#waveform'),
            status: $('#status'), // Status div for
            colorOne: '#DBD2E8',
            colorTwo: '#7857A5',
            loadingCallback: function(){

            },
            onStatus: function(x) {
//                $('#status').text('Loading '+Math.floor(x*100)+'%')
            },
            onReady: function() {
//                $('#status').text('Done')
            }
        })
    },
    switch:function(){
        if($(".mpc-wrapper").is(':visible')){
            $(".mpc-wrapper").fadeOut(500, function(){
                $("#tutDescription").animate({
                    width: "100%"
                }, 1000);
                $(".tutContent").fadeIn(1000);
                $("#tutLink").html("Click here to collapse the tutorial");
            });
        }else{
            $(".tutContent").fadeOut(500, function(){
                $("#tutDescription").animate({width: "49%"}, 1000, function(){
                    $(".mpc-wrapper").fadeIn(500);
                    $("#tutLink").html("Click here to see the tutorial");
                });
            });
        }
    },

    /**
     * Convert Keycode to corresponding cell
     * @param keyPressed Keycode of pressed button
     * @return {Integer|Boolean} ID of cell / False if invalid key
     */
    keycodeToCell: function(keyPressed){
    var keyCellVals = {
        49: 1,
        50: 2,
        51: 3,
        52: 4,
        81: 5,
        87: 6,
        69: 7,
        82: 8,
        65: 9,
        83: 10,
        68: 11,
        70: 12,
        90: 13,
        88: 14,
        67: 15,
        86: 16
    };
    return keyCellVals[keyPressed] || false;
}
});

/**
 * Convert milliseconds to MM:SS format
 * @param ms
 * @return {String}
 */
function convertMS(ms) {
    var x = new Date(ms);
    return ((x.getMinutes()<10) ? "0": "") + x.getMinutes() + ':' + ((x.getSeconds()<10) ? "0" : "") + x.getSeconds();
}
$(document).ready(function(){
    sampler = new mpcDisplay();
    $("pre.styles").snippet("css",{style:"bright"});
    $("pre.js").snippet("javascript_dom",{style:"typical"});
});