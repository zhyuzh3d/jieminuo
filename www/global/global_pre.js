//在所有脚本之前，jquery之后执行，比如检测登陆情况
console.info('global_pre loading...');

if (!_global) var _global = {};

(function () {
    'use strict';

    //全局设置，所有的路径结尾都不带斜杠,自动匹配10knet和jieminuoketang
    if (/^\w*\.10knet\.com$/.test(location.host)) {
        _global.hostUrl = 'http://www.10knet.com';
    } else if (/^\w*\.jieminuoketang\.com$/.test(location.host)) {
        _global.hostUrl = 'http://www.jieminuoketang.com';
    }
    _global.apiPrefix = _global.hostUrl + '/api';

})();

(function () {
    'use strict';

    //修改标题
    $('title').html('杰米诺 | ' + $('title').html());


})();


(function () {
    'use strict';

    //获取api路径
    _global.api = function (str) {
        return _global.apiPrefix + '/' + str;
    };



    //先检查是否登陆，没有登陆的话直接跳往登陆注册页面
    _global.chkLogin = function () {
        var api = _global.api('acc_getMyInfo');
        var dat = {};

        $.post(api, dat, function (res) {
            var isloginpage = (location.href.indexOf(_global.hostUrl + '/account/?page=acc_login') == 0);
            var isregpage = (location.href.indexOf(_global.hostUrl + '/account/?page=acc_register') == 0);
            var ischangepwpage = (location.href.indexOf(_global.hostUrl + '/account/?page=acc_changePw') == 0);
            var istemp = (location.href.indexOf(_global.hostUrl + '/account/?page=acc_temp') == 0);
            var ishomepage = (location.href == _global.hostUrl + '/') || (location.href == _global.hostUrl) || (location.href.indexOf(_global.hostUrl + '/?') == 0);

            if (res.code == 1) {
                //已经登陆，把数据填充到用户
                _global.myUsrInfo = res.data;
                _global.hasLogin = true;
            } else {
                //没有登陆，跳转到登录页，把当前页地址作为参数传递（因为可能是单独调用接口注销的）
                //如果当前页面已经是登录页或注册页就不要跳转了,站点首页不跳转
                if (!isloginpage && !isregpage && !ischangepwpage && !istemp && !ishomepage) {
                    var tourl = _global.hostUrl + '/account/?page=acc_login&okUrl=';
                    tourl += encodeURI(location.href);
                    setTimeout(function () {
                        window.location.href = tourl;
                    }, 100);
                };
            };
        }, 'jsonp');
    };
    _global.chkLogin();


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
