(function () {
    'use strict';
    var thisName = 'pie_sideNav';

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

        $rootScope[thisName] = $scope;

        $scope.menus = [{
            name: '我的首页',
            icon: 'fa fa-bomb',
            ctrlr: 'pie_welcome',
        }]

        $(window).ready(function () {
            setTimeout(function () {
                //载入完毕后执行
            }, 1000)
        });

        $scope.goHome = function () {
            $rootScope.tagLeftMenu();
            window.location.href = _global.hostUrl;
        };

        $scope.name = thisName;

        //获取App列表，显示在左侧栏
        $scope.getMyAppList = function () {
            var api = _global.api('pie_getMyApps');
            $.post(api, undefined, function (res) {
                console.log('POST', api, undefined, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        //重新排序
                        var arr = _fns.obj2arr(res.data.apps);
                        arr = arr.sort(function (a, b) {
                            return b.info.time - a.info.time;
                        });

                        $scope.myApps = res.data;
                        $scope.myApps.apps = _fns.arr2obj(arr);
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
        $scope.getMyAppList();


        //从侧栏打开app编辑器
        $scope.editApp = function (appname) {
            var str = 'http://' + window.location.host + '/pie/?page=pie_editor&app=' + appname;
            str = encodeURI(str);
            $rootScope.tagLeftMenu();
            location.href = str;
        };









        //end
    }
})();
