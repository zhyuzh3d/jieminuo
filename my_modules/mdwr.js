/*处理http请求进入路由之前的流程
如调整路径，检测用户user认证等
*/

var _mdwr = function* (next) {
    //可以在这里修改请求的路径或添加参数
    var ctx = this;

    //添加jsonp支持
    if (ctx.enableJsonp == true) {
        setforJsonp(ctx, ctx.jsonpDomains);
    };

    yield next;
};

/*兼容jsonp的处理程序
ctx,koa请求上下文
domains,只允许这些域名跨域，数组；默认为xcfg中的crossDomains域名
 */
function setforJsonp(ctx, domains) {
    if (!domains) domains = _xcfg.crossDomains;
    var allow = domains.indexOf(ctx.hostname);
    if (allow == -1) ctx.body = __newMsg(__errCode.JSONPERR, 'Jsonp error.');

    var jsonpCallback = ctx.query.callback || ctx.request.body.callback;
    if (jsonpCallback && ctx.body) {
        ctx.body = ctx.query.callback + '(' + JSON.stringify(ctx.body) + ')';
    };
};


//导出模块
module.exports = _mdwr;
