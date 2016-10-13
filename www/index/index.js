(function () {
    'use strict';
    angular.module('app', []).controller('bodyController', function ($rootScope, $scope, $location, $anchorScroll) {




        //等待global读取账号信息成功后刷新右上角用户
        _global.promiseRun(function () {
            $scope.$apply(function () {
                $scope.myUsrInfo = _global.myUsrInfo;
                $scope.hasLogin = _global.hasLogin;
            });
        }, function () {
            return _global.hasLogin;
        });


        //注销
        $scope.loginout = function () {
            _global.logout(function () {
                $scope.$apply(function () {
                    $scope.myUsrInfo = _global.myUsrInfo;
                    $scope.hasLogin = _global.hasLogin;
                });
            })
        };

        //各种跳转函数
        $scope.nextPage = function () {
            $.fn.fullpage.moveSectionDown();
        };

        $scope.prevPage = function () {
            $.fn.fullpage.moveSectionUp();
        };

        $scope.nextSlide = function () {
            $.fn.fullpage.moveSlideRight();
        };

        $scope.prevSlide = function () {
            $.fn.fullpage.moveSlideLeft();
        };

        $scope.gotoPie = function () {
            var pieurl = 'http://' + location.host + '/pie/';
            if ($scope.hasLogin) {
                location.href = pieurl;
            } else {
                location.href = 'http://' + location.host + '/account/?page=acc_login' + '&&okUrl=' + pieurl;
            }
        };

        $scope.gotoLadder = function () {
            var pieurl = 'http://' + location.host + '/pie/?page=pie_ladder';
            if ($scope.hasLogin) {
                location.href = pieurl;
            } else {
                location.href = 'http://' + location.host + '/account/?page=acc_login' + '&&okUrl=' + pieurl;
            }
        };

        $scope.gotoFavor = function () {
            var pieurl = 'http://' + location.host + '/pie/?page=pie_favors';
            if ($scope.hasLogin) {
                location.href = pieurl;
            } else {
                location.href = 'http://' + location.host + '/account/?page=acc_login' + '&&okUrl=' + pieurl;
            }
        };


        $scope.gotoTor = function () {
            var pieurl = 'http://' + location.host + '/pie/?page=pie_tutor';
            if ($scope.hasLogin) {
                location.href = pieurl;
            } else {
                location.href = 'http://' + location.host + '/account/?page=acc_login' + '&&okUrl=' + pieurl;
            }
        };

        $scope.gotoProfile = function () {
            var pieurl = 'http://' + location.host + '/account/?page=acc_profile';
            if ($scope.hasLogin) {
                location.href = pieurl;
            } else {
                location.href = 'http://' + location.host + '/account/?page=acc_login' + '&&okUrl=' + pieurl;
            }
        };


        $scope.goto360 = function () {
            location.href = 'http://www.xmgc360.com/';
        };

        $scope.gotoHome = function () {
            location.href = 'http://www.jieminuoketang.com/';
        };

        $scope.gotoFS = function () {
            location.href = 'http://ke.qq.com/course/156211';
        };
        $scope.gotoBD = function () {
            location.href = 'http://www.chuanke.com/s7227624.html';
        };
        $scope.gotoTX = function () {
            location.href = 'http://jmnkt.ke.qq.com/';
        };

        $scope.gotoTour = function () {
            location.href = 'http://' + location.host + '/pie/';
        };

        $scope.gotoHome = function () {
            location.href = 'http://' + location.host + '/';
        };

        $scope.gotoReg = function () {
            var pieurl = 'http://' + location.host + '/pie/';
            location.href = 'http://' + location.host + '/account/?page=acc_register' + '&&okUrl=' + pieurl;
        };

        $scope.gotoLogin = function () {
            var pieurl = 'http://' + location.host + '/pie/';
            location.href = 'http://' + location.host + '/account/?page=acc_login' + '&&okUrl=' + pieurl;
        };



        //课程列表
        $scope.courses = [{
            title: 'Web前端开发工程师 微信小程序/CSS/html5/JavaScript/全栈开发',
            url: 'https://ke.qq.com/course/156211',
            thum: 'https://10.url.cn/qqcourse_logo_ng/ajNVdqHZLLBwjla2vMFeR026JSQL6ic7YeaFfGcxfR1EVfkceyLkQG851hp2GLtwXIu7hmzpKZibU/510',
        }, {
            title: '0基础想学习微信小程序开发？你要知道什么是html5',
            url: 'https://ke.qq.com/course/159672',
            thum: 'https://10.url.cn/qqcourse_logo_ng/ajNVdqHZLLDkz80YVTeFjcjRs1fOUfJBoCiatcVM4ibPicYyRXvaGxHN6w76CpXPz5UnTLhILTyYjg/510',
        }, {
            title: 'html网页文件是怎样的？0基础成为WEB全栈工程师',
            url: 'https://ke.qq.com/course/159739',
            thum: 'https://10.url.cn/qqcourse_logo_ng/ajNVdqHZLLCCLmf1G4kxxsbECOyOz6DSic8ic5gicpy8qibOEYyhecImvAgQ0hLkmo80LnZ4ZWdkYJM/510',
        }, {
            title: '0基础成为年薪20W的UI设计师',
            url: 'http://www.chuanke.com/7227624-187659.html',
            thum: 'http://web.img.chuanke.com/course/2016-08/25/78950c50e1356059fe9b74fbbcec43d8.jpg',
        }, {
            title: '从0基础到精通 C++开发工程师 第一季',
            url: 'https://ke.qq.com/course/153750',
            thum: 'https://10.url.cn/qqcourse_logo_ng/ajNVdqHZLLCZJYdKRN72JSthrplnp1Vm8OY8DBFibmYaKSE2LfLRwx3nKQvfibj4w0XejTfrQc59w/510',
        }, {
            title: '从0基础到精通 C++开发工程师 第二季',
            url: 'https://ke.qq.com/course/153750',
            thum: 'https://10.url.cn/qqcourse_logo_ng/ajNVdqHZLLBdZYiaEq3IzfvaBeDSKhAtbMU5e228hE3HwbzdCuE7tBvkDQCLc7FLpwDHZy69ra6E/510',
        }, {
            title: '从0基础到精通 C++开发工程师 第三季',
            url: 'https://ke.qq.com/course/153800',
            thum: 'https://10.url.cn/qqcourse_logo_ng/ajNVdqHZLLDTMckpb4zSKB1IegmF5KHM6pltarM1ggsdBmiadTtACj9IcgsIzGFzic5VoXq2WWSbg/510',
        }, {
            title: '从0基础到精通 C++开发工程师 第四季',
            url: 'https://ke.qq.com/course/153804',
            thum: 'https://10.url.cn/qqcourse_logo_ng/ajNVdqHZLLApC3BOzNFzMZT0WbZRd1oWqMia4nb6x0uQeyRSErWwKZicDZg69VQScfOStiadx1J9WQ/510',
        }, {
            title: '0基础成为年薪20W的JAVA开发工程师',
            url: 'http://www.chuanke.com/7227624-187654.html',
            thum: 'http://web.img.chuanke.com/course/2016-08/25/0e4f3069f2e4eb1de7b603266bc4116d.jpg',
        }, {
            title: '零基础成为年薪20W的iOS开发工程师',
            url: 'http://www.chuanke.com/7227624-187653.html',
            thum: 'http://web.img.chuanke.com/course/2016-08/25/fa608916ab959d5d1b902e9f74d153bd.jpg',
        }, {
            title: '从0到1成为C++开发工程师 手把手教学第一季',
            url: 'http://www.chuanke.com/7227624-182288.html',
            thum: 'http://web.img.chuanke.com/course/2016-07/21/677356413e850e61b63e404aeef8c2e0.jpg',
        }, {
            title: '从0到1成为C++开发工程师 手把手教学第三季',
            url: 'http://www.chuanke.com/7227624-182521.html',
            thum: 'http://web.img.chuanke.com/course/2016-07/21/c2eaca9f4ac5b8ed4979edaab9b8109d.jpg',
        }, {
            title: '从0到1成为C++开发工程师 手把手教学第四季',
            url: 'http://www.chuanke.com/7227624-182523.html',
            thum: 'http://web.img.chuanke.com/course/2016-07/21/63e71c632596b89ab41cd245e258d472.jpg',
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



    });









})();
