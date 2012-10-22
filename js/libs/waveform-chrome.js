
var mpcDisplay, waveformElements = {
    bufs: [],
    wfArray: []
};

  this.Waveform = function(_arg) {
    var canvas, file, loadBuffer, onReady, onStatus, req, sections, self, status, that = this;
    this.reqs = [];
    this.bufs = [];
    var fileArray = _arg.fileArray, canvas = _arg.canvas, onStatus = _arg.onStatus, onReady = _arg.onReady;
    canvas = $(canvas);
    status = $(status);
    sections = canvas.attr('width');
      $.extend(waveformElements,{canvas: $('#waveform'),
        sections: $('#waveform').attr('width'),
        status: $('#status')
    });
    this.canvas = canvas;
      $.each(fileArray,function(){
          var currentReq;
          currentReq = new XMLHttpRequest();
          currentReq.open('GET', this, true);
          currentReq.responseType = 'arraybuffer';
          currentReq.onprogress = function(e) {
              return typeof onStatus === "function" ? onStatus(e.loaded / e.total) : void 0;
          };
          currentReq.onload = function() {
              that.reqs.push(currentReq);
              console.log(currentReq.response);
              return loadBuffer(currentReq.response);
          };
          currentReq.send();

      })

    loadBuffer = function(arr) {

      console.log(arr);
      var audio, buf;
      audio = new webkitAudioContext();
      buf = audio.createBuffer(arr, true);
//      self.playback = PlayBuffer(audio, buf);
//      self.view.onCursor = self.playback.playAt;
//      setInterval(function() {
//        return self.view.moveCursor(self.playback.getTime() / buf.duration);
//      }, 100);
        waveformElements.bufs.push(buf);
        return typeof onReady === "function" ? onReady() : void 0;
    };
//    this.self = self;
    return this;
  };
  this.drawSpecifiedWaveform = function(id, soundInstance){
      id-=1;
      self = {
          view: WaveformView(waveformElements.canvas)
      };
      var sections = waveformElements.canvas.attr('width');
      console.log(self.view.drawBar);
      var context = waveformElements.canvas[0].getContext('2d');
      context.clearRect(0,0,412,50);
      context.fillStyle = 'black';
      ProcessAudio.extract(waveformElements.bufs[id].getChannelData(0), sections, self.view.drawBar);
      showWaveformProgress(soundInstance)
  }
  this.WaveformView = function() {
    var canvas = waveformElements.canvas;
    var ctx, cursor, height, overlay, self, width, _ref;
    _ref = canvas[0], width = _ref.width, height = _ref.height;
      var context;
          context = canvas[0].getContext('2d');


    ctx = canvas[0].getContext('2d');

    ctx.fillStyle = 'black';
    cursor = $("<div style=\"\n  position: relative;\n  height: " + height + "px;\n  width: 2px;\n  background-color: blue;\">");
//    overlay = $("<div style=\"\n  position: relative;\n  top: -" + height + "px;\n  height: 0px;\">");
//    overlay.append(cursor);
//    canvas.after(overlay);
    canvas.click(function(e) {
      var mx;
      mx = e.pageX - this.offsetLeft;
      cursor.css('left', mx);
      return typeof self.onCursor === "function" ? self.onCursor(mx / width) : void 0;
    });
    return self = {
      drawBar: function(i, val) {
        console.log('drawbar');
        var h;
        h = val * 50 * height;
        ctx.fillStyle = "#DBD2E8";
        return ctx.fillRect(i, height / 2 - h / 2, 1, h);
      },
      moveCursor: function(pos) {
        return cursor.css('left', pos * width);
      }
    };
  };
  this.showWaveformProgress = function(soundInstance){
      var canvas = waveformElements.canvas;
      var ctx, cursor, height, overlay, self, width, _ref;
      _ref = canvas[0], width = _ref.width, height = _ref.height;
      var intervalLen = (soundInstance.getDuration() / 400);

      var context;
      var i = 0;
      ctx = canvas[0].getContext('2d');
      mpcDisplay.progressInterval = waveformElements.progressInterval = window.setInterval(function(){
          if(i >= waveformElements.wfArray.length)
            window.clearInterval(waveformElements.progressInterval);
          ctx.fillStyle = '#DBD2E8';
          ctx.fillRect(i,0,1,height);
          ctx.fillStyle = '#7857A5';
          var h;
          h = waveformElements.wfArray[i] * 50 * height;
          ctx.fillRect(i, height / 2 - h / 2, 1, h);
          i++;
      },intervalLen);

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
    progressExtract:function(buffer, sections, out, done){

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
