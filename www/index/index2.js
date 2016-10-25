(function () {
    'use strict';
    angular.module('app', []).controller('bodyController', function ($rootScope, $scope, $location, $anchorScroll) {


        /*
        var api = 'http://localhost:8000/api/ext_getWildDogCustomToken';
        $.get(api, function (res) {
            console.log('>>get', res);
        }, 'jsonp');
        */


        var api = 'http://localhost:8000/api/ext_httpProxy';

        var path = '/openapi/api'
        var data = {
            type: 'http',
            opt: {
                hostname: 'www.tuling123.com',
                port: 80,
                path: path,
                method: 'POST',
            },
            body: {
                key: '{{tulingkey}}',
                info: '刘德华是谁',
            },
        };

        api += '?data=' + encodeURIComponent(JSON.stringify(data));

        $.get(api, function (res) {
            console.log('>>get', res);
        }, 'jsonp')


        var tulingapi = 'http://www.tuling123.com/openapi/api';
        $.post(tulingapi, {
            key: 'a279a3e8ce04433aa0461f42aebf91ba',
            info: '刘德华是谁',
            userid: 1
        }, function (res) {
            //console.log('tuling', res);
        });



    });









})();
