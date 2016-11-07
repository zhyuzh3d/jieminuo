/*mongoose数据库基本功能
 */

var _mngs = {};

_mngs.startPrms = function () {
    var prms = new Promise(function (resolvefn, rejectfn) {
        $mongoose.connect('mongodb://localhost/pie');
        _mngs.db = $mongoose.connection;
        _mngs.db.on('error', function (err) {
            __errhdlr('_mngs:startPrms:db error', err);
            rejectfn(err);
        });
        _mngs.db.once('open', function () {
            __infohdlr('_mngs:startPrms:is ready');
            resolvefn(_mngs);
        });
    });
    return prms;
};



//全部操作方法
var fns = _mngs.fns = {};

/**
 * 添加一条分享记录，可以_ctnu调用
 * @param {object} hisobj   记录对象
 * @param {function} callback(err) 回调
 */
fns.addShare = function (shareobj, callback) {
    var mod = new models.share(shareobj);
    mod.save(callback);
};


/**
 * 添加一条历史记录，可以_ctnu调用
 * @param {object} hisobj   记录对象
 * @param {function} callback(err) 回调
 */
fns.addHis = function (hisobj, callback) {
    var mod = new models.his(hisobj);
    mod.save(callback);
};

/**
 * 添加一条信息记录，可以_ctnu调用
 * @param {object} msgobj   记录对象
 * @param {function} callback(err) 回调
 */
fns.addMsg = function (msgobj, callback) {
    var mod = new models.msg(msgobj);
    mod.save(callback);
};


//全部图式------
var schemas = _mngs.schemas = {};

(function allSchemas() {
    //分享页面,不记录由谁分享，页面地址作为唯一识别
    schemas.share = new $mongoose.Schema({
        url: String, //分享的地址
        like: { //点赞数
            type: Number,
            default: 0
        },
        visited: { //访问数量。使用前端记录避免重复
            type: Number,
            default: 0
        },
    }, {
        strict: false,
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'update_at',
        },
    });

    //用户操作
    schemas.his = new $mongoose.Schema({
        uid: Number, //操作者id
        type: Number, //操作类型，如创建新app，登录，登出等
        //tarId: Number, //目标id，如创建的新app的id，可能为空
        //tarType: Number, //目标类型，如用户、app、信息等，可能为空
        //param: $mongoose.Schema.Mixed, //其余参数，对象格式，根据type不同而不同
    }, {
        strict: false,
        timestamps: {
            createdAt: 'created_at',
        },
    });

    //用户私信
    schemas.msg = new $mongoose.Schema({
        from: Number, //来自哪个用户uid
        to: Number, //发送到哪个用户uid
        read: Boolean, //是否已读
        content: $mongoose.Schema.Types.Mixed, //信息内容，根据不同type而不同，如title、text、pic、pics、files...
        state: Number, //状态，同意，拒绝
    }, {
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'update_at',
        },
    });

})();


//全部模型------
var models = _mngs.models = {};

(function allModels() {
    //用户分享页面对象
    models.share = $mongoose.model('share', schemas.share);

    //用户行为操作历史
    models.his = $mongoose.model('his', schemas.his);

    //用户所有信息记录
    models.msg = $mongoose.model('umsg', schemas.msg);
})();









//导出模块
module.exports = _mngs;
