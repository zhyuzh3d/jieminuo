(function () {
    'use strict';
    var thisName = 'pie_admsms';

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
                $scope.getListData();
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


        //注册验证或者重置验证
        $scope.mode = 'reg';
        $scope.setMode = function (str) {
            $scope.mode = str;
            $scope.getListData();
        };


        //刷新短信tmp键列表
        $scope.getListData = function () {
            var api = _global.api('rds_admRunCmd');
            var keys = ($scope.mode == 'reg') ? '_tmp:phoneRegCode-*' : '_tmp:phoneRstCode-*'
            var dat = {
                cmd: '["keys","' + keys + '"]',
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        //转化数据格式
                        $scope.listData = res.data;
                        $scope.pageCount = Math.ceil($scope.listData.length / $scope.perPageCount);

                        //截取当前页数据
                        $scope.getCurPageData();

                        //分页数组
                        $scope.paginationArr = [];
                        for (var i = 0; i < $scope.pageCount; i++) {
                            $scope.paginationArr.push(i);
                        };
                    })
                }
            });
        };


        //分页相关
        $scope.curPageIndex = 0;
        $scope.perPageCount = 50;
        $scope.pageCount = 0;
        $scope.curPageData = [];

        $scope.getCurPageData = function () {
            var start = $scope.curPageIndex * $scope.perPageCount;
            var end = start + $scope.perPageCount;
            end = (end > $scope.listData.length) ? $scope.listData.length - 1 : end;
            $scope.curPageData = $scope.listData.slice(start, end + 1);
        };

        $scope.toNextPage = function () {
            var n = $scope.curPageIndex + 1;
            if (n > $scope.pageCount) n = $scope.pageCount;
            $scope.curPageIndex = n;
            $scope.getCurPageData();
        }

        $scope.toPrevPage = function () {
            var n = $scope.curPageIndex - 1;
            if (n < 0) n = 0;
            $scope.curPageIndex = n;
            $scope.getCurPageData();
        }

        $scope.toPageN = function (n) {
            $scope.curPageIndex = n;
            $scope.getCurPageData();
        }


        //关闭任何弹窗
        $scope.cancelDialog = function () {
            $mdDialog.hide();
        };

        //删除键，先提示再删除
        $scope.deleteKey = function (key) {
            var confirm = $mdDialog.confirm()
                .title('您确定要移除Key ' + key + '吗?')
                .textContent('移除后将无法恢复.')
                .ariaLabel('remove key')
                .ok('确定移除')
                .cancel('取消');
            $mdDialog.show(confirm).then(function () {
                var api = _global.api('rds_admRunCmd');
                var dat = {
                    cmd: '["del","' + key + '"]',
                };
                $.post(api, dat, function (res) {
                    console.log('POST', api, dat, res);
                    if (res.code == 1) {
                        $mdDialog.hide();
                        $mdToast.show(
                            $mdToast.simple()
                            .textContent('移除成功')
                            .position('top right')
                            .hideDelay(3000)
                        );
                    };
                });
            });
        };


        //修正背景色
        $('#curPage').css('background', '#FFF');



        //end
    }
})();
