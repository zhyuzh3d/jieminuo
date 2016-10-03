(function () {
    'use strict';
    var thisName = 'pie_admrds';

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


        //清除cmd
        $scope.cmd = '';


        //先弹窗确认再执行
        $scope.runCmd = function () {
            //格式检查
            var arr = JSON.safeParse($scope.cmd);
            if (!arr || arr.constructor != Array) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('命令格式错误')
                    .position('top right')
                    .hideDelay(3000)
                );
                return;
            };

            //执行
            var confirm = $mdDialog.confirm()
                .title('CMD:' + $scope.cmd)
                .textContent('!!危险操作，非专业人士慎用!!')
                .ariaLabel('runCmd')
                .ok('确定执行')
                .cancel('取消');
            $mdDialog.show(confirm).then(function () {
                var api = _global.api('rds_admRunCmd');
                var dat = {
                    cmd: $scope.cmd,
                };
                $scope.listData = '正在等待刷新，请稍后...';
                $.post(api, dat, function (res) {
                    console.log('POST', api, dat, res);
                    if (res.code == 1) {
                        $scope.listData = res.data;
                        $mdDialog.hide();
                        $mdToast.show(
                            $mdToast.simple()
                            .textContent('执行成功')
                            .position('top right')
                            .hideDelay(3000)
                        );
                    } else {
                        $scope.listData = 'ERR:' + res.text;
                    };
                    _fns.applyScope($scope);
                });
            });
        };


        //修正背景色
        $('#curPage').css('background', '#FFF');



        //end
    }
})();
