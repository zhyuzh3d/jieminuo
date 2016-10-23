/*提供通用函数和全局变量
全局相关的设置也在这里修改
*/
if (!_pielib) var _pielib = {};

(function () {
    'use strict';


    var _cfg = {}; //全局设置参数的变量

    //七牛文件上传接口设定
    _cfg.qn = {
        getUploadTokenApiRd: 'http://www.jieminuoketang.com/api/qn_getUploadToken2', //上传到随机文件名
        BucketDomain: 'http://files.jieminuoketang.com/',
    };


    /*创建唯一的id
     */
    _pielib.uuid = function uniqueId(prefix) {
        var ts = Number(new Date()).toString(36)
        var rd = Number(String(Math.random()).replace('.', '')).toString(36);
        var res = ts + '-' + rd;
        if (prefix) res = prefix + '-' + res;
        return res;
    };



    //-------以下上传文件相关------------

    /**
     * 上传到七牛存储，必须已经获得uploadtoken,使用随机文件名
     * @param   {str} token    已经获取的上传凭证,必须
     * @param   {obj} file     需要上传的文件数据，必须
     * @param   {fn} progress 上传过程中更新的函数,一个参数obj包含lengthComputable,total,loaded，可选
     * @param   {fn} success  上传成功后的函数,三个参数,分别是返回信息(包含name,type,key),state('success'),xhr对象(带有file对象和domain)，可选
     * @param   {fn} error    上传失败后的函数，可选
     * @param   {fn} complete 上传完成后的函数，可选
     * @returns {xhr} 上传的xhr对象，带有file和domain属性
     */
    _pielib.uploadFileQnRd = function (token, file, progress, success, error, complete) {
        var useargs = (token.constructor != String);

        if (useargs) token = arguments.token;
        if (!token) {
            __errhdlr(new Error('_pielib.uploadFileQnRd:token undefined.'))
            return;
        };

        if (useargs) file = arguments.file;
        if (!file) {
            __errhdlr(new Error('_pielib.uploadFileQnRd:file undefined.'))
            return;
        };

        var domain = _cfg.qn.BucketDomain;

        //准备fromdata
        var formdata = new FormData();
        formdata.append('token', token);
        formdata.append('file', file);

        //发起上传
        var set = {
            url: "http://up.qiniu.com",
            data: formdata,
            type: 'POST',
            processData: false, //屏蔽掉ajax自动header处理
            contentType: false, //屏蔽掉ajax自动header处理
        };

        //监听事件
        if (useargs) progress = arguments.progress;
        if (progress) {
            set.xhr = function () {
                //为ajax添加progress事件监听
                var xhr = $.ajaxSettings.xhr();
                if (!xhr.file) xhr.file = file;
                xhr.upload.addEventListener("progress", progress, false);
                return xhr;
            };
        };

        //添加各种监听函数
        if (useargs) success = arguments.success;
        if (success) set.success = success;
        if (useargs) error = arguments.error;
        if (error) set.error = error;
        if (useargs) complete = arguments.complete;
        if (complete) set.complete = complete;

        var xhr = $.ajax(set);
        xhr.file = file;
        xhr.domain = domain;

        //把xhr存入_cfg.xhrs
        if (file.uploadId && file.id) {
            _cfg.xhrs[file.uploadId][file.id] = xhr;
        };

        return xhr;
    };



    /*最基本的上传按钮
    progress(evt),//添加evt.percent
    successfn(res),//增加res.url
    返回一个uniqID，最终的xhr存储在_cfg.xhrs[uploadid][xhrid]，用于取消上传
    */
    _cfg.xhrs = {};

    /**
     * 上传一个或多个文件，随机文件名版
     * @param   {jquery对象} btnjo      点击的按钮对象，隐身input将跟在这个jo后面,必须
     * @param   {function} beforefn 在发起上传之前执行的函数,fn(f,xhr)，可选
     * @param   {function} progressfn 上传过程中的函数，fn(f,evt),上传百分比进度evt.percent，可选
     * @param   {function} successfn  上传成功后执行的函数，fn(f,res)，上传的文件地址res.url，可选
     * @param   {function} abortfn    取消上传后执行的函数，可选
     * @param   {function} errorfn    出错执行的函数,fn(f,err)，标准xhr参数，可选
     * @param   {function} completefn 上传完成执行的函数,fn(f,xhr,status),标准xhr参数，可选
     * @param   {boolean} multi     同时上传多个文件，可选
     * @returns {int} uploadId整数，指向一个数组包含所有文件的xhr，_cfg.xhrs[uploadId]
     */
    _pielib.uploadFile2 = function (btnjo, beforefn, progressfn, successfn, abortfn, errorfn, completefn, multi) {
        if (!btnjo) {
            __errhdlr(new Error('_pielib.uploadFile:button undefined.'));
            return;
        };

        //如果按钮已经有uploadid，那么直接使用，否则就重新创建
        var uploadId = btnjo.attr('uploadId') || _pielib.uuid();
        btnjo.attr('uploadId', uploadId);
        if (!_cfg.xhrs[uploadId]) _cfg.xhrs[uploadId] = {};

        //创建file数据,隐身input放在btn之后
        var filejo = btnjo.siblings('#uploadFileInput');
        filejo.remove();
        filejo = $('<input id="uploadFileInput" type="file" style="display:none"></input>').appendTo(btnjo);
        if (multi) filejo.attr('multiple', "multiple");
        btnjo.after(filejo);


        //给file input添加监听
        filejo.bind('change', function () {
            var fileobjs = filejo.get(0).files;
            var domain = _cfg.qn.BucketDomain;

            //获取随机文件名token
            $.get(_cfg.qn.getUploadTokenApiRd, function (res) {
                for (var i = 0; i < fileobjs.length; i++) {
                    var f = fileobjs[i];
                    if (abortfn) f.abortfn = abortfn;

                    //执行上传之前的动作,预先放置一个空的xhr，带有file信息
                    var xhrid = _pielib.uuid();
                    var xhr = {};
                    xhr.file = f;
                    xhr.id = xhr.file.id = f.id = xhrid;
                    xhr.uploadId = xhr.file.uploadId = f.uploadId = uploadId;

                    _cfg.xhrs[uploadId][xhrid] = xhr;
                    if (beforefn) beforefn(f, xhr);

                    //开始上传
                    xhr = _pielib.uploadFileQnRd(res.data.uptoken, f,
                        function (evt) {
                            //添加evt.percent,为了避免abort之后progress会多运行一次，所以使用f.abort做判断
                            if (progressfn && !f.abort) {
                                if (evt.lengthComputable) {
                                    evt.percent = (100 * evt.loaded / evt.total).toFixed(0);
                                    f.percent = evt.percent;
                                };
                                progressfn(f, evt);
                            };
                        },
                        function (res) {
                            //把七牛的返回结果转为标准格式
                            res['success'] = true;
                            f.url = res.url = res['file_path'] = domain + res.key;
                            res['msg'] = 'upload ok.';
                            if (successfn) successfn(f, res);
                        },
                        function (f, err) {
                            if (errorfn) errorfn(f, err);
                        },
                        function (xhr, status) {
                            filejo.remove();
                            if (completefn) completefn(f, xhr, status);
                        }, domain);

                    if (xhr && abortfn) xhr['abortfn'] = abortfn;
                    if (xhr) {
                        xhr.id = xhrid;
                        xhr.uploadId = uploadId;
                        if (xhr.file) {
                            xhr.file.id = xhrid;
                            xhr.file.uploadId = uploadId;
                        };
                    };
                    if (xhr) _cfg.xhrs[uploadId][xhrid] = xhr;
                }
            }, 'jsonp');
        });

        //激活按钮点击事件
        filejo.click();

        return uploadId;
    }

    /**
     * 上传多个文件，与uploadFile单个文件相同
     * 随机文件名版本
     */
    _pielib.uploadFiles2 = function (btnjo, beforefn, progressfn, successfn, abortfn, errorfn, completefn) {
        return _pielib.uploadFile2(btnjo, beforefn, progressfn, successfn, abortfn, errorfn, completefn, domain, true);
    };

    /**
     * 取消上传，同时适用指定文件名版本和随机文件名版本
     * @param {int} xhrid 最终xhr将存放在_cfg.xhrs[xhrid]
     */
    _pielib.abortUpload = function (f) {
        var xhr = _cfg.xhrs[f.uploadId][f.id];
        if (f.abortfn) f.abortfn(f);
        f.abort = true;
        try {
            xhr.abort();
        } catch (err) {}
    };


    //-------------------------------------------------------

    /*专用err处理函数,适合co().then()使用*/
    function __errhdlr(err) {
        console.xerr(err.stack);
    };

    /*专用空函数，只输出不做额外处理,适合co().then()使用*/
    function __nullhdlr(res) {};

    /*专用空函数，只输出不做额外处理,适合co().then()使用*/
    function __infohdlr(res) {
        console.xinfo(res);
    };

    /*专用空函数，只纪录日志不做额外处理,适合co().then()使用*/
    function __loghdlr(res) {
        console.xlog(res);
    };

})();
