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
        var secret = yield _ctnu([_rds.cli, 'hget'], _rds.k.app(appId), 'wildDogAppSecret');
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


//导出模块
module.exports = _ext;
