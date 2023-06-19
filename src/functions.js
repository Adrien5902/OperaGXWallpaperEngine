//ffmpeg
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const misc = require("./functions/misc")

//Wallpaper Engine
const WallpaperEngine = require('./functions/wallpaper_engine');

//Project
const Project = require('./functions/project');

module.exports = {
    misc,

    ffmpeg,

    WallpaperEngine,
    Project,
}