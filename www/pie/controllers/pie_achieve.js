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
                    $scope.genCodeHisChart(res.data);
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
        var days = [];
        $scope.genCodeHisChart = function (hisarr) {
            var chartData = {};
            //把数据按照appid规整
            for (var i = 0; i < hisarr.length; i++) {
                var his = hisarr[i];

                var date = new Date(his.created_at);
                if (_fns.isDate(date)) {
                    his.date = date;
                    //his.date = moment(date).format('YY/MM/DD');
                    his.time = date.getHours() * 60 + date.getMinutes();
                    if (days.indexOf(his.date) == -1) days.push(his.date);
                };
                if (!chartData[his.tarId]) chartData[his.tarId] = [];
                chartData[his.tarId].push([his.date, his.time, his.param.length, his.param.changes]);
            };



            var itemStyle = {
                normal: {
                    opacity: 0.2,
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

                var ser = {
                    name: attr,
                    data: arr,
                    type: 'scatter',
                    symbolSize: function (data) {
                        var size = data[2] * 0.1;
                        if (size > 100) size = 100;
                        if (size < 1) size = 1;
                        return size;
                    },
                    label: {
                        emphasis: {
                            show: true,
                            formatter: function (item) {
                                return item[3];
                            },
                            position: 'top'
                        }
                    },
                    itemStyle: itemStyle,
                }

                data.push(ser);
            };



            //绘制图表
            var myChart = echarts.init(document.getElementById('codeHisChart'));

            var option = {
                title: {
                    text: '最近7天编码成就分布图',
                },
                xAxis: {
                    type: 'time',
                    interval: 3600 * 1000 * 24,
                    min: new Date() - 3600 * 1000 * 24 * 7,
                    max: new Date().getTime(),
                    axisLabel: {
                        formatter: function (str) {
                            return moment(str).format('MM-DD');
                        },
                    },
                    splitLine: {
                        lineStyle: {
                            color: ['#EEE'],
                        }
                    },
                },
                yAxis: {
                    type: 'value',
                    min: 0,
                    max: 60 * 24,
                    interval: 120,
                    axisLabel: {
                        formatter: function (val) {
                            return Math.floor(val / 60) + ':00';
                        }
                    },
                    splitLine: {
                        lineStyle: {
                            color: '#FAFAFA',
                        }
                    },
                },
                series: data,
            };

            // 使用刚指定的配置项和数据显示图表。
            myChart.setOption(option);
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
