// Get Cookie
export function getCookie(cname) {
    let name = cname + "="
    let ca = document.cookie.split(';')
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i]
        while (c.charAt(0) == ' ') c = c.substring(1)
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

// Set Length Display
export function setLengthDisplay(seconds) {
    const minuteCount = Math.floor(seconds / 60)
    const secondCount = seconds % 60

    return `${minuteCount.toString().padStart(2, "0")}:${secondCount.toString().padStart(2, "0")}`
}

// Capitalise the first letter, lowercase the rest
export const capitalise = text => text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()

// Sleep
export const delay = async time => new Promise(resolve => setTimeout(resolve, time))

// Apply HR / DT to a map's stats (the AR / OD formulas below are osu!'s own)
export function getModDetails(cs, ar, od, hp, bpm, len, mod) {
    const cap = value => Math.min(Math.round(value * 10) / 10, 10)

    if (mod.includes("HR")) {
        cs = cap(Number(cs) * 1.3)
        ar = cap(Number(ar) * 1.4)
        od = cap(Number(od) * 1.4)
        hp = cap(Number(hp) * 1.4)
    }
    if (mod.includes("DT")) {
        if (ar > 5) ar = Math.round((((1200 - (( 1200 - (ar - 5) * 150) * 2 / 3)) / 150) + 5) * 10) / 10
        else ar = Math.round((1800 - ((1800 - ar * 120) * 2 / 3)) / 120 * 10) / 10
        od = Math.round((79.5 - (( 79.5 - 6 * od) * 2 / 3)) / 6 * 10) / 10
        bpm = Math.round(bpm * 1.5)
        len = Math.round(len / 1.5)
    }

    return { cs, ar, od, hp, bpm, len, mod }
}