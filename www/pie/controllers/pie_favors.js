(function () {
    'use strict';
    var thisName = 'pie_favors';

    _app.controller(thisName, thisFn);

    function thisFn(
        $rootScope,
        $scope,
        $location,
        $anchorScroll,
        $element,
        $mdToast,
        $mdDialog,
        $mdMedia,
        $filter
    ) {
        console.log(thisName + '.js is loading...');
        _fns.initCtrlr($scope, $element, thisName, false);

        $rootScope[thisName] = $scope;

        //锚点
        $scope.goto = function (key) {
            $location.hash(key);
            $anchorScroll();
        };


        //等待global读取账号信息成功后刷新右上角用户
        _global.promiseRun(function () {
            $scope.$apply(function () {
                $scope.myUsrInfo = _global.myUsrInfo;
                $scope.hasLogin = _global.hasLogin;
                $scope.getFavorApps();
            });
        }, function () {
            return _global.hasLogin;
        });

        //退出并刷新
        $scope.logout = function () {
            _global.logout(function () {
                window.location.reload();
            });
        };

        $scope.gotoProfile = function () {
            location.href = 'http://' + location.host + '/account/?page=acc_profile';
        };

        //开始就打开左侧栏
        $(document).ready(function () {
            setTimeout(function () {
                if (!$rootScope.leftMenuOpen && $mdMedia("gt-sm")) {
                    $('#leftnavbtn').click();
                };
            }, 1000);
        });


        //运行app，跳转到app首页,转换到rtfiles
        $scope.openApp = function (app) {
            var str = app.url.replace(/^http:\/\/files.jieminuoketang.com/, 'http://rtfiles.jieminuoketang.com');
            str = encodeURI(str + 'index.html');
            window.open(str);
        };

        //点赞
        $scope.likeApp = function (app) {
            if (app.hashit) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('谢谢您的鼓励!')
                    .position('top right')
                    .hideDelay(3000)
                );
                return;
            };

            var api = _global.api('pie_ladderLikeApp');
            var dat = {
                appId: app.id
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                var tip = '';
                if (res.code == 1) {
                    if (res.data == 0) {
                        tip = '谢谢您的鼓励！'
                    } else {
                        tip = '谢谢您的支持！'
                        _fns.applyScope($scope, function () {
                            if (!app.hit) app.hit = 0;
                            app.hit = Number(app.hit) + 1;
                            app.hashit = 1;
                        })
                    };
                } else {
                    tip = '点赞失败:' + res.text;
                };
                $mdToast.show(
                    $mdToast.simple()
                    .textContent(tip)
                    .position('top right')
                    .hideDelay(3000)
                );
            });
        };


        //根据项目id计算项目的背景
        $scope.genCardBg = function (n) {
            var len = _cfg.themeImgs.length;
            var url = _cfg.themeImgs[n % len].sm;
            var css = {
                'background-image': 'url(' + url + ')',
            };
            return css;
        };

        //根据用户的颜色项目的背景
        $scope.genCardBg2 = function (n) {
            var css = {
                'background-color': _global.myUsrInfo.color,
            };
            return css;
        };


        //取消弹窗
        $scope.cancelDialog = function () {
            $mdDialog.hide();
        };


        //获取我的收藏app列表
        $scope.getFavorApps = function () {
            var api = _global.api('pie_favorGetApps');
            var dat = {};

            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        //重新排序
                        $scope.favorApps = res.data;
                    });
                } else {
                    //提示错误
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('读取收藏App列表失败，请稍后再试:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
            });
        };

        //加入排行榜
        $scope.setFavorApp = function (appinfo, favor) {
            var api = _global.api('pie_favorAdd');
            if (favor == false) api = _global.api('pie_favorRem');
            var dat = {
                appId: appinfo.id,
            }
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                var tip = favor ? '已成功加入收藏！' : '取消收藏成功';
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        appinfo.hasfavor = favor;
                    });
                } else {
                    tip = '设置失败:' + res.text;
                };
                $scope.cancelDialog();
                $mdToast.show(
                    $mdToast.simple()
                    .textContent(tip)
                    .position('top right')
                    .hideDelay(3000)
                );
            });
        };






        //end
    }
})();
