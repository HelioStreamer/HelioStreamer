# HelioStreamer
This program was created as part of the bachelor's thesis by Sandro Schwager and Fabio Strappazzon.

This repository is a fork of CesiumJS.
For more information about the library, visit the repository of [CesiumJS](https://github.com/AnalyticalGraphicsInc/cesium).

### :checkered_flag: Changes to CesiumJS ###
In order to optimize CesiumJS for our project, several files of CesiumJS were replaced or changed.

The whole Apps folder is replaced with the file required for the HelioStreamer. 

In the Source folder the following files are modified:
 * Source/Core/VideoSynchronizer.js -- Added a time scaling so videos can run faster or slower than the CesiumJS Viewer time.
 * Source/Scene/Material.js -- Added optimizations for paused video files.
 * Source/Scene/PerformanceDisplay.js -- Changed 'MS' to 'ms'

There are also changes in the build scripts and documentation.

### :pushpin: Install the HelioStreamer ###

In order to setup your own HelioStreamer you only need to copy the content of the Apps directory. This directory contains the streamer itself and an unminified build of CesiumJS.
The video streamer itself can be found in the Apps directory. The content of the Apps directory can be pasted to any location and do not require any additional libaries.

#### Video files ####

The video streamer relies on .ts video files. These files are generated with the [FFmpeg](https://ffmpeg.org/) command, which is generated with the [VideoTilingCommandGenerator](https://github.com/FabioStrappazzonFHNW/VideoTilingCommandGenerator). 

Make sure you have the video files accessible for the users of the HelioStreamer.

#### Configure the HelioStreamer ####
In the Viewer.html, you will find the following url:

```http://86.119.40.9/Viewer/3/videos/x{3}/t1_{1}-{0}l{2}.ts```

This describes, where the .ts files can be found.

Change the URL to the one of your videos. Use the placeholders which are:
 * `{0}` -- the x coordinate of the video tile.
 * `{1}` -- the y coordinate of the video tile.
 * `{2}` -- the number of the video segment
 * `{3}` -- the speedup factor of the video tiles.

### :rocket: Start the HelioStreamer

CesiumJS itself has already a server. To run it, write `npm start`. More information can be found in the [CesiumJS Build Guide](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Documentation/Contributors/BuildGuide/README.md).

### :pencil2: Code changes ###

All files in the Apps folder can directly be changed. Keep in mind, if you modify the Apps/lib files you also need to change the corresponding file under Source.

If you want to rebuild the Apps/lib folder, take a look at the [CesiumJS Build Guide](https://github.com/AnalyticalGraphicsInc/cesium/blob/master/Documentation/Contributors/BuildGuide/README.md).

When you rebuild CesiumJS the Build dirctory will contain the corresponding files. Copy them to the Apps/lib folder so the Video Player also takes the new build.