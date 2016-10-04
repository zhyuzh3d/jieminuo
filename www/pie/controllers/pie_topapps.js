(function () {
    'use strict';
    var thisName = 'pie_topapps';

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
            var dat = {
                count: 4
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        $scope.showApps = res.data;
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

        $scope.getShowApps();

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
                            app.hit += 1;
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





        //end
    }
})();
