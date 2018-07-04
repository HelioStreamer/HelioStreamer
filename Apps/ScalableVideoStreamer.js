function ScalableVideoStreamer(zooms, targetFPS = 25, colorTable = LUT["Gray"]) {
  // Subfunctions work with this object.
  // We use self instead of this so we can be sure that we always take the right object.
  // Thanks javascript.
  var self = this;

  self.zooms = zooms;
  
  // We sort them so we don't need to iterate over the whole list when zooming
  // Having the highest zoom level first results in faster percieved loading because the first tile will already cover the whole globe.
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
      skyAtmosphere: false, 
      targetFrameRate: targetFPS
  });
  
  // Globe color is blue by default.
  // Change it to black so it matches the video files.
  self.viewer.scene.globe.material =  Cesium.Material.fromType('Color');
  self.viewer.scene.globe.material.uniforms.color = new Cesium.Color(0.0, 0.0, 0.0, 1.0);
  
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
  
  //the maximum speedup factor relative to the set time scaling that can be achieved with the animation widget
  self.maxSpeedupFactor = 4;

  // We define the variables that are required for zooming and playing selective videos.
  // Zooming level
  self.activeZoom = 0;
  // The tile which is played. All tiles around will also be played.
  self.targetIndex = 0;
  
  // Init color table texture
  self.colorTexture = new Cesium.Texture({
      context : self.viewer.scene.context,
      pixelFormat : Cesium.PixelFormat.RGBA,
      pixelDatatype : Cesium.PixelDatatype.UNSIGNED_BYTE,
      width : 256,
      height : 1,
      source : {
          arrayBufferView : colorTable
      }
  });
  
  // We generate the tiles and add it to the scene.
  // The current zooming level is displayed while the others are hidden.
  self.zooms.forEach(function(z, i) {
    z.generateTiles(self.viewer, self.colorTexture, self.activeZoom == i);
  });
  
  // Select correct zooming level on startup.
  self.lookForNewZoomingLevel();
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

// Change video path of all videos
// This will only change the videos - time and scaling should be changed too
ScalableVideoStreamer.prototype.setVideoPath = function(scale, startdate, enddate) {
  // We stop the time when loading a new video source
  this.viewer.clock.shouldAnimate = false;
  this.zooms.forEach(function(zoom) {
    zoom.setVideoPlaylist(scale, startdate, enddate);
  });
}

// Change the color table of the color texture
ScalableVideoStreamer.prototype.setColorTable = function(colorTable) {
  this.colorTexture.copyFrom({arrayBufferView: colorTable, width: 256, height: 1}, 0, 0);
}


// Set the start time of the video.
ScalableVideoStreamer.prototype.setStartTime = function(startTime, reset = true, play = false) {
  var self = this;
  // Set if we play the video
  self.viewer.clock.shouldAnimate = play;
  // Set start time of the clock
  self.viewer.clock.startTime = Cesium.JulianDate.fromIso8601(startTime);
  // Change timeline to current time.
  self.viewer.timeline.zoomTo(self.viewer.clock.startTime, self.viewer.clock.stopTime);
  // Change synchronizers of videos to this time.
  self.sync.forEach(function(s) {
    s.epoch = self.viewer.clock.startTime;
  });
  // If the current time is set to start time
  if(reset)
    self.viewer.clock.currentTime = self.viewer.clock.startTime;
}

// Set the end time of the video.
ScalableVideoStreamer.prototype.setEndTime = function(endTime) {
  // Set stop time of the clock
  this.viewer.clock.stopTime = Cesium.JulianDate.fromIso8601(endTime);
  // Change timeline to current time.
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
  this.viewer.animation.viewModel.setShuttleRingTicks([0, scale * this.maxSpeedupFactor]);
}

// Checks the current distance of the camera to the earth and searches for the matching zoom level.
ScalableVideoStreamer.prototype.lookForNewZoomingLevel = function() {
  // The height of the camera
  var height = this.viewer.camera.getMagnitude();
  
  // In order to find a good height for scaling - add the following line and look at the console
  // console.log(height);
  
  // We look for the closest (last in default order, thus the reverse()) matching zooming level and activate it.
  var newZoom = this.zooms.length - 1 - this.zooms.slice().reverse().findIndex(function(zoom){
	return zoom.isInRange(height);
  });
  
  if(this.activeZoom != newZoom && newZoom != -1) {
	this.zooms[this.activeZoom].tiles.forEach(function(tile) {
	  tile.show = false;
	});
	this.activeZoom = newZoom;
	// currently no target
	this.targetIndex = -1;
	this.zooms[this.activeZoom].tiles.forEach(function(tile) {
	  tile.show = true;
	});
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
ScalableVideoStreamer.prototype.indexOfCenteredTile = function(zoom = this.activeZoom) {
  var xTiles = this.zooms[zoom].xTiles;
  var yTiles = this.zooms[zoom].yTiles;
  var xPosition = (1 + (this.viewer.camera.positionCartographic.longitude / Math.PI)) * xTiles;
  var yPosition = (0.5 - (this.viewer.camera.positionCartographic.latitude / Math.PI)) * yTiles;
  var index = Math.floor(xPosition) * yTiles + Math.floor(yPosition);
      
  if(index < this.zooms[zoom].tiles.length && index >= 0)
    return index;
  return -1;
}