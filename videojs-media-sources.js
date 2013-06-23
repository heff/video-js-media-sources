(function(){
  var urlCount = 0;

  // MediaSource
  videojs.MediaSource = function(){
    var self = this;
    this.sourceBuffers = [];
    this.listeners = {};
    setTimeout(function(){
      self.trigger('sourceopen');
    }, 0)
  };
  videojs.MediaSource.prototype = {
    addSourceBuffer: function(type){
      var sourceBuffer = new videojs.SourceBuffer();
      this.sourceBuffers.push(sourceBuffer);
      return sourceBuffer;
    },
    on: function(type, listener){
      if (!this.listeners[type]) {
        this.listeners[type] = [];
      }
      this.listeners[type].push(listener);
    },
    trigger: function(type){
      var listeners = this.listeners[type], i = listeners.length;
      while (i--) {
        listeners[i]({ type: type });
      }
    }
  };

  // SourceBuffer
  videojs.SourceBuffer = function(){
    this.buffer = [];
  };
  videojs.SourceBuffer.prototype = {
    appendBuffer: function(uint8Array, badPlayer){
      var array = [], i = uint8Array.length;
      this.buffer.push(uint8Array);
      while (i--) {
        array[i] = uint8Array[i];
      }
      badPlayer.ready(function(){
        badPlayer.load();
        badPlayer.tech.el().vjs_appendBuffer(array);
      });
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
      var url = 'blob:vjs-source:' + urlCount;
      urlCount++;
      return url;
    }
  };

  videojs.plugin('mediaSources', function(options){
    var player = this;
  });
})();