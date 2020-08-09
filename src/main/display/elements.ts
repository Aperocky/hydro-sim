// Export a map of frontend elements

let mapspace = document.getElementById("mapspace");
let console = document.getElementById("console");
let loadButton = document.getElementById("reload");
let runButton = document.getElementById("run");
let decadeButton = document.getElementById("decade");
let altButton = document.getElementById("show_alt");
let aquiferButton = document.getElementById("show_aquifer");
let floraButton = document.getElementById("show_flora");
let floraAlpha = document.getElementById("flora_alpha");
let precipButton = document.getElementById("show_precip");
let basinButton = document.getElementById("show_basin");
let wetSpell = document.getElementById("wet_spell");
let drySpell = document.getElementById("dry_spell");

let elements = {
    mapSpace: mapspace,
    console: console,
    buttons: {
        loadButton: loadButton,
        runButton: runButton,
        decadeButton: decadeButton,
        altButton: altButton,
        aquiferButton: aquiferButton,
        floraButton: floraButton,
        floraAlpha: floraAlpha,
        precipButton: precipButton,
        basinButton: basinButton,
        wetButton: wetSpell,
        dryButton: drySpell,
    },
}
export default elements;
