(function () {
    'use strict';
    var thisName = 'pie_ladder';

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
                $scope.getShowApps();
                $scope.getTopApps();
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


        //从show读取n个推荐app,实际个数为n+1;
        $scope.getShowApps = function () {
            var api = _global.api('pie_ladderGetShowApps');

            //自动根据页面设定读取showapp数量
            var count = 1;
            if ($mdMedia("gt-xs")) count = 2;
            if ($mdMedia("gt-sm")) count = 3;
            if ($mdMedia("gt-md")) count = 6;

            var dat = {
                count: count - 1,
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        $scope.showApps = res.data;
                        //为每个app添加icon字段
                        for (var i = 0; i < $scope.showApps.length; i++) {
                            _fns.getAppIcon($scope, $scope.showApps[i]);
                        };
                    });
                } else {
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('读取推荐列表失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                }
            });
        };


        //从weight读取n个topapp,实际个数为n+1;
        $scope.getTopApps = function () {
            var api = _global.api('pie_ladderGetTopApps');

            //自动根据页面设定读取showapp数量
            var count = 10;

            var dat = {
                count: count - 1,
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        $scope.topApps = res.data;
                        $scope.topApps.sort(function (a, b) {
                            return b.weight - a.weight;
                        });

                        //为每个app添加icon字段
                        for (var i = 0; i < $scope.topApps.length; i++) {
                            _fns.getAppIcon($scope, $scope.topApps[i]);
                        };
                    });
                } else {
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('读取排行榜列表失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                }
            });
        };


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


        //显示推荐规则
        $scope.showAppsTip = function () {
            $scope.textDialogData = '推荐规则\n任何参加【打榜】的APP都有均等的推荐机会\n每人对每个APP都【只能点赞一次】\n推荐【100次】之后才有机会进入TOP排行榜\nTOP榜排名关键在于【点赞数】和【推荐次数】的比例';

            //弹出窗口
            $mdDialog.show({
                contentElement: '#textDialog',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };

        //显示推荐规则
        $scope.topAppsTip = function () {
            $scope.textDialogData = '排行规则\n打榜APP被推荐【100次】之后才会进入TOP榜排名计算\n排名为完全计算机算法排行，【无人工】干预\nTOP榜排名关键在于【点赞数】和【推荐次数】的比例';

            //弹出窗口
            $mdDialog.show({
                contentElement: '#textDialog',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };

        //取消弹窗
        $scope.cancelDialog = function () {
            $mdDialog.hide();
        };


        //弹出打榜弹窗
        $scope.openJoinDialog = function () {
            $scope.joinDialgSelId = undefined;
            $mdDialog.show({
                contentElement: '#joinDialog',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };

        //获取我的app列表
        $scope.getMyApps = function () {
            var api = _global.api('pie_getMyApps');
            var dat = {};

            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        //重新排序
                        var arr = _fns.obj2arr(res.data.apps);
                        var apparr = [];
                        arr.forEach(function (item) {
                            apparr.push(item.info);
                        });
                        apparr = apparr.sort(function (a, b) {
                            return b.time - a.time;
                        });

                        $scope.myApps = apparr;
                    });
                } else {
                    //提示错误
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('读取App列表失败，请稍后再试:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
            });
        };

        //加入排行榜
        $scope.joinLadder = function (appId) {
            var api = _global.api('pie_ladderJoin');
            var dat = {
                appId: appId,
            }
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                $scope.cancelDialog();
                if (res.code == 1) {
                    $scope.getShowApps();
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('恭喜，您的APP已经成功加入排行榜！')
                        .position('top right')
                        .hideDelay(3000)
                    );
                } else {
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('加入排行榜失败:' + res.text)
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
