//Format Time
{
    var padZero = function(number) {
        return number.toString().padStart(2, '0');
    }

    var formatTime = function(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = Math.floor(seconds % 60);

        return `${padZero(hours)}:${padZero(minutes)}:${padZero(remainingSeconds)}`;
    }
}

//Sharp
{
    //Resize Square Image
    const sharp = require('sharp');
    var resizeSquareImage = (inputPath, outputPath, size, cb) => {
        sharp(inputPath)
        .resize(size, size)
        .toFile(outputPath, (err) => {
            if (err) {
                throw err
            }else if(cb){
                cb(outputPath)
            }
        });
    }
}

//Clone Template
function cloneTemplate(templateId){
    let template = document.getElementById(templateId)
    let clone = template.content.firstElementChild.cloneNode(true)
    return clone
}

//Hex to HSL
function hexToHSL(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);

    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;

    if (max == min){
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        
        h /= 6;
    }

    h = Math.round(h*360);
    s = Math.round(s*100);
    l = Math.round(l*100);

    return { h, s, l };
}

function hslToHex(color) {
    let {h,s,l} = color
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');   // convert to Hex and prefix "0" if needed
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  }

function hslToCSSFilter(color){
    return `hue-rotate(${color.h}deg) saturate(${color.s}%) brightness(${color.l+50}%)`;
}

//Max Threads
const os = require('os');
const maxThreads = os.cpus().length - 1;

function updateColors(){
    let primaryColor = document.getElementById("theme-gx_accent")
    let secondaryColor = document.getElementById("theme-gx_secondary_base")
    
    let primary = hexToHSL(primaryColor.value)
    let secondary = hexToHSL(secondaryColor.value)
    primary.l += 50
    secondary.l += 80
    
    document.querySelector('img[src="preview-filter/primary.png"]').style.filter = hslToCSSFilter(primary)
    document.querySelector('img[src="preview-filter/secondary1.png"]').style.filter = hslToCSSFilter(secondary)
    secondary.l -= 25
    document.querySelector('img[src="preview-filter/secondary2.png"]').style.filter = hslToCSSFilter(secondary)
    secondary.l -= 15
    document.querySelector('img[src="preview-filter/secondary3.png"]').style.filter = hslToCSSFilter(secondary)
}

module.exports = {
    hexToHSL,
    hslToHex,
    hslToCSSFilter,
    cloneTemplate,
    formatTime,
    resizeSquareImage,
    updateColors,
    maxThreads,
}