/*pie的扩展功能
提供野狗账号认证功能等第三方功能接口
*/
var _ext = {};


/**
 * 支持JSONP，获取野狗账户系统自定义tonken，必须登录用户才能使用
 * 必须该App已经绑定了野狗App超级密钥才有效，有效期1个月
 * @param {} 根据用户发起请求的链接解析到app的name路径
 * @returns {...}
 */

_rotr.apis.ext_getWildDogCustomToken = function () {
    var ctx = this;
    ctx.enableJsonp = true;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        //获取appuid和appname
        var url = ctx.req.headers.referer.replace(/\/\//g, '/');
        var urlspilt = url.split('/');
        if (!urlspilt || urlspilt.length < 4) throw Error('非法的请求路径');
        var appUid = urlspilt[2];
        var appName = urlspilt[3];

        //从appuid用户的app列表获取appid
        var appId = yield _ctnu([_rds.cli, 'zscore'], _rds.k.usrApps(appUid), appName);
        if (!appId) throw Error('APP标识与作者不匹配');

        //获取野狗密钥,不能为空
        var secret = yield _ctnu([_rds.cli, 'hget'], _rds.k.appExt(appId), 'wildDogAppSecret');
        if (!secret && secret != '') throw Error('此APP尚未绑定野狗密钥');

        //生成token
        var payload = {
            "v": 1,
            "uid": uid,
            "iat": new Date().getTime(),
            "exp": new Date().getTime() + _cfg.dur.month,
        };

        var dat = $jwt.encode(payload, secret);

        //返回数据
        ctx.body = __newMsg(1, 'ok', dat);

        return ctx;
    });
    return co;
};


/**
 * 支持JSONP，代理转发接口，解析{{attrname}}替换为自定义变量
 * 必须变量全能匹配到
 * @param {} 根据用户发起请求的链接解析到app的name路径
 * @param {object}  opt http请求的option，只能使用地址栏参数，必须有host和path两个字段
 * @param {object}  data http请求的数据，只能使用地址栏参数，可选
 * @param {string}  type http或https
 * @returns {...}
 */

_rotr.apis.ext_httpProxy = function () {
    var ctx = this;
    ctx.enableJsonp = true;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        //获取选项设置
        var data = JSON.safeParse(decodeURIComponent(ctx.query.data));

        //根据路径获取appuid和appname
        var url = ctx.req.headers.referer.replace(/\/\//g, '/');
        var urlspilt = url.split('/');
        if (!urlspilt || urlspilt.length < 4) throw Error('非法的请求路径');
        var appUid = urlspilt[2];
        var appName = urlspilt[3];

        //从appuid用户的app列表获取appid
        var appId = yield _ctnu([_rds.cli, 'zscore'], _rds.k.usrApps(appUid), appName);
        if (!appId) throw Error('APP标识与作者不匹配');

        //获取自定义变量,不能为空
        var appext = yield _ctnu([_rds.cli, 'hgetall'], _rds.k.appExt(appId));
        if (!appext && appext != '') throw Error('此APP尚未包含自定义变量');

        //将data转为字符串，替换路径中的自定义变量，然后再转为obj
        var str = JSON.stringify(data);
        str = str.replace(/\{\{[\w]+\}\}/g, function (s) {
            s = s.replace(/\{/g, '');
            s = s.replace(/\}/g, '');
            if (!appext[s]) throw Error('自定义变量' + s + '找不到');
            return appext[s];
        });
        data = JSON.safeParse(str);
        if (!data) throw Error('提交数据处理失败');

        //提取opt
        var opt = data.opt;
        if (!opt || !opt.hostname || !opt.path) throw Error('选项和host，path都不能为空');

        //禁止代理访问jieminuoketang的接口
        if (/^[\w]+\.jieminuoketang\.com$/.test(opt.hostname)) throw Error('禁止请求杰米诺课堂接口');

        //补全opt的默认参数
        if (!opt.port) opt.port = 80;
        if (!opt.method) opt.method = 'GET';

        //提取请求方法
        var type = data.type;
        if (!type || (type != 'http' && type != 'https')) {
            type = 'http'
        };

        //发送数据
        var body = data.body;

        var res;
        if (body) {
            res = yield _fns.httpReqPrms(opt, body, type);
        } else {
            res = yield _fns.httpReqPrms(opt, type);
        };

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);

        return ctx;
    });
    return co;
};


//导出模块
module.exports = _ext;
