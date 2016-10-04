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



        var a = 0;
        console.log('>>>>nil==', a == null);
        console.log('>>>>nil!=', a != null);
        console.log('>>>>nil!==', a !== null);

        //锚点
        $scope.goto = function (key) {
            $location.hash(key);
            $anchorScroll();
        };


        //从info.json获取各个接口信息
        $scope.getApis = function () {
            var api = 'http://www.jieminuoketang.com/pie/web/info.json';
            $.get(api, function (res) {
                var res = JSON.parse(res);
                console.log('POST', api, undefined, res);
                _fns.applyScope($scope, function () {
                    $scope.apis = res.apis;
                    //每个api都增加senDat和sendPost方法
                    if ($scope.apis) {
                        $scope.apis.forEach(function (item, i) {
                            item.sendDat = {};
                            item.sendPost = function () {
                                var sendapi = 'http://www.jieminuoketang/api/' + item.name + '/';
                                $.post(sendapi, item.sendDat, function (sendres) {
                                    console.log('POST', sendapi, item.sendDat, sendres);
                                    _fns.applyScope($scope, function () {
                                        item.recvDat = sendres;
                                    });
                                });
                            };
                        })
                    };
                });
            }, 'html');
        };
        $scope.getApis();


        $scope.uploader = {};
        $scope.uploadFile = function () {
            var xhr = _fns.uploadFileQn2($scope.uploader.file.name, $scope.uploader.file, function (arg1, arg2, arg3) {
                console.log('procing:', arg1, arg2, arg3);
            }, function (arg1, arg2, arg3) {
                console.log('success:', arg1, arg2, arg3);
            })
        };


        $scope.uploadData = function () {
            var blob = new Blob([$scope.uploader.data], {
                type: "text/html"
            });
            var xhr = _fns.uploadFileQn2('hahaha3.html', blob, function (arg1, arg2, arg3) {
                console.log('procing-bb:', arg1, arg2, arg3);
            }, function (arg1, arg2, arg3) {
                console.log('success-bb:', arg1, arg2, arg3);
            });
        };








        //----------------------------

        $scope.db = new Wilddog("https://simiduihua.wilddogio.com");

        $scope.db.child('quanbuduihua').on("value", function (data) {
            $scope.quanbuduihua = data.val();
            $scope.$apply();
            $location.hash('dibu');
            $anchorScroll();
        });

        $(window).bind('resize', function (evt) {
            $location.hash('dibu');
            $anchorScroll();
        });

        $scope.tianjiaduihua = function () {
            $scope.db.child('quanbuduihua').push({
                neirong: $scope.xinduihua,
                shijian: (new Date()).getTime(),
                zuozhe: _pie.myUsrInfo.nick,
                touxiang: _pie.myUsrInfo.avatar,
            });
            $scope.xinduihua = '';
        };









        //222222222222222
        $scope.quanbuduihua = [];

        $scope.fasong = function () {
            $scope.quanbuduihua.push({
                neirong: $scope.xinneirong,
                zuozhe: _pie.myUsrInfo.nick,
                shijian: (new Date()).getTime(),
            })
        }





        //布局完成









        //------------------------









        //end
    }
})();
