/*http路由分发
接口模式server/:app/:api
*/

var _rotr = {};

//http请求的路由控制
_rotr = new $router();

//访问的请求
_rotr.get('api', '/api/:apiname', apihandler);
_rotr.post('api', '/api/:apiname', apihandler);

/*所有api处理函数都收集到这里
必须是返回promise
各个api处理函数用promise衔接,return传递ctx
*/
_rotr.apis = {};

/*处理Api请求
默认tenk的api直接使用
每个app的独立api格式appname_apiname
*/
function* apihandler(next) {
    var ctx = this;
    var apinm = ctx.params.apiname;

    console.log('API RECV:', apinm);

    //创建xdat用来传递共享数据
    ctx.xdat = {
        apiName: apinm
    };

    //匹配到路由函数,路由函数异常自动返回错误
    var apifn = _rotr.apis[apinm];

    if (apifn && apifn.constructor == Function) {
        yield apifn.call(ctx, next).then(null, function (err) {
            ctx.body = __newMsg(__errCode.APIERR, [err.message, 'API proc failed:' + apinm + '.']);
            __errhdlr(err);
        });
    } else {
        ctx.body = __newMsg(__errCode.NOTFOUND, ['服务端找不到接口程序', 'API miss:' + apinm + '.']);
    };

    yield next;
};

/*测试接口,返回请求的数据
 */
_rotr.apis.test = function () {
    var ctx = this;
    var co = $co(function* () {

        var resdat = {
            query: ctx.query.nick,
            body: ctx.body,
        };

        ctx.body = __newMsg(1, 'ok', {
            res: resdat,
            ctx: ctx,
        });
        return ctx;
    });
    return co;
};

/*测试接口,返回请求的数据
 */
_rotr.apis.test2 = function () {
    var ctx = this;
    var co = $co(function* () {

        var code = Math.random().toString().substr(2, 8);
        var exp = new Date().getTime() + 60000;

        //生成token
        var payload = {
            tel: '13405045537',
            params: [String(code), '5'],
            tpl_id: 4243,
            exp: exp,
        };

        var dat = {
            jwt_access_token: $jwt.encode(payload, _xcfg.sms.secret),
        };

        var opt = {
            //            hostname: '121.41.41.46',//test
            //            hostname: '120.55.90.62',//
            //            port: 4003,
            hostname: 'sms.xmgc360.com',
            port: 80,
            path: '/api/send',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        var res = yield _fns.httpReqPrms(opt, dat);
        res = JSON.safeParse(res.body);

        if (res.result != 0) throw Error('发送失败:' + res.errmsg);

        ctx.body = __newMsg(1, 'ok');
        return ctx;
    });
    return co;
};




//导出模块
module.exports = _rotr;
