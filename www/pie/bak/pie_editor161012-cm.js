//编辑器的控制器函数

(function () {
    'use strict';
    var thisName = 'pie_editor';
    console.log(thisName + '.js is loading...');

    _app.controller(thisName, thisFn);

    function thisFn(
        $rootScope,
        $scope,
        $location,
        $anchorScroll,
        $element,
        $mdToast,
        $mdDialog,
        $mdMedia
    ) {
        _fns.initCtrlr($scope, $element, thisName, false);

        //锚点
        $scope.goto = function (key) {
            $location.hash(key);
            $anchorScroll();
        };

        //登录成功后自动读取index.html
        _fns.promiseRun(function (tm) {
            $scope.$apply(function () {
                $scope.myUsrInfo = _global.myUsrInfo;
                $scope.hasLogin = _global.hasLogin;
            });

            $scope.getFileList();

            //打开index.html，载入index.css
            $scope.openFile();

            //自动打开index.css文件并加载到实时预览
            var appName = $scope.getAppArg();
            var uid = $rootScope.myInfo.id;
            var cssurl = _cfg.qn.BucketDomain + uid + '/' + appName + '/index.css';
            var fkey = uid + '/' + appName + '/index.css';
            $scope.openFile(cssurl, fkey, false);


        }, function () {
            return _global.hasLogin;
        });


        //实时屏幕尺寸
        $scope.sizeGt = function (str) {
            return $mdMedia('gt-' + str);
        }

        //自动隐藏list和preview
        $scope.layoutInit = function () {
            if (!$mdMedia('gt-xs')) {
                $scope.hideList = true;
            };
            if (!$mdMedia('gt-sm')) {
                $scope.hidePreview = true;
            }
        }
        $scope.layoutInit();

        //低于xs各个部分solo显示
        $scope.tagPart = function (str, val) {
            if (!$mdMedia('gt-xs')) {
                $scope.hideList = true;
                $scope.hideEditor = true;
                $scope.hidePreview = true;
                if (val === undefined) {
                    $scope[str] = !$scope[str];
                } else {
                    $scope[str] = val;
                }
            } else {
                if (val === undefined) {
                    $scope[str] = !$scope[str];
                } else {
                    $scope[str] = val;
                }
            };
            $scope.resizePreviewPart();
        };

        //检测Appname，如果没有那么后退
        $scope.getAppArg = function () {
            $scope.appName = $scope.xargs.app;
            if (!$scope.appName) {
                var alrt = $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('您还没有选定项目')
                    .textContent('您必须选定一个项目才能进行编辑.')
                    .ariaLabel('您还没有选定项目')
                    .ok('返回我的APP列表')
                $mdDialog.show(alrt).then(function () {
                    window.location.href = document.referrer;
                });
            } else {
                $scope.appName = decodeURI($scope.appName);
            };

            return $scope.appName;
        };
        $scope.getAppArg();

        //获取app信息
        $scope.getAppInfo = function () {
            var appName = $scope.getAppArg();

            var api = _global.api('pie_getAppInfo');
            var dat = {
                appName: appName,
            };

            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    $scope.curApp = res.data;
                } else {
                    //提示错误
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('获取文件信息失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
            });
        };
        $scope.getAppInfo();





        //获取app文件夹的列表
        $scope.getFileList = function () {
            var appName = $scope.getAppArg();
            var uid = $rootScope.myInfo.id;
            $scope.appPath = uid + '/' + appName + '/';

            var api = _global.api('qn_getFileList');

            var dat = {
                path: appName + '/',
                limit: 100,
            };


            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        $scope.appFiles = res.data.items;
                        $scope.domain = res.data.domain;
                        $scope.appFolder = appName;

                        //为每个文件添加domain和folder属性
                        $scope.appFiles.forEach(function (fobj) {
                            fobj.domain = res.data.domain;
                            fobj.folder = res.data.folder;
                            fobj.url = fobj.domain + fobj.key;
                        });


                        //填充folders及内部文件
                        var folders = res.data.commonPrefixes;
                        if (folders) {
                            if (!$scope.appFolders) $scope.appFolders = {};
                            //填充appFolders[folderpath]={};
                            var newfolders = {};
                            for (var attr in folders) {
                                //如果前端已经存在，那么忽略，以此保持expand等信息,如果后端已经不存在，那么前端也去除
                                var fpath = folders[attr];
                                if (!$scope.appFolders[fpath]) {
                                    newfolders[fpath] = {};
                                } else {
                                    newfolders[fpath] = $scope.appFolders[fpath];
                                };
                                newfolders[fpath].items = [];
                            };

                            $scope.appFolders = newfolders;

                            //为每个folder读取文件列表
                            for (var att in $scope.appFolders) {
                                $scope.getFolderFiles(att);
                            };
                        } else {
                            $scope.appFolders = {};
                        };
                    });
                } else {
                    //提示错误
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('获取文件列表失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
            });
        };





        //获取文件夹的文件列表,并填充到appFolders[folderpath].items
        $scope.getFolderFiles = function (folderpath) {
            var api = _global.api('qn_getFileList');
            //去除开始的uid
            var fdpath = folderpath.replace(/^\d+\//, '');

            var dat = {
                path: fdpath,
                limit: 100,
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    _fns.applyScope($scope, function () {
                        var folderobj = $scope.appFolders[folderpath];
                        folderobj.items = res.data.items;

                        //为每个文件添加domain和folder属性
                        folderobj.items.forEach(function (fobj) {
                            fobj.domain = res.data.domain;
                            fobj.folder = res.data.folder;
                            fobj.url = fobj.domain + fobj.key;
                        })
                    });
                } else {
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('获取文件列表失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
            });
        };


        //计算文件大小，除以1024
        $scope.ksize = function (num) {
            return (num / 1024).toFixed(2);
        };

        //新增一个文件夹,初始化创建一个'_'文件
        $scope.doAddNewFolder = function () {
            var appName = $scope.getAppArg();
            var uid = $rootScope.myInfo.id;

            //弹出窗口提示输入文件夹名
            var confirm = $mdDialog.prompt()
                .title('请输入文件夹的名称(如src)，不推荐创建多余的文件夹，请谨慎使用')
                .textContent('请不要使用字母数字以外的特殊符号.')
                .placeholder('folder name')
                .ariaLabel('folder name')
                .initialValue('src')
                .ok('确定')
                .cancel('取消');
            $mdDialog.show(confirm).then(function (ipt) {
                if (ipt && _cfg.regx.folderName.test(ipt)) {
                    //检查_文件是否存在
                    var fpath = uid + '/' + appName + '/' + ipt + '/_';
                    $scope.chkFileExist(fpath, function () {
                        //提示错误
                        $mdToast.show(
                            $mdToast.simple()
                            .textContent('同名文件夹已经存在，不能创建')
                            .position('top right')
                            .hideDelay(3000)
                        );
                    }, function () {
                        $scope.addNewFile(appName + '/' + ipt + '/_');
                    });
                } else {
                    //提示错误
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('文件夹名格式错误')
                        .position('top right')
                        .hideDelay(3000)
                    );
                }
            });
        };




        //增加一个新文件
        $scope.doAddNewFile = function () {
            var appName = $scope.getAppArg();
            var uid = $rootScope.myInfo.id;

            //弹出窗口提示输入文件名
            var confirm = $mdDialog.prompt()
                .title('请输入文件的名称(如mypage.html)')
                .textContent('请不要使用字母数字以外的特殊符号.目前只可以创建.js,.css,.html,.json,.txt格式文件')
                .placeholder('file name')
                .ariaLabel('App name')
                .initialValue('myfile.html')
                .ok('确定')
                .cancel('取消');
            $mdDialog.show(confirm).then(function (ipt) {
                if (ipt && _cfg.regx.fileName.test(ipt)) {
                    //检查文件是否存在
                    var fpath = uid + '/' + appName + '/' + ipt;
                    $scope.chkFileExist(fpath, function () {
                        //提示错误
                        $mdToast.show(
                            $mdToast.simple()
                            .textContent('同名文件已经存在，不能创建')
                            .position('top right')
                            .hideDelay(3000)
                        );
                    }, function () {
                        $scope.addNewFile(appName + '/' + ipt);
                    });
                } else {
                    //提示错误
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('文件名格式错误')
                        .position('top right')
                        .hideDelay(3000)
                    );
                }
            });
        };

        //增加一个新文件
        $scope.addNewFile = function (fname) {
            var fext = fname.substring(fname.lastIndexOf('.') + 1);
            var mime = _fns.getMimeByExt(fext);

            var blob = new Blob(['Hello pie!'], {
                type: mime
            });
            var xhr = _fns.uploadFileQn(fname, blob, function (arg1, arg2, arg3) {
                //成功提示
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('创建成功！')
                    .position('top right')
                    .hideDelay(3000)
                );
                _fns.applyScope($scope, function () {
                    $scope.getFileList();
                });
            });
        };

        //检查文件是否存在，如果不存在就执行nofn，存在就执行yesfn
        $scope.chkFileExist = function (fpath, yesfn, nofn) {
            var appName = $scope.getAppArg();

            var api = _global.api('qn_getFileInfo');


            var dat = {
                key: fpath,
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    if (yesfn && yesfn.constructor == Function) yesfn();
                } else {
                    if (nofn && nofn.constructor == Function) nofn();
                };
            });
        };



        //删除一个文件夹，必须是下面没有目录才行,其实只是删除最后一个_文件
        $scope.deleteFolder = function (fdpath) {
            //前端监测文件夹内是否还有文件
            var items = $scope.appFolders[fdpath].items;
            var fdkey = fdpath + '_';
            if (items.length == 1 && items[0].key == fdkey) {
                $scope.doDeleteFile(fdkey);
            } else {
                $mdDialog.show($mdDialog.confirm()
                    .title('请先删除文件夹下的文件')
                    .textContent('不能删除含有文件的文件夹')
                    .ariaLabel('App name')
                    .ok('关闭'));
            };
        };


        //删除一个文件
        $scope.deleteFile = function (item) {
            var fpath = item.key;
            var fname = fpath.substring(fpath.lastIndexOf('/') + 1);

            var appName = $scope.getAppArg();
            if (!fname) {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('文件名不能为空，删除取消！')
                    .position('top right')
                    .hideDelay(3000)
                );
            } else if (fname == 'index.html') {
                //禁止删除index.html文件
                $mdToast.show(
                    $mdDialog.alert()
                    .clickOutsideToClose(true)
                    .title('您不能删除index.html文件')
                    .textContent('这个文件是APP的首页，不能删除.')
                    .ok('我知道啦！')
                );
            } else {
                //弹窗确认
                var confirm = $mdDialog.confirm()
                    .title('您确认要删除文件 ' + fname + ' 吗?')
                    .textContent('警告！删除后无法恢复.')
                    .ariaLabel('App name')
                    .ok('确定删除')
                    .cancel('取消');
                $mdDialog.show(confirm).then(function () {
                    $scope.doDeleteFile(item.key);
                });
            }
        };

        //执行删除一个文件
        $scope.doDeleteFile = function (fpath) {
            var appName = $scope.getAppArg();

            var api = _global.api('qn_deleteFile');

            var dat = {
                key: fpath,
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('删除成功！')
                        .position('top right')
                        .hideDelay(3000)
                    );
                    _fns.applyScope($scope, function () {
                        $scope.getFileList();
                    });
                } else {
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('删除失败！')
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
            });
        };




        //弹出选择上传文件夹的弹窗，改变selFolder变量
        $scope.selFolderPath;
        $scope.showFolderSelDialog = function () {
            var keys = ($scope.appFolders) ? Object.keys($scope.appFolders) : [];

            if (keys.length < 1) {
                //如果为空，默认指向src文件夹
                $scope.selFolderPath = $scope.appPath + 'src/';
                $scope.appFolders = {};
                $scope.appFolders[$scope.selFolderPath] = {};
            } else if (!$scope.selFolderPath) {
                //如果之前没指定过selFolderPath,那么指向第一个文件夹
                $scope.selFolderPath = Object.keys($scope.appFolders)[0];
            };

            $mdDialog.show({
                contentElement: '#selFolderDialog',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };

        //关闭弹窗
        $scope.cancelDialog = function () {
            $mdDialog.hide();
        };

        //直接向指定folder传文件
        $scope.upload2Folder = function (fdpath) {
            $scope.selFolderPath = fdpath;
            $scope.doUploadFile();
        };

        //模拟input弹窗选择文件并开始上传
        $scope.upFiles = {};
        $scope.doUploadFile = function (evt) {
            var appName = $scope.getAppArg();
            var uid = $rootScope.myInfo.id;

            //如果没有btnjo那么自动创建一个隐身的
            var btnjo;
            if (!evt) {
                btnjo = $('<div style="display:none"></div>');
            } else {
                btnjo = $(evt.target);
                if (btnjo.attr('id') != 'uploadBtn') btnjo = btnjo.parent();
            }

            //将selFolderPath去掉uid和结尾的斜杠
            var path = $scope.selFolderPath.replace(/^\d+\//, '');
            path = path.replace(/\/$/, '');

            $scope.uploadId = _fns.uploadFile(path, btnjo,
                function (f, res) {
                    //before,
                    $scope.cancelDialog();
                },
                function (f, proevt) {
                    //progress,更新进度条
                    _fns.applyScope($scope, function () {
                        $scope.upFiles[f.id] = f;
                    });
                },
                function (f, res) {
                    //sucess,从upFiles里面移除这个f
                    f.url = res.url;
                    $scope.removeUpFile(f);
                    //刷新列表，提示成功
                    _fns.applyScope($scope, function () {
                        $scope.getFileList();
                    });
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('上传成功！')
                        .position('top right')
                        .hideDelay(3000)
                    );
                },
                function (f) {
                    //abort,从upFiles里面移除这个f
                    $scope.removeUpFile(f);
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('上传被取消')
                        .position('top right')
                        .hideDelay(3000)
                    );
                },
                function (f, err) {
                    //error,从upFiles里面移除这个f
                    f.url = res.url;
                    $scope.removeUpFile(f);
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('上传失败:' + err.message)
                        .position('top right')
                        .hideDelay(3000)
                    );
                });
        };


        //并从上传列表中移除
        $scope.removeUpFile = function (f) {
            setTimeout(function () {
                _fns.applyScope($scope, function () {
                    delete $scope.upFiles[f.id];
                });
            }, 100);
        };

        //取消上传并从上传列表中移除
        $scope.abortUploadFile = function (f) {
            _fns.abortUpload(f);
        };


        $scope.cmModes = {
            'html': 'xml',
            'css': 'css',
            'js': 'javascript'
        };

        //codemirror选项
        $scope.cmOpt = {
            mode: "xml",
            htmlMode: true,
            lineNumbers: true,
            styleActiveLine: true,
            matchBrackets: true,
            lineWrapping: true,
            extraKeys: {
                //alt折叠当前行开始的代码块
                'Alt': function (cm) {
                    cm.foldCode(cm.getCursor());
                },
            },
            foldGutter: true,
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter", "CodeMirror-lint-markers"],
            autoCloseBrackets: true,
            lint: true,
        };


        //codemirror运行前设置
        $scope.cmLoaded = function (cm) {
            $scope.cm = cm;
            var doc = $scope.cmDoc = cm.getDoc();
            var editor = $scope.cmEditor = doc.getEditor();

            //调整高度
            var hei = $(window).height() - 78;
            editor.setSize('100%', hei + 'px');

            $(window).resize(function () {
                var hei = $(window).height() - 78;
                editor.setSize('100%', hei + 'px');
            });

            //初始化黑色主题
            $scope.cmEditor.setOption('theme', 'mbo');
            $scope.cmDoc.setValue('正在载入文件，请稍后...');

            //调整字体
            editor.getWrapperElement().style["font-size"] = "1.6rem";
            editor.getWrapperElement().style["font-family"] = "monospace,Monaco";
            editor.getWrapperElement().style["line-height"] = "1.5rem";
            editor.refresh();

            //提示器
            var selstr;
            editor.on('keydown', function (cm, event) {
                selstr = editor.doc.getSelection();
            });

            editor.on("keyup", function (cm, event) {
                //结合anyword和javascript两个提示器
                var char = String.fromCharCode(event.keyCode);

                //对于非字母数字点或者按下ctrlalt的，忽略
                if (!cm.state.completionActive && /[0-9A-Za-z\.\¾]/.test(char) && !event.altKey && !event.ctrlKey) {
                    CodeMirror.showHint(cm, function (edtr, opts) {

                        //根据模式自适应提示引擎
                        var mod = $scope.cmOpt.mode;
                        if (mod == 'xml') mod = 'html';
                        var res = CodeMirror.hint[mod](edtr, opts);

                        res = CodeMirror.hint.anyword(edtr, {
                            list: (res && res.list) ? res.list : []
                        });
                        return res;
                    }, {
                        completeSingle: false
                    });
                };
            });
        };


        /*打开一个文件，将文件内容显示到编辑器
         */
        $scope.doOpenFile = function (fkey) {
            //只能打开指定类型的文件
            var ext = _fns.getFileExt(fkey);

            var allowftype = (_cfg.editFileTypes.indexOf(ext) != -1);
            var allowptype = (_cfg.viewImageTypes.indexOf(ext) != -1);

            if (!allowftype && !allowptype) {
                $mdDialog.show($mdDialog.confirm()
                    .title('编辑器不支持您的文件类型')
                    .textContent('只能打开html,css,js或txt格式文件')
                    .ariaLabel('App name')
                    .ok('关闭'));
            } else if (allowptype) {
                //图片格式，弹窗预览
                $scope.showImgPreviewDialog(fkey);
            } else if (!fkey) {
                $mdDialog.show($mdDialog.confirm()
                    .title('找不到文件地址，请刷新后再试')
                    .textContent('这可能是由于网络不稳定引起的')
                    .ariaLabel('App name')
                    .ok('关闭'));
            } else if (allowftype) {
                var url = _cfg.qn.BucketDomain + fkey;
                $scope.openFile(url, fkey);
            };
        };


        //显示页面的二维码弹窗
        $scope.showImgPreviewDialog = function (key) {
            if (!key) {
                return undefined;
            } else {
                $scope.imgPreviewUrl = $scope.toRtfilesUrl(_cfg.qn.BucketDomain + key);
            };
            $mdDialog.show({
                contentElement: '#imgPreviewDialog',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };



        //编辑器内的文件
        $scope.editorFile = {};
        //手工预览窗内的文件
        $scope.previewMnFile = {};
        //实时预览窗的html文件
        $scope.previewRtHtmlFile = {};
        //实时预览窗内的css文件
        $scope.previewRtCssFile = {};



        /*打开文件显示到cm的函数,都使用html读取，否则没有回调
        url为绝对完整地址
        延迟100毫秒执行
        */

        $scope.openFile = function (url, fkey, ineditor) {
            var appName = $scope.getAppArg();
            var uid = $rootScope.myInfo.id;
            if (!url) url = _cfg.qn.BucketDomain + uid + '/' + appName + '/index.html';
            if (!fkey) fkey = uid + '/' + appName + '/index.html';
            if (ineditor === undefined) ineditor = true;

            var fext = _fns.getFileExt(url);
            var fname = _fns.getFileName(url);


            //添加时间戳强制刷新
            var urlp = url + '?_=' + (new Date()).getTime();

            $.get(urlp, function (res) {
                console.log('GET', urlp, null, String(res).substr(0, 25));

                _fns.applyScope($scope, function () {

                    var fobj = {
                        url: url,
                        key: fkey,
                        ext: fext,
                        name: fname,
                        data: res,
                    };

                    //同步当前编辑器和预览数据,避免打开新文件后实时预览异常
                    if ($scope.editorFile.key == $scope.previewRtHtmlFile.key) {
                        $scope.previewRtHtmlFile.data == $scope.editorFile.data;
                    } else if ($scope.editorFile.key == $scope.previewRtCssFile.key) {
                        $scope.previewRtCssFile.data == $scope.editorFile.data;
                    };

                    //处理编辑器
                    if (ineditor) {
                        $scope.editorFile = fobj;

                        //自动切换编辑器提示引擎
                        if ($scope.cmModes[fext] != undefined) {
                            $scope.cmOpt.mode = $scope.cmModes[fext];
                            //重置编辑器
                            $scope.cmEditor.setOption('mode', $scope.cmOpt.mode);
                        } else if (ineditor) {
                            $mdToast.show(
                                $mdToast.simple()
                                .textContent('编辑器不支持您的文件格式.')
                                .position('top right')
                                .hideDelay(3000)
                            );
                        };

                        //强制刷新
                        setTimeout(function () {
                            if (ineditor) {
                                $scope.editorFile.data += ' ';
                            };
                        }, 100);

                        //成功提示
                        $mdToast.show(
                            $mdToast.simple()
                            .textContent('读取文件' + fname + '.' + fext + '成功，已经载入编辑器！')
                            .position('top right')
                            .hideDelay(500)
                        );
                    };

                    //不管是否载入编辑器，都改变预览文件参数
                    if (fext == 'html') {
                        $scope.previewRtHtmlFile = fobj;
                        $scope.previewMnFile = fobj;
                    } else if (fext == 'css') {
                        $scope.previewRtCssFile = fobj;
                    };
                });


            }, "html");
        };





        /*刷新手工预览窗口的url*/
        $scope.reloadPreview = function () {
            //rtfile自动添加时间戳，不需要刷新时间戳
            $scope.refreshPreviewFrameUrl();

            /*
            //如果当前html文件和预览html文件不同，那么也存储预览html文件，以便刷新预览html文件内部的时间戳
            if ($scope.previewMnFile.key != $scope.editorFile.key) {
                var timestamp = (new Date()).getTime() + '{[timeStamp]}';
                var uid = $rootScope.myInfo.id;
                var url = $scope.previewMnFile.key.substr(uid.length + 1);

                var data = $scope.previewMnFile.data;
                var tsdata = data.replace(/\d*\{\[timeStamp\]\}/g, timestamp);

                $scope.saveFile(url, tsdata, function (f, res) {

                    //存储完成后等1秒再刷新预览窗url
                    setTimeout(function () {
                        $scope.refreshPreviewFrameUrl();
                    }, 1000);
                });
            } else {
                //预览与编辑的文件一致,直接刷新
                $scope.refreshPreviewFrameUrl();
            }
            */
        };


        //改变iframe的src地址,实时情况下不刷新
        $scope.refreshPreviewFrameUrl = function () {
            //先弹窗拖延时间
            if ($scope.previewRt) return;
            $mdToast.show(
                $mdToast.simple()
                .textContent('正在刷新预览页面,请稍后')
                .position('top right')
                .hideDelay(3000)
            );

            var url = '';
            if ($scope.previewMnFile.url) {
                url = encodeURI($scope.previewMnFile.url) + '?_=' + Math.random();
            };
            setTimeout(function () {
                $('#previewFrame').attr('src', url);
            }, 2500);
        };


        /*切换实时，手工开关;默认实时；
         */
        $scope.previewRt = true;
        $scope.tagPreviewRt = function () {
            $scope.previewRt = !$scope.previewRt;
            if (!$scope.previewRt) {
                $scope.refreshPreviewFrameUrl();
            }
        };






        /*保存当前编辑器内容到当前文件url
         */
        $scope.doSaveFile = function () {

            //截取uid/后面的部分
            var appName = $scope.getAppArg();
            var uid = $rootScope.myInfo.id;
            var fkey = $scope.editorFile.key.substr(uid.length + 1);
            var data = $scope.cmDoc.getValue();


            if (!fkey || !data) {
                $mdDialog.show($mdDialog.confirm()
                    .title('找不到文件地址或数据为空，保存取消')
                    .textContent('这可能是由于网络不稳定引起的')
                    .ariaLabel('App name')
                    .ok('关闭'));
            } else {
                var timestamp = (new Date()).getTime() + '{[timeStamp]}';
                var tsdata = data.replace(/\d*\{\[timeStamp\]\}/g, timestamp);

                //如果编辑的html和预览的html不是同一个页面，那么提前reload保存预览html以便于刷新html里面的时间戳
                if ($scope.previewMnFile.key != $scope.editorFile.key) {
                    $scope.refreshPreviewFrameUrl();
                };

                //存储完成后刷新预览窗
                $scope.saveFile(fkey, tsdata, function () {
                    if ($scope.previewMnFile.key == $scope.editorFile.key) {
                        $scope.refreshPreviewFrameUrl();
                    };
                    //更新本地数据
                    _fns.applyScope($scope, function () {
                        $scope.curFileData = data;
                    });

                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('保存成功')
                        .position('top right')
                        .hideDelay(1000)
                    );
                });
            };
        };


        /*保存文件，fkey前不带uid不带斜杠格式myapp/index.html，data为字符串
        okfn(f,res)为保存成功后执行的函数
         */
        $scope.saveFile = function (fkey, data, okfn) {
            var ext = _fns.getFileExt(fkey);
            var mime = _fns.getMimeByExt(ext);

            var blob = new Blob([data], {
                type: mime
            });

            var xhr = _fns.uploadFileQn(fkey, blob, undefined, okfn, function () {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('文件存储失败，请重新尝试')
                    .position('top right')
                    .hideDelay(1000)
                );
                refreshFile(fkey);
            });
        };

        //专为实时文件地址rtfiles
        $scope.toRtfilesUrl = function (url) {
            if (!url) return '';
            return url.replace(/^http:\/\/files/, 'http://rtfiles');
        };

        /*上传之后刷新文件,fkey带uid不带斜杠格式1/myapp/index.html，data为字符串
         */
        $scope.refreshFile = function (fkey) {
            var appName = $scope.getAppArg();
            var uid = $rootScope.myInfo.id;
            var ext = _fns.getFileExt($scope.curFileKey);
            var mime = _fns.getMimeByExt(ext);

            var api = _global.api('qn_refreshFile');
            var dat = {
                key: uid + '/' + fkey,
            };
            $.post(api, dat, function (res) {
                console.log('POST', api, dat, res);
                if (res.code == 1) {
                    //成功提示
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('文件更新成功！')
                        .position('top right')
                        .hideDelay(1000)
                    );
                } else {
                    $mdToast.show(
                        $mdToast.simple()
                        .textContent('文件更新失败:' + res.text)
                        .position('top right')
                        .hideDelay(3000)
                    );
                };
            });
        };

        //打开新页面访问app的index页面
        $scope.gotoApp = function () {
            var appName = $scope.getAppArg();
            var uid = $rootScope.myInfo.id;
            var url = _cfg.qn.BucketDomain + uid + '/' + appName + '/index.html?_=' + (new Date()).getTime();
            window.open(url);
        };


        //显示页面的二维码弹窗
        $scope.showQrcodeDialog = function (key) {
            if (!key) {
                var appName = $scope.getAppArg();
                var uid = $rootScope.myInfo.id;
                $scope.qrcodeDialogUrl = _cfg.qn.BucketDomain + uid + '/' + appName + '/index.html';
            } else {
                $scope.qrcodeDialogUrl = _cfg.qn.BucketDomain + key;
            };
            $scope.qrcodeDialogUrl = $scope.toRtfilesUrl($scope.qrcodeDialogUrl);

            //使用jquery生成二维码
            $('#qrcode').empty();
            $('#qrcode').qrcode($scope.qrcodeDialogUrl);

            $mdDialog.show({
                contentElement: '#qrcodeDialog',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };

        //显示文件的信息弹窗,显示文件的链接
        $scope.showFileInfoDialog = function (item) {
            $scope.fileinfoDialogFile = item;
            $mdDialog.show({
                contentElement: '#fileInfoDialog',
                parent: angular.element(document.body),
                clickOutsideToClose: true
            });
        };



        //使用模板，自动判断html和js
        $scope.useTemplate = function () {
            if ($scope.curFileExt == 'html') {
                $scope.useTemplateHtml();
            } else if ($scope.curFileExt == 'js') {
                $scope.useTemplateJs();
            } else {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('目前还没有此类型文件的模板')
                    .position('top right')
                    .hideDelay(3000)
                );
            }
        };

        //使用base.html模板
        $scope.useTemplateHtml = function () {
            var api = 'http://www.jieminuoketang.com/pie/templates/base/index.html';
            $.get(api, function (res) {
                console.log('GET', api, null, String(res).substr(0, 100));
                _fns.applyScope($scope, function () {
                    var body = $scope.cmDoc.getValue();
                    var html = res.replace('[{codeHere}]', body);
                    $scope.cmDoc.setValue(html);
                });
            }, 'html');
        };

        //使用base.js模板
        $scope.useTemplateJs = function () {
            var api = 'http://www.jieminuoketang.com/pie/templates/base/index.js';
            $.get(api, function (res) {
                console.log('GET', api, null, String(res).substr(0, 100));
                _fns.applyScope($scope, function () {
                    var code = $scope.cmDoc.getValue();
                    var js = res.replace('[{codeHere}]', code);
                    $scope.cmDoc.setValue(js);
                });
            }, 'html');
        };


        //新窗口打开url地址，非html打开preview，否则打开当前页,添加时间戳
        $scope.openUrl = function (key) {
            var url;
            if (key) {
                url = _cfg.qn.BucketDomain + key;
            } else {
                url = $scope.previewMnFile.url;
            };

            url = $scope.toRtfilesUrl(url);

            if (url) {
                //时间戳由后端自动添加
                //url = url + '?_=' + (new Date()).getTime();
                window.open(encodeURI(url));
            } else {
                $mdToast.show(
                    $mdToast.simple()
                    .textContent('文件地址未定义，请刷新后再试')
                    .position('top right')
                    .hideDelay(3000)
                );
            }
        };



        //拖拽改变预览窗大小的功能
        $scope.draging = false;

        $scope.setDragBar = function () {
            //拖拽滑块改变窗格尺寸
            var startPrevWid = 480;
            var curPrevWid = 480;
            var startX = 0;
            var editorPartJo = $('#editorPart');
            var previewPartJo = $('#previewPart');

            $('#dragPreSizeBar').bind('mousedown', function (evt) {
                startX = evt.x || evt.clientX;
                $scope.draging = true;
                $('#dragMask').show();
                startPrevWid = previewPartJo.width();
            });

            //全局鼠标监听
            $(window).bind('mousemove', function (evt) {
                if ($scope.draging) {
                    var curX = evt.clientX || evt.x;
                    var absOffsetX = curX - startX;
                    var newWid = startPrevWid - absOffsetX;
                    if (newWid < 300) {
                        newWid = 300;
                    };

                    $('#previewPart').css('width', newWid + 'px');
                };
            });

            $(window).bind('mouseup', function (evt) {
                $scope.draging = false;
                $('#dragMask').hide();
            });
        };
        $scope.setDragBar();

        //重新匹配预览窗口，用于切换开关显示时候使用
        $scope.resizePreviewPart = function () {
            setTimeout(function () {
                var mainwid = $('#mainbody').innerWidth();
                var listwid = $scope.hideList ? 0 : $('#listPart').outerWidth(true);
                var editwid = $('#editorPart').outerWidth(true) + 1;
                var barwid = $('#dragPreSizeBar').outerWidth(true);

                var wid = mainwid - listwid - editwid - barwid - 1;
                if (wid < 480) wid = 480;
                $('#previewPart').css('width', wid + 'px');
            }, 200)
        };


        //检查是否当前预览文件,文件列表栏标识预览文件
        $scope.fileStateStyle = function (item) {
            var stl = {};

            //正在编辑，紫色
            if (item.key == $scope.editorFile.key) {
                stl['color'] = '#ec407a';
            };

            //实时预览，虚线边
            if (item.key == $scope.previewRtHtmlFile.key || item.key == $scope.previewRtCssFile.key) {
                stl['border-bottom'] = '1px dashed #DDD';
            };

            //手工预览，左侧边
            if (item.key == $scope.previewMnFile.key) {
                stl['border-left'] = '4px solid #ec407a';
            };

            return stl;
        };


        //判断界面尺寸
        $scope.greatThan = function (str) {
            var res = $mdMedia("gt-" + str);
            return res;
        };


        //改变编辑器的主题
        $scope.cmTheme = 'mbo';
        $scope.changeCmEditorTheme = function () {

            if ($scope.cmTheme == 'default') {
                $scope.cmTheme = 'mbo';
            } else {
                $scope.cmTheme = 'default';
            };
            $scope.cmEditor.setOption('theme', $scope.cmTheme);
        };


        //微信窗口修正
        var previewWid = (document.body.clientWidth > 480) ? '480px' : $('#menuSec').width() + 'px';
        $('#previewPart').css('width', previewWid);

        function fixLayout() {
            $scope.previewHei = document.body.clientHeight - $('#menuSec').height() - 2 + 'px';
            $scope.mbodyHei = document.body.clientHeight - $('#menuSec').height() + 'px';
            $scope.mbodyWid = document.body.clientWidth + 'px';
        }
        fixLayout();
        $(window).resize(fixLayout);


        //初始化bootstrap的tooltip工具
        $(document).ready(function () {
            $('[data-toggle="tooltip"]').tooltip();
        });


        //直接计算一个对象转为数组的长度

        $scope.objLength = function (obj) {
            var arr = _fns.obj2arr(obj);
            return arr.length;
        }



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


        //关闭左侧栏
        $rootScope.enableBlockLeftNav = false;
        //$rootScope.tagLeftMenu(false);

        //ctrlr end
    }
})();








//end
