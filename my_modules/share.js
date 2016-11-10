/*专门处理分享页面相关功能
比如分享点赞
*/
var _share = {};


/**
 * 添加分享历史记录的接口,用allows限定只允许的分享类型
 * 同时mongodb创建share对象
 * @returns {null}
 */
_rotr.apis.share_addShareHis = function () {
    var ctx = this;

    var co = $co(function* () {
        var uid = yield _fns.getUidByCtx(ctx);

        var type = ctx.query.type || ctx.request.body.type;
        if (type === undefined) throw Error('分享的动作类型不能为空.');

        //临时拦截codeapp类型的历史
        var allows = [
            _cfg.mgHisType.shareAchieve,
            _cfg.mgHisType.shareApp
        ];
        type = parseInt(type);
        if (allows.indexOf(type) == -1) throw Error('没有权限添加此类型历史记录.');

        var url = ctx.query.url || ctx.request.body.url;
        if (url === undefined) throw Error('分享页面地址不能为空.');

        var tarId = ctx.query.tarId || ctx.request.body.tarId;
        var tarType = ctx.query.tarType || ctx.request.body.tarType;
        if (!tarId) tarType = undefined;
        if (!tarType) tarId = undefined;

        var param = ctx.query.param || ctx.request.body.param;
        if (param) param = JSON.safeParse(param);

        //链接url记录到用户的分享历史记录，以备查询
        if (!param) param = {};
        param.url = url;

        //添加个人分享mongo历史
        var his = {
            uid: Number(uid),
            type: type,
            param: param,
        };
        if (tarId && tarType) {
            his.tarId = tarId;
            his.tarType = tarType;
        };

        _mngs.fns.addHis(his);

        //创建分享对象，如果没有就创建upsert
        var share = {
            url: url,
            type: type,
            param: param,
        };
        if (tarId && tarType) {
            his.tarId = tarId;
            his.tarType = tarType;
        };

        var res = yield _mngs.models.share.update({
            url: share.url
        }, share, {
            upsert: true
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok');
        return ctx;
    });
    return co;
};



/**
 * 未登录用户点赞某个页面，记入mongo。jsonp
 * 需要注意如果有时间戳也会被计算
 * @returns {null}
 */
_rotr.apis.share_likeUrl = function () {
    var ctx = this;
    ctx.enableJsonp = true;

    var co = $co(function* () {
        var uid = yield _fns.getUidByCtx(ctx, true);

        //如果已经登陆，增加点赞历史
        if (uid) {
            _mngs.fns.addHis({
                uid: uid,
                type: _cfg.mgHisType.likeShareUrl,
            });
        };

        //如果tarType是app且有tarId，那么增加点赞数，增加点赞app历史
        var tarType = ctx.query.tarType || ctx.request.body.tarType;
        var tarId = ctx.query.tarId || ctx.request.body.tarId;

        //jsonp使用data地址url参数
        var data = JSON.safeParse(decodeURIComponent(ctx.query.data));
        if (!tarType && data && data.tarType) tarType = data.tarType;
        if (!tarId && data && data.tarId) tarId = data.tarId;

        if (uid && tarType == 'app' && tarId) {
            //保存到mongo历史
            _mngs.fns.addHis({
                uid: Number(uid),
                type: _cfg.mgHisType.likeApp,
                tarId: Number(tarId),
                tarType: _cfg.mgTarType.app,
            });
            //检查hithis是否已经点赞
            var haslike = yield _ctnu([_rds.cli, 'sismember'], _rds.k.ladderHitHis, tarId + '-' + uid);

            //如果没有点赞，那么增加hit记录,并返回新的点赞数和权重;异步增加hithis
            var res = {};
            if (!haslike) {
                res.hit = yield _ctnu([_rds.cli, 'zincrby'], _rds.k.ladderHit, 1, tarId);
                res.weight = yield _pie.ladderUpdateWeightCo(tarId);
                _rds.cli.sadd(_rds.k.ladderHitHis, tarId + '-' + uid);
            };
        };


        var url = ctx.headers.referer;

        //根据url更新点赞数
        var res = yield _mngs.models.share.find({
            url: url
        }).update({
            $inc: {
                like: 1
            }
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};

/**
 * 未登录用户访问某个页面，记入mongo。jsonp
 * 需要注意如果有时间戳也会被计算
 * @returns {null}
 */
_rotr.apis.share_visitUrl = function () {
    var ctx = this;
    ctx.enableJsonp = true;

    var co = $co(function* () {
        var url = ctx.headers.referer;

        //根据url更新点赞数
        var res = yield _mngs.models.share.find({
            url: url
        }).update({
            $inc: {
                visited: 1
            }
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};


/**
 * 未登录用户获取页面的分享点赞访问信息。jsonp
 * 需要注意如果有时间戳也会被计算
 * @returns {null}
 */
_rotr.apis.share_getUrlData = function () {
    var ctx = this;
    ctx.enableJsonp = true;

    var co = $co(function* () {
        var url = ctx.headers.referer;

        //根据url更新点赞数,只返回查找到的第一个
        var res = yield _mngs.models.share.find({
            url: url
        });

        if (res[0]) res = res[0];

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};



//test




//导出模块
module.exports = _share;
