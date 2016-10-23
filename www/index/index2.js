(function () {
    'use strict';
    angular.module('app', []).controller('bodyController', function ($rootScope, $scope, $location, $anchorScroll) {


        var api = 'http://localhost:8000/api/ext_getWildDogCustomToken';
        $.get(api, function (res) {
            console.log('>>get', res);
        }, 'jsonp')




    });









})();
