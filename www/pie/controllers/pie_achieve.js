(function () {
    'use strict';
    var thisName = 'pie_achieve';

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
                $scope.getMyCodeHis();
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

        //开始就打开左侧栏
        $(document).ready(function () {
            setTimeout(function () {
                if (!$rootScope.leftMenuOpen && $mdMedia("gt-sm")) {
                    $('#leftnavbtn').click();
                };
            }, 1000);
        });

        //取消弹窗
        $scope.cancelDialog = function () {
            $mdDialog.hide();
        };


        /**
         * 获取个人的最近7天的编码历史记录
         */
        $scope.getMyCodeHis = function () {
            var api = _global.api('pie_getMyCodeHis');
            var dat = {};
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    //填充到图表数据
                    _fns.applyScope($scope, function () {
                        $scope.codeHisChart = $scope.genCodeHisChart(res.data);
                    });

                    //自动匹配图表大小，避免左侧栏拉出动画，多一个延迟匹配
                    $(window).resize(function () {
                        var wid = $('#codeHisChartBox').width() + 'px';
                        if ($scope.codeHisChart) $scope.codeHisChart.resize(wid, '480px');
                        setTimeout(function () {
                            var wid = $('#codeHisChartBox').width() + 'px';
                            if ($scope.codeHisChart) $scope.codeHisChart.resize(wid, '480px');
                        }, 1000);
                    });
                } else {
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('载入数据失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                };

            });
        };



        //生成图表
        $scope.genCodeHisChart = function (hisarr) {
            //统计总数
            $scope.chartTotal = {
                days: 0,
                changes: 0,
                length: 0,
                times: 0,
                apps: 0,
            };

            var days = [];
            var chartData = {}; //chardata基本的散点图格式数据
            var daysdata = {};
            var now = new Date();

            //把数据按照appid规整,分别加入图表数据
            for (var i = 0; i < hisarr.length; i++) {
                var his = hisarr[i];
                var date = new Date(his.created_at);
                $scope.chartTotal.times += 1;

                //chardata基本的散点图格式数据
                if (_fns.isDate(date)) {
                    his.date = date;
                    his.time = date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds();
                    if (days.indexOf(his.date) == -1) days.push(his.date);

                    //计算每天编码总数
                    var ymdstr = moment(date).format('YYYY-MM-DD');
                    var ymdate = new Date(ymdstr + ' ' + moment(now).format('hh:mm:ss'));
                    if (!daysdata[ymdstr]) {
                        daysdata[ymdstr] = {
                            date: ymdate,
                            name: ymdstr,
                            length: 0,
                            changes: 0
                        };
                    };
                    daysdata[ymdstr].changes += Number(his.param.changes);
                    daysdata[ymdstr].length += Number(his.param.length);

                    //叠加到总计
                    $scope.chartTotal.changes += Number(his.param.changes);
                    $scope.chartTotal.length += Number(his.param.length);

                };
                if (!chartData[his.tarId]) chartData[his.tarId] = [];
                chartData[his.tarId].push([his.date, his.time, his.param.changes, his.param.length]);
            };


            //生成散点数据
            var itemStyle = {
                normal: {
                    opacity: 0.25,
                    shadowBlur: 10,
                    shadowOffsetX: 0,
                    shadowOffsetY: 0,
                    shadowColor: 'rgba(0, 0, 0, 0.2)'
                }
            };
            var legendData = [];
            var data = [];
            for (var attr in chartData) {
                var arr = chartData[attr];
                legendData.push(attr);

                $scope.chartTotal.apps += 1;

                var ser = {
                    name: attr,
                    data: arr,
                    type: 'scatter',
                    symbolSize: function (dt) {
                        var size = Math.sqrt(dt[2]);
                        return size;
                    },
                    label: {
                        emphasis: {
                            show: true,
                            formatter: function (item) {
                                return '编码' + item.value[2] + '字符';
                            },
                            position: 'top'
                        }
                    },
                    itemStyle: itemStyle,
                    //stack:'编码数量每日分布'
                }

                data.push(ser);
            };

            //生成折线数据
            var linedata = {
                name: '每日编码总计',
                type: 'line',
                smooth: true,
                symbolSize: 10,
                label: {
                    emphasis: {
                        show: true,
                        formatter: function (params) {
                            return params.data[2].substr(5) + '总计' + params.data[1].toFixed(0);
                        },
                        position: 'top'
                    }
                },
                lineStyle: {
                    normal: {
                        color: '#00bfa5',
                        width: 1,
                    },
                },
                itemStyle: {
                    normal: {
                        color: '#00bfa5',
                        borderWidth: 1,
                    }
                },
                data: [],
            };
            for (var attr in daysdata) {
                var dt = daysdata[attr];
                $scope.chartTotal.days += 1;
                //最多每秒输入一个字符
                linedata.data.push([dt.date, dt.changes, dt.name, dt.length]);
            };
            data.push(linedata);



            //绘制图表
            var myChart = echarts.init(document.getElementById('codeHisChart'));

            var option = {
                title: {
                    text: '最近7天编码成就分布图',
                },
                legend: {
                    data: ['每日编码总计'],
                    align: 'right',
                    orient: 'vertical',
                    left: 'right',
                },
                xAxis: {
                    name: '日期',
                    type: 'time',
                    interval: 3600 * 1000 * 24,
                    min: new Date() - 3600 * 1000 * 24 * 7,
                    max: new Date().getTime(),
                    axisLabel: {
                        formatter: function (str) {
                            if ($mdMedia('gt-sm')) {
                                return moment(str).format('MM-DD hh:mm');
                            } else {
                                return moment(str).format('MM-DD');
                            }
                        },
                    },
                    splitLine: {
                        lineStyle: {
                            color: ['#DDD'],
                        }
                    },
                },
                yAxis: {
                    name: '小时/每日累计',
                    type: 'value',
                    min: 0,
                    max: 60 * 60 * 24,
                    interval: 3600 * 2,
                    axisLabel: {
                        formatter: function (val) {
                            return Math.floor(val / 3600);
                        }
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#EEE',
                        }
                    },
                },
                series: data,
            };

            // 使用刚指定的配置项和数据显示图表。
            myChart.setOption(option);
            return myChart;
        };


        /**
         * 分享成就图，把成就图截图然后上传随机文件名，然后再生成一个随机文件名html文件，最后弹出分享按钮
         */
        $scope.shareAchieve = function () {
            $mdToast.show(
                $mdToast.simple()
                .textContent('正在为您生成分享图片和链接，请稍后！')
                .position('top right')
                .hideDelay(3000)
            );

            //生成图片,放在用户的_share/下面
            var imgdataurl = $('#codeHisChart').find('canvas')[0].toDataURL('image/png');

            $scope.imgdataurl = imgdataurl;

            var blob = _fns.canvasToBlob($('#codeHisChart').find('canvas'));

            var imgurl = '_share/' + _fns.uuid() + '.png';

            _fns.uploadFileQn(imgurl, blob, null, function (arg1, arg2, arg3) {
                if (arg2 == 'success' && arg1.key) {
                    //创建分享页面
                    var shareObj = {
                        user: $scope.myUsrInfo,
                        title: '我的编码成就',
                        subTitle: '个人累计编码' + $scope.myUsrInfo.codeChanges + '字符',
                        content: '最近' + $scope.chartTotal.days + '天' + $scope.chartTotal.times + '次编码' + $scope.chartTotal.changes + '字符',
                        pics: [{
                            desc: '最近' + $scope.chartTotal.days + '天编码成就图',
                            url: _cfg.qn.BucketDomain + arg1.key,
                    }],
                    };
                    _fns.createSharePage('achieve', shareObj, function (shareurl) {
                        $rootScope.tempDialogData = {
                            title: '我在杰米诺课堂学编程，来看看我的成就吧！',
                            url: shareurl,
                        };
                        $mdDialog.show({
                            controller: 'pie_dialog_share',
                            templateUrl: _fns.getDialogUrl('share'),
                            parent: angular.element(document.body),
                            clickOutsideToClose: true
                        });

                        //添加历史记录
                        $scope.addShareAchieveHis(shareurl);
                    });
                }
            }, function (err) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('上传分享成就截图失败，请重试')
                    .position('top right')
                    .hideDelay(3000)
                );
            });
        };



        /**
         * 添加分享成就的历史记录
         * @param {string} shareurl 分享的页面地址
         */
        $scope.addShareAchieveHis = function (shareurl) {
            var api = _global.api('share_addShareHis');
            var dat = {
                type: _cfg.mgHisType.shareAchieve,
                url: shareurl
            };

            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
            });
        };









        /**
         * 保存编辑器设置历史
         * @param {Number} appId app的id
         * @param {Number} type  动作类型
         * @param {object} param 动作参数
         */
        $scope.addUpdateAppHis = function (appId, type, param) {
            var api = _global.api('pie_setAppUpdate');
            var dat = {
                appId: $scope.curApp.id,
                type: type,
            };
            if (param) dat.param = param;

            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
            });
        };




        //打开分享窗口
        $scope.openShare = function (item) {
            var url = item.url.replace('http://files.jieminuoketang', 'http://rtfiles.jieminuoketang');
            $rootScope.tempDialogData = {
                title: '我开发的WebApp:' + item.alias,
                url: url + 'index.html',
            };
            $mdDialog.show({
                controller: 'pie_dialog_share',
                templateUrl: _fns.getDialogUrl('share'),
                parent: angular.element(document.body),
                clickOutsideToClose: true
            })
        };




        //end
    }
})();
