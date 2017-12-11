"use strict";


const electron = require("electron");
const remote = electron.remote;
const tableify = require('tableify');
const ipc = electron.ipcRenderer;


const btn = document.getElementById("btn");

btn.addEventListener('click', (e) => {
  ipc.send('query_selected', 'select * from dtable limit 10;')
});


ipc.on('got_data', (event, arg) => {
	console.log(arg);
	let table_data = tableify(arg);
	let elem = document.getElementById("query_data");
	elem.innerHTML = table_data;
}
