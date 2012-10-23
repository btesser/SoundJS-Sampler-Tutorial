
var mpcDisplay, waveformElements = {
    bufs: [],
    wfArray: [],
    colorOne: "white",
    colorTwo: "black"
};

  this.Waveform = function(_arg) {
    var canvas, file, loadBuffer, onReady, onStatus, req, sections, self, status, that = this;
    this.reqs = [];
    this.bufs = [];
    // Changed file variable to an array in order to allow for preloading.
    var fileArray = _arg.fileArray, canvas = _arg.canvas, onStatus = _arg.onStatus, onReady = _arg.onReady,
        colorOne = _arg.colorOne, colorTwo = _arg.colorTwo, loadingCallback = _arg.loadingCallback;
    canvas = $(canvas);
    status = $(status);
    sections = canvas.attr('width');
      $.extend(waveformElements,{canvas: canvas,
        sections: sections,
        status: status,
        colorOne: colorOne,
        colorTwo: colorTwo
    });
    this.canvas = canvas;
      // rather than load an individual file, preload all audio files
    this.numFiles = fileArray.length;
    this.numFilesLoaded = 0;
    this.doneLoading = false;
      $.each(fileArray,function(){
          var currentReq;
          currentReq = new XMLHttpRequest();
          currentReq.open('GET', this, true);
          currentReq.responseType = 'arraybuffer';
          currentReq.onprogress = function(e) {
              return typeof onStatus === "function" ? onStatus(e.loaded / e.total) : void 0;
          };
          // When loading is complete
          currentReq.onload = function() {
              // add request to requests array
              that.reqs.push(currentReq);
              that.numFilesLoaded++;
              if (that.numFilesLoaded >= that.numFiles){
                that.doneLoading = true;
                loadingCallback();
              }
              return loadBuffer(currentReq.response);
          };
          // initialize the request
          currentReq.send();

      });

    loadBuffer = function(arr) {

      console.log(arr);
      var audio, buf;
      audio = new webkitAudioContext();
      buf = audio.createBuffer(arr, true);
// Disable internal playback in favor of Sound JS for playback

        // Add buffer to array of buffers
        waveformElements.bufs.push(buf);
        return typeof onReady === "function" ? onReady() : void 0;
    };
//    this.self = self;
    return this;
  };

/**
 * Modified original drawing to allow for the id and soundInstance to be passed.  This allows waveform-chrome to
 * display progress of the soundJs instance
 * @param id
 * @param soundInstance
 */
  this.drawSpecifiedWaveform = function(id, soundDuration){
      // Start ID at 0 rather than 1
      id-=1;
      self = {
          view: WaveformView(waveformElements.canvas)
      };
      var sections = waveformElements.canvas.attr('width');
      var context = waveformElements.canvas[0].getContext('2d');
      // Clear any existing content in the canvas
      context.clearRect(0,0,412,50);
      // Change fill color to black
      context.fillStyle = 'black';
      // Extract amplitude from buffer with getChannelData and pass data to drawBar
      ProcessAudio.extract(waveformElements.bufs[id].getChannelData(0), sections, self.view.drawBar);

      return showWaveformProgress(soundDuration);
  }
  this.WaveformView = function() {
    var canvas = waveformElements.canvas;
    var ctx, cursor, height, overlay, self, width, _ref;
    _ref = canvas[0], width = _ref.width, height = _ref.height;
      var context;
          context = canvas[0].getContext('2d');
    ctx = canvas[0].getContext('2d');

    return self = {
      /**
       * Draw the progress bar
       * @param i X start point
       * @param val Amplitude
       * @return {*} Canvas fillRect results
       */
      drawBar: function(i, val) {
        console.log('drawbar');
        var h;
        h = val * 50 * height;
        ctx.fillStyle = waveformElements.colorOne;
        return ctx.fillRect(i, height / 2 - h / 2, 1, h);
      }
    };
  };
/**
 * Set up interval to draw progress on the waveform
 * @param soundDuration Length in ms of sound being played
 * @return {Integer} The interval identifier
 */
  this.showWaveformProgress = function(soundDuration){
      var canvas = waveformElements.canvas;
      var ctx, cursor, height, overlay, self, width, _ref;
      _ref = canvas[0], width = _ref.width, height = _ref.height;
      // The length in ms of the interval is equal to the length of the soundfile over the width of the canvas
      var intervalLen =  soundDuration / width;

      var i = 0;
      waveformElements.progressInterval = window.setInterval(function(){
          // If at end of canvas stop interval
          if(i >= waveformElements.wfArray.length)
              window.clearInterval(waveformElements.progressInterval);
          // Draw progress
          drawProgress(i,height);
          i++;
      },intervalLen);
      return waveformElements.progressInterval;
  }
/**
 * Draw progress on the canvas
 * @param i X start point
 * @param height the height of the canvas
 */
  this.drawProgress = function(i,height){
      var canvas = waveformElements.canvas,
      ctx = canvas[0].getContext('2d'),
      h;
      // Set fill color to be the foreground color
      ctx.fillStyle = waveformElements.colorOne;
      // Fill background with foreground color (for contrast)
      ctx.fillRect(i,0,1,height);
      // Set fill color to be background color
      ctx.fillStyle = waveformElements.colorTwo;
      // Draw waveform in contrasting colors
      h = waveformElements.wfArray[i] * 50 * height;
      ctx.fillRect(i, height / 2 - h / 2, 1, h);
  }
  this.PlayBuffer = function(audio, buffer) {
    var node, paused, self, start, timeBasis, timeStart;
    node = null;
    timeStart = null;
    timeBasis = null;
    paused = null;
    start = function(t) {
      timeStart = Date.now();
      timeBasis = t;
      node = audio.createBufferSource();
      node.buffer = buffer;
      node.connect(audio.destination);
      if (t === 0) {
        return node.noteOn(0);
      } else {
        return node.noteGrainOn(0, t, buffer.duration - t);
      }
    };
    start(0);
    return self = {
      play: function() {
        start(paused || 0);
        return paused = null;
      },
      playAt: function(t) {
        node.noteOff(0);
        start(t * buffer.duration);
        return paused = null;
      },
      getTime: function() {
        return paused || Math.min((Date.now() - timeStart) / 1000 + timeBasis, buffer.duration);
      },
      pause: function() {
        node.noteOff(0);
        return paused = self.getTime();
      },
      isPaused: function() {
        return paused !== null;
      }
    };
  };

  this.ProcessAudio = {
    extract: function(buffer, sections, out, done) {
      var f, i, int, len;
      len = Math.floor(buffer.length / sections);
      i = 0;
      wfArray = [];
      f = function() {
        var end, pos, _results;
        end = i + 10;
        _results = [];
        while (i < end) {
          pos = i * len;
          waveformElements.wfArray[i] = ProcessAudio.measure(pos,pos+len,buffer);
          out(i, ProcessAudio.measure(pos, pos + len, buffer));
          i++;
          if (i >= sections) {
            clearInterval(int);
            if (typeof done === "function") done();
            break;
          } else {
            _results.push(void 0);
          }
        }
        return _results;
      };
      return int = setInterval(f, 1);
    },
    measure: function(a, b, data) {
      var i, s, sum, _ref;
      sum = 0.0;
      for (i = a, _ref = b - 1; a <= _ref ? i <= _ref : i >= _ref; a <= _ref ? i++ : i--) {
        s = data[i];
        sum += s * s;
      }
      return Math.sqrt(sum / data.length);
    }
  };
