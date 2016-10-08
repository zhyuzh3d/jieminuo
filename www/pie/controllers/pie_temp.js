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


        $scope.showShareDialog = function () {
            $rootScope.tempDialogData = {
                title: 'XXX',
                url: 'http://www.jieminuoketang.com/pie/?page=pie_temp#/root#curPageUrl%23@pie_temp',
                pic: 'xx'
            };
            $mdDialog.show({
                controller: 'pie_dialog_share',
                templateUrl: _fns.getDialogUrl('share'),
                parent: angular.element(document.body),
                clickOutsideToClose: true
            })
        };



        //end
    }
})();
