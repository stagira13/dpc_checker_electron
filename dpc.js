"use strict";


const electron = require("electron");

// アプリケーションをコントロールするモジュール
const app = electron.app;

// ウィンドウを作成するモジュール
const BrowserWindow = electron.BrowserWindow;

// メインウィンドウはGCされないようにグローバル宣言
let mainWindow;

// 全てのウィンドウが閉じたら終了
app.on('window-all-closed', function() {
  if (process.platform != 'darwin') {
    app.quit();
  }
});

var express = require('express');
var ejs = require("ejs");
var tableify = require('tableify');


var webapp = express();
var bb = require('express-busboy');
bb.extend(webapp,{
  upload: true,
  path: './tmp'
});

//bodypaererの設定。これでtmpに自動でアップロード出来るはず

webapp.engine('ejs',ejs.renderFile);

var sqlite3 = require('sqlite3').verbose();
var fs = require('fs'),
    parse = require('csv-parse');

webapp.use('/static',express.static('./static'));

var queryname = fs.readdirSync('./query');
// .txtつきのリストになります
var querys = {};
queryname.forEach((i)=> {querys[i] = fs.readFileSync('./query/' + i,'utf8')})
//utf8指定するとstringになるが、そうでないとbufferになる

const exec = require('child_process').exec;
const iconv = require('iconv-lite');
const json2csv = require('json2csv');
const dash_querys = require('./dashdata')



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

webapp.get("/",function(req,res){
    res.render('index.ejs');
});




webapp.get('/query', function (req, res) {
  let db = new sqlite3.Database('dpc.db');
  let query = querys['test2.txt'];
  db.all(query, function (err, rows) {
      let rowst = tableify(rows);
      res.render('query.ejs',{query_data:rowst,queryname:queryname,
        s_queryname:'test2.txt',linktext:""});
    });
  db.close();
});

//空白文字はレンダリングされない。ダウンロードは、うーん。webapp.get(/csv)とか作って、static fileを
//req.download(filename)で返すのが簡単かもなあ


webapp.post('/query', function (req, res) {
  let db = new sqlite3.Database('dpc.db');
  console.log(req.body.q1);
  let selected = req.body.q1;
  let query = querys[selected];
  db.all(query, function (err, rows) {
      let rowst = tableify(rows);
      let fields = Object.keys(rows[0]);
      let csv = json2csv({data : rows,fields : fields});
      fs.writeFileSync("./tmp/out.csv",csv);
      res.render('query.ejs',{query_data:rowst,queryname:queryname,
        s_queryname:selected,linktext:"CSVダウンロード"});
    });
  db.close();
});


webapp.get('/csv',(req,res) => {
  res.download("./tmp/out.csv")
})


//元がutf8じゃないと読み込みが上手く行かない。nodeはsjis扱うのにライブラリ必須っぽい

webapp.post('/importd',(req,res) => {
  console.log(req.files)
  let oldFile = "./" + req.files.dfile.file;
  fs.readFile(req.files.dfile.file, function (err, data) {
  let newPath = "./tmp/DRGD.txt";
  let buf = new Buffer(data,'binary');
  let newData = iconv.decode(buf,"Shift-JIS");
  fs.writeFile(newPath, newData,'utf8', function (err) {
    fs.unlinkSync(oldFile);
    fs.rmdirSync("./tmp/" + req.files.dfile.uuid + "/dfile" );
    fs.rmdirSync("./tmp/" + req.files.dfile.uuid);
    exec('sqlite3.exe dpc.db < importd.sql');
    res.redirect('/');
    });
  });
});


webapp.post('/importe',(req,res) => {
  console.log(req.files)
  let oldFile ="./" + req.files.efile.file;
  fs.readFile(req.files.efile.file, function (err, data) {
  let newPath = "./tmp/DRGEF.txt";
  let buf = new Buffer(data,'binary');
  let newData = iconv.decode(buf,"Shift-JIS");
  fs.writeFile(newPath, newData,'utf8', function (err) {
    fs.unlinkSync(oldFile);
    fs.rmdirSync("./tmp/" + req.files.efile.uuid + "/efile" );
    fs.rmdirSync("./tmp/" + req.files.efile.uuid);
    exec('sqlite3.exe dpc.db < importe.sql');
    res.redirect('/');
    });
  });
});



//importについてはbodyparser頼み。受け取ったファイルは速やかにリネームしておく。
//rmdirとunlinkを繰り返すことになる

webapp.post('/delete', function (req, res) {
  let delfile = req.body.t1;
  console.log(delfile);
  let db = new sqlite3.Database('dpc.db');
  switch (delfile) {
    case 'dtable':
      db.run('DELETE FROM dtable',(err) => {
        db.close();
      res.redirect('/');
      });
      break;

    case 'etable':
      db.run('DELETE FROM etable',(err) => {
        db.close();
      res.redirect('/');
      });
      break;

  }
});


app.get('/getdata',(req,res) => {
  let db = new sqlite3.Database('dpc.db');
  let query = dash_querys[req.query.key];
  db.all(query,(err,rows) => {
    res.json(rows);
  })
  db.close();
})

app.get("/dash",function(req,res){
    res.render('board.ejs');
});


var server = webapp.listen(3000,function(){
    console.log('Server is runnnig');
  });


// Electronの初期化完了後に実行
app.on('ready', function() {
  // メイン画面の表示。ウィンドウの幅、高さを指定できる
  mainWindow = new BrowserWindow({width: 1200, height: 800});
  mainWindow.loadURL('http://localhost:3000');

  // ウィンドウが閉じられたらアプリも終了
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});