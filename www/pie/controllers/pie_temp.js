(function () {
    'use strict';
    var thisName = 'pie_temp';

    _app.controller(thisName, thisFn);

    function thisFn(
        $rootScope,
        $scope,
        $location,
        $anchorScroll,
        $element,
        $mdToast,
        $mdDialog
    ) {
        console.log(thisName + '.js is loading...');
        _fns.initCtrlr($scope, $element, thisName, false);

        //获取我的收藏app列表
        $scope.getCaptcha = function () {
            var api = _global.api('captcha_get');
            var dat = {};

            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        //重新排序
                        $scope.captcha = res.data.svg;
                    });
                }
            });
        };

        $scope.getCaptcha();




        //end
    }
})();
