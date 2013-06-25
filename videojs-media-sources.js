(function(window){
  var urlCount = 0,
      nativeMediaSource = window.MediaSource || window.WebKitMediaSource || {},
      nativeUrl = window.URL || {},
      flvCodec = /video\/flv; codecs=["']vp6,aac["']/;


  // extend the media source APIs

  // Media Source
  videojs.MediaSource = function(){
    var self = this;
    this.sourceBuffers = [];
    this.listeners = {
      sourceopen: [function(event){
        self.player = document.getElementById(event.playerId);
        // trigger load events
        self.player.vjs_load();
      }]
    };
  };
  videojs.MediaSource.sourceBufferUrls = {};
  videojs.MediaSource.prototype = {
    addSourceBuffer: function(type){
      var self = this,
          sourceBuffer;
      if (flvCodec.test(type)) {
	sourceBuffer = new videojs.SourceBuffer(this);
      } else {
	sourceBuffer = this.prototype.prototype.addSourceBuffer.call(this, arguments);
      }
      this.sourceBuffers.push(sourceBuffer);
      return sourceBuffer;
    },
    addEventListener: function(type, listener){
      if (!this.listeners[type]) {
        this.listeners[type] = [];
      }
      this.listeners[type].unshift(listener);
    },
    trigger: function(event){
      var listeners = this.listeners[event.type] || [],
          i = listeners.length;
      while (i--) {
        listeners[i](event);
      }
    }
  };
  // setup delegation
  videojs.MediaSource.prototype.prototype = nativeMediaSource;

  // SourceBuffer
  videojs.SourceBuffer = function(source){
    this.source = source;
    this.buffer = [];
  };
  videojs.SourceBuffer.prototype = {
    appendBuffer: function(uint8Array){
      var array = [], i = uint8Array.length, self = this;
      this.buffer.push(uint8Array);
      while (i--) {
        array[i] = uint8Array[i];
      }
      if (this.source.player) {
        this.source.player.vjs_appendBuffer(array);
      }
      this.trigger('update');
      this.trigger('updateend');
    },
    trigger: function(type){
      videojs.trigger(this, type);
    },
    on: function(type, listener){
      videojs.on(this, type, listener);
    },
    off: function(type, listener){
      videojs.off(this, type, listener);
    }
  };

  // URL
  videojs.URL = {
    createObjectURL: function(object){
      var url = 'blob:vjs-source/' + urlCount;
      urlCount++;
      videojs.MediaSource.sourceBufferUrls[url] = function(playerId){
	console.log('got playerid', playerId);
	object.trigger({
	  type: 'sourceopen',
	  playerId: playerId
	});
      };
      return url;
    }
  };
  // setup delegation
  videojs.URL.prototype = nativeUrl;

})(this);
