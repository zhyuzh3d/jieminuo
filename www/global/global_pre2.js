//在所有脚本之前，jquery之后执行，比如检测登陆情况，需要jqeury支持
console.info('global_pre loading...');

if (!_global) var _global = {};

(function () {
    'use strict';

    //全局设置，所有的路径结尾都不带斜杠,自动匹配10knet和jieminuoketang
    if (/^\w*\.10knet\.com$/.test(location.host)) {
        _global.host = 'www.10knet.com';
        _global.hostUrl = 'http://www.10knet.com';
    } else if (/^\w*\.jieminuoketang\.com$/.test(location.host)) {
        _global.host = 'www.jieminuoketang.com';
        _global.hostUrl = 'http://www.jieminuoketang.com';
    }
    _global.apiPrefix = _global.hostUrl + '/api';

})();

(function () {
    'use strict';

    if (!jQuery) return;

    //修改标题
    $('title').html('杰米诺 | ' + $('title').html());


})();


(function () {
    'use strict';

    //如果没有jquery直接跳过
    if (!jQuery) return;

    //获取api路径
    _global.api = function (str) {
        return _global.apiPrefix + '/' + str;
    };

    //先检查是否登陆，没有登陆的话直接跳往登陆注册页面
    _global.chkLogin = function () {
        var api = _global.api('acc_getMyInfo');
        var dat = {};

        $.post(api, dat, function (res) {

            if (res.code == 1) {
                //已经登陆，把数据填充到用户
                _global.myUsrInfo = res.data;
                _global.hasLogin = true;
            } else {
                var jumptype = 2; //跳转类型,0不跳转，1直接跳转，2跳转到注册欢迎页面

                var indomain = (location.host == _global.host);
                var url = location.href.replace(/[\/]+/g, '/'); //去掉可能存在的双斜杠，http://也会变http:/
                var urlarr = url.split('/');

                if (indomain) {
                    //www域名下,mod模块名称
                    var modname = urlarr[2] || '';

                    //page参数名称
                    var pagestr = url.match(/page=[\w\d_]+/g) || [''];
                    var pagename = pagestr[0].split('=')[1];

                    //登陆页不跳转
                    var accnojump = ['acc_login', 'acc_register', 'acc_changePw', 'acc_temp'];
                    if (modname == 'account' && accnojump.indexOf(pagename) != -1) {
                        jumptype = 0;
                    };

                    //首页不跳转
                    var homeregx = /^(index[\.\d\w]*)*(\?[\d\w\_]*=[\d\w\_]*)*$/;
                    if (homeregx.test(modname)) jumptype = 0;
                } else {
                    //其他情况files域名下都采用弹窗提示，不强制注册
                    jumptype = 2;
                };

                if (jumptype == 1) {
                    //跳转目标，传递okUrl参数
                    var tourl = _global.hostUrl + '/account/?page=acc_login&okUrl=';
                    tourl += encodeURI(location.href);
                    window.location.href = tourl;
                } else if (jumptype == 2) {
                    //跳转目标，传递okUrl参数
                    var tourl = _global.hostUrl + '/account/welcome.html?&okUrl=';
                    tourl += encodeURI(location.href);
                    window.location.href = tourl;
                };
            };
        }, 'jsonp');
    };

    //如果非匿名anon模式就自动获取用户信息
    (function () {
        var url = decodeURI(location.search);
        var para = url.match(/_anonymous=[\s\S]*/g);
        var anon = false;
        if (para && para.length > 0 && para[0].split('=')[1] == 'true') {
            anon = true;
        };
        if (!anon) {
            _global.chkLogin();
        }
    })();


    //注销账号
    _global.logout = function (okfn) {
        //注销当前账号
        var api = _global.api('acc_loginOut');
        var dat = {};

        $.post(api, dat, function (res) {
            console.log('POST', api, dat, res);
            if (res.code == 1) {
                _global.myUsrInfo = undefined;
                _global.hasLogin = false;
                if (okfn && okfn.constructor == Function) {
                    try {
                        okfn()
                    } catch (err) {}
                };
            } else {
                console.log('_global:logout:failed:', res.text);
            }
        });
    };


    /*等待某个值为真然后运行函数fn
    当condition(time)函数返回为真的时候执行；默认condition为返回true的空函数
    interval检查间隔默认100毫秒，maxcheck最多等待时间毫秒默认10秒10000
    fn函数fn(time),默认超时结束不运行;
    forceRun超时最后也会运行这个函数，所以要避免强制运行就要检测时间小于maxtime
    */
    _global.promiseRun = function (fn, condition, maxtime, interval, forceRun) {
        if (!fn || fn.constructor != Function) return;
        if (!condition || condition.constructor != Function) condition = function () {
            return true;
        };

        if (!interval) interval = 100;
        if (!maxtime) maxtime = 10000;

        var bgntm = (new Date()).getTime();
        var setid = setInterval(function () {
            var now = (new Date()).getTime();
            var tm = now - bgntm;
            if (tm >= maxtime) {
                //超时
                if (forceRun === true) {
                    try {
                        fn(tm);
                    } catch (err) {
                        __errhdlr(new Error('_fns.promiseRun:timeout run error:' + err));
                    }
                };
                clearInterval(setid);
            } else {
                //检测condition
                if (condition(tm) == true) {
                    try {

                        fn(tm);
                    } catch (err) {
                        console.log('_fns.promiseRun:run error:', err);
                    };
                    clearInterval(setid);
                };
            }
        }, interval);
    };




})();
