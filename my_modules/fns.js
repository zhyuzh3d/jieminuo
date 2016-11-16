/*扩展系统对象功能或者提供新功能
JSON.safeParse/JSON.sparse;
*/

var _fns = {};


//基础函数扩充---------------------------------------
/*扩展JSON.safeParse*/
JSON.safeParse = JSON.sparse = function (str) {
    try {
        return JSON.parse(str);
    } catch (err) {
        return undefined;
    };
};

/*扩展一个方法或对象*/
function extend(Child, Parent) {
    var F = function () {};
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.prototype.constructor = Child;
    Child.uber = Parent.prototype;
};


/*重新封装console的函数*/
var cnslPreStr = '>';
console.xerr = function () {
    var args = arguments;
    console.info(cnslPreStr, 'ERR:');
    console.error.apply(this, args);
};
console.xlog = function () {
    var args = arguments;
    console.info(cnslPreStr, 'LOG:');
    console.log.apply(this, args);
};
console.xinfo = function () {
    var args = arguments;
    console.info(cnslPreStr, 'INFO:');
    console.info.apply(this, args);
};
console.xwarn = function () {
    var args = arguments;
    console.info(cnslPreStr, 'WARN:');
    console.xwarn.apply(this, args);
};


/*专用err处理函数,适合co().then()使用*/
global.__errhdlr = __errhdlr;

function __errhdlr(err) {
    err.stack ? console.xerr(err.stack) : console.xerr(err);
};

/*专用空函数，只输出不做额外处理,适合co().then()使用*/
global.__nullhdlr = __nullhdlr;

function __nullhdlr(res) {};

/*专用空函数，只输出不做额外处理,适合co().then()使用*/
global.__infohdlr = __infohdlr;

function __infohdlr() {
    console.xinfo.apply(this, arguments);
};

/*专用空函数，只纪录日志不做额外处理,适合co().then()使用*/
global.__loghdlr = __loghdlr;

function __loghdlr() {
    console.xlog.apply(this, arguments);
};

/*生成不重复的key*/
global.__uuid = __uuid;

function __uuid() {
    return $uuid.v4();
};

/*md5加密
如果str为空，自动生成一个uuid
digest类型，hex默认,base64
*/
global.__md5 = __md5;

function __md5(str, dig) {
    if (!str) str = __uuid();
    if (!dig) dig = 'hex';
    return $crypto.createHash('md5').update(str).digest(dig)
};

/**
 * 检查是否是日期格式数据
 * @param   {object} o 被检查对象
 * @returns {boolean}   是否
 */
_fns.isDate = function (o) {
    return {}.toString.call(o) === "[object Date]" && o.toString() !== 'Invalid Date' && !isNaN(o);
};


/*sha1加密
如果str为空，自动生成一个uuid
digest类型，hex默认,base64
*/
global.__sha1 = __sha1;

function __sha1(str, dig) {
    if (!str) str = __uuid();
    if (!dig) dig = 'hex';
    return $crypto.createHash('md5').update(str).digest(dig)
};



/*生成标准的msg*/
global.__newMsg = __newMsg;

function __newMsg(code, text, data) {
    var info;
    if (text.constructor == Array) {
        if (text.length >= 2) {
            info = text[1];
        };
        text = text[0];
    };
    return {
        code: code,
        text: text,
        info: info,
        data: data,
        time: Number(new Date()),
    };
};


//重要函数------------------------------------
/*服务端向其他地址发起http请求的promise
成功执行resolvefn({headers:{...},body:'...'})
注意header的Content-Type可能导致不能post数据data，限定只能用地址栏参数
options应包含所有必需参数如hostname，port,method等等,例如
{
    hostname: 'rsf.qbox.me',
    port: 80,
    path: optpath,
    method: 'POST',
    headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': '',
    },
};
 */
_fns.httpReqPrms = httpReqPrms;

