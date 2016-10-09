(function () {
    'use strict';
    var thisName = 'pie_tutor';

    _app.controller(thisName, thisFn);

    function thisFn(
        $rootScope,
        $scope,
        $location,
        $anchorScroll,
        $element,
        $mdToast,
        $mdDialog,
        $mdMedia,
        $filter
    ) {
        console.log(thisName + '.js is loading...');
        _fns.initCtrlr($scope, $element, thisName, false);

        $rootScope[thisName] = $scope;

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
            });
        }, function () {
            return _global.hasLogin;
        });

        //退出并刷新
        $scope.logout = function () {
            _global.logout(function () {
                window.location.reload();
            });
        };

        $scope.gotoProfile = function () {
            location.href = 'http://' + location.host + '/account/?page=acc_profile';
        };


        //修正背景色
        $('#curPage').css('background', '#FFF');


        //开始就打开左侧栏
        $(document).ready(function () {
            setTimeout(function () {
                if (!$rootScope.leftMenuOpen && $mdMedia("gt-sm")) {
                    $('#leftnavbtn').click();
                };
            }, 1000);
        });


        //版本历史信息
        $scope.his = [{
            title: '新增分享功能【分享到QQ／QQ空间／新浪微博／微信】',
            content: '可以在各处APP卡片上快速分享了，也可以在编辑器页面左上角的二维码位置打开分享功能',
            time: new Date('2016-10-8 22:04'),
         },{
            title: '我的收藏页面增加【手工添加收藏】按钮',
            content: '可以直接复制APP的首页链接地址，然后直接收藏这个APP',
            time: new Date('2016-10-6 16:06'),
         },{
            title: '左侧栏增加【我的收藏】，TOP榜单页APP卡片增加【收藏】按钮',
            time: new Date('2016-10-6 14:11'),
            content: '每个人可以方便的收藏别人的APP来使用或学习啦！'
         },{
            title: '左侧栏增加【TOP排行榜】，首页APP卡片菜单增加【打榜】',
            time: new Date('2016-10-5 21:49'),
            content: '任何参加【打榜】的APP都有同等的随机推荐机会，向所有用户展示你的APP;<br>推荐100次后根据点赞数多少进入TOP排名，大家都来把自己编写的APP秀出来吧！'
         }, {
            title: '左侧栏增加【What\'s New】和【关于我们】两个菜单',
            time: new Date('2016-10-3 15:12'),
            content: '【What\'s New】列出所有升级的新功能，即版本历史；<br>【关于我们】显示杰米诺课堂的创办理念和我们的各种联系方式'
         }]



        //end
    }
})();
