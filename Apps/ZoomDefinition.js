// Videopath needs to contain a {0} for time scaling, {1} for date, {2} for x, {3} for y.
var ZoomDefinition = function (xTiles, yTiles, maxZoomLevel, videopath) {
  this.xTiles = xTiles;
  this.yTiles = yTiles;
  this.maxZoomLevel = maxZoomLevel;
  this.videopath = videopath;
  this.m3u8video = [];
  for(var i = 0; i < xTiles*yTiles; i++) {
    this.m3u8video[i] = new M3U8();
  }
  // Save hls instances to destroy them on video change
  this.hls = [];
  
  //XXX Following line is for demo use.
  this.startIndexTime = new Date(Date.UTC(2018, 0, 1, 0, 0));
  this.maxExampleVidId = 19
}

// Required for videopath.
String.prototype.format = function() {
  var a = this;
  for (var k in arguments) {
      a = a.replace(new RegExp("\\{" + k + "\\}", 'g'), arguments[k]);
  }
  return a
}

// scale = timedifference between videos, startdate = JS Date, enddate = JS Date.
ZoomDefinition.prototype.setVideoPlaylist = function(scale, startdate, enddate) {
  var self = this;
  var defaultScale = 900;
  var noVids = (enddate.getTime() - startdate.getTime()) / (1000*scale*defaultScale);
  var startIndex = Math.floor((startdate.getTime() - this.startIndexTime.getTime()) / (1000*scale*defaultScale));
  //var date = new Date(startdate)
  
  for(var x = 0; x < this.xTiles; x++) {
    for(var y = 0; y < this.yTiles; y++) {
      var m3u8 = self.m3u8video[x*this.xTiles + y];
      // Remove current playlist
      m3u8.clear();
      // Add video for each timescale.
      for(var i = 0; i < noVids; i++) {
		if(i+startIndex <= self.maxExampleVidId) {
			m3u8.addTrack(self.videopath.format(x, y, startIndex+i, scale), 2);
			m3u8.addDiscontinuity();
		}
        //date.setSeconds(date.getSeconds() + scale);
      }
    }
  }
  
  if(self.tiles != null) {
    self.tiles.forEach(function (tile, i) {
      var videoUrl = self.m3u8video[i].toUTF8URL();
      
      if(self.hls.length > i)
        self.hls[i].destroy();
      if(Hls.isSupported()) {
        self.hls[i] = new Hls({
          maxBufferLength: 6
        });
        self.hls[i].loadSource(videoUrl);
        self.hls[i].attachMedia(tile.appearance.material.uniforms.image);
      }
      else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        tile.appearance.material.uniforms.image.src = videoUrl;
      }
    });
  }
}

ZoomDefinition.prototype.generateTiles = function(viewer, colorTexture, display) {
  this.tiles = [];
  var moveX = 180 / this.xTiles;
  var moveY = 180 / this.yTiles;
      
  for (var x = 0; x < this.xTiles; x++) {
    for (var y = 0; y < this.yTiles; y++) {
      // load video onto surface
      var videoElement = document.createElement('video')
      document.getElementsByTagName("body")[0].appendChild(videoElement);
      videoElement.autoplay = false;
      videoElement.muted = true;
      videoElement.loop = true;
      
      var i = x*this.xTiles + y;
      var videoUrl = this.m3u8video[i].toUTF8URL();
      
      if(this.hls.length > i)
        this.hls[i].destroy();
      if(Hls.isSupported()) {
        this.hls[i] = new Hls({
          maxBufferLength: 6
        });
        this.hls[i].loadSource(videoUrl);
        this.hls[i].attachMedia(videoElement);
      }
      
      var videoMaterial = new Cesium.Material({
        fabric : {
            uniforms : {
                image : Cesium.Material.DefaultImageId,
                colorMap : Cesium.Material.DefaultImageId
            },
            components : {
                diffuse : 'texture2D(colorMap, vec2(texture2D(image, materialInput.st).r,0)).bgr'
            }
        },
        translucent : function(material) {
            return false;
        }
      });
      videoMaterial.uniforms.image = videoElement;
      videoMaterial.uniforms.colorMap = colorTexture;
  
      this.tiles.push(viewer.scene.primitives.add(new Cesium.Primitive({
          geometryInstances : new Cesium.GeometryInstance({
              geometry : new Cesium.RectangleGeometry({
                  rectangle : Cesium.Rectangle.fromDegrees(-180.0 + moveX*x, 90.0 - moveY*(y+1), -180.0 + moveX*(x+1), 90.0 - moveY*y),
                  vertexFormat : Cesium.EllipsoidSurfaceAppearance.VERTEX_FORMAT
              })
          }),
          appearance : new Cesium.EllipsoidSurfaceAppearance({
              aboveGround : false,
              material: videoMaterial,
              translucent: false
          }),
          show : display
      })));
    }
  }
}

ZoomDefinition.prototype.isInRange = function(magnitude) {
  return magnitude < this.maxZoomLevel;
}