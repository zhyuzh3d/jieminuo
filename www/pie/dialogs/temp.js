/*
分享选择弹窗及其控制器,注意不能引入$element
需要预先引入jquery.qrcode
共用$rootScope.tempDialogData
{title:'xxx',url:'http://xxx',pic:'htttp://xxx'}
*/

(function () {
    'use strict';
    var thisName = 'pie_dialog_share';

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

        //初始化节目数据
        (function () {
            $scope.shares = {
                qq: {
                    title: 'QQ',
                    icon: 'http://www.xmgc360.com/_imgs/QQclr.png',
                },
                qzone: {
                    title: 'QQ空间',
                    icon: 'http://www.xmgc360.com/_imgs/qzone.png',
                },
                weibo: {
                    title: '新浪微博',
                    icon: 'http://www.xmgc360.com/_imgs/新浪微博.png',
                },
            };
        })();

        //动态刷新分享的链接
        $scope.goShare = function (type) {
            var dialogData = $rootScope.tempDialogData;

            var title = dialogData.title ? dialogData.title : "我在杰米诺课堂学习编程啦，你也来吧！";
            var url = dialogData.url ? dialogData.url : "http://www.jieminuoketang.com";
            var pic = dialogData.pic ? $scope.xargs.pic : '';

            var strp = "title=" + encodeURIComponent(title) + "&url=" + encodeURIComponent(url) + "&pic=" + encodeURIComponent(pic);

            var str = '';
            switch (type) {
                case 'qq':
                    str = "http://connect.qq.com/widget/shareqq/index.html?" + strp;
                    break;
                case 'qzone':
                    str = "http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?" + strp + "&summary=我在杰米诺课堂学习编程啦，你也来吧！";
                    break;
                case 'weibo':
                    str = "http://service.weibo.com/share/share.php?" + strp;
                    break;
            };
            if (str && str != '') window.open(str);
        };


        //显示二维码和链接
        $scope.showQcode = function () {
            $scope.qcodeVisble = true;
            //使用jquery生成二维码
            var jo = $('#pie_share_dialog').find('#qrcode')
            jo.empty();
            jo.qrcode($rootScope.tempDialogData.url);
        };



        //end
    }
})();
