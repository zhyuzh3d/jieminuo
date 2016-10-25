(function () {
    'use strict';
    var thisName = 'pie_help';

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


        //基础文档
        $scope.docs = [{
            title: '如何创建我自己的APP？',
            tips: [{
                text: '点击左侧栏【我创建的APP】菜单',
            }, {
                text: '点击顶部左侧的【新建APP】按钮',
            }, {
                text: '在弹出窗口中修改您的APP名称，建议不要修改其他内容，然后点击确定创建',
            }, {
                text: '新建的APP会出现在【我创建的APP】列表第一个位置',
            }],
            links: [],
        }, {
            title: '如何编辑我创建的APP？',
            tips: [{
                text: '点击左侧栏【我创建的APP】菜单',
            }, {
                text: '在列表中点击您希望进行编辑的APP卡片底部的铅笔按钮，或者点击卡片右下角的菜单按钮然后选择【编辑】',
            }, {
                text: '在打开的编辑器页面中，默认已经为您载入了index.html文件，您可以直接在编辑器内进行编码，然后保存',
            }, {
                text: '也可以在左侧文件列表中打开其他文件进行编辑，或者点击+加号按钮进行上传文件',
            }],
            links: [],
        }, {
            title: '为什么我编码的时候预览窗口显示不是最终效果？',
            tips: [{
                text: '请尝试点击右上角的【实时】按钮，切换到【手工】状态',
            }, {
                text: '然后您可以在需要的时候点击【刷新】按钮对页面进行刷新',
            }, {
                text: '提示，【实时】模式仅预览html和css内容，【手工】模式才是真正的最终效果预览',
            }],
        }, {
            title: '如何上传我自己的图片文件资源？',
            tips: [{
                text: '首先对APP进行编辑，进入APP的【编辑器页面】',
            }, {
                text: '然后从左侧【文件列表】下面点击【+】加号按钮',
            }, {
                text: '弹出菜单中选择【上传文件】',
            }, {
                text: '然后在弹出窗口中点击【选择文件】按钮，不推荐您修改上传目录',
            }, {
                text: '上传成功后您的文件将出现在【文件列表】的src文件夹内，您可以点开文件夹进行查看，点击文件左侧的小图标查看文件【信息】或【删除】文件',
            }],
        }, {
            title: '如何获取我上传的图片的链接？',
            tips: [{
                text: '首先对APP进行编辑，进入APP的【编辑器页面】',
            }, {
                text: '然后从左侧【文件列表】中点击您需要获取链接的文件左侧的文件小图标',
            }, {
                text: '从弹出菜单中选择【信息】',
            }, {
                text: '在弹出的窗口中您可以复制这个文件的链接地址，如果图片内容不会变更可以直接使用链接地址，如果图片内容经常被修改，请使用实时地址',
            }],
        }, {
            title: '如何为我的APP添加图标？',
            tips: [{
                text: '点击左侧栏【我创建的APP】菜单',
            }, {
                text: '然后点击您希望设置图标的APP卡片右下角的菜单按钮',
            }, {
                text: '弹出【APP设置】窗口，切换到【设置】标签下，点击图标进行更换，然后保存',
            }, {
                text: '您也可以在【编辑器页面】点击页面左上角的图标，从下拉菜单打开【APP设置弹窗】',
            }],
        }, {
            title: '如何给我的APP改名？',
            tips: [{
                text: '点击左侧栏【我创建的APP】菜单',
            }, {
                text: '然后点击您希望加入排行榜的APP卡片右下角的菜单按钮',
            }, {
                text: '弹出【APP设置】窗口，点击【设置】切换到设置标签下',
            }, {
                text: '修改您的APP名称，然后保存',
            }],
        }];


        //公共接口
        $scope.apidesc = '提示：所有接口都应使用jsonp方式请求，如有reqdata那么提交也应该使用地址url参数拼接的方式\nobj应转为json字符串并进行uri编码，直接使用body发送讲无法接收。所有接口的返回格式都是{code:1,text:\'ok\',data:{}},\n这里如果服务端处理失败，那么code将不等于1，具体失败原因将在text内文字描述；\n如果处理成功，那么code等于1，text等于\'ok\'，服务端返回的真实数据就是data';


        $scope.apis = [{
            name: 'acc_getMyInfo',
            desc: '用于获取用户自身的基本信息',
            path: 'http://www.jieminuoketang.com/api/acc_getMyInfo',
            method: 'POST,GET',
            reqdata: undefined,
            reqdesc: undefined,
            resdata: {
                code: 1,
                text: 'ok',
                data: {
                    id: '1',
                    nick: 'zhyuzh',
                    phone: '134******37',
                    avatar: 'http://files.jieminuoketang.com/Fgs0UiKM1yxLb1IqnjRYcedxwisc'
                }
            },
            resdesc: 'id,用户的id，每个用户都不同，可用于身份识\nnick,用户的昵称\nphone，用户的注册电话号码，中间星号隐藏\navatar，用户的头像url地址',
            tip: undefined,
        }, {
            name: 'ext_getWildDogCustomToken',
            desc: '用于获取野狗APP用户账户识别的自定义customToken',
            path: 'http://www.jieminuoketang.com/api/ext_getWildDogCustomToken',
            method: 'POST,GET',
            reqdata: undefined,
            reqdesc: undefined,
            resdata: {
                code: 1,
                text: 'ok',
                data: 'eyJ0e...lD6E'
            },
            resdesc: 'data就是可以用于野狗自定义认证的customToken',
            tip: 'APP作者必须先在APP设置弹窗的【扩展】一栏中绑定野狗APP的超级密钥才能在js中使用这个接口；customToken有效期1个月',
            links: [{
                title: '野狗官方自定义用户认证说明',
                url: 'https://docs.wilddog.com/guide/auth/web/custom.html'
                }],
        }, {
            name: 'ext_httpProxy',
            desc: '代理转发各种第三方API接口功能',
            path: 'http://www.jieminuoketang.com/api/ext_httpProxy',
            method: 'POST,GET',
            reqdata: {
                type: 'http',
                opt: {
                    hostname: 'www.tuling123.com',
                    path: '/openapi/api',
                    method: 'POST'
                },
                body: {
                    key: '{{tulingkey}}',
                    info: '你好！'
                },
            },
            reqdesc: '整个reqdata应该以json字符串形式且经过uri编码，然后拼接在ext接口路径之后作为data参数传递\n比如\"..api/ext_httpProxy?data\"+(JSON.stringify(reqdata));/\ntype发送请求类型，目前仅支持http,后续会支持https\nopt请求选项，至少要包含hostname和path字段（请参照第三方API官方接口规范拼接）\nbody如果是post方式那么可以直接把数据放在这里，请参照第三方API官方接口规范',
            resdata: {
                code: 1,
                text: 'ok',
                data: 'API返回的结果'
            },
            resdesc: 'data就是第三方API返回的结果，具体格式参照第三方API官方说明',
            tip: 'APP作者必须先在APP设置弹窗的【扩展】一栏中绑定野狗APP的超级密钥才能在js中使用这个接口；customToken有效期1个月',
            links: [{
                title: '图灵机器人官方网站（需要登录注册，创建自己的机器人然后得到ApiKey）',
                url: 'http://www.tuling123.com/'
                }, {
                title: '范例：基于图灵接口开发的聊天机器人（可以直接修改地址为/index.js查看js文件)',
                url: 'http://rtfiles.jieminuoketang.com/1/au22ntesx127/index.html'
                }],
        }];

        $scope.apislabel = '公共接口(' + $scope.apis.length + ')';



        //外部扩展
        $scope.exts = [{
            title: '野狗APP用户自定义认证的使用方法',
            tips: [{
                text: '首先，必须在index.html加入以下两个js引用',
                code: '<script src="https://cdn.wilddog.com/sdk/js/2.1.2/wilddog.js"></script>\n<script src="https://cdn.wilddog.com/sdk/js/2.1.2/wilddog-auth.js"></script>',
            }, {
                text: '在index.js内添加如下代码,其中user.uid就是野狗APP认证的用户id',
                code: 'var config = {\n\tauthDomain: "jwttest.wilddog.com"\n};\nwilddog.initializeApp(config, "DEFAULT");\n\nvar api = \'http://www.jieminuoketang.com/api/ext_getWildDogCustomToken\';\n$.get(api, function (res) {\n\twilddog.auth().signInWithCustomToken(res.data).then(function (user) {\n\t   	console.log(user);\n\t});\n}, \'jsonp\');',
            }],
            links: [{
                title: '野狗官方自定义用户认证说明',
                url: 'https://docs.wilddog.com/guide/auth/web/custom.html'
                }],
        }, {
            title: '通用第三方http接口API接口功能的使用',
            tips: [{
                text: '首先，您需要了解第三方API的接口规范，并获得相应的AppKey密钥',
            }, {
                text: '然后，您需要把这个密钥设定为杰米诺APP的扩展的自定义属性，如tulingkey,EXds9sd...',
            }, {
                text: '这样您就可以在js编码的时候调用www.jieminuoketang.com/api/ext_httpProxy接口，根据官方规范格式调用，密钥字段使用{{tulingke}}替换，这里tulingkey代表您的保密关键字，必须与上一步设定的APP自定义属性一致',
                code: '\nvar api = \'http://www.jieminuoketang.com/api/ext_httpProxy\';\nvar data = {\n\topt: {\n\t\thostname: \'www.tuling123.com\',\n\t\tpath: \'/openapi/api\',\n\t\tmethod: \'POST\'\n\t},\n\t body: {\n\t\tkey: \'{{tulingkey}}\',\n\t\tinfo: $scope.ask\n\t}\n};\napi += \'?data=\' +(JSON.stringify(data));\n$.get(api, function (res) {},\'jsonp\')',
            }],
            links: [{
                title: '图灵机器人官方网站（需要登录注册，创建自己的机器人然后得到ApiKey）',
                url: 'http://www.tuling123.com/'
                }, {
                title: '范例：基于图灵接口开发的聊天机器人（可以直接修改地址为/index.js查看js文件)',
                url: 'http://rtfiles.jieminuoketang.com/1/au22ntesx127/index.html'
                }],
        }];
        $scope.extslable = '第三方扩展(' + $scope.exts.length + ')';





        //跳转到链接
        $scope.gotoLink = function (str) {
            window.open(str);
        };


        //end
    }
})();
