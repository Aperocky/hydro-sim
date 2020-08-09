// Export a map of frontend elements

let mapspace = document.getElementById("mapspace");
let console = document.getElementById("console");
let loadButton = document.getElementById("reload");
let runButton = document.getElementById("run");
let decadeButton = document.getElementById("decade");
let altButton = document.getElementById("show_alt");
let aquiferButton = document.getElementById("show_aquifer");
let precipButton = document.getElementById("show_precip");
let basinButton = document.getElementById("show_basin");

let elements = {
    mapSpace: mapspace,
    console: console,
    buttons: {
        loadButton: loadButton,
        runButton: runButton,
        decadeButton: decadeButton,
        altButton: altButton,
        aquiferButton: aquiferButton,
        precipButton: precipButton,
        basinButton: basinButton,
    },
}
export default elements;