function httpReqPrms(options, bodydata, type) {
    var prms = new Promise(function (resolvefn, rejectfn) {

        //自动判断https或http
        var httpobj;
        if (type == 'https') {
            httpobj = $https;
        } else {
            httpobj = $http;
        };

        var str;
        if (bodydata) {
            var str = JSON.stringify(bodydata);
            if (options && options.headers) {
                options.headers['Content-Length'] = str.length;
            };
        };

        var req = httpobj.request(options, (res) => {
            if (res.statusCode != 200) {
                rejectfn(new Error('Target server return err:' + res.statusCode));
            } else {
                res.setEncoding('utf8');
                var dat = {
                    headers: res.headers,
                    body: '',
                };
                res.on('data', (dt) => {
                    dat.body += dt;
                });
                res.on('end', () => {
                    resolvefn(dat);
                })
            };
        });

        req.on('error', (e) => {
            rejectfn(new Error('Request failed:' + e.message));
        });

        if (str) req.write(str);

        req.end();
    });

    return prms;
};

/*向指定目标发送一封邮件
默认以_xcfg.serMail.addr为发送邮箱
*/
var mailTransPort = $mailer.createTransport({
    host: _xcfg.serMail.host,
    port: _xcfg.serMail.port,
    auth: {
        user: _xcfg.serMail.addr,
        pass: _xcfg.serMail.pw,
    },
});

/*可以使用其它传输器，默认为serMail
 */
_fns.sendMail = sendMail;

function sendMail(tarmail, tit, cont) {
    var prms = new Promise(function (resolvefn, rejectfn, transport) {
        if (!transport) transport = mailTransPort;
        transport.sendMail({
            from: 'jscodepie servicegroup<' + _xcfg.serMail.addr + '>',
            to: tarmail,
            subject: tit,
            html: cont
        }, function (err, res) {
            (err) ? rejectfn(err): resolvefn(res);
        });
    });
    return prms;
};


/**
 * 函数，通过request请求获取uid
 * @param   {ctx} ctx请求的上下文
 * @returns {uid} 用户的id
 */
_fns.getUidByCtx = function (ctx, unThrowErr) {
    var co = $co(function* () {

        //通过cookie从主服务器获取uid
        var ukey = ctx.cookies.get('m_ukey');
        if (!ukey || !_cfg.regx.ukey.test(ukey)) {
            if (unThrowErr) {
                return undefined;
            } else {
                throw Error('您还没有注册和登陆');
            };
        };

        //登陆情况，读取用户id
        var mpkey = _rds.k.map_ukey2uid;
        var uid = yield _ctnu([_rds.cli, 'hget'], _rds.k.map_ukey2uid, ukey);

        //未登录情况,清除ukey并返回错误
        if (!uid) {
            ukey = undefined;
            ctx.cookies.set('m_ukey', ukey, {
                httpOnly: true,
                expires: new Date((new Date()).getTime() + _cfg.dur.browserUkey),
            });

            if (unThrowErr) {
                return undefined;
            } else {
                throw Error('错误或无效的登录信息，请您手工登陆或注册.')
            };
        };

        return uid;
    });
    return co;
};

/**
 * 将一个数组转化为对象
 * @param   {array}   arr    需要转换的数组
 * @param   {boolean} keyval 是否是[key,val,key,val]模式,默认为真,keyobj转换为'key':{'key':key,'val':val}
 * @returns {Object}   转换结果，可能是空对象
 */

_fns.arr2obj = function (arr, keyval, keyobj) {
    if (keyval === undefined) keyval = true;
    var res = {};
    if (!arr || !Array.isArray(arr)) return res;
    if (!keyval) {
        for (var i = 0; i < arr.length; i++) {
            res[String(i)] = arr[i];
        };
    } else {
        for (var i = 0; i < arr.length; i += 2) {
            if ((i + 1) < arr.length) {
                if (keyobj) {
                    res[String(arr[i])] = {
                        key: String(arr[i]),
                        val: arr[i + 1]
                    };
                } else {
                    res[String(arr[i])] = arr[i + 1];
                }
            };
        };
    };
    return res;
}









//导出模块
module.exports = _fns;
