const { resizeSquareImage, cloneTemplate } = require("./misc")
const fs = require('fs');

const defaultPreview = path.join(__dirname, "..", "Wallpaper_Engine_Logo_Animated.gif")

module.exports = class Wallpaper {
    constructor(dir){
        let data = JSON.parse(fs.readFileSync(path.join(dir,"project.json")).toString())

        if(data.category){
            throw new Error("Make sure this is a wallpaper")
        }

        this.path = dir

        Object.assign(this, data)
        
        this.description = this.description ?? ""

        if(this.preview){
            const previewPath = path.join(this.path,this.preview)
            this.fullPreview = fs.existsSync(previewPath) ? this.path + "/" +this.preview : defaultPreview
        }else{
            this.fullPreview = defaultPreview
        }

        this.type = this.type ?? "scene"
    }

    htmlPreview(){
        let html = cloneTemplate("wallpaper-preview")
        html.querySelector("span.name").innerHTML = this.title
        let img = html.querySelector("img")
        img.src = this.fullPreview
        img.setAttribute('draggable', false)

        html.querySelector(".type-video").classList.toggle("selected", this.getVideo())
        html.querySelector(".type-scene").classList.toggle("selected", !this.getVideo())

        return html
    }
    
    getIcons = (savePath, resList = [128, 256, 512]) => new Promise((resolve) => {
        const promises = []

        resList.forEach(res => {
            promises.push(new Promise((resolveRes) => {
                let outputPath = path.join(savePath, `icon_${res}.png`)
                resizeSquareImage(
                    this.fullPreview,
                    outputPath,
                    res,
                    () => {
                        resolveRes()
                    }
                )
            }))
        });

        Promise.all(promises).then(() => resolve())
    })

    getVideo = () => {
        if(this.type.toLowerCase() == "video"){
            return path.join(this.path, this.file)
        }else{
            return null
        }
    }
}