M3U8.PlaylistTypes = {
    EVENT : "EVENT",
    VOD : "VOD",
}

function M3U8() {
  this.videolist = [];
  this.videometa = [];
  this.discontinueIndex = [];
  this.playlistType = M3U8.PlaylistTypes.VOD;
  this.targetDuration = 10;
  this.version = 4;
  this.mediaSequence = 0;
  this.discontinuitySequence = 0;
  this.endlistTag = true;
}

M3U8.prototype.addTrack = function(tsFile, duration, title) {
  if(title === undefined)
    title = "";
  this.videolist.push(tsFile);
  this.videometa.push("#EXTINF:" + duration + "," + title);
}

M3U8.prototype.addStreamInf = function(playlistFile, bandwidth, programId, codecs, resolution) {
  this.videolist.push(playlistFile);
  var meta = "#EXT-X-STREAM-INF:PROGRAM-ID=" + programId + ",BANDWIDTH=" + bandwidth + ",CODECS=\"" + codecs;
  meta += (resolution != null) ? "\",RESOLUTION=" + resolution : "";
  this.videometa.push()
}

// This will remove the video from the playlist without leaving any trace.
// Discontinuity tags will stay at their current video.
// Discontinuity tag on removed video will be placed in front of next video.
M3U8.prototype.removeVideo = function(index) {
  this.videolist.splice(index, 1);
  this.videometa.splice(index, 1);
  var self = this;
  this.discontinueIndex.forEach(function(n, i) {
    if(n > index)
      self.discontinueIndex[i] = n-1;
  });
}

M3U8.prototype.clear = function() {
  this.videolist = [];
  this.videometa = [];
  this.discontinueIndex = [];
}

M3U8.prototype.addDiscontinuity = function() {
  this.discontinueIndex.push(this.videolist.length);
}

M3U8.prototype.toString = function() {
  var string = "#EXTM3U\n";
  string += "#EXT-X-PLAYLIST-TYPE:" + this.playlistType + "\n";
  string += "#EXT-X-TARGETDURATION:" + this.targetDuration + "\n";
  string += "#EXT-X-VERSION:" + this.version + "\n";
  string += "#EXT-X-MEDIA-SEQUENCE:" + this.mediaSequence + "\n";
  string += "#EXT-X-DISCONTINUITY-SEQUENCE:" + this.discontinuitySequence + "\n";
  for(var i = 0; i < this.videolist.length; i++) {
    if(this.discontinueIndex.includes(i))
      string += "#EXT-X-DISCONTINUITY\n";
    string += this.videometa[i] + "\n";
    string += this.videolist[i] + "\n";
  }
  if(this.endlistTag)
    string += "#EXT-X-ENDLIST";
  return string;
}

M3U8.prototype.toUTF8String = function() {
  var string = this.toString();
  var enc = new TextEncoder("utf-8");
  return enc.encode(string);
}

M3U8.prototype.toUTF8URL = function() {
  var utf8string = this.toUTF8String();
  return URL.createObjectURL(new Blob([utf8string], {type: 'application/vnd.apple.mpegurl'}));
}

M3U8.prototype.wrapIntoStreamURL = function(bandwidth, programId, codecs) {
  string = "#EXTM3U\n" + 
           "#EXT-X-STREAM-INF:PROGRAM-ID=" + programId + ",BANDWIDTH=" + bandwidth + ",CODECS=\"" + codecs + "\"\n" + 
           this.toUTF8URL() + "\n";
           
  var enc = new TextEncoder("utf-8");
  return URL.createObjectURL(new Blob([enc.encode(string)]));
}