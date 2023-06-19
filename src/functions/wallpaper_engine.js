//Import Reg
const Reg = require('./reg');
const fs = require('fs');

module.exports = class WallpaperEngine{
    static Wallpaper = require("./wallpaper.js")

    static getWallpapers = () => new Promise((resolve, reject) => {
        Promise.all([
            WallpaperEngine.getWallpapersFromWorkshop(),
            WallpaperEngine.getWallpapersFromProjects(),
        ]).then(res => {
            res = res.flat()
            res.sort((a, b) => {
                if(a.title < b.title) { return -1; }
                if(a.title > b.title) { return 1; }
                return 0;
            })
            resolve(res)
        })
    })

    static getWallpapersFromWorkshop = () => new Promise(async(resolve, reject)=>{
        const wallpapers = []
        let steamDir = await Reg.getInstallationDir(Reg.keys.steam)
        let workshopWallpapersDir = path.join(steamDir, "steamapps\\workshop\\content\\431960")
        if(fs.existsSync(workshopWallpapersDir)){
            const files = fs.readdirSync(workshopWallpapersDir)
            for(const file of files){
                try {
                    wallpapers.push(new this.Wallpaper(path.join(workshopWallpapersDir, file)))
                }catch (error){}
            }
        }
        resolve(wallpapers)
    })
    
    static getWallpapersFromProjects = () => new Promise(async(resolve, reject)=>{
        const wallpapers = []
        let wallpaper_engineDir = await Reg.getInstallationDir(Reg.keys.wallpaper_engine)
        let projectsDir = path.join(wallpaper_engineDir.replace("wallpaper32.exe", ""), "projects")
        if(fs.existsSync(projectsDir)){
            for(let projects of fs.readdirSync(projectsDir)){
            if(projects != "temp" && projects != "templates"){
                let dir = path.join(projectsDir, projects)
                const files = fs.readdirSync(dir)
                    for(const file of files){
                        try {
                            wallpapers.push(new this.Wallpaper(path.join(dir, file)))
                        }catch (error){}
                    }
                }
            }
        }
        resolve(wallpapers)
    })
}