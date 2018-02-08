'use strict';
const electron = require('electron');
const app = electron.app;
var BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain;

var sqlite3 = require('sqlite3').verbose();


const getSqlData = function(query) {
  return new Promise(function (resolve, reject) {
    let db = new sqlite3.Database('dpc.db');
    db.all(query,(err,rows) => {
      resolve(rows)
    });
  })};

ipc.on('query_selected', function(event, arg) {
    getSqlData(arg).then((result) => {event.sender.send('got_data',result)});
  });
  



var db = new sqlite3.Database('dpc.db');

db.serialize(function () {
 db.run('CREATE TABLE IF NOT EXISTS dtable(施設番号 integer, \
データ識別番号 integer,退院年月日 text, \
入院年月日 text,データ区分 integer, \
順序番号 integer,点数マスタコード integer, \
レセ電算処理コード integer,解釈番号 text, \
診療行為名称 text,行為点数 real, 行為薬剤料 real,行為材料料 real,円点区分 integer, \
行為回数 real,保険者番号 text,レセプト種別コード text,実施年月日 text, \
レセプト科区分 text,診療科区分 text, \
医師コード text,病棟コード text,病棟区分 text,入外区分 text,施設タイプ text, \
算定開始日 text,算定終了日 text,算定起算日 text,分類番号 text,医療機関係数 real)');

db.run('CREATE TABLE IF NOT EXISTS etable(施設コード integer,データ識別番号 integer, \
退院年月日 text,入院年月日 text,データ区分 real,順序番号 real,行為明細番号 integer,病院点数マスタコード real, \
レセプト電算コード real,解釈番号 text,診療明細名称 text,使用量 real,基準単位 real,明細点数・金額 real,\
円点区分 integer,出来高実績点数 real,行為明細区分情報 text,行為点数 real,行為薬剤料 real, \
行為材料料 real,行為回数 real,保険者番号 real, \
レセプト種別コード real,実施年月日 text,レセプト科区分 real,診療科区分 real, \
医師コード text,病棟コード real,病棟区分 real,入外区分 text, \
施設タイプ text)');

});

db.close();

var mainWindow = null;

app.on('window-all-closed', function() {
  if (process.platform != 'darwin')
    app.quit();
});


app.on('ready', function() {

  // ブラウザ(Chromium)の起動, 初期画面のロード
  mainWindow = new BrowserWindow({width: 800, height: 600});
  mainWindow.loadURL('file://' + __dirname + '/index.html');

  mainWindow.webContents.on('did-finish-load', function(){
    console.log("window finish")
  });
  // mainWindow.webContents.openDevTools() デバッグ時オンにする

  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});