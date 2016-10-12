/*
分享选择弹窗及其控制器,注意不能引入$element
需要预先引入jquery.qrcode
共用$rootScope.tempDialogData
{title:'xxx',url:'http://xxx',pic:'htttp://xxx'}
*/

(function () {
    'use strict';
    var thisName = 'pie_dialog_chars';

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

        var editor = $rootScope.tempDialogData.editor;

        //初始化字符数据
        $scope.chars1 = {
            '<': '<',
            '>': '>',
            '(': '(',
            ')': ')',
            '[': '[',
            ')': ')',
            '{': '{',
            '}': '}',
        };
        $scope.chars2 = {
            '.': '.',
            ';': ';',
            '\'': '\'',
            '\"': '\"',
            '$': '$',
            '#': '#',
            '&&': '&&',
            '||': '||',
            '+': '+',
            '-': '-',
            '*': '*',
            '/': '/',
            '=': '=',
            '!': '!',
            '%': '%',
            '_': '_',
            '^': '^',
            '\\': '\\',
            '@': '@',
        };

        $scope.insertChar = function (str) {
            if (editor) {
                editor.insertChar(str);
                $scope.cancelDialog();
            } else {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('插入失败，没找到编辑器')
                    .position('top right')
                    .hideDelay(3000)
                );
            }

        };

        //关闭弹窗
        $scope.cancelDialog = function () {
            $mdDialog.hide();
        };






        //end
    }
})();
