var ZoomDefinition = function (xTiles, yTiles, maxZoomLevel, videoName) {
  this.xTiles = xTiles;
  this.yTiles = yTiles;
  this.maxZoomLevel = maxZoomLevel;
  this.videoName = videoName;
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
      videoElement.loop = false;
      
      videoElement.src = this.videoName + x + '_' + y + '.mp4';
      
      var videoMaterial = Cesium.Material.fromType('Image');
      videoMaterial.translucent = false;
      videoMaterial.uniforms.image = videoElement;
  
      this.tiles.push(viewer.scene.primitives.add(new Cesium.Primitive({
          geometryInstances : new Cesium.GeometryInstance({
              geometry : new Cesium.RectangleGeometry({
                  rectangle : Cesium.Rectangle.fromDegrees(-180.0 + moveX*x, -90.0 + moveY*y, -180.0 + moveX*(x+1), -90.0 + moveY*(y+1)),
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

ZoomDefinition.prototype.setVideoName = function(videoName) {
  var self = this;
  self.videoName = videoName;
  if(self.tiles != null) {
    self.tiles.forEach(function (tile) {
      tile.appearance.material.uniforms.image.src = self.videoName + x + '_' + y + '.mp4';
    });
  }
}

ZoomDefinition.prototype.isInRange = function(magnitude) {
  return magnitude < this.maxZoomLevel;
}