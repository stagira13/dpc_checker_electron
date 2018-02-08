'use strict';

const electron = require('electron');
const remote = electron.remote;
const ipc = electron.ipcRenderer;
const path = require("path");

const Vue = require("vue/dist/vue.js");
const VueRouter = require("vue-router");
const Vuetify = require('vuetify').default;
const {dialog} = require('electron').remote
const exec = require('child_process').exec;
const json2csv = require('json2csv');


const sqlite3 = require('sqlite3').verbose();


const fs = require('fs');

var win = remote.getCurrentWindow();
const iconv = require("iconv-lite");


Vue.use(Vuetify)

Vue.use(VueRouter)

const jisToUtf = (filename,savename) => {
fs.createReadStream(filename)
.pipe(iconv.decodeStream('Shift_JIS'))
.pipe(iconv.encodeStream('utf8'))
.pipe(fs.createWriteStream(savename)) 
}

const createHeaders = (rows) => {
  let headers = Object.keys(rows[0])
  let arr = []
  headers.forEach((item) => {arr.push(
    {text:item, value:item})})
  return arr
}

let queryname = fs.readdirSync('./query');
let querys = {};
queryname.forEach((name)=> {querys[name] = fs.readFileSync('./query/' + name,'utf8')})
//あとでlodashで書き直したい…




const titletop = {
template: '<v-container fluid> \
        <h2>データ登録画面</h2> \
        <p>この画面ではデータの登録を行います。提出用のDファイル／EF統合ファイルを用意して下さい。</p> \
        <p>現在のバージョンでは、単月取り込みにのみ対応します。月ごとにデータ削除を行い、</p> \
        <p>削除後に最新データの取り込みを行って下さい。</p> \
    </v-container> ',
    methods:{
      getdata: function() {
        ipc.send('query_selected','Select distinct 実施年月日 from dtable limit 2;')
        ipc.on('got_data',(args,data) => {
          console.log(data)
        })
      }
    }
}

const importfile = {
  template: '<v-container fluid> \
  <h1>データの登録</h1> \
  <v-btn color="primary" v-on:click.prevent="importd">Dファイル登録</v-btn> \
  <v-btn color="primary" v-on:click.prevent="importe">EFファイル登録</v-btn> \
  <br>\
  <p> {{progress}} </p> \
  </v-container>',
  methods:{
    importd: function() {
      this.progress = "インポート中"
      dialog.showOpenDialog (win, {filters: [{name: 'All Files', extensions: ['*']}],
      properties:['openFile']},
      (filename) => {console.log(filename[0]); //opendialogは複数ファイル選択を前提するので、0index指定
      jisToUtf(filename[0],'DRGD.txt')
      exec('sqlite3.exe dpc.db < importd.sql',(error, stdout, stderr) => {
        console.log(error,stdout,stderr)
      }
    );
      this.progress = "インポート終了"})
      // filenameはarrayになってる。filename[0]かな
    },
    importe: function() {
      this.progress = "インポート中"
      dialog.showOpenDialog (win, {filters: [{name: 'All Files', extensions: ['*']}],
      properties:['openFile']},
      (filename) => {console.log(filename[0]);
      jisToUtf(filename[0],'DRGEF.txt')
      exec('sqlite3.exe dpc.db < importe.sql');
      this.progress = "インポート終了"})
    }
  },
  data: function () {
    return {progress: ''}
  }
}

const deletefile = {
  template: '<v-container fluid> \
  <h1>データの削除</h1> \
  <v-btn color="primary" v-on:click.prevent="deleteD">Dファイル削除</v-btn> \
  <v-btn color="primary" v-on:click.prevent="deleteE">EFファイル削除</v-btn> \
  <br>\
  <p> {{progress}} </p> \
  </v-container>',
  methods: {
    deleteE: function() {
      this.progress = '削除中'
      let db = new sqlite3.Database('dpc.db');
      db.run('DELETE FROM dtable',(err) => {
        db.close();
        this.progress = "削除完了"
      })
    },
    deleteD: function() {
      this.progress = '削除中'
      let db = new sqlite3.Database('dpc.db');
      db.run('DELETE FROM etable',(err) => {
        db.close();
        this.progress = "削除完了" // successの処理に入れないとダメなのでは
      })
    }
  },
  data: function() {
    return {progress:''}
  }
}





const radiogroup = {
  template: '<v-container fluid> \
    <form> \
        <v-radio-group v-model="checked"> \
            <v-radio v-for="item in items" :label="item" :value="item" ></v-radio> \
            <br> \
        </v-radio-group> \
        <h2> {{checked}}</h2> \
        <v-btn color="primary" v-on:click.prevent="send">データ抽出</v-btn> \
      </form> \
</v-container>',
  data:function(){
    var checked = ""
    var items = queryname
    return {checked:checked,items:items}
  },
  methods:{
    send:function() {
      ipc.send('query_selected',querys[this.checked])     
    }
  }
}



const sqltable = {
  template: '<v-container fluid> \
  <v-btn v-show="csvflag" v-on:click.prevent="savecsv">CSVで保存する</v-btn> \
  <v-data-table \
      v-bind:headers="tmpdata.headers" \
      :items="tmpdata.items" \
      hide-actions \
      class="elevation-1" \
    > \
    <template slot="items" slot-scope="props"> \
      <td v-for="item in props.item" class="text-xs-right">{{item}}</td> \
    </template> \
  </v-data-table> \
</v-container> ',
data: function() {
  let csvflag = false
  var tmpdata = "n"
  ipc.on('got_data',(args,data) => {
    let headers = createHeaders(data)
    this.tmpdata = {headers:headers,items:data}
    this.csvflag = true
  })
  return {tmpdata:tmpdata,csvflag:csvflag}
},
methods: {
  savecsv: function () {
    let csvdata = json2csv({data : this.tmpdata.items,fields : this.tmpdata.headers})
    console.log(csvdata)
    dialog.showSaveDialog (win, {filters: [{name: 'Csv', extensions: ['.csv']}],
    properties:['saveFile']},
    (filename) => {console.log(filename);　//opendialogと違い、こっちは複数ファイルなど前提しない
    //fs.writeFile(filename,csvdata)
    let writer = fs.createWriteStream(filename);
    writer.write(iconv.encode(csvdata, "Shift_JIS"));
    writer.end();
  })
  }
}
}


const routes = [
  {path:'/',components: {
    default:titletop,
    importfile:importfile,
    deletefile:deletefile}},
  {path:'/table',components: {
    default:radiogroup,
    sqltable:sqltable
  }}
]

const router = new VueRouter({
  routes // `routes: routes` の短縮表記
})


var init_app = new Vue({
  router: router
  //el: '#app',
}).$mount('#app')

