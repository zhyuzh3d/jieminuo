(function () {
    'use strict';
    var thisName = 'pie_admladder';

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




        //获取各种榜的列表，然后再处理
        $scope.getListData = function () {
            var api = _global.api('pie_admGetLadderList');
            var dat = {};
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        //转化数据格式
                        $scope.allData = res.data;
                        for (var attr in $scope.allData) {
                            $scope.allData[attr] = _fns.arr2obj($scope.allData[attr]);
                        };

                        //以show为索引
                        $scope.listData = _fns.obj2arr($scope.allData.show, true);
                        $scope.listData.forEach(function (item) {
                            for (var attr in $scope.allData) {
                                item[attr] = $scope.allData[attr][item.key];
                            };
                        });

                        //计算页数
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


        //获取一个app的详细信息，runcmd操作
        $scope.showAppDetails = function (item) {
            var api = _global.api('rds_admRunCmd');
            var appkey = 'app-' + item.key;
            var dat = {
                cmd: '["hgetall","' + appkey + '"]',
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                $scope.jsonDialogData = res.data;

                //弹出窗口
                $mdDialog.show({
                    contentElement: '#jsonDialog',
                    parent: angular.element(document.body),
                    clickOutsideToClose: true
                });
            });
        };

        //把一个app从各个榜单数据中完全移除，先提示再操作
        $scope.removeApp = function (item) {
            var confirm = $mdDialog.confirm()
                .title('您确定要移除APP ' + item.key + '吗?')
                .textContent('移除后将无法恢复.')
                .ariaLabel('remove key')
                .ok('确定移除')
                .cancel('取消');
            $mdDialog.show(confirm).then(function () {
                $mdDialog.hide();
                var keyarr = [];
                keyarr.push('_map:ldrShow:app.id:show');
                keyarr.push('_map:ldrJoinTime:app.id:ts');
                keyarr.push('_map:ldrUShow:app.id:show');
                keyarr.push('_map:ldrrHit:app.id:hit');
                keyarr.push('_map:ldrWei:app.id:wei');

                keyarr.forEach(function (keynm) {
                    $scope.removeMemberFromZsort(keynm, item.key);
                });
            });
        };


        //从一个zsort中移除一个成员
        $scope.removeMemberFromZsort = function (keyname, member) {
            var api = _global.api('rds_admRunCmd');
            var dat = {
                cmd: '["zrem","' + keyname + '","' + member + '"]',
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code != 1) {
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('移除数据键成员失败！' + keyname + '/' + member + '.')
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
            });
        };





        //修正背景色
        $('#curPage').css('background', '#FFF');



        //end
    }
})();
