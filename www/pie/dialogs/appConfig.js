/*
设置app各种参数的弹窗控制器，注意不能引入$element
$rootScope.tempDialogData.app
$rootScope.tempDialogData.activeTab 默认激活哪个菜单，'menu','set','ext'
$rootScope.tempDialogData.fnAfterChange 如果发生改变后执行的函数，比如刷新列表
*/

_fns.addDialogJs('share');
_fns.addDialogJs('appReset');

(function () {
    'use strict';
    var thisName = 'pie_dialog_appConfig';

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

        $scope.hisType = _cfg.mgHisTypeName;

        $scope.app = $rootScope.tempDialogData.app;

        //切换激活tab页,监听tab页面切换到ext时候自动加载ext
        (function autoSetMenu() {
            $scope.$watch('selectedIndex', function (cur, old) {
                if (cur == 2) {
                    $scope.getAppInfoExt();
                } else if (cur == 3) {
                    $scope.getAppHis();
                };
            });

            var tabs = ['menu', 'set', 'ext'];
            console.log(tabs.indexOf($rootScope.tempDialogData.activeTab));
            if (!$scope.activeTab) {
                $scope.selectedIndex = 0;
            } else {
                $scope.selectedIndex = tabs.indexOf($rootScope.tempDialogData.activeTab);
            }
        })();


        //菜单页列表数据
        $scope.menus = [{
            title: '分享',
            icon: 'fa fa-share',
            fn: 'shareApp',
       }, {
            title: '运行',
            icon: 'fa fa-rocket',
            fn: 'launchApp',
       }, {
            title: '编辑',
            icon: 'fa fa-pencil',
            fn: 'editApp',
       }, {
            title: '打榜',
            icon: 'fa fa-trophy',
            fn: 'ladderApp',
       }, {
            title: '重置',
            icon: 'fa fa-refresh',
            fn: 'resetApp',
       }, {
            title: '删除',
            icon: 'fa fa-times',
            fn: 'removeApp',
       }];

        $scope.menurun = function (str) {
            $scope[str]();
        };


        //打开分享窗口
        $scope.shareApp = function () {
            var url = $scope.app.url.replace('http://files.jieminuoketang', 'http://rtfiles.jieminuoketang');
            $rootScope.tempDialogData = {
                title: '我开发的WebApp:' + $scope.app.alias,
                url: url + 'index.html',
            };
            $mdDialog.show({
                controller: 'pie_dialog_share',
                templateUrl: _fns.getDialogUrl('share'),
                parent: angular.element(document.body),
                clickOutsideToClose: true
            })
        };


        //运行APP
        $scope.launchApp = function () {
            var str = _cfg.qn.RtBucketDomain + $rootScope.myInfo.id + '/' + $scope.app.name + '/index.html';
            str = encodeURI(str);
            window.open(str);
            $mdDialog.hide()
        };

        //打开编辑器载入APP
        $scope.editApp = function () {
            var str = _global.hostUrl + '/pie/?page=pie_editor&app=' + $scope.app.name;
            str = encodeURI(str);
            location.href = str;
        };

        //将APP加入排行榜
        $scope.ladderApp = function () {
            var api = _global.api('pie_ladderJoin');
            var dat = {
                appId: $scope.app.id,
            }
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                $mdDialog.hide();
                if (res.code == 1) {
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


        //用模版重新初始化APP
        $scope.resetApp = function () {
            var confirm = $mdDialog.confirm()
                .title('您确定要重新初始化[' + $scope.app.alias + '(' + $scope.app.name + ')]应用?')
                .textContent('警告！文件内容将被删除，丢失后无法找回！')
                .ariaLabel('reset app')
                .ok('重新初始化')
                .cancel('取消');
            $mdDialog.show(confirm).then(function () {
                $rootScope.tempDialogData.app = {};
                $rootScope.tempDialogData.app = $scope.app;
                $rootScope.tempDialogData.editAfterReset = true;
                $mdDialog.show({
                    controller: 'pie_dialog_appReset',
                    templateUrl: _fns.getDialogUrl('appReset'),
                    parent: angular.element(document.body),
                    clickOutsideToClose: true
                })
            });
        };


        //移除APP，只是从用户的APP列表移除，并不真的删除文件
        $scope.removeApp = function () {
            var confirm = $mdDialog.confirm()
                .title('您确定要移除【' + $scope.app.alias + '】应用吗?')
                .textContent('移除后将无法恢复.')
                .ariaLabel('remove app')
                .ok('确定移除')
                .cancel('取消');
            $mdDialog.show(confirm).then(function () {
                var api = _global.api('pie_removeApp');
                var dat = {
                    appId: $scope.app.id,
                }
                $.post(api, dat, function (res) {
                    console.log('POST', api, dat, res);
                    if (res.code == 1) {
                        $mdToast.show(
                            $mdToast.simple()
                            .textContent('成功移除APP')
                            .position('top right')
                            .hideDelay(3000)
                        );
                        if ($rootScope.tempDialogData.fnAfterChange) {
                            try {
                                $rootScope.tempDialogData.fnAfterChange();
                            } catch (err) {}
                        };
                    } else {
                        $mdToast.show(
                            $mdToast.simple()
                            .textContent('移除APP失败:' + res.text)
                            .position('top right')
                            .hideDelay(3000)
                        );
                    };
                });
            });
        };


        //更换图标
        $scope.iconUploadPer = 0; //上传进度
        $scope.iconUploading = false; //上传进度
        $scope.changeIcon = function () {
            var acceptstr = 'image/png,image/jpg,image/jpeg';
            if (!$mdMedia('gt-sm')) acceptstr = 'image/*';
            $scope.iconUploadPer = 0;
            $scope.iconUploading = true;

            _fns.uploadFile2($('#appiconbtn'), function (f) {
                    //before
                },
                function (f, proevt) {
                    //progress
                    _fns.applyScope($scope, function () {
                        $scope.iconUploadPer = f.percent;
                    });
                },
                function (f, res) {
                    //sucess
                    _fns.applyScope($scope, function () {
                        $scope.iconUploading = false;
                        $scope.app.icon = res.url;
                    });
                },
                function (f) {
                    //abort
                },
                function (f, err) {
                    //error
                    _fns.applyScope($scope, function () {
                        $scope.iconUploading = false;
                    });
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('上传失败:' + err.message)
                        .position('top right')
                        .hideDelay(3000)
                    );
                }, null, null, null, acceptstr);
        };

        //更新基本数据，图标icon，别名alias，描述desc
        $scope.updateAppBase = function () {
            var dat = {
                appId: $scope.app.id,
                icon: $scope.app.icon,
                alias: $scope.app.alias,
                desc: $scope.app.desc,
            };

            //格式检查
            var errstr;
            if (!dat.alias || !_cfg.regx.appAlias.test(dat.alias)) errstr = 'APP名称格式错误';
            if (dat.desc && !_cfg.regx.appDesc.test(dat.desc)) errstr = 'APP描述格式错误';
            if (errstr) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent(errstr)
                    .position('top right')
                    .hideDelay(3000)
                );
                return;
            };

            $scope.updateAppInfo(dat);
        };

        //更新扩展数据,野狗wildDogAppSecret
        $scope.updateAppExt = function () {
            var dat = {
                appId: $scope.app.id,
                wildDogAppSecret: $scope.appExt.wildDogAppSecret,
            };

            //格式检查
            var errstr;
            if (dat.wildDogAppSecret && !_cfg.regx.wildDogAppSecret.test(dat.wildDogAppSecret)) {
                errstr = '野狗APP超级密钥格式错误';
            };
            if (errstr) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent(errstr)
                    .position('top right')
                    .hideDelay(3000)
                );
                return;
            };

            //添加自定义字段
            if ($scope.customsArr) {
                var arr = [];

                //先去除空属性；（空值不去除，表示删除这个属性）
                $scope.customsArr.forEach(function (item, n) {
                    if (item.key != '') {
                        arr.push(item);
                    };
                });

                //再添加
                if (arr.length > 0) {
                    dat.customs = {};
                    arr.forEach(function (item, n) {
                        dat.customs[item.key] = item.val;
                    })
                };
            };

            $scope.updateAppInfoExt(dat);
        };

        //更新APP信息。base和ext都使用这个函数进行更新
        $scope.updateAppInfo = function (dat) {
            //发送请求
            var api = _global.api('pie_updateAppInfo');
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                var tip = '';
                if (res.code == 1) {
                    tip = '保存成功！'
                    $mdDialog.hide();
                } else {
                    tip = '保存失败:' + res.text;
                };
                $mdToast.show(
                    $mdToast.simple()
                    .textContent(tip)
                    .position('top right')
                    .hideDelay(3000)
                );
            });
        };

        //更新APP信息。base和ext都使用这个函数进行更新
        $scope.updateAppInfoExt = function (dat) {
            //发送请求
            var api = _global.api('pie_updateAppInfoExt');
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                var tip = '';
                if (res.code == 1) {
                    tip = '保存成功！'
                    $mdDialog.hide();
                } else {
                    tip = '保存失败:' + res.text;
                };
                $mdToast.show(
                    $mdToast.simple()
                    .textContent(tip)
                    .position('top right')
                    .hideDelay(3000)
                );
            });
        };


        //载入appext信息
        $scope.refreshAppInfoExt = function () {
            //发送请求
            var api = _global.api('pie_getMyAppInfoExt');
            var dat = {
                appId: $scope.app.id,
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        $scope.appExt = res.data;

                        //把customs拆解成数组[{key:attr,val:value},...]，不包含野狗密钥
                        var exarr = ['wildDogAppSecret'];
                        $scope.customsArr = [];
                        for (var attr in $scope.appExt) {
                            if (exarr.indexOf(attr) == -1) {
                                $scope.customsArr.push({
                                    key: attr,
                                    val: $scope.appExt[attr],
                                })
                            }
                        };
                    });
                } else {
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('获取App扩展信息失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
            });
        };

        //获取附加设置
        $scope.getAppInfoExt = function () {
            if (!$scope.appExt) $scope.refreshAppInfoExt();
        };




        //载入appext信息
        $scope.refreshAppHisArr = function () {
            //发送请求
            var api = _global.api('pie_getAppHis');
            var dat = {
                appId: $scope.app.id,
                start: 0,
                count: 12,
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        $scope.hisArr = res.data;
                    });
                } else {
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('获取App扩展信息失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
            });
        };

        //获取历史
        $scope.getAppHis = function () {
            if (!$scope.hisArr) $scope.refreshAppHisArr();
        };






        //自定义属性组
        $scope.customsArr = [];

        //添加一个空字符串属性
        $scope.addCustoms = function () {
            $scope.customsArr.push({
                key: '',
                val: '',
            })
        };



        //end
    }
})();
