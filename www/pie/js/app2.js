//每个页面都引入这个文件，提供所有的全局设置和文件引入

//屏蔽顶部导航栏
if (!_pie) _pie = {};
_pie.useNavBar = 'none';

var _app = {}; //最高全局变量，angular

(function _main() {
    'use strict';


    //初始化
    _app = angular.module('app', [
        'app.factories',
        'app.services',
        'app.filters',
        'app.directives',
        'app.controllers',
        'ngMaterial',
        'ui.codemirror'
    ]);

    //基础设置
    _app.config(angularConfig);

    function angularConfig(
        $controllerProvider,
        $compileProvider,
        $filterProvider,
        $provide,
        $mdThemingProvider,
        $sceDelegateProvider
    ) {
        //指向_app
        _app.controller = $controllerProvider.register;
        _app.service = $provide.service;
        _app.factory = $provide.factory;
        _app.directive = $compileProvider.directive;
        _app.filter = $filterProvider.register;

        $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            'http://rtfiles.jieminuoketang.com/**',
            'http://files.jieminuoketang.com/**'
        ]);


        //material design theme主题颜色定制
        $mdThemingProvider.theme('default')
            .primaryPalette('teal', {
                'default': 'A700'
            })
            .accentPalette('pink', {
                'default': '400'
            })
            .warnPalette('red', {
                'default': '600'
            });
    };


    //初始化各种功能
    angular.module('app.factories', []);
    angular.module('app.services', []);
    angular.module('app.filters', []);
    angular.module('app.directives', []);
    angular.module('app.controllers', []);

    //执行rootscope控制器代码，可被其他控制器调用
    _app.run(function angularRun($rootScope, $timeout, $mdSidenav, $log, $mdMedia) {
        //把rootscope记录到xdat
        $rootScope.xargs = {
            id: 'root',
        };
        _fns.initCtrlr($rootScope, undefined, 'root', true);

        //使用锚点跳转控制器
        $(window).on('hashchange', function (evt) {
            _fns.changeCtrlrByHash();
        });

        //共用的弹窗数据容器
        $rootScope.tempDialogData = {};

        //通过锚点跳转控制器的函数,模拟a标签点击
        $rootScope.lastCtrlr; //上一个跳转的控制器
        $rootScope.ctlrHis = []; //上一个跳转的控制器

        $rootScope.gotoCtrlr = function (ctrlrName, id, attr) {
            if (!ctrlrName || ctrlrName == '') {
                ctrlrName = _cfg.startPage;
            }
            var url = _fns.getCtrlrUrl(ctrlrName);
            if (!url) return;

            if (!id) id = 'root';
            if (!attr) attr = 'curPageUrl';

            $rootScope.lastCtrlr = ctrlrName;
            $rootScope.ctlrHis.push(ctrlrName);

            //模拟a标签点击，延迟50毫秒避免 $apply 进程报错
            var adom = $('<a href="#' + id + '#' + attr + '#@' + ctrlrName + '">...</a>');
            adom.hide();
            $('body').append(adom);
            setTimeout(function () {
                adom[0].click();
                adom.remove();
            }, 50);
        };


        //跳转到默认起始页控制器
        $(document).ready(function () {
            var ctrlrName = _cfg.startPage;
            var autohash = _fns.changeCtrlrByHash();

            //自动跳转也把控制器计入历史
            if (autohash && autohash.ctrlr) {
                $rootScope.lastCtrlr = ctrlrName;
                $rootScope.ctlrHis.push(ctrlrName);
            };

            if (!autohash) {
                $rootScope.gotoCtrlr();
            };
        });

        //侧栏,默认允许固定
        $rootScope.leftMenuOpen = true;
        $rootScope.enableBlockLeftNav = true;
        $rootScope.sideNavUrl = _fns.getCtrlrUrl('pie_sideNav');

        //仅供测试
        $rootScope.tempCtrlrUrl = _fns.getCtrlrUrl('pie_temp');

        //显示左侧栏,接收true／false
        $rootScope.tagLeftMenu = function (open) {

            if (open === undefined) {
                if ($mdSidenav('left').isLockedOpen()) {
                    $rootScope.enableBlockLeftNav = false;
                    $mdSidenav('left').close().then(function () {
                        $rootScope.leftMenuOpen = $mdSidenav('left').isLockedOpen() ? true : $mdSidenav('left').isOpen();
                    });
                } else {
                    $rootScope.enableBlockLeftNav = true;
                    $mdSidenav('left').toggle().then(function () {
                        $rootScope.leftMenuOpen = $mdSidenav('left').isLockedOpen() ? true : $mdSidenav('left').isOpen();
                    });
                };
            } else if (open) {
                if (!$mdSidenav('left').isLockedOpen() && !$mdSidenav('left').isOpen()) {
                    $rootScope.enableBlockLeftNav = true;
                    $mdSidenav('left').open().then(function () {
                        $rootScope.leftMenuOpen = $mdSidenav('left').isLockedOpen() ? true : $mdSidenav('left').isOpen();
                    });
                };
            } else {
                if ($mdSidenav('left').isLockedOpen() || $mdSidenav('left').isOpen()) {
                    $rootScope.enableBlockLeftNav = false;
                    $mdSidenav('left').close().then(function () {
                        $rootScope.leftMenuOpen = $mdSidenav('left').isLockedOpen() ? true : $mdSidenav('left').isOpen();
                    });
                };
            };
        };

    });

    _app.controller('appCtrlr', appCtrlr);

    //整体控制器代码，与 $rootscope 类似，只是不能被其他控制器自由调用
    function appCtrlr($rootScope, $scope, $mdToast, $mdMedia) {
        $scope.xargs = {
            id: 'app',
        };
        _fns.initCtrlr($scope, undefined, 'appCtrlr', true);

        //自动调整屏幕高度宽度
        $scope.scrHei = $(window).height();
        $scope.scrWid = $(window).width();

        $(window).resize(function () {
            _fns.applyScope($scope, function () {
                $scope.scrHei = $(window).height();
                $scope.scrWid = $(window).width();
            })
        });


        //自动登陆获取自己信息记录到$root
        $rootScope.getMyInfo = function () {
            var api = _global.api('acc_getMyInfo');
            var dat = {};

            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    $rootScope.myInfo = res.data;
                } else {
                    //提示错误
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('您还没有登陆和注册，很多功能将无法使用')
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
            });
        };
        $rootScope.getMyInfo();
    };

    //filter：显示为html样式
    _app.filter(
        'toTrustHtml',
        function ($sce) {
            return function (text) {
                return $sce.trustAsHtml(text);
            }
        }
    );

    //filter：显示文件名
    _app.filter(
        'fileName',
        function () {
            return function (url) {
                if (!url) return '';
                return url.substring(url.lastIndexOf('/') + 1);
            }
        }
    );

    //noJsTag:去掉所有的<script>标签
    _app.filter(
        'noJsTag',
        function () {
            return function (data) {
                return data.replace(/<script[\S\s]*>[\S\s]*<\/script>/g, '');
            }
        }
    );

    //filter：隐私信息，一半用*代替
    _app.filter(
        'halfHide',
        function () {
            return function (str) {
                if (!str) return undefined;
                var shown = Math.ceil(str.length / 2);
                var startn = Math.floor(shown / 2);
                var endn = shown - startn;
                var hiden = str.length - shown;
                var rep = '';
                for (var i = 0; i < hiden; i++) {
                    rep += '*';
                };
                var str2 = str.substr(0, startn) + rep + str.substr(startn + shown);
                return str2;
            }
        }
    );




    //onlyBody：只截取<body></body>标签中间的部分
    _app.filter(
        'onlyBody',
        function () {
            return _fns.getBody;
        }
    );

    //把css文件读取的内容嵌套到<style>标签里面
    _app.filter(
        'styleCss',
        function () {
            return function (str) {
                if (!str) str = '';
                str = String(str);
                var res = '<style>' + str + '</style>';
                return res;
            };;
        }
    );


    //单纯的添加一些空行，默认10行
    _app.filter(
        'addEmptyLine',
        function (n) {
            return function (str) {
                if (!n) n = 10;
                if (!str) str = '';
                for (var i = 0; i < n; i++) {
                    str += '\n'
                }
                return res;
            };;
        }
    );



    //directive:上传文件的指令
    //<file name="image" ng-model="inputFile" accept="image/png,image/jpg,image/jpeg" />
    _app.directive('file', function () {
        return {
            restrict: 'E',
            template: '<input type="file" />',
            replace: true,
            require: 'ngModel',
            link: function (scope, element, attr, ctrl) {
                var listener = function () {
                    scope.$apply(function () {
                        attr.multiple ? ctrl.$setViewValue(element[0].files) : ctrl.$setViewValue(element[0].files[0]);
                    });
                }
                element.bind('change', listener);
            }
        }
    });




    //end

})();
