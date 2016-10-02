(function () {
    'use strict';
    var thisName = 'pie_admusrs';

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
                $scope.getUsrList();
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


        //获取用户手机号码列表
        $scope.getUsrList = function () {
            var api = _global.api('acc_admGetUsrList');
            var dat = {};
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                _fns.applyScope($scope, function () {
                    //转化数据格式
                    $scope.usrs = _fns.obj2arr(res.data, true);
                    for (var i = 0; i < $scope.usrs.length; i++) {
                        $scope.usrs[i].val = Number($scope.usrs[i].val);
                    };
                    $scope.pageCount = Math.ceil($scope.usrs.length / $scope.perPageCount);
                    $scope.usrs = $scope.usrs.sort(function (a, b) {
                        return Number(b.val) - Number(a.val);
                    });

                    //截取当前页数据
                    $scope.getCurPageUsrs();

                    //分页数组
                    $scope.paginationArr = [];
                    for (var i = 0; i < $scope.pageCount; i++) {
                        $scope.paginationArr.push(i);
                    };
                })
            });
        };


        //分页相关
        $scope.curPageIndex = 0;
        $scope.perPageCount = 50;
        $scope.pageCount = 0;
        $scope.curPageUsrs = [];

        $scope.getCurPageUsrs = function () {
            var start = $scope.curPageIndex * $scope.perPageCount;
            var end = start + $scope.perPageCount;
            end = (end > $scope.usrs.length) ? $scope.usrs.length - 1 : end;
            $scope.curPageUsrs = $scope.usrs.slice(start, end + 1);
        };

        $scope.toNextPage = function () {
            var n = $scope.curPageIndex + 1;
            if (n > $scope.pageCount) n = $scope.pageCount;
            $scope.curPageIndex = n;
            $scope.getCurPageUsrs();
        }

        $scope.toPrevPage = function () {
            var n = $scope.curPageIndex - 1;
            if (n < 0) n = 0;
            $scope.curPageIndex = n;
            $scope.getCurPageUsrs();
        }

        $scope.toPageN = function (n) {
            $scope.curPageIndex = n;
            $scope.getCurPageUsrs();
        }


        //读取用户的全部信息
        $scope.usrDetailsDialogData = {};
        $scope.getUsrDetails = function (u) {
            var api = _global.api('acc_admGetUsrDetails');
            var dat = {
                id: u.val
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                $scope.usrDetailsDialogData = res.data;
                res.phone = u.key;
                res.id = u.id;

                //弹出窗口
                $mdDialog.show({
                    contentElement: '#usrDetailsDialog',
                    parent: angular.element(document.body),
                    clickOutsideToClose: true
                });
            });
        };

        //修改用户的单个属性弹窗
        $scope.setUsrAttrDialogData = {};
        $scope.openSetUsrAttrDialog = function (u) {
            $scope.setUsrAttrDialogData.usr = {};
            $scope.setUsrAttrDialogData.usr = {
                phone: u.key,
                id: u.val,
            };

            //弹出窗口
            $mdDialog.show({
                contentElement: '#setUsrAttrDialog',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };

        //修改用户属性post
        $scope.setUsrAttr = function () {
            var api = _global.api('acc_admSetUsrAttr');
            var dat = {
                id: $scope.setUsrAttrDialogData.usr.id,
                key: $scope.setUsrAttrDialogData.key,
                val: $scope.setUsrAttrDialogData.val,
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    $mdDialog.hide();
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('修改成功')
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
            });
        };


        //移除用户，现弹窗再执行
        $scope.removeUsr = function (u) {
            var confirm = $mdDialog.confirm()
                .title('您确定要移除用户 ' + u.val + '(' + u.key + ')' + '吗?')
                .textContent('移除后将无法恢复.')
                .ariaLabel('remove usr')
                .ok('确定移除')
                .cancel('取消');
            $mdDialog.show(confirm).then(function () {
                var api = _global.api('acc_admRemoveUsr');
                var dat = {
                    id: u.val,
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





        //关闭任何弹窗
        $scope.cancelDialog = function () {
            $mdDialog.hide();
        };

        //修正背景色
        $('#curPage').css('background', '#FFF');



        //end
    }
})();
