(function () {
    'use strict';
    angular.module('app', []).controller('bodyController', function ($rootScope, $scope, $location, $anchorScroll) {




            //等待global读取账号信息成功后刷新右上角用户
            _global.promiseRun(function () {
                $scope.$apply(function () {
                    $scope.myUsrInfo = _global.myUsrInfo;
                    $scope.hasLogin = _global.hasLogin;
                });
            }, function () {
                return _global.hasLogin;
            });







            //end ctrlr
        });

})();
