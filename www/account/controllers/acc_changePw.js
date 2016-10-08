/*注册页面
先验证是否已经登陆，如果已经登陆则自动注销当前用户
*/

(function () {
    'use strict';

    var ctrlrName = 'acc_changePw';

    _app.controller(ctrlrName, fn);

    function fn($rootScope, $scope, $location, $anchorScroll, $element, $mdToast, $mdDialog) {
        $rootScope[ctrlrName] = $scope;
        $scope.ctrlrName = ctrlrName;
        $scope.autoRun = []; //自动运行的函数

        _fns.getCtrlrAgs($scope, $element);

        $scope.user = {};

        //需要载入的内容，仅限延迟使用，即时使用的需要加入index.html
        _fns.addLib('md5');

        //换页
        $scope.goPage = function (pname) {
            $rootScope.changePage(pname);
        };

        $scope.hasLogin = true; //初始认为已经登陆成功

        //自动检查是否已经登陆，如果已经登陆提示是否要注销
        $scope.autoRun.chkLogin = function () {
            var api = _global.api('acc_getMyInfo');
            var dat = {}

            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    //已经登陆，提示是否要注销，不注销就后退页面
                    var confirm = $mdDialog.confirm()
                        .title('您已经登陆，需要为您注销吗?')
                        .textContent('必须注销后才能重置密码.')
                        .ok('注销账号')
                        .cancel('返回');
                    $mdDialog.show(confirm).then(function (result) {
                        //注销当前账号
                        $scope.loginOut();
                    }, function () {
                        //返回上一页
                        window.location.href = document.referrer;
                    });
                    $scope.hasLogin = true;
                } else {
                    //还没登陆
                    $scope.hasLogin = false;
                };
            });
        };

        //注销当前账号
        $scope.loginOut = function () {
            var api = _global.api('acc_loginOut');
            var dat = {
                phone: $scope.user.phone
            };

            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    $scope.hasLogin = false;
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('注销成功！')
                        .position('top right')
                        .hideDelay(3000)
                    );
                    _global.myUsrInfo = undefined;
                    _global.hasLogin = false;
                } else {
                    //提示错误
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('注销失败：' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                }
            });
        };


        //验证码按钮倒计时功能
        $scope.waiting = 0;
        var waitid = 0;

        //获取验证码
        $scope.getPhoneRstCode = function () {
            var api = _global.api('acc_getPhoneRstCode');
            var dat = {
                phone: $scope.user.phone,
                capKey: $scope.captchaKey,
                capVal: $scope.captchaVal,
            };

            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                $scope.cancelDialog();
                var tip = '发送成功，请注意查收';

                $scope.$apply(function () {
                    $scope.hasSendCode = true;
                    $scope.user.phoneCode = undefined;
                });

                if (res.code == 1) {
                    //启动倒计时
                    $scope.waiting = 120;
                    clearInterval(waitid);
                    waitid = setInterval(function () {
                        $scope.$apply(function () {
                            $scope.waiting--;
                        })
                        if ($scope.waiting <= 0) {
                            clearInterval(waitid);
                        };
                    }, 1000);
                } else {
                    tip = '发送失败:' + res.text;
                };

                $mdToast.show(
                    $mdToast.simple()
                    .textContent(tip)
                    .position('top right')
                    .hideDelay(3000)
                );
            });
        };

        //注册账号
        $scope.rstPwByPhone = function () {
            var api = _global.api('acc_rstPwByPhone');
            var dat = {
                phone: $scope.user.phone,
                phoneCode: $scope.user.phoneCode,
                pw: md5($scope.user.pw),
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    //如果登陆成功，根据args进行跳转
                    if ($scope.args.okUrl) {
                        window.location.href = encodeURI($scope.args.okUrl);
                    } else {
                        window.location.href = document.referrer;
                    }
                } else {
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('修改失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                }
            });
        };


        //取消注册
        $scope.cancel = function () {
            window.location.href = document.referrer;
        };



        //取消弹窗
        $scope.cancelDialog = function () {
            $mdDialog.hide();
        };


        //弹出验证弹窗
        $scope.openCaptchaDialog = function () {
            //监测电话号码输入格式
            var regx = /^1+\d{10}$/;
            if (!regx.test($scope.user.phone)) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('电话号码格式错误，请检查后再试')
                    .position('top right')
                    .hideDelay(3000)
                );
                return;
            };

            //清理数据
            $scope.captchaVal = undefined;
            $scope.captchaKey = undefined;
            $scope.captchaSvg = undefined;

            //重新请求验证码数据
            $scope.refreshCaptcha();

            //弹窗
            $mdDialog.show({
                contentElement: '#captchaDialog',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };

        //重新请求验证码数据
        var capExpireOutN;
        $scope.refreshCaptcha = function () {
            var api = _global.api('captcha_get');
            var dat = {};

            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        $scope.captchaKey = res.data.key;
                        $scope.captchaSvg = res.data.svg;

                        //设定倒计时过期
                        if (capExpireOutN) clearTimeout(capExpireOutN);
                        capExpireOutN = setTimeout(function () {
                            $scope.captchaTimeOut = true;
                        }, res.data.expire * 1000);
                    });
                }
            });
        };







        //测试
        $scope.print = function (str) {
            console.log(str);
        };
        $scope.showHints = false;





        //自动运行的函数
        for (var attr in $scope.autoRun) {
            var fn = $scope.autoRun[attr];
            try {
                fn();
            } catch (err) {
                console.log(ctrlrName + ':' + fn.name + ' auto run failed...');
            }
        }


        //end
        console.log(ctrlrName + '.js loading...')
    };
})();
