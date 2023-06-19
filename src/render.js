const {ipcRenderer, shell} = require('electron');
const path = require('path');
const { WallpaperEngine, Project } = require("./functions");
const { updateColors, hexToHSL } = require('./functions/misc');

function display(id, message = null, type = null, info = ""){
    let focused = document.querySelectorAll(".focused")
    focused.forEach(focEl => {
        focEl.classList.remove("focused")
    })
    let el = document.getElementById(id)
    el.classList.add("focused")

    if(id == "loading"){
        let bar = type == "progress-bar"
        document.getElementById("loading-message").innerHTML = message ?? "Chargement..."
        document.getElementById("progress-bar-container").style.display = bar ? "flex" : "none"
        document.getElementById("loading-round").style.display = !bar ? "flex" : "none"
        document.getElementById("loading-info").innerHTML = info
        updateProgressBar(0)
    }

    if(id == "projects"){
        displayProjects()
    }
}

function searchWallpapers(input){
    let wallpapers =  document.querySelectorAll("#wallpapers-container .wallpaper-preview")
    wallpapers.forEach(el => {
        el.style.display = !input || el.querySelector(".name").innerHTML.toLowerCase().includes(input.toLowerCase()) ? "flex" : "none"
    })
}

let search = document.getElementById("wallpaper-search")
search.addEventListener("input", e => {
    searchWallpapers(search.value)
})

function createButton(button){
    let btn = document.createElement("button")
    btn.innerHTML = button.text

    if(button.style)
    btn.setAttribute("style", button.style)

    btn.addEventListener("click", e => {
        if(button.action)
        button.action()
    })
    return btn
}

function addRightClick(el, buttons){
    el.addEventListener("contextmenu", e => {
        e.preventDefault();

        let contextMenu = document.getElementById("context-menu")
        if(contextMenu)
        contextMenu.remove()
    
        const { clientX: mouseX, clientY: mouseY } = e;
    
        contextMenu = document.createElement("div")
        contextMenu.id = "context-menu"
        document.body.appendChild(contextMenu)

        contextMenu.style.top = `${mouseY}px`;
        contextMenu.style.left = `${mouseX}px`;

        for(let button of buttons){
            let btn = createButton(button)

            btn.addEventListener("click", e => {
                contextMenu.remove()
            })
            
            contextMenu.appendChild(btn)
        }

        const closeContextMenu = () => {
            contextMenu.remove()
            document.body.removeEventListener("click", closeContextMenu)
        }
        document.body.addEventListener("click", closeContextMenu)
    })
}

function showDialog(text = "", buttons = [], type = "info", value = ""){
    let dialog = document.createElement("dialog")
    document.body.appendChild(dialog)

    let span = document.createElement("span")
    dialog.appendChild(span)
    if(type == "error"){
        buttons.push({
            text: '<i class="fa-solid fa-face-sad-tear"></i>',
            style: 'color: var(--yellow); width: 100%;',
        })
        span.innerHTML += "Une erreur est survenue : "
    }
    span.innerHTML = text
    
    dialog.classList.toggle("error", type == "err" || type == "error")

    if(type == "input"){
        let input = document.createElement("input")
        input.type = "text"
        input.value = value
        dialog.appendChild(input)
    }
    
    let btnDiv = document.createElement("div")
    btnDiv.classList.add("buttons")
    dialog.appendChild(btnDiv)

    buttons.forEach(button => {
        let btn = createButton(button)

        btn.addEventListener("click", e => {
            dialog.remove()
        })
        
        btnDiv.appendChild(btn)
    })
    
    dialog.showModal()
}

function updateProgressBar(percentage, estimatedTime = null){
    let progressContainer = document.getElementById("progress-bar-container")
    let progressBar = document.getElementById("progress-bar")
    let progressWidth = percentage/100 * (progressContainer.offsetWidth - 24)
    progressBar.style.width = progressWidth+"px"
    document.getElementById("loading-time").innerHTML = estimatedTime ? "Temps restant estimé : " + estimatedTime : ""
}

