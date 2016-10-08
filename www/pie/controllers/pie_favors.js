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
        $scope.setFavorApp = function (appinfo, favor, refresh) {
            var api = _global.api('pie_favorAdd');
            if (favor == false) api = _global.api('pie_favorRem');
            var dat = {
                appId: appinfo.id,
            }
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                var tip = favor ? '已成功加入收藏！' : '取消收藏成功,页面刷新后消失';
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

                if (refresh) $scope.getFavorApps();

            });
        };


        //弹出手工收藏窗口
        $scope.openMenualAddDialog = function () {
            $scope.munualAddDialogIpt = undefined;
            $mdDialog.show({
                contentElement: '#menualAddDialog',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };

        //根据链接添加收藏
        $scope.getAppInfoByUrl = function () {
            $scope.munualAddDialogTip = undefined;
            $scope.menualAddDialogAppId = undefined;
            $scope.menualAddDialogAppAlias = undefined;

            if (!$scope.munualAddDialogIpt) {
                $scope.munualAddDialogTip = '请输入链接';
                return;
            }
            var url = $scope.munualAddDialogIpt.toLowerCase();
            //首先进行验证
            if (!/^(http:\/\/)?(rt)?files.jieminuoketang.com\/\d+\/[a-z0-9]+\//.test(url)) {
                $scope.munualAddDialogTip = '请输入正确的链接格式';
                return;
            };

            //去除开头部分
            url = url.replace(/^(http:\/\/)?(rt)?files.jieminuoketang.com/g, '');

            //解析链接地址获得目标app的uid和name
            var arr = url.split('/');
            var appuid = arr[1];
            var appname = arr[2];

            //从服务器拉取appid和其它信息
            var api = _global.api('pie_getAppInfo');
            var dat = {
                appUid: appuid,
                appName: appname,
            };

            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        //重新排序
                        $scope.menualAddDialogAppAlias = res.data.alias;
                        $scope.menualAddDialogAppId = res.data.id;
                        $scope.menualAddDialogAppInfo = res.data;
                    });
                } else {
                    _fns.applyScope($scope, function () {
                        //重新排序
                        $scope.munualAddDialogTip = '找不到对应的APP:' + res.text;
                    });
                };
            });

        };

        //根据链接添加收藏
        $scope.menualAddFavor = function () {
            $scope.setFavorApp($scope.menualAddDialogAppInfo, true, true);
        };


        //打开分享窗口
        $scope.openShare = function (item) {
            var url = item.url.replace('http://files.jieminuoketang', 'http://rtfiles.jieminuoketang');
            $rootScope.tempDialogData = {
                title: '我开发的WebApp:' + item.alias,
                url: url + 'index.html',
            };
            $mdDialog.show({
                controller: 'pie_dialog_share',
                templateUrl: _fns.getDialogUrl('share'),
                parent: angular.element(document.body),
                clickOutsideToClose: true
            })
        };


        //end
    }
})();
