// Export a map of frontend elements

let mapspace = document.getElementById("mapspace");
let console = document.getElementById("console");
let loadButton = document.getElementById("reload");
let altButton = document.getElementById("show_alt");
let precipButton = document.getElementById("show_precip");
let basinButton = document.getElementById("show_basin");

let elements = {
    mapSpace: mapspace,
    console: console,
    buttons: {
        loadButton: loadButton,
        altButton: altButton,
        precipButton: precipButton,
        basinButton: basinButton,
    },
}
export default elements;
