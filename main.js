var express = require("express");
var multer = require('multer');
var crypto = require('crypto');
var app = express();
var util = require("util");
var fs = require("fs");

var rmDir = function(dirPath) {
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { return; }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath);
    }
  fs.rmdirSync(dirPath);
};

var mkdirSync = function (path) {
  try {
    fs.mkdirSync(path);
  } catch(e) {
    if ( e.code != 'EEXIST' ) throw e;
  }
}

rmDir(__dirname + "/uploads");
mkdirSync(__dirname + "/uploads");


app.get('/', function(req, res) {
    res.sendFile(__dirname + "/index.html");
});
app.use('/download', express.static('uploads'));

app.use(function(req, res, next) {
    var oneof = false;
    if(req.headers.origin) {
        res.header('Access-Control-Allow-Origin', req.headers.origin);
        oneof = true;
    }
    if(req.headers['access-control-request-method']) {
        res.header('Access-Control-Allow-Methods', req.headers['access-control-request-method']);
        oneof = true;
    }
    if(req.headers['access-control-request-headers']) {
        res.header('Access-Control-Allow-Headers', req.headers['access-control-request-headers']);
        oneof = true;
    }
    if(oneof) {
        res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
    }

    // intercept OPTIONS method
    if (oneof && req.method == 'OPTIONS') {
        res.send(200);
    }
    else {
        next();
    }
});

GLOBAL.del = function(imgName) {
    fs.unlinkSync(__dirname + "/uploads/" + imgName);
}

app.post('/upload', function(req, res) {


    var name = util.inspect(req) + Date.now();
    name = crypto.createHash('md5').update(name).digest("hex");
    var upload = multer({
        storage: multer.diskStorage({
        destination: function(req, file, callback) {
            callback(null, './uploads');
        },
        filename: function(req, file, callback) {
            console.log(JSON.stringify(file));
            callback(null, name);
        }
    })
    }).single("image");
    upload(req, res, function(err, url) {
        if (err) {
            console.log(err);
            return res.end(JSON.stringify({success: false}));
        }
        var expiryTime = 30 * 1000;
        res.end(JSON.stringify({success: true, name: name, totalLife: expiryTime }));
        setTimeout(function() {del(name);}, expiryTime);
    });
});
var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
    console.log("Working on port " + port);
});