/*专为其他App提供后端服务，如文件存储服务（qiniu）
 */
var _app = global._app = {};
_app.hostPort = 8000;

//外部库引入
var $http = global.$http = require('http');
var $https = global.$https = require('https');
var $fs = global.$fs = require('fs');
var $path = global.$path = require('path');
var $co = global.$co = require('co');
var $koa = global.$koa = require('koa');
var $router = global.$router = require('koa-router');
var $bodyParser = global.$bodyParser = require('koa-bodyparser');
var $cookie = global.$cookie = require('cookie');
var $crypto = global.$crypto = require('crypto');
var $mailer = global.$mailer = require('nodemailer');
var $redis = global.$redis = require('redis');
var $mongoose = global.$mongoose = require('mongoose');
var $uuid = global.$uuid = require('node-uuid');
var $sktio = global.$sktio = require('socket.io');
var $scaptcha = global.$scaptcha = require('svg-captcha');
var $qiniu = global.$qiniu = require('qiniu');
var $jwt = global.$jwt = require('jwt-simple');
//var $moment = global.$moment = require('moment');
//var $cors = global.$cors = require('koa-cors');

//自定义库引入
global._xcfg = require('../jieminuo_xcfg.js');
global._mime = require('./my_modules/mime.js');
global._ctnu = require('./my_modules/ctnu.js');
global._cfg = require('./my_modules/cfg.js');
global._fns = require('./my_modules/fns.js');
global._mdwr = require('./my_modules/mdwr.js');
global._ndwr = require('./my_modules/ndwr.js');
global._rotr = require('./my_modules/rotr.js');
global._rds = require('./my_modules/rds.js');
global._mngs = require('./my_modules/mngs.js');
global._captcha = require('./my_modules/captcha.js');
global._qn = require('./my_modules/qn.js');

//功能模块引入
global._account = require('./my_modules/account.js');
global._pie = require('./my_modules/pie.js');
global._ext = require('./my_modules/ext.js');
global._share = require('./my_modules/share.js');

//服务器对象
var koaSvr = _app.koaSvr = $koa();
var httpSvr = _app.httpSvr = $http.createServer(koaSvr.callback());

//https服务器
var httpsOpt = {
    key: $fs.readFileSync(__path + '/conf/ssl/privatekey.pem'),
    cert: $fs.readFileSync(__path + '/conf/ssl/certificate.pem')
};
var httpsSvr = _app.httpsSvr = $https.createServer(httpsOpt, koaSvr.callback());
//httpSvr =httpsSvr;

/*读取外部xcfg文件写入_xfg全局参数
 */

$co(function* () {
    _app.httpSvr.listen(_app.hostPort);
    yield _qn.startPrms();
    _rds.start();
    yield _mngs.startPrms();
    __infohdlr('Http server is running on:' + _app.hostPort);
    __infohdlr('------', new Date(), '------');
});




/*使用body解析器
 */
koaSvr.use($bodyParser({
    onerror: function (err, ctx) {
        ctx.request.body = undefined;
        __errhdlr(err);
    }
}));



/*跨域，改为jsonp单个接口控制
koaSvr.use($cors({
    origin: 'http://files.10knet.com',
    credentials: true,
}));
*/

/*http请求中间件
 */
koaSvr.use(_mdwr);


/*http请求的路由控制
 */
koaSvr.use(_rotr.routes());


/*http请求收尾件
 */
koaSvr.use(_ndwr);





//test



//console.log('>>>>ukey',__uuid());;

//console.log('>>>toUTCString',new Date((new Date()).getTime() + _cfg.dur.browserUkey).toUTCString());



//
