(function () {
    'use strict';
    var thisName = 'pie_welcome';

    _app.controller(thisName, thisFn);

    function thisFn(
        $rootScope,
        $scope,
        $location,
        $anchorScroll,
        $element,
        $mdToast,
        $mdDialog,
        $mdMedia
    ) {
        console.log(thisName + '.js is loading...');
        _fns.initCtrlr($scope, $element, thisName, false);

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
                $scope.getMyAppList();
            });
        }, function () {
            return _global.hasLogin;
        });


        //获取我的App列表
        $scope.getMyAppList = function () {
            var api = _global.api('pie_getMyApps');
            var dat = {};

            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        //重新排序
                        var arr = _fns.obj2arr(res.data.apps);
                        arr = arr.sort(function (a, b) {
                            return b.info.time - a.info.time;
                        });

                        $scope.myApps = res.data;
                        $scope.myApps.apps = _fns.arr2obj(arr, false);
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



        _fns.promiseRun(function (tm) {
            $scope.getMyAppList();
        }, function () {
            return _pie.myInfo;
        });


        //退出并刷新
        $scope.logout = function () {
            _global.logout(function () {
                window.location.reload();
            });
        };


        //跳转到App首页
        $scope.openApp = function (appname) {
            var str = _cfg.qn.BucketDomain + $rootScope.myInfo.id + '/' + appname + '/index.html';
            str = encodeURI(str);
            window.open(str);
        };

        //跳转到App首页
        $scope.editApp = function (appname) {
            var str = _global.hostUrl + '/pie/?page=pie_editor&app=' + appname;
            str = encodeURI(str);
            location.href = str;
        };

        //弹出提示窗口输入App名称
        $scope.openCreateDialog = function () {
            $mdDialog.show({
                contentElement: '#createDialog',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };

        $scope.cancelDialog = function () {
            $mdDialog.hide();
        };


        //弹出提示窗口输入App名称
        $scope.newApp = {};

        $scope.doCreateApp = function () {
            if (!_cfg.regx.appName.test($scope.newApp.name)) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('APP名称格式错误')
                    .position('top right')
                    .hideDelay(3000)
                );
                return;
            };
            if (!_cfg.regx.appAlias.test($scope.newApp.alias)) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('APP标识名格式错误')
                    .position('top right')
                    .hideDelay(3000)
                );
                return;
            };

            $scope.createApp($scope.newApp.name, $scope.newApp.alias);
        };



        //弹出重新初始化app的功能
        $scope.RIappName = '';
        $scope.RIappAlias = '';
        $scope.RIselTemplate = 'base';

        //弹出提示窗口重新初始化app
        $scope.openReInitDialog = function (appinfo) {
            $scope.RIappName = appinfo.name;
            $scope.RIappAlias = appinfo.alias;
            var confirm = $mdDialog.confirm()
                .title('您确定要重新初始化[' + $scope.RIappAlias + '(' + $scope.RIappName + ')]应用?')
                .textContent('警告！文件内容将被删除，丢失后无法找回！')
                .ariaLabel('reinit app')
                .ok('重新初始化')
                .cancel('取消');
            $mdDialog.show(confirm).then(function () {
                $scope.RIselTemplate = 'base';
                $mdDialog.show({
                    contentElement: '#reInitDialog',
                    parent: angular.element(document.body),
                    clickOutsideToClose: true
                });
            });
        };


        //执行重新初始化
        $scope.doReInitApp = function () {
            $mdToast.show(
                $mdToast.simple()
                .textContent('正在根据模版为您初始化APP文件，请稍后')
                .position('top right')
                .hideDelay(3000)
            );
            $scope.initAppByTemplate($scope.RIappName, $scope.RIselTemplate, function () {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('重新初始化完成，请点击菜单进入编辑文件')
                    .position('top right')
                    .hideDelay(3000)
                );
            });
            $scope.cancelDialog();
        };



        //自动随机标识名
        function randAppName() {
            return 'a' + Math.random().toString(36).substr(2, 11).toLowerCase();
        };

        //创建一个应用
        $scope.newApp.name = randAppName();
        $scope.newApp.alias = '我的应用' + String(Math.random()).substr(2, 4);

        $scope.createApp = function (appname, appalias) {
            var api = _global.api('pie_createApp');
            var dat = {
                appName: appname,
                appAlias: appalias,
            }
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    //刷新列表
                    $scope.getMyAppList();
                    $mdDialog.hide();

                    //根据模版自动初始化所有文件
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('正在根据模版为您初始化APP文件，请稍后')
                        .position('top right')
                        .hideDelay(3000)
                    );
                    $scope.initAppByTemplate(dat.appName, $scope.selTemplate, function () {
                        $mdToast.show(
                            $mdToast.simple()
                            .textContent('初始化完成，请点击菜单进入编辑文件')
                            .position('top right')
                            .hideDelay(3000)
                        );
                    });

                    $scope.newApp.alias = '我的应用' + String(Math.random()).substr(2, 4);
                    $scope.newApp.name = randAppName();
                } else {
                    //提示错误
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('创建APP失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
            });
        };


        //修改app的别名
        $scope.renameApp = function (appid) {
            //先弹窗输入新名字
            var confirm = $mdDialog.prompt()
                .title('请输入新的APP名称(使用中文或数字)')
                .textContent('3~32个字符.')
                .placeholder('App name')
                .ariaLabel('App name')
                .ok('确定')
                .cancel('取消');
            $mdDialog.show(confirm).then(function (ipt) {
                if (appid && ipt && _cfg.regx.appAlias.test(ipt)) {
                    //发送修改请求
                    $scope.dorenameApp(appid, ipt);
                } else {
                    //提示错误
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('App名称格式错误')
                        .position('top right')
                        .hideDelay(3000)
                    );
                }
            })
        };


        //执行修改名字的请求
        $scope.dorenameApp = function (id, alias) {
            var api = _global.api('pie_renameApps');
            var dat = {
                appId: id,
                appAlias: alias,
            }
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    //刷新列表
                    $scope.getMyAppList();
                    try {
                        _xdat.ctrlrs['pie_sideNav'][0].getMyAppList();
                    } catch (err) {}
                } else {
                    //提示错误
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('移除APP失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
            });
        };


        //弹出提示窗口提示移除app
        $scope.doRemoveApp = function (appname) {
            var confirm = $mdDialog.confirm()
                .title('您确定要移除 ' + appname + '应用吗?')
                .textContent('移除后将无法恢复.')
                .ariaLabel('remove app')
                .ok('确定移除')
                .cancel('取消');
            $mdDialog.show(confirm).then(function () {
                $scope.removeApp(appname);
            });
        };


        //创建一个应用
        $scope.removeApp = function (appname) {
            var api = _global.api('pie_removeApp');
            var dat = {
                appName: appname,
            }
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    //刷新列表
                    $scope.getMyAppList();
                    try {
                        _xdat.ctrlrs['pie_sideNav'][0].getMyAppList();
                    } catch (err) {}
                } else {
                    //提示错误
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('移除APP失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
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

        $scope.gotoProfile = function () {
            location.href = 'http://' + location.host + '/account/?page=acc_profile';
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

            var files = $scope.templates[tmpname].files;
            if (!files) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('找不到指定模版' + tmpname + '，初始化失败')
                    .position('top right')
                    .hideDelay(3000)
                );
                return;
            };

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



        //加入排行榜
        $scope.joinLadder = function (item) {
            var api = _global.api('pie_ladderJoin');
            var dat = {
                appId: item.val,
            }
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
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




        //弹出提示窗口重新初始化app
        $scope.openConfigDialog = function (appinfo) {
            $rootScope.tempDialogData = {};
            $rootScope.tempDialogData.app = appinfo;
            $rootScope.tempDialogData.fnAfterChange = function () {
                $scope.getMyAppList();
            };
            $mdDialog.show({
                controller: 'pie_dialog_appConfig',
                templateUrl: _fns.getDialogUrl('appConfig'),
                parent: angular.element(document.body),
                clickOutsideToClose: true
            })
        };





        //初始化bootstrap的tooltip工具
        $(document).ready(function () {
            $('[data-toggle="tooltip"]').tooltip();
        });


        //开始就打开左侧栏
        $(document).ready(function () {
            setTimeout(function () {
                if (!$rootScope.leftMenuOpen && $mdMedia("gt-sm")) {
                    //$('#leftnavbtn').click();
                };
            }, 1000);
        });



        //跳转到链接
        $scope.gotoLink = function (str) {
            window.open(str);
        };

        //end
    }
})();
