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


        //案例教程
        $scope.sampleTutors = [{
            title: '<span style="color:#ec407a">零基础，1分钟带你做闪瞎眼的Hello world!</span>',
            desc: '看1分钟视频，敲7行代码，挑战你能不能搞定编程！',
            links: [
                ['教程链接', 'http://rtfiles.jieminuoketang.com/1/ax0uonxp39is/index.html'],
            ],
        }];

        //知识点教程
        $scope.baseTutors = [{
            title: '<span style="color:#ec407a">HTML基础入门课程</span>',
            desc: '腾讯课堂全套Web开发技术课程，免费开放中',
            links: [
                ['先要免费加入课程，点这里！', 'https://ke.qq.com/course/156211'],
                ['01.什么是html？(5分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823212086813235&vid=k1413vozmsl'],
                ['02.网页的html结构是怎么样的？(8分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823216381780531&vid=x1413n0c7ix'],
                ['03.网页head能放哪些内容？(8分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823220676747827&vid=y1413yrugrq'],
                ['04.网页的body能放哪些标记？(8分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823224971715123&vid=y1413yrugrq']
            ],
        },{
            title: '<span style="color:#ec407a">CSS基础入门课程</span>',
            desc: '腾讯课堂全套Web开发技术课程，免费开放中',
            links: [
                ['先要免费加入课程，点这里！', 'https://ke.qq.com/course/156211'],
                ['01.什么是css？(7分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823229266682419&vid=g1413rg1vqp'],
                ['02.如何批量修改多个标记的样式？(7分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823233561649715&vid=f141395xtyj'],
                ['03.如何使用组合选择器？(8分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823237856617011&vid=p1413x0qvce'],
                ['04.怎么用css做动画效果？(7分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823242151584307&vid=h1413wz03an'],
                ['05.怎么加载外部的css文件？(6分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823246446551603&vid=x1413wpyrip']
            ],
        },{
            title: '<span style="color:#ec407a;font-weight:bold">Javascript基础入门课程</span>',
            desc: '腾讯课堂全套Web开发技术课程，免费开放中',
            links: [
                ['先要免费加入课程，点这里！', 'https://ke.qq.com/course/156211'],
                ['01.什么是Javascript？(7分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823345230799411&vid=r14134mzv8k'],
                ['02.变量、数据和对象(7分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823349525766707&vid=d14134z6i34'],
                ['03.如何用js操纵html和css？(7分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823353820734003&vid=n141362nsel'],
                ['04.如何编写函数并给按钮添加点击？(12分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823358115701299&vid=o1413mqjgev'],
                ['05.数字的操作(10分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823362410668595&vid=x1413te4pok'],
                ['06.操作字符串(11分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823366705635891&vid=d14133uykmu'],
                ['07.重复循环for(10分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823379590537779&vid=q14135jkn2c'],
                ['08.操作数组(14分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823371000603187&vid=g14139xb9gu'],
                ['09.条件判断if...else...(14分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823375295570483&vid=e1413acyh0u'],
                ['10.操作日期和时间(10分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823383885505075&vid=g1413ata7ni'],
                ['11.计时器和动画制作(8分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823388180472371&vid=c1413m1a0q4'],
                ['12.操作颜色数据(14分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823392475439667&vid=u1413pr1m3a'],
                ['13.深入理解数据、函数和对象(6分钟)', 'https://ke.qq.com/webcourse/index.html#course_id=156211&term_id=100178917&taid=823396770406963&vid=a141396txvp']
            ],
        }];

        //外部链接
        $scope.webTutors = [{
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

        var arrs = [['案例视频', $scope.sampleTutors], ['知识点视频', $scope.baseTutors],['文字教程资源', $scope.webTutors]];
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
