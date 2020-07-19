import CONFIG from '../../conf/conf';


function ajaxGet(url, handler) {
    let req = new XMLHttpRequest();
    req.addEventListener('load', handler);
    req.open("get", url);
    req.responseType = 'json';
    req.send();
}


export function receiveParameters() {

}
