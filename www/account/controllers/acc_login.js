/*登陆页面控制器
支持okUrl参数
*/

(function () {
    'use strict';

    var ctrlrName = 'acc_login';

    angular.module('app').controller(ctrlrName, fn);

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


        //检测是否登录,如果已经登录就提示注销
        _global.promiseRun(function (tm) {
            _fns.applyScope($scope, function () {
                var confirm = $mdDialog.confirm()
                    .title('您已经登陆，需要为您注销吗?')
                    .textContent('必须注销后才能切换账号登录.')
                    .ok('注销账号')
                    .cancel('返回');
                $mdDialog.show(confirm).then(function (result) {
                    //注销当前账号
                    $scope.loginOut();
                }, function () {
                    //返回上一页
                    window.location.href = document.referrer;
                });
            })
        }, function () {
            return _global.hasLogin;
        });




        //注销当前账号
        $scope.loginOut = function () {
            //清理输入框
            $scope.user = {};

            var api = _global.api('acc_loginOut');
            var dat = {
                phone: $scope.user.phone
            };

            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
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
                        .textContent('注销失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                }
            });
        };


        //登陆
        $scope.loginByPhone = function () {
            var api = _global.api('acc_loginByPhone');
            var dat = {
                phone: $scope.user.phone,
                pw: md5($scope.user.pw),
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    //如果登陆成功，根据args进行跳转
                    if ($scope.args.okUrl) {
                        window.location.href = $scope.args.okUrl;
                    } else {
                        window.location.href = document.referrer;
                    }
                } else {
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('登录失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                }
            });
        };



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
