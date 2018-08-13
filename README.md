# HelioStreamer
This program was created as part of the bachelor's thesis by Sandro Schwager and Fabio Strappazzon.

This repository is a fork of CesiumJS.
For more information about the library, visit the repository of [CesiumJS](https://github.com/AnalyticalGraphicsInc/cesium).

### :checkered_flag: Changes to CesiumJS
In order to optimize CesiumJS for our project, several files of CesiumJS were replaced or changed.

The whole Apps folder is replaced with the files required for the HelioStreamer. 

In the Source folder the following files have been modified:
 * `Source/Core/VideoSynchronizer.js` -- Added a time scaling so videos can run faster or slower than the CesiumJS Viewer time.
 * `Source/Scene/Material.js` -- Added optimizations for paused video files.
 * `Source/Scene/PerformanceDisplay.js` -- Changed 'MS' to 'ms'

There are also changes in the build scripts and documentation.

### :pushpin: Installing HelioStreamer

HelioStreamer can be installed on any static web server by copying the contents of ./Apps to the web server.
For best results activate CORS and ensure HPPT1.1 persistent connection has an appropriate timeout length (10+ seconds).




#### Video files

The video streamer relies on .ts video files. These files are generated with the [FFmpeg](https://ffmpeg.org/) command, which is generated with the [VideoTilingCommandGenerator](https://github.com/FabioStrappazzonFHNW/VideoTilingCommandGenerator). 

Make sure you have the video files accessible for the users of the HelioStreamer.

#### Configuring HelioStreamer ####
In the Viewer.html, you will find the following url:

```http://86.119.40.9/Viewer/3/videos/x{3}/t1_{1}-{0}l{2}.ts```

This describes, where the .ts files can be found.

Change the URL to the one of your videos. Use the placeholders which are:
 * `{0}` -- the x coordinate of the video tile.
 * `{1}` -- the y coordinate of the video tile.
 * `{2}` -- the number of the video segment
 * `{3}` -- the speedup factor of the video tiles.

### :rocket: Starting HelioStreamer

CesiumJS comes with its own file server that depends on npm and node.js. It can be started with `npm start`. More information can be found in the [CesiumJS Build Guide](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Documentation/Contributors/BuildGuide/README.md).

### :pencil2: Code changes 

All files in the Apps folder can directly be changed. Changes in the Source folder will not be applied until you rebuild Cesium. Information can be found in the [CesiumJS Build Guide](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Documentation/Contributors/BuildGuide/README.md). After running the build script the generated output needs to be copied to the Apps/lib folder. 
