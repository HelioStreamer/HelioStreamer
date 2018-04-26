function ScalableVideoStreamer(zooms, targetFPS = 25) {
  // Subfunctions work with this object.
  // We use self instead of this so we can be sure that we always take the right object.
  // Thanks javascript.
  var self = this;

  self.zooms = zooms;
  
  // We sort them so we don't need to iterate over the whole list when zooming
  self.zooms.sort(function(a, b) {
    return a.maxZoomLevel < b.maxZoomLevel;
  });
  
  self.viewer = new Cesium.Viewer("cesiumContainer", {
      showRenderLoopErrors : false,
      shouldAnimate : false,
      baseLayerPicker: false,
      sceneModePicker: false,
      geocoder: false,
      imageryProvider: false,
      // Atmosphere could be the animation around the sun...
      skyAtmosphere: false, 
      targetFrameRate: targetFPS
  });
  
  // Globe color is blue by default.
  // Change it to gray so it matches the video files.
  self.viewer.scene.globe.material =  Cesium.Material.fromType('Color');
  self.viewer.scene.globe.material.uniforms.color = new Cesium.Color(0.1, 0.1, 0.1, 1.0);
  
  // We are the sun, we don't need it in the background.
  self.viewer.scene.sun = null;
  
  self.viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
  
  // Scale even after small changes
  self.viewer.camera.percentageChanged = 0.01;
  
   // Init Video Synchronizers
  self.sync = [];
  for(var i = 0; i < 9; i++) {
    self.sync.push(new Cesium.VideoSynchronizer({
        clock : self.viewer.clock,
        clockScale: 1
    }));
  }

  // We define the variables that are required for zooming and playing selective videos.
  // Zooming level
  self.activeZoom = 0;
  // The tile which is played. All tiles around will also be played.
  self.targetIndex = 0;
  
  // We generate the tiles and add it to the scene.
  // The current zooming level is displayed while the others are hidden.
  self.zooms.forEach(function(z, i) {
    z.generateTiles(self.viewer, self.activeZoom == i);
  });
  
  // Default is FPS*30 because a frame represents 30s
  self.changeTimeScaling(targetFPS*30);
  
  // Take the current targeted videos and add them to the synchronizers.
  self.synchronizeVideosOnTarget();
  
  // Changing zooming level and targeted tile.
  self.viewer.camera.changed.addEventListener(function() {
    self.lookForNewZoomingLevel();
    
    // Check if new targeted tile
    var newTargetIndex = self.indexOfCenteredTile();
    if(newTargetIndex != -1 && newTargetIndex != self.targetIndex) {
      self.stopSynchronizeVideos();
      
      self.targetIndex = newTargetIndex;
      
      self.synchronizeVideosOnTarget();
    }
  });
  
  // Older browsers do not support WebGL video textures,
  // put up a friendly error message indicating such.
  self.viewer.scene.renderError.addEventListener(function() {
      self.stopSynchronizers();
      self.viewer.cesiumWidget.showErrorPanel("This browser does not support cross-origin WebGL video textures.", "", "");
  });
}

// Set the start time of the video.
ScalableVideoStreamer.prototype.setStartTime = function(startTime, reset = true, play = false) {
  var self = this;
  self.viewer.clock.shouldAnimate = play;
  self.viewer.clock.startTime = Cesium.JulianDate.fromIso8601(startTime);
  self.viewer.timeline.zoomTo(self.viewer.clock.startTime, self.viewer.clock.stopTime);
  self.sync.forEach(function(s) {
    s.epoch = self.viewer.clock.startTime;
  });
  if(reset)
    self.viewer.clock.currentTime = self.viewer.clock.startTime;
}

// Set the end time of the video.
ScalableVideoStreamer.prototype.setEndTime = function(endTime) {
  this.viewer.clock.stopTime = Cesium.JulianDate.fromIso8601(endTime);
  this.viewer.timeline.zoomTo(this.viewer.clock.startTime, this.viewer.clock.stopTime);
}

// Change the timescaling of the video.
// 1s in the video represents [scale]s in the Cesium timeline.
ScalableVideoStreamer.prototype.changeTimeScaling = function(scale, changeTimelineSpeed = true) {
  if(changeTimelineSpeed)
    this.viewer.clock.multiplier = scale;
  this.sync.forEach(function(s) {
    s.clockScale = scale;
  });
}

// Checks the current distance of the camera to the earth and searches for the matching zoom level.
ScalableVideoStreamer.prototype.lookForNewZoomingLevel = function() {
  // The height of the camera
  var height = this.viewer.camera.getMagnitude();
  
  // In order to find a good height for scaling - add the following line and look at the console
  // console.log(height);
  
  // We look for the first matching zooming level and activate it.
  // XXX To high zoom factor results in too long loading time of all tiles.
  // XXX Maybe use the same technique as for the synchronizers
  for(var i = this.zooms.length-1; i >= 0; i--) {
    if(this.zooms[i].isInRange(height)) {
      if(this.activeZoom != i) {
        this.zooms[this.activeZoom].tiles.forEach(function(tile) {
          tile.show = false;
        });
        this.activeZoom = i;
        // currently no target
        this.targetIndex = -1;
        this.zooms[this.activeZoom].tiles.forEach(function(tile) {
          tile.show = true;
        });
      }
      // We found the best matching zooming level. 
      return;
    }
  }
}

// Stop old video from playing and remove them from the synchronizers.
ScalableVideoStreamer.prototype.stopSynchronizeVideos = function() {
  for(var i = 0; i < this.sync.length; i++) {
    var elem = this.sync[i].element;
    this.sync[i].element = null;
    if(elem != null)
      elem.pause();
  }
}

// Change the synchronizer target and play the target tile and the tiles around it.
ScalableVideoStreamer.prototype.synchronizeVideosOnTarget = function() {
  var syncIndex = 0;
  for(var i = -1; i <= 1; i++) {
    for(var j = -1; j <= 1; j++) {
      var index = this.targetIndex+i*this.zooms[this.activeZoom].xTiles+j;
      if(index < this.zooms[this.activeZoom].tiles.length && index >= 0) {
        this.sync[syncIndex++].element = this.zooms[this.activeZoom].tiles[index].appearance.material.uniforms.image;
      }
    }
  }
}

// Returns the tile in the screen center
ScalableVideoStreamer.prototype.indexOfCenteredTile = function() {
  var tiles = this.zooms[this.activeZoom].tiles;
  
  var screenWidthCenter = this.viewer.scene.drawingBufferWidth/2;
  var screenHightCenter = this.viewer.scene.drawingBufferHeight/2;
  var activeTile = this.viewer.scene.pick(Cesium.Cartesian2.fromElements(screenWidthCenter, screenHightCenter));
  if(activeTile == null)
    return -1;
  activeTile = activeTile.primitive;
  for(var i = 0; i < tiles.length; i++) {
    if(tiles[i] == activeTile)
      return i;
  }
  return -1;
}