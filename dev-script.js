// ==UserScript==
// @name         Gelbooru upgrade
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  Set of QOL features to make gelbooru more user-friendly
// @author       https://github.com/dummefil
// @match        https://gelbooru.com/*
// @grant        none
// ==/UserScript==

function addScript(url){
    var script = document.createElement('script');
    script.setAttribute('type','text/javascript');
    script.setAttribute('src',url);
    document.getElementsByTagName('head')[0].appendChild(script);
}
addScript('http://localhost:6868/index.js')
