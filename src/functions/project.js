const { hslToHex } = require("./misc")
const errors = require("./errors")
const fs = require('fs');
const {cloneTemplate} = require('./misc');

const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

var forbiddenCharacters = /[\x1F]/g;

class Project{
    static dir = path.join(__dirname, "../../save/projects")

    constructor(name, description, wallpaper, manifest = null){
        this.name = name
        this.description = description
        this.wallpaper = wallpaper
        this.manifest = manifest
    }

    static async createFromWallpaper(wallpaper, name = null){
        name = name ?? wallpaper.title
        name = name.replace(forbiddenCharacters, "")
        
        let projectPath = path.join(Project.dir, name)
        
        if(fs.existsSync(projectPath)){
            throw errors.projectAlreadyExists
        }

        fs.mkdirSync(projectPath)

        await wallpaper.getIcons(projectPath)

        let project = new Project(name, wallpaper.description, wallpaper)
        project.manifest = this.Manifest.new(project)
        project.save()

        return project
    }

    open(title, description){
        (document.querySelector("#make-title img")).src = this.getHighestResIcon()
        title.value = this.name
        description.value = this.description

        const videoPreview = document.querySelector("#make-video video")
        videoPreview.src = ""

        for(let colorType of ["gx_accent", "gx_secondary_base"]){
            let colorSelect = document.getElementById("theme-"+colorType)
            if(
                this.manifest &&
                this.manifest.getMods() &&
                this.manifest.getMods().themes &&
                this.manifest.getMods().themes.dark &&
                this.manifest.getMods().themes.dark[colorType]
            ){
                let color = this.manifest.getMods().themes.dark[colorType]
                colorSelect.value = hslToHex(color)
            }else{
                colorSelect.value = "#000000"
            }
        }

        updateColors()

        const videoInfo = document.querySelector("#make-video .info")
        const recordDiv = document.querySelector("#make-video div.record")
        const recordButton = document.querySelector("#make-video button.record")

        const previewBg = document.getElementById("make-preview-bg")

        videoPreview.srcObject = null
        videoPreview.src = ""

        let video = this.getVideo()
        let wallpaperVideo = null

        if(video){
            videoPreview.src = video
            previewBg.src = video
            videoPreview.play()
            previewBg.play()
        }else{
            wallpaperVideo = this.wallpaper.getVideo()
            if(wallpaperVideo){
                videoPreview.src = wallpaperVideo
                previewBg.src = wallpaperVideo
                videoPreview.play()
                previewBg.play()
            }else{

            }
        }

        recordDiv.style.display = !video && !wallpaperVideo ? "block" : "none"
    }

    delete(){
        fs.rmSync(this.getPath(), { recursive: true })
    }

    static list(){
        if(!fs.existsSync(this.dir)){
            fs.mkdirSync(this.dir)
            return []
        }else{
            return fs.readdirSync(this.dir)
        }
    }
    
    static readIcons = (projectPath) => {
        let files = fs.readdirSync(projectPath)
        let icons = {}
        files.forEach(file => {
            if(file.includes("icon")){
                let res = file.replace("icon_", "").replace(".png","")
                icons[res] = file
            }
        })
        return icons
    }

    getHighestResIcon(){
        let icons = Object.keys(this.manifest.icons)
        icons.sort((a, b) =>  Number(b) - Number(a))
        return path.join(this.getPath(), this.manifest.icons[icons[0]])
    }

    static read = (saveName) => {
        const projectPath = path.join(Project.dir, saveName)

        if(!fs.existsSync(projectPath)){
            throw "Project Not Found"
        }

        let manifest = Project.Manifest.readFromFile(projectPath)
        
        return new this(
            saveName,
            manifest.description,
            new WallpaperEngine.Wallpaper(manifest.wallpaper_dir),
            manifest
        )
    }

    getVideo(){
        let videoPath = path.join(this.getPath(), "wallpaper.webm")
        return fs.existsSync(videoPath) ? videoPath : null
    }

    getPath = () => path.join(Project.dir, this.name);

    rename(newName){
        if(this.name == newName)
        return

        let oldPath = this.getPath()
        newName = newName.replace(forbiddenCharacters, "")
        let newPath = path.join(path.dirname(oldPath), newName)
        
        if(fs.existsSync(newPath)){
            throw errors.projectAlreadyExists
        }

        if(fs.existsSync(oldPath)){
            fs.renameSync(oldPath, newPath)
        }
        this.name = newName
        this.manifest.name = newName
    }

    save() {
        let projectPath = this.getPath()
        fs.writeFileSync(path.join(projectPath, "manifest.json"), this.manifest.toJSON())
    }

    htmlPreview(){
        let html = cloneTemplate("wallpaper-preview")
        html.querySelector("span.name").innerHTML = this.name
        let img = html.querySelector("img")

        img.src = this.getHighestResIcon()

        img.setAttribute('draggable', false)
        return html
    }

    static Manifest = class{
        constructor(obj){
            Object.assign(this, obj)
        }

        static new(project, version = "1.0"){
            let icons = Project.readIcons(project.getPath())

            let manifest = new this({
                parent: project,
                name: project.name,
                description: project.description,
                wallpaper_dir: project.wallpaper.path,
                version,
                manifest_version: 3,
                icons,
            })

            return manifest
        }

        getMods(){
            if(this.mod && this.mod.payload)
            return this.mod.payload
            else
            return null
        }
    
        setMods(mods){
            this.mod = {
                payload: {
                    ...mods
                },
                schema_version: 1
            }
        }

        toJSON(){
            let obj = {...this}
            delete obj.parent
            return JSON.stringify(obj)
        }

        static readFromFile(projectPath){
            return new this(JSON.parse(fs.readFileSync(path.join(projectPath, "manifest.json"))))
        }

        setWallpaper(wallpaperVideo, first_frame, text_color = "#FFFFFF", text_shadow = "#000000"){
            this.setMods({wallpaper:{
                dark: {
                    image: wallpaperVideo,
                    first_frame,
                    text_color,
                    text_shadow,
                }, light: {
                    image: wallpaperVideo,
                    first_frame,
                    text_color,
                    text_shadow,
                }
            }})
        }
    }

    static Video = class{
        constructor(project){
            this.parent = project
        }

        getPath(){
            return path.join(this.parent.getPath(), "wallpaper.webm")
        }

        getFirstFrame = (outputPath = 'first_frame.png') => new Promise((resolve, reject) => {
            ffmpeg(this.getPath())
            .outputOptions('-vframes', '1')
            .output(outputPath)
            .on('error', function(err) {
                reject(err)
            })
            .on('end', function() {
                resolve()
            })
            .run();
        })
    }
}

module.exports = Project