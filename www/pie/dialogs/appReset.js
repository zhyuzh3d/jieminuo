/*
设置app各种参数的弹窗控制器，注意不能引入$element
必须先包含两个对话框，appreset和share
$rootScope.tempDialogData.app,
$rootScope.tempDialogData.editAfterReset是否在重置后打开
app对象
*/

(function () {
    'use strict';
    var thisName = 'pie_dialog_appReset';

    _app.controller(thisName, thisFn);

    function thisFn(
        $rootScope,
        $scope,
        $location,
        $anchorScroll,
        $mdToast,
        $mdDialog,
        $mdMedia,
        $filter
    ) {
        console.log(thisName + '.js is loading...');
        _fns.initCtrlr($scope, undefined, thisName, false);

        $rootScope[thisName] = $scope;

        $scope.app = $rootScope.tempDialogData.app;

        //初始化模版
        $scope.templates = _cfg.templates;
        $scope.selTemplate = 'base';

        $scope.cancelDialog = function () {
            $mdDialog.hide();
        };


        //执行重新初始化
        $scope.doReInitApp = function () {
            $mdToast.show(
                $mdToast.simple()
                .textContent('正在根据模版为您初始化APP文件，请稍后')
                .position('top right')
                .hideDelay(3000)
            );
            $scope.initAppByTemplate($scope.app.name, $scope.selTemplate, function () {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('重新初始化完成，请点击菜单进入编辑文件')
                    .position('top right')
                    .hideDelay(3000)
                );
                if ($rootScope.tempDialogData.editAfterReset) {
                    setTimeout(function () {
                        var str = _global.hostUrl + '/pie/?page=pie_editor&app=' + $scope.app.name;
                        str = encodeURI(str);
                        location.href = str;
                    }, 1000);
                };
            });
            $scope.cancelDialog();
        };



        //初始化模版
        $scope.templates = _cfg.templates;
        $scope.selTemplate = 'base';

        //记录每次模版初始化的数量
        $scope.initCounters = {};

        //使用模版初始化项目,逐个保存文件，完成数叠加
        $scope.initAppByTemplate = function (appname, tmpname, okfn) {
            var counterid = _fns.uuid();
            var counter = $scope.initCounters[counterid] = {
                ok: 0,
                total: 0,
            };

            if (!$scope.templates[tmpname] || !$scope.templates[tmpname].files) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('找不到指定模版' + tmpname + '，初始化失败')
                    .position('top right')
                    .hideDelay(3000)
                );
                return;
            };
            var files = $scope.templates[tmpname].files;

            for (var attr in files) {
                counter.total++;
                var furl = files[attr];
                var fkey = appname + '/' + attr;
                $scope.initOneFile(appname, furl, fkey, counter, okfn);
            };
        };

        //上传数据为文件,传递furl和fkey，避免被后续覆盖值
        $scope.initOneFile = function (appname, furl, fkey, counter, okfn) {
            //先读取数据
            $.get(furl, function (res) {
                var ext = _fns.getFileExt(fkey);
                var mime = _fns.getMimeByExt(ext);
                var uid = $rootScope.myInfo.id;

                //对res内的uid和appName进行处理替换
                if (typeof (res) == 'string') {
                    res = res.replace(/\[\[uid\]\]/g, uid).replace(/\[\[appName\]\]/g, appname);
                };

                var blob = new Blob([res], {
                    type: mime
                });
                //再写入数据到文件
                _fns.uploadFileQn(fkey, blob, null, function () {
                    counter.ok++;
                    if (counter.ok >= counter.total) {
                        try {
                            okfn();
                        } catch (err) {
                            $mdToast.show(
                                $mdToast.simple()
                                .textContent('初始化结束失败:' + err)
                                .position('top right')
                                .hideDelay(3000)
                            );
                        }
                    };
                });
            }, "text");
        };

        //end
    }
})();
