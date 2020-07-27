import CONFIG from '../../../conf/conf';


declare function require(name:string);
const fetch = require('node-fetch');


async function getMatrix(url, name) {
    let response = await fetch(url);
    let data = await response.json();
    let matrix = data["matrix"];
    console.log(`${name} MIN: ${data["min"]}`);
    console.log(`${name} MAX: ${data["max"]}`);
    console.log(`${name} MEAN: ${data["mean"]}`);
    return matrix;
}


export async function getData(size) {
    let altitude: number[][];
    let precip: number[][];
    altitude = await callNumpy(size, 250, 0.1, "ALTITUDE", 1);
    precip = await callNumpy(size, 20, 1, "PRECIPITATION", 2);
    return {
        "altitude": altitude,
        "precip": precip,
    };
}


async function callNumpy(size, reps, min_feature, name, baseline) {
    let base_url = CONFIG['local_url'];
    let args_str = `size=${size}&reps=${reps}&min_feature=${min_feature}&baseline=${baseline}`;
    let url = `${base_url}?${args_str}`;
    let matrix = await getMatrix(url, name);
    return matrix;
}


//
// None-async former functions - deprecated
//

//function getResult(response, matrix, name): void {
//    matrix = response["matrix"];
//    console.log(`${name} MIN: ${response["min"]}`);
//    console.log(`${name} MAX: ${response["max"]}`);
//    console.log(`${name} MEAN: ${response["mean"]}`);
//}
//
//
//function ajaxGet(url, handler) {
//    let req = new XMLHttpRequest();
//    req.addEventListener('load', handler);
//    req.open("get", url, false);
//    req.responseType = 'json';
//    req.send();
//}
//
