(function () {
    'use strict';
    var thisName = 'pie_links';

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


        //相关链接
        $scope.resources = [{
            title: 'BootCDN开源项目CDN服务',
            desc: '这里列出了数千个Javascript插件或功能库，可以直接嵌入到页面代码中使用，可以说是前端开发和学习必备资源。',
            links: [
                ['官方站点', 'http://www.bootcdn.cn/'],
            ],
        }, {
            title: 'JQuery',
            icon: 'http://files.jieminuoketang.com/1/aaw6vsns2i5k/src/jquery_128px.png',
            desc: '当前最流行的JS功能库，提供丰富易用的各种功能，从操作DOM、选择器到事件控制、动画制作、AJAX，写JS脚本必备。base模版已经默认引入。',
            links: [
                ['中文文档', 'http://www.jquery123.com/'],
                ['CDN页面', 'http://www.bootcdn.cn/jquery/'],
            ],
        }, {
            title: 'Bootstrap',
            icon: 'http://files.jieminuoketang.com/1/aaw6vsns2i5k/src/bootstrap.jpeg',
            desc: '来自于Twitter，当前最受欢迎的Web前端UI框架，丰富精美的各种CSS样式类和多样的界面元件模版可选，提供经典的响应式布局解决方案，前端页面布局和美化必备神器。base模版已经默认引入。',
            links: [
                ['中文网站', 'http://www.bootcss.com/'],
                ['组件说明文档V3', 'http://v3.bootcss.com/'],
                ['CDN页面', 'http://www.bootcdn.cn/bootstrap/'],
            ],
        }, {
            title: 'Fontawesome',
            desc: '提供600多个常用图标，覆盖了绝大部分需要使用的图标，可以实现图标的变色、放缩和动画效果',
            links: [
                ['图标列表', 'http://fontawesome.io/icons/'],
                ['教程与范例', 'http://fontawesome.io/examples/'],
                ['CDN页面', 'http://www.bootcdn.cn/font-awesome/'],
            ],
        }, {
            title: 'Easyicon',
            desc: '图标图片库，数十万计的各类图标图片，可根据名称、类别、颜色进行搜索',
            links: [
                ['官方站点', 'http://www.easyicon.net/']
            ],
        }, {
            title: 'Iconfont',
            desc: '国内最大的字体图标库，由阿里巴巴体验团队打造，提供各种风格的字体和图标样式，应有尽有，可定制。',
            links: [
                ['图标库列表', 'http://www.iconfont.cn/collections'],
                ['CDN页面', 'http://www.bootcdn.cn/font-awesome/'],
            ],
        }, {
            title: 'Material Desin谷歌设计规范',
            desc: '基于Android的谷歌产品通用设计规范，统一优雅的界面风格，跨越PC和手机等各种设备。UI设计必须学习的内容。',
            links: [
                ['官方站点(可能需要翻墙)', 'https://material.google.com/'],
            ],
        }, {
            title: 'AngularJs',
            icon: ' http://files.jieminuoketang.com/1/aaw6vsns2i5k/src/angular2.png',
            desc: '当前非常流行的Web前端开发框架，优秀的MVC设计开发模式，有效提高产品开发速度和可扩展性。推荐专业开发人士使用。本站点就是基于angularjs开发。Angular模版将自动引入。',
            links: [
                ['官方站点', 'https://angularjs.org/'],
                ['CDN页面', 'http://www.bootcdn.cn/angular.js/'],
            ],
        }, {
            title: 'Angular Material Design',
            icon: ' http://files.jieminuoketang.com/1/aaw6vsns2i5k/src/angular2.png',
            desc: '基于angularjs的material design风格界面框架，提供了丰富的界面组件，与angularjs深度整合。本站点主要页面都使用了这个框架。',
            links: [
                ['官方站点', 'https://material.angularjs.org/latest/'],
                ['CDN页面', 'http://www.bootcdn.cn/angular-material/'],
            ],
        }, {
            title: '在线编码转换工具',
            desc: '由oschina提供的utf-8/ASCII/url编码转换工具，在线转换非常方便',
            links: [
                ['转换器链接', 'http://tool.oschina.net/encode'],
            ],
        }, {
            title: 'Animate.Css',
            desc: '炫酷的动画CSS样式库，让DOM元素各种动起来',
            links: [
                ['官方站点和动画示例', 'https://daneden.github.io/animate.css/'],
            ],
        }];


        //常用工具
        $scope.tools = [{
            title: '谷歌浏览器(Chrome)',
            icon: 'http://files.jieminuoketang.com/1/aaw6vsns2i5k/src/chrome_128px.png',
            desc: '目前全世界最流行、用户最多的浏览器；为开发者提供了优秀的开发和测试辅助工具；首选推荐浏览器',
            links: [
                ['搜索下载', 'http://cn.bing.com/search?q=%E8%B0%B7%E6%AD%8C%E6%B5%8F%E8%A7%88%E5%99%A8&qs=AS&pq=%E8%B0%B7%E6%AD%8C&sk=AS1&sc=8-2&sp=2&cvid=7A99AEFF19FF420D894F819B971919F4&FORM=QBRE'],
                ['官方站点(可能需要翻墙)', 'http://www.google.cn/intl/zh-CN/chrome/browser/desktop/index.html'],
            ],
        }, {
            title: '火狐浏览器',
            icon: 'http://files.jieminuoketang.com/1/aaw6vsns2i5k/src/Firefox_128px.png',
            desc: '世界领先的优秀浏览器，同样为开发者提供了优秀的开发和测试辅助工具；推荐使用',
            links: [
                ['官方中文站点', 'http://www.firefox.com.cn/'],
            ],
        }, {
            title: 'Brackets离线编辑器',
            icon: 'http://files.jieminuoketang.com/1/aaw6vsns2i5k/src/brackets.jpeg',
            desc: '功能先进的Web编程工具，代码编辑器；推荐从事专业开发的同学使用',
            links: [
                ['官方英文站点', 'http://brackets.io/'],
            ],
        }];

        //学习资源
        $scope.tutors = [{
            title: 'W3school在线教程中文站',
            desc: '全面的WEB开发入门学习资源，详细列出了Html的全部标记、css3全部样式属性、Javascript全部函数方法，是初学者必不可少的技术参考资料',
            links: [
                ['官方站点', 'http://www.w3school.com.cn/index.html'],
                ['Html全面学习教程', 'http://www.w3school.com.cn/html/index.asp'],
                ['Html全部标签参考手册', 'http://www.w3school.com.cn/tags/index.asp'],
                ['Css全面学习教程', 'http://www.w3school.com.cn/css/index.asp'],
                ['Css全部属性参考手册', 'http://www.w3school.com.cn/cssref/index.asp'],
                ['Javascript全面学习教程', 'http://www.w3school.com.cn/css/index.asp'],
                ['JQuery全面学习手册', 'http://www.w3school.com.cn/jquery/index.asp']
            ],
        }, {
            title: 'W3school在线教程英文站',
            desc: '全英文站点，比中文站点更新、更全面，包含了中文站没有的bootstrap、Angular学习内容。强烈推荐有英文基础的同学使用。',
            links: [
                ['官方站点', 'http://www.w3schools.com/'],
                ['Bootstrap全面学习教程', 'http://www.w3schools.com/bootstrap/default.asp'],
                ['AngularJs全面学习教程', 'http://www.w3schools.com/angular/default.asp'],
            ],
        }, {
            title: 'MDN开发者网络中文版',
            desc: 'Mozilar Neveloper Newwork，权威性的web开发技术指南，这里集中了html／css／js等技术的更详细更准确的说明',
            links: [
                ['官方站点', 'https://developer.mozilla.org/zh-CN/'],
                ['了解Web开发', 'https://developer.mozilla.org/zh-CN/docs/Learn'],
                ['Html全部标记列表索引', 'https://developer.mozilla.org/zh-CN/docs/Web/HTML/Element'],
                ['Css全部属性列表索引', 'https://developer.mozilla.org/zh-CN/docs/Web/CSS/Reference'],
                ['Javascript教程及技术参考', 'https://developer.mozilla.org/zh-CN/docs/Web/JavaScript']
            ],
        }];



        //合并多个列表生成 all
        var allitems = [];
        $scope.allitems = allitems;

        var arrs = [['参考手册', $scope.tutors], ['推荐工具', $scope.tools], ['常用链接', $scope.resources]];
        $scope.arrs = arrs;

        arrs.forEach(function (list) {
            list[1].forEach(function (item) {
                allitems.push(item);
            });
        });


        //跳转到链接
        $scope.gotoLink = function (str) {
            window.open(str);
        };


        //end
    }
})();