async function displayWallapers(onclick){
    const wallpapers = await WallpaperEngine.getWallpapers()
    let wallpapersDiv = document.getElementById("wallpapers-container")
    wallpapersDiv.innerHTML = ""

    wallpapers.forEach(wallpaper => {
        let wallpaperBox = wallpaper.htmlPreview()
        wallpapersDiv.appendChild(wallpaperBox)

        wallpaperBox.addEventListener("click", async e => {
            onclick(wallpaper, wallpaperBox)

/*
            let videoBuffer
            if(isVideo){
                const videoPath = path.join(wallpaper.path, wallpaper.file)
                videoPreview.src = videoPath
                videoPreview.play();
                videoInfo.innerHTML = "Tout est opérationel, ce fond d'écran a été créé à partir d'une vidéo."
                videoBuffer = fs.readFileSync(videoPath)
            }else{
                videoInfo.innerHTML = "Ce fond d'écran ne peut pas être importé en tant que vidéo vous aller devoir enregistrer une vidéo du fond d'écran pour pouvoir l'importer dans OperaGX."


                function stopRecording(){

                }

                function record(){
                    try {
                        ipcRenderer.invoke("getWallpaperRecordSource").then(async source => {
                            if(source){
                                const constraints = {
                                    audio: false,
                                    video: {
                                        mandatory: {
                                            chromeMediaSource: 'desktop',
                                            chromeMediaSourceId: source.id
                                        }
                                    }
                                };
                                const stream = await navigator.mediaDevices.getUserMedia(constraints);

                                videoPreview.srcObject = stream;
                                videoPreview.play();
                            }else{
                                
                            }
                        })
                    } catch (error) {
                        console.error(error)
                    }
                }

                recordButton.onclick = record
            }

            const save = () => new Promise(async (resolve,reject)=>{
                const savePath = path.join("save", title.value)
                if(!fs.existsSync(savePath)){
                    fs.mkdirSync(savePath)
                }

                const videoSave = "wallpaper.webm"
                
                let videoSaved = false
                let videoExt = path.extname(wallpaper.file)
                const inputPath = path.join(wallpaper.path, wallpaper.file)
                if(videoExt != ".webm" && !fs.existsSync(inputPath)){
                    await new Promise((resolve, reject)=> {
                        const outputPath = path.join(path.resolve(__dirname, '..'), savePath, videoSave)
                        let startTime;
                        display("loading", "Conversion de la vidéo...", "progress-bar", "Cette opération peut prendre quelques minutes.")
                        ffmpeg(inputPath)
                        .noAudio()
                        .videoCodec('libvpx-vp9')
                        .outputOptions(
                            '-lossless', '1',
                            '-threads', misc.maxThreads)
                        .audioCodec('libvorbis')
                        .on('start', () => {
                        startTime = Date.now(); // Store the start time when the conversion starts
                        })
                        .on('error', (err) => {
                            reject(err)
                        })
                        .on('end', (err, stdout, stderr) => {
                            resolve(true)
                        })
                        .on("progress", (progress) => {
                            const elapsedTime = (Date.now() - startTime) / 1000; // Elapsed time in seconds
                            const estimatedTotalTime = elapsedTime / (progress.percent / 100);
                            const estimatedRemainingTime = estimatedTotalTime - elapsedTime;
                            updateProgressBar(progress.percent, misc.formatTime(estimatedRemainingTime))
                        })
                        .save(outputPath)

                        videoSaved = true
                    })
                }

                if(!videoSaved){
                    fs.writeFileSync(path.join(savePath, videoSave), videoBuffer)
                    videoSaved = true
                }

                let manifest = new Project.Manifest(title.value, description.value, "icon.png")
                manifest.setWallpaper(videoSave, "icon.png")
                fs.writeFileSync(path.join(savePath, "manifest.json"), JSON.stringify(manifest))
                resolve()
            })

            document.getElementById("make-save").onclick = async ()=>{
                await save()
                display("main")
            }

            document.getElementById("make-export").onclick = async()=>{
                await save()

                const {filePath} = await ipcRenderer.invoke("saveDialog", "Enregistrer", title.value + ".crx")

                if (filePath) {
                    display("loading", "Compilation des fichiers...")
                    const ext = new crx({
                        rootDirectory: path.join("save", title.value),
                        privateKey: fs.readFileSync(path.join(__dirname,"key.pem"))
                    })

                    ext.load()
                    .then(crx => crx.pack())
                    .then(crxBuffer => {
                        fs.writeFileSync(filePath, crxBuffer);
                        shell.showItemInFolder(filePath)
                        display("loading", "✅ Opération réussie")
                        setTimeout(()=>{
                            display("main")
                        },1000)
                    })
                }
            } */
        })

        display("wallpapers")
    })

    searchWallpapers(search.value)

    return wallpapers
}

let primaryColor = document.getElementById("theme-gx_accent")
let secondaryColor = document.getElementById("theme-gx_secondary_base")
primaryColor.addEventListener("input", updateColors)
secondaryColor.addEventListener("input", updateColors)

let makePreview = document.getElementById("make-preview-images")
makePreview.onclick = () => makePreview.classList.toggle("zoom")

