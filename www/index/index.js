(function() {
    'use strict';
    angular.module('app', []).controller('bodyController', function($rootScope, $scope, $location, $anchorScroll) {

        //初始化fullpage
        $(document).ready(function() {
            $('#fullpage').fullpage({
                slidesNavigation: false,
                slidesNavPosition: 'bottom',
                controlArrows: false,
            });
            $('body').show();
            $('.fp-slidesNav').find('span').css('background', '#FFF');
        });

        $scope.nextPage = function() {
            $.fn.fullpage.moveSectionDown();
        };

        $scope.nextSlide = function() {
            $.fn.fullpage.moveSlideRight();
        };

        $scope.prevSlide = function() {
            $.fn.fullpage.moveSlideLeft();
        };

        $scope.gotoPie = function() {
            location.href = 'http://' + location.host + '/pie/';
        };


        //前端页面内容
        $scope.clientList = [{
            title: 'html5+CSS3+Javascript',
            list: ['什么是标识语言？',
                '如何读懂网页源码？',
                'HTML5的新特性有哪些？',
                '如何CSS3美化网页样式？',
                '怎么最快速实现炫酷动画？',
                '如何最快速度搞定JS编程',
                '怎么搞定正则表达式？',
                '更多...'
            ],
        }, {
            title: 'jquery+bootstrap',
            list: ['如何快速创建美观的站点？',
                '不写脚本也能做动态交互？',
                '选择操纵每个元素！',
                '精通AJAX网络通信！',
                '更多...',
            ],
        }, {
            title: 'angularjs+material design',
            list: ['再不懂MVC你就OUT了！',
                '要做网站架构师！',
                '怎么做到模块化网页开发？',
                '选择操纵每个元素！',
                'MD：最强UI界面！',
                '更多...',
            ],
        }];

        //后端页面内容
        $scope.serverList = [{
            title: 'nodejs+koa',
            list: ['怎么最快速上手服务器端开发？',
                '如何才算看通请求和响应？',
                '路由的策略是什么？',
                '怎么搭建服务端框架？',
                '如何用socketIO搭建实时通信系统？',
                '什么是ES6？',
                '神器promise带给我们什么？',
                '玩转邮件和手机账号注册！',
                '更多...'
            ],
        }, {
            title: 'redis',
            list: ['Redis是什么鬼？',
                '大道至简的数据策略！',
                '如何玩转数据类型？',
                'Session缓存怎么用？',
                '更多...',
            ],
        }, {
            title: 'Mysql+MongoDb',
            list: ['如何玩转增删改查？',
                '什么是事务和原子性操作？',
                '怎么让数据库性能翻倍？',
                'Mongoose是什么？',
                '优化！优化！',
                '如何玩转数据安全与加密！',
                '更多...',
            ],
        }];

        //云端页面内容
        $scope.cloudList = [{
            title: 'QCLOUD+centOS',
            list: ['腾讯云都有哪些牛X产品？',
                '如何搞定域名和解析？',
                '怎么玩转云服务器？',
                '什么是对象存储CDN？',
                '云端安全！云端防护！',
                '更多...'
            ],
        }, {
            title: 'Nginx',
            list: ['Nginx是什么鬼？',
                '如何快速配置静态Web服务器？',
                '如何实现端口代理和转发？',
                '怎么实现多服务器网络应用架构？',
                '更多...',
            ],
        }, {
            title: 'More things',
            list: ['怎么做好版本管理和持续集成？',
                '如何玩转七牛云服务？',
                '如何玩转各类api市场接口？',
                '野狗是什么鬼？',
                '如何玩转阿里云？',
                '更多...',
            ],
        }]


    });
})();
