(function(window){
  var urlCount = 0,
      NativeMediaSource = window.MediaSource || window.WebKitMediaSource || {},
      nativeUrl = window.URL || {},
      flvCodec = /video\/flv; codecs=["']vp6,aac["']/,
      objectUrlPrefix = 'blob:vjs-source/';

  // extend the media source APIs

  // Media Source
  videojs.MediaSource = function(){
    var self = this;
    this.sourceBuffers = [];
    this.readyState = 'closed';
    this.listeners = {
      sourceopen: [function(event){
        self.player = document.getElementById(event.playerId);
        self.readyState = 'open';
        
        // trigger load events
        if (self.player) {
          self.player.vjs_load();
        }
      }],
      webkitsourceopen: [function(event){
        self.trigger({
          type: 'sourceopen'
        });
      }]
    };
  };
  videojs.MediaSource.sourceBufferUrls = {};
  videojs.MediaSource.prototype = {
    addSourceBuffer: function(type){
      var sourceBuffer;
      if (flvCodec.test(type)) {
        // Flash source buffers
        sourceBuffer = new videojs.SourceBuffer(this);
      } else {
        // native source buffers
        sourceBuffer = this.nativeSource.addSourceBuffer.apply(this.nativeSource, arguments);
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
    endOfStream: function(){
      this.readyState = 'ended';
    },
    trigger: function(event){
      var listeners = this.listeners[event.type] || [],
          i = listeners.length;
      while (i--) {
        listeners[i](event);
      }
    }
  };

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
      var url = objectUrlPrefix + urlCount,
          triggerSourceOpen = function(playerId){
	    object.trigger({
	      type: 'sourceopen',
	      playerId: playerId
	    });
          };
      urlCount++;

      // setup the mapping back to object
      videojs.MediaSource.sourceBufferUrls[url] = triggerSourceOpen;
      triggerSourceOpen.object = object;

      return url;
    }
  };

  // plugin
  videojs.plugin('mediaSource', function(options) {
    var player = this;
    player.on('loadstart', function() {
      var url = player.currentSrc(),
          trigger = function(event){
            mediaSource.trigger(event);
          },
          mediaSource;

      if (player.techName === 'Html5' && url.indexOf(objectUrlPrefix) === 0) {
        // use the native media source implementation
        mediaSource = videojs.MediaSource.sourceBufferUrls[url].object;

        if (!mediaSource.nativeUrl) {
          // initialize the native source
          mediaSource.nativeSource = new NativeMediaSource();
          mediaSource.nativeSource.addEventListener('sourceopen', trigger, false);
          mediaSource.nativeSource.addEventListener('webkitsourceopen', trigger, false);
          mediaSource.nativeUrl = nativeUrl.createObjectURL(mediaSource.nativeSource);
          
        }
        player.src(mediaSource.nativeUrl);
      }
    });
  });

})(this);