function selectWallapaper(callback){
    let nextButton = document.getElementById("wallpapers-next")
    nextButton.style.visibility = "hidden"
    let selectedWallapaper = null

    displayWallapers((wallpaper, wallpaperBox) => {
        document.querySelectorAll("#wallpapers-container .wallpaper-preview").forEach(el => {
            el.classList.remove("checked")
        })

        if(wallpaper != selectedWallapaper){
            selectedWallapaper = wallpaper
            wallpaperBox.classList.add("checked")
        }else{
            selectedWallapaper = null
        }

        nextButton.style.visibility = selectedWallapaper ? "visible" : "hidden"
        nextButton.innerHTML = `Continuer avec <span>${wallpaper.title}</span> <i class="fa-solid fa-arrow-right"></i>`
    })

    nextButton.onclick = () => {
        if(selectedWallapaper){
            callback(selectedWallapaper)
        }else{
            throw "Please select a wallpaper"
        }
    }

    document.getElementById("wallpapers-cancel").onclick = () => display("projects")
}


/**
 * @param {Project} project 
*/
function displayMaking(project){
    display("make")
    const title = document.querySelector("#make-title .title")
    const description = document.querySelector("#make-title .description")

    project.open(title, description)
    document.getElementById("make-cancel").onclick = () => {
        display("projects")
    }

    document.getElementById("make-save").onclick = () => {
        project.rename(title.value)

        let themes = {light:{}, dark:{}}
        
        for(let colorType of ["gx_accent", "gx_secondary_base"]){
            let colorSelect = document.getElementById("theme-"+colorType)
            let color = hexToHSL(colorSelect.value)
            themes.light[colorType] = color
            themes.dark[colorType] = color
        }

        project.manifest.setMods({themes})

        project.save()

        display("projects")
    }
}

async function newProjectFromWallapaper(wallpaper, name = null){
    try{
        let project = await Project.createFromWallpaper(wallpaper, name)
        displayMaking(project)
        display("make")
        document.getElementById("make-cancel").onclick = () => {
            project.delete()
            display("projects")
        }
    }catch(err){
        showDialog(err + " : ", [
            {
                text: '<i class="fa-solid fa-arrow-rotate-left"></i> Réessayer avec un nouveau nom',
                style: "background: var(--warnColor)",
                action: () => {
                    showDialog("Nouveau nom : ", [
                        {
                            text: '<i class="fa-solid fa-check"></i> Ok',
                            style: "background: var(--green)",
                            action: () => {
                                newProjectFromWallapaper(wallpaper, (document.querySelector("dialog input")).value)
                            }
                        },
                        {
                            text: '<i class="fa-solid fa-xmark"></i> Annuler',
                        }
                    ], "input", wallpaper.title)
                }
            },
            {
                text: '<i class="fa-solid fa-xmark"></i> Annuler',
            }
        ], "err")
    }
}

function displayProjects(){
    const projects = Project.list();
    let projectsDiv = document.getElementById("projects-container")
    projectsDiv.innerHTML = ""
    projects.forEach(projectName => {
        let project = Project.read(projectName)
        let projectBox = project.htmlPreview()
        projectsDiv.appendChild(projectBox)
        projectBox.onclick = () => {
            displayMaking(project)
        }

        addRightClick(projectBox, [
            {
                text: '<i class="fa-solid fa-pen-to-square"></i> Renommer',
                action: () => {
                    showDialog(`Renommer ${project.name}`, [
                        {
                            text: '<i class="fa-solid fa-check"></i> Ok',
                            style: "background: var(--green);",
                            action: () => {
                                try{
                                    project.rename(document.querySelector("dialog input").value)
                                }catch(error){
                                    showDialog(error, [], "error")
                                }
                                display("projects")
                            }
                        },
                        {
                            text: '<i class="fa-solid fa-xmark"></i> Annuler'
                        }
                    ], "input", project.name)
                }
            },
            {
                text:'<i class="fa-solid fa-trash"></i> Supprimer',
                style: "color: var(--red);",
                action: () => {
                    showDialog(`Êtes-vous sûr de vouloir supprimer le projet : ${project.name}`, [
                        {
                            text: '<i class="fa-solid fa-trash"></i> Oui',
                            style: "background: red;",
                            action: () => {
                                project.delete()
                                display("projects")
                            }
                        },
                        {
                            text: '<i class="fa-solid fa-xmark"></i> Non'
                        }
                    ])
                }
            },
        ])
    })

    let newProject = document.createElement("button")
    newProject.id = "new-project"
    newProject.classList.add("wallpaper-preview")
    newProject.style.alignItems = "center"
    newProject.innerHTML = '<i class="fa-solid fa-plus" style="color: var(--green);"></i>'
    newProject.onclick = () => {
        selectWallapaper(async (wallpaper)=>{
            newProjectFromWallapaper(wallpaper)
        })
    }

    projectsDiv.appendChild(newProject)
}

display("projects")