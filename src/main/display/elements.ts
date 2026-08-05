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
let shiftSpell = document.getElementById("shift_spell");
let flatnessButton = document.getElementById("show_flatness");
let sedimentationButton = document.getElementById("show_sedimentation");
let godPrecipButton = document.getElementById("god_precipitation");
let godAltitudeButton = document.getElementById("god_altitude");
let godSize = document.getElementById("god_size") as HTMLInputElement;
let godAmplitude = document.getElementById("god_amplitude") as HTMLInputElement;
let godSizeValue = document.getElementById("god_size_value");
let godAmplitudeValue = document.getElementById("god_amplitude_value");

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
        shiftButton: shiftSpell,
        earthquakeButton: document.getElementById("earthquake"),
        flatnessButton: flatnessButton,
        sedimentationButton: sedimentationButton,
        godPrecipButton: godPrecipButton,
        godAltitudeButton: godAltitudeButton,
        godSize: godSize,
        godAmplitude: godAmplitude,
        godSizeValue: godSizeValue,
        godAmplitudeValue: godAmplitudeValue,
    },
}
export default elements;
