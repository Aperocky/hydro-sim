// Export a map of frontend elements

let mapspace = document.getElementById("mapspace");
let loadButton = document.getElementById("reload");

let elements = {
    mapSpace: mapspace,
    buttons: {
        loadButton: loadButton,
    },
}
export default elements;
