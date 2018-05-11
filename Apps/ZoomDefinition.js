var ZoomDefinition = function (xTiles, yTiles, maxZoomLevel, videoName, videoPath = "./") {
  this.xTiles = xTiles;
  this.yTiles = yTiles;
  this.maxZoomLevel = maxZoomLevel;
  this.videoName = videoName;
  this.videoPath = videoPath;
}
    
ZoomDefinition.prototype.generateTiles = function(viewer, display) {
  this.tiles = [];
  var moveX = 180 / this.xTiles;
  var moveY = 180 / this.yTiles;
  for (var x = 0; x < this.xTiles; x++) {
    for (var y = 0; y < this.yTiles; y++) {
      // load video onto surface
      var videoElement = document.createElement('video')
      videoElement.autoplay = false;
      videoElement.muted = true;
      videoElement.loop = true;
      
      videoElement.src = this.videoPath + this.videoName + y + x + '' + '.mp4';
      
      /*var videoMaterial = Cesium.Material.fromType('Image');
      videoMaterial.translucent = false;
      videoMaterial.uniforms.image = videoElement;*/
      var videoMaterial = new Cesium.Material({
        fabric : {
            type : Cesium.Material.ImageType,
            uniforms : {
                image : Cesium.Material.DefaultImageId
            },
            components : {
                diffuse : 'texture2D(image, materialInput.st).rrr'
            }
        },
        translucent : function(material) {
            return false;
        }
      });
      videoMaterial.uniforms.image = videoElement;
  
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

ZoomDefinition.prototype.setVideoPath = function(videoPath) {
  var self = this;
  self.videoPath = videoPath;
  if(self.tiles != null) {
    self.tiles.forEach(function (tile) {
      var currentSrc = tile.appearance.material.uniforms.image.src.substring(tile.appearance.material.uniforms.image.src.indexOf(self.videoName))
      tile.appearance.material.uniforms.image.src = self.videoPath + currentSrc;
    });
  }
}

ZoomDefinition.prototype.isInRange = function(magnitude) {
  return magnitude < this.maxZoomLevel;
}