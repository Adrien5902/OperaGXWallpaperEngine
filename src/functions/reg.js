const Registry = require('winreg');

module.exports = class Reg{
    constructor(name, key) {
        this.name = name,
        this.key = new Registry({
            hive: Registry.HKCU,
            key
        })
    }

    //Get Installation Directory of a certain app from reg
    static getInstallationDir = (path) => new Promise((resolve, reject) => {
        path.key.get(path.name, (err, item) => {
            if (err) {
                reject(err);
                return;
            }
            const dir = item.value;
            resolve(dir);
        })
    })

    static keys = {
        steam: new Reg("SteamPath", '\\Software\\Valve\\Steam'),
        wallpaper_engine: new Reg("installPath", '\\Software\\WallpaperEngine')
    }
}
