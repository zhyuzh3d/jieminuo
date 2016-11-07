/*创建和管理App
 */
var _pie = {};

//预先读取模板文件
var templates = {
    baseHtml: $fs.readFileSync(__path + '/www/pie/templates/base/index.html', 'utf-8'),
    baseJs: $fs.readFileSync(__path + '/www/pie/templates/base/index.js', 'utf-8'),
    baseCss: $fs.readFileSync(__path + '/www/pie/templates/base/index.css', 'utf-8'),
};


/**
 * 接口：创建App，存储一个模板index.html文件到七牛存储，返回App的ID
 * @returns {appid} 创建的app的id
 */
_rotr.apis.pie_createApp = function () {
    var ctx = this;

    var co = $co(function* () {

        var appName = ctx.query.appName || ctx.request.body.appName;
        if (!appName || !_cfg.regx.appName.test(appName)) throw Error('App标识名格式错误.');

        var appAlias = ctx.query.appAlias || ctx.request.body.appAlias;
        if (!appAlias || !_cfg.regx.appAlias.test(appAlias)) throw Error('App名称格式错误.');

        var uid = yield _fns.getUidByCtx(ctx);

        //检查是否已经存在同名app，如果存在则终止
        var usrAppsKey = _rds.k.usrApps(uid);
        var isExist = yield _ctnu([_rds.cli, 'zscore'], usrAppsKey, appName);
        if (isExist) throw Error('已经存在相同标识名的APP，无法创建.');

        //获取appid
        var appId = yield _ctnu([_rds.cli, 'hincrby'], _rds.k.map_cls2id, 'app', 1);
        var appKey = _rds.k.app(appId);

        //向七牛添加三个的index文件，更多文件由前端根据模版创建
        var tmphtml = templates.baseHtml.replace(/\[\[uid\]\]/g, uid).replace(/\[\[appName\]\]/g, appName);
        var tmpcss = templates.baseCss.replace(/\[\[uid\]\]/g, uid).replace(/\[\[appName\]\]/g, appName);
        var tmpjs = templates.baseJs.replace(/\[\[uid\]\]/g, uid).replace(/\[\[appName\]\]/g, appName);

        var qnreshtml = yield _qn.qn_uploadDataCo(tmphtml, uid + '/' + appName + '/index.html');
        var qnrescss = yield _qn.qn_uploadDataCo(tmpcss, uid + '/' + appName + '/index.css');
        var qnresjs = yield _qn.qn_uploadDataCo(tmpjs, uid + '/' + appName + '/index.js');

        //存储为app-aid键
        var mu = _rds.cli.multi();
        var dat = {
            'id': appId,
            'name': appName,
            'alias': appAlias,
            'uid': uid,
            'pkey': __uuid(),
            'time': (new Date()).getTime(),
            'update': (new Date()).getTime(),
            'url': _qn.cfg.BucketDomain + uid + '/' + appName + '/',
        };
        for (var attr in dat) {
            mu.hset(appKey, attr, dat[attr]);
        };

        //增加usr-uid.appTotal字段
        mu.hincrby(_rds.k.usr(uid), 'appCreated', 1);

        mu.zadd(usrAppsKey, appId, appName);

        var res = yield _ctnu([mu, 'exec']);

        //增加一个his到mongo
        _mngs.fns.addHis({
            uid: Number(uid),
            type: _cfg.mgHisType.createApp,
            tarId: Number(appId),
            tarType: _cfg.mgTarType.app,
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok', dat);
        return ctx;
    });
    return co;
};


/**
 * 接口：通过appauthorid和appName获取app的基本信息，可以读取其他用户的app信息
 * @req {appUid} 创建的app的作者id
 * @req {appName} app的name
 * @returns {appid} 创建的app的id
 */
_rotr.apis.pie_getAppInfo = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        var appUid = ctx.query.appUid || ctx.request.body.appUid;
        if (appUid && !/^\d*$/.test(appUid)) throw Error('App作者ID格式错误.');
        if (!appUid) {
            //尝试使用cookie的token兑换uid
            appUid = uid;
        };

        var appName = ctx.query.appName || ctx.request.body.appName;
        if (!appName || !_cfg.regx.appName.test(appName)) throw Error('App标识名格式错误.');

        //从用户的app列表获取appid
        var uAppsKey = _rds.k.usrApps(appUid);
        var appid = yield _ctnu([_rds.cli, 'zscore'], uAppsKey, appName);
        if (!appid) throw Error('找不到对应的App.');

        //读取app的全部信息
        var appkey = _rds.k.app(appid);
        var dat = yield _ctnu([_rds.cli, 'hgetall'], appkey);

        //对数据进行过滤，只显示公开数据
        var res = {
            id: dat.id,
            name: dat.name,
            alias: dat.alias,
            time: dat.time,
            uid: dat.uid,
            url: dat.url,
            icon: dat.icon,
            desc: dat.desc,
            update: dat.update,
        };

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};




/**
 * 获取我的App列表
 * @returns {obj} {count:3,apps:[{name:'xxx',...}]}
 */

_rotr.apis.pie_getMyApps = function () {
    var ctx = this;

    var co = $co(function* () {
        var uid = yield _fns.getUidByCtx(ctx);

        //获取appid列表
        var uAppsKey = _rds.k.usrApps(uid);
        var apps = yield _ctnu([_rds.cli, 'zrange'], uAppsKey, 0, -1, 'WITHSCORES');

        var dat = {
            count: apps.length / 2,
            apps: _fns.arr2obj(apps, true, true),
        };

        //读取每个app的全部数据，不过滤
        var mu = _rds.cli.multi();
        for (var attr in dat.apps) {
            var app = dat.apps[attr];
            mu.hgetall('app-' + app.val);
        };

        var infos = yield _ctnu([mu, 'exec']);
        infos.forEach(function (info) {
            dat.apps[info.name].info = info;
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok', dat);
        return ctx;
    });
    return co;
};








/**
 * 移除自己的一个APP，只是从列表里面移除，并没有删除app键，也不删除响应的七牛文件，所以是可以恢复的
 * @param {appId} app的id
 * @returns {null}
 */

_rotr.apis.pie_removeApp = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        var appId = ctx.query.appId || ctx.request.body.appId;
        if (!appId) throw Error('App名称格式错误.');

        //获取appName
        var appKey = _rds.k.app(appId);
        var appName = yield _ctnu([_rds.cli, 'hget'], appKey, 'name');

        //从appid列表中移除
        var uAppsKey = _rds.k.usrApps(uid);
        var res = yield _ctnu([_rds.cli, 'zrem'], uAppsKey, appName);

        //保存到mongo历史
        _mngs.fns.addHis({
            uid: Number(uid),
            type: _cfg.mgHisType.removeApp,
            tarId: Number(appId),
            tarType: _cfg.mgTarType.app,
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok');
        return ctx;
    });
    return co;
};


/**
 * 修改我一个的App别名alias；限定自己的app
 * @param {appId} app的id
 * @param {appAlias} 新的app别名
 * @returns {}
 */

_rotr.apis.pie_renameApps = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        var appId = ctx.query.appId || ctx.request.body.appId;
        if (appId === undefined) throw Error('App ID不能为空.');
        appId = Number(appId);
        if (!appId || !Number.isInteger(appId)) throw Error('App ID格式错误.');

        var appAlias = ctx.query.appAlias || ctx.request.body.appAlias;
        if (!appAlias || !_cfg.regx.appAlias.test(appAlias)) throw Error('App新名称格式错误.');

        //检查app是否存在
        var appKey = _rds.k.app(appId);
        var hasexsit = yield _ctnu([_rds.cli, 'exists'], appKey);
        if (!hasexsit) throw Error('App不存在，修改失败');

        //检查appid是否在用户的app列表中
        var uAppsKey = _rds.k.usrApps(uid);
        var ismine = yield _ctnu([_rds.cli, 'zrangebyscore'], uAppsKey, appId, appId);
        if (!ismine || ismine.length == 0) throw Error('修改失败，您只能修改自己创建的app');

        //修改alias
        var res = yield _ctnu([_rds.cli, 'hset'], appKey, 'alias', appAlias);

        _rds.cli.hset(appKey, 'update', (new Date()).getTime());
        //保存到mongo历史
        _mngs.fns.addHis({
            uid: Number(uid),
            type: _cfg.mgHisType.renameApp,
            tarId: Number(appId),
            tarType: _cfg.mgTarType.app,
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok');
        return ctx;
    });
    return co;
};



/**
 * ladder:加入展示榜（每次展示列表都是从这里随机提取的）。
 * 新应用有100次随机展现机会，然后根据这100次的击中率进入权重榜，
 * 权重榜固定展现排名前十击中率，对于同一用户的重复展现不计次
 * @param {appId} app的id
 * @returns {}
 * 只有app的作者才可以执行这个操作
 */

_rotr.apis.pie_ladderJoin = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        var appId = ctx.query.appId || ctx.request.body.appId;
        if (appId === undefined) throw Error('App ID不能为空.');
        appId = Number(appId);
        if (!appId || !Number.isInteger(appId)) throw Error('App ID格式错误.');

        //验证app的作者是否是uid
        var authorId = yield _ctnu([_rds.cli, 'hget'], _rds.k.app(appId), 'uid');
        if (authorId != uid) throw Error('只有作者本人可以把APP加入榜单.');

        //检查是否已经加入到列表,避免重新加入导致刷新展示数和加入时间
        var shown = yield _ctnu([_rds.cli, 'zscore'], _rds.k.ladderShow, appId);
        if (shown !== null) throw Error('这个APP已经加入榜单，不需要重复入榜。');

        var mu = _rds.cli.multi();

        //把app加入到排行榜的展示列表中，有点击才会加入到击中列表
        mu.zadd(_rds.k.ladderShow, 0, appId);

        //记录加入时间
        mu.zadd(_rds.k.ladderJoinTime, (new Date()).getTime(), appId);

        //添加到app-id的inladder字段
        mu.hset(_rds.k.app(appId), 'inladder', 1);

        var res = yield _ctnu([mu, 'exec']);

        //保存到mongo历史
        _mngs.fns.addHis({
            uid: Number(uid),
            type: _cfg.mgHisType.addAppToLadder,
            tarId: Number(appId),
            tarType: _cfg.mgTarType.app,
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok');
        return ctx;
    });
    return co;
};


/**
 * ladder:获取n(<10)个随机展示，从展示榜抽取且自增，并且根据显示历史验证是否需要增加用户展示榜计数
 * @param {count} 读取多少个，小于12
 * @returns {apps:[{id:xx,alias:xx,name:xx,authorid:xx,url:xxx},...]}
 */

_rotr.apis.pie_ladderGetShowApps = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        var count = ctx.query.count || ctx.request.body.count;
        if (count == undefined || count > 12) count = 12;

        //获取5个最低展示数的APP
        var apps = yield _ctnu([_rds.cli, 'zrange'], _rds.k.ladderShow, 0, count, 'withscores');
        apps = _fns.arr2obj(apps);

        var res = yield _pie.ladderProcAppsShowCo(apps, uid, 'show');

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};



/**
 * ladder:获取top10，权重榜的10个,本质上这也是一种展现，计算到show榜
 * @param {count} 读取多少个，小于12
 * @returns {apps:[{id:xx,alias:xx,name:xx,authorid:xx,url:xxx},...]}
 */

_rotr.apis.pie_ladderGetTopApps = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        var count = ctx.query.count || ctx.request.body.count;
        if (count == undefined || count > 12) count = 12;

        //获取5个最高权重榜APP
        var apps = yield _ctnu([_rds.cli, 'zrevrange'], _rds.k.ladderWeight, 0, count, 'withscores');
        apps = _fns.arr2obj(apps);

        var res = yield _pie.ladderProcAppsShowCo(apps, uid);

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};



/*处理多个apps的展示后续事件，
 * 比如，获取每个app的详细信息，
 * 监测是否第一次向用户展示自增ushow数据
 * 获取app的更多榜单信息如show,ushow,hit,wei等数据
 * @param {apps} 一个对象，每个属性就是appid，{112:99,124:1,...},只用attr/key，val不用
 * @param {uid} 当前用户
 * @param {asKey} 把apps的val作为哪个属性返回，'show'，则是{...,show:99,....}
 * @returns [{appinfo},...] app详细信息数组
 */
_pie.ladderProcAppsShowCo = function (apps, uid, asKey) {
    var co = $co(function* () {
        var mu = _rds.cli.multi();
        var muasync = _rds.cli.multi();

        var needUpdateWeight = {};

        //针对每个appid操作
        for (var appid in apps) {
            //获取这个app的基本信息
            mu.hgetall('app-' + appid);

            //异步：将这5个APP每个计数+1
            muasync.zincrby(_rds.k.ladderShow, 1, appid);

            //监测是否已经向uid用户展示过这个app
            var hasshow = yield _ctnu([_rds.cli, 'sismember'], _rds.k.ladderShowHis, appid + '-' + uid);

            //异步：如果是第一次向此用户展示，那么向ushow计数+1,同时创建showhis
            if (!hasshow) {
                muasync.zincrby(_rds.k.ladderUsrShow, 1, appid);
                muasync.sadd(_rds.k.ladderShowHis, appid + '-' + uid);
                needUpdateWeight[appid] = true;
            }
        };

        muasync.exec();
        var res = yield _ctnu([mu, 'exec']);

        //获取用户的favor列表，以便于下面填充hasfavor字段
        var ufavors = yield _ctnu([_rds.cli, 'smembers'], _rds.k.usrFavorApps(uid));

        //为每个app补充信息
        for (var i = 0; i < res.length; i++) {
            var appinfo = res[i];

            var muadd = _rds.cli.multi();

            //补充每个app的author信息
            muadd.hgetall(_rds.k.usr(appinfo.uid));

            //补充每个app的hit点赞数
            muadd.zscore(_rds.k.ladderHit, appinfo.id);

            //补充每个app当前uid是否已经点赞
            muadd.sismember(_rds.k.ladderHitHis, appinfo.id + '-' + uid);

            var resadd = yield _ctnu([muadd, 'exec']);

            //限定字段，不返回app私密信息
            res[i] = {
                id: appinfo.id,
                name: appinfo.name,
                alias: appinfo.alias,
                time: appinfo.time,
                uid: appinfo.uid,
                url: appinfo.url,
                icon: appinfo.icon,
                author: {
                    id: resadd[0].id,
                    nick: resadd[0].nick,
                    color: resadd[0].color,
                    avatar: resadd[0].avatar,
                },
                hit: resadd[1],
                hashit: resadd[2],
                hasfavor: ufavors.indexOf(appinfo.id) != -1,
                update: appinfo.update,
            };

            if (asKey) res[i][asKey] = apps[appinfo.id];

            //获取权重
            if (needUpdateWeight[appinfo.id]) {
                res[i].weight = yield _pie.ladderUpdateWeightCo(appinfo.id);
            } else {
                res[i].weight = yield _ctnu([_rds.cli, 'zscore'], _rds.k.ladderWeight, appinfo.id);
            };
        };

        return res;
    });
    return co;
};


/**
 * ladder:点赞app，限定每用户每APP只能1票
 * @param {appId} 给哪个app投票
 * @returns {...}
 */

_rotr.apis.pie_ladderLikeApp = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        var appId = ctx.query.appId || ctx.request.body.appId;
        if (appId === undefined) throw Error('App ID不能为空.');
        appId = Number(appId);
        if (!appId || !Number.isInteger(appId)) throw Error('App ID格式错误.');

        //检查hithis是否已经点赞
        var haslike = yield _ctnu([_rds.cli, 'sismember'], _rds.k.ladderHitHis, appId + '-' + uid);

        //如果没有点赞，那么增加hit记录,并返回新的点赞数和权重;异步增加hithis
        var res = {};
        if (!haslike) {
            res.hit = yield _ctnu([_rds.cli, 'zincrby'], _rds.k.ladderHit, 1, appId);
            res.weight = yield _pie.ladderUpdateWeightCo(appId);
            _rds.cli.sadd(_rds.k.ladderHitHis, appId + '-' + uid);
        };

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);

        //保存到mongo历史
        _mngs.fns.addHis({
            uid: Number(uid),
            type: _cfg.mgHisType.likeApp,
            tarId: Number(appId),
            tarType: _cfg.mgTarType.app,
        });

        return ctx;
    });
    return co;
};



/**
 * 根据ushow和hit计算单个app的weight并更新
 * 前提是show大于100，异步更新weight并返回新weight
 * @param   {appId} 需要计算更新的appid
 * @returns {weight} hit/ushow的比例，小于1的小数；-1表示展示低于100，无权重
 */

_pie.ladderUpdateWeightCo = function (appId) {
    var co = $co(function* () {
        //先获取show，低于100直接返回-1
        var show = yield _ctnu([_rds.cli, 'zscore'], _rds.k.ladderShow, appId);
        if (show < 100) return -1;

        var mu = _rds.cli.multi();

        //获取ushow和hit计算weight
        mu.zscore(_rds.k.ladderHit, appId);
        mu.zscore(_rds.k.ladderUsrShow, appId);

        var res = yield _ctnu([mu, 'exec']);
        if (!res[0] === null) res[1] = 0; //未被击中，无记录
        if (!res[1]) throw Error('获取APP榜单权重失败,找不到APP展示数据.');

        var weight = res[0] / res[1];

        //异步写入weight数据库
        _rds.cli.zadd(_rds.k.ladderWeight, weight, appId);

        return weight;
    });
    return co;
}



/**
 * favor:收藏一个app
 * @param {appId} 收藏哪个app
 * @returns {}
 */

_rotr.apis.pie_favorAdd = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        var appId = ctx.query.appId || ctx.request.body.appId;
        if (appId === undefined) throw Error('App ID不能为空.');
        appId = Number(appId);
        if (!appId || !Number.isInteger(appId)) throw Error('App ID格式错误.');

        //将appid添加到uFavorApps-uid中
        var res = yield _ctnu([_rds.cli, 'sadd'], _rds.k.usrFavorApps(uid), appId);

        //增加一个his到mongo
        _mngs.fns.addHis({
            uid: Number(uid),
            type: _cfg.mgHisType.favorApp,
            tarId: Number(appId),
            tarType: _cfg.mgTarType.app,
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};

/**
 * favor:取消收藏一个app
 * @param {appId} 取消哪个app
 * @returns {}
 */

_rotr.apis.pie_favorRem = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        var appId = ctx.query.appId || ctx.request.body.appId;
        if (appId === undefined) throw Error('App ID不能为空.');
        appId = Number(appId);
        if (!appId || !Number.isInteger(appId)) throw Error('App ID格式错误.');

        //将appid添加到uFavorApps-uid中
        var res = yield _ctnu([_rds.cli, 'srem'], _rds.k.usrFavorApps(uid), appId);

        //保存到mongo历史
        _mngs.fns.addHis({
            uid: Number(uid),
            type: _cfg.mgHisType.unFavorApp,
            tarId: Number(appId),
            tarType: _cfg.mgTarType.app,
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};


/**
 * favor:获取收藏的App列表，包含每个app的公开信息和作者信息
 * @param {}
 * @returns [{id:12,name:xxx,url:xxx,author:{id:xx,nick:xx,avatar:xx}},...]
 */

_rotr.apis.pie_favorGetApps = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        //将appid添加到uFavorApps-uid中
        var apps = yield _ctnu([_rds.cli, 'smembers'], _rds.k.usrFavorApps(uid));
        if (!apps || apps.length < 1) {
            ctx.body = __newMsg(1, 'ok', []);
            return ctx;
        };

        var muapp = _rds.cli.multi();

        //循环提取多个app基本信息
        for (var i = 0; i < apps.length; i++) {
            muapp.hgetall(_rds.k.app(apps[i]));
        };
        var resapps = yield _ctnu([muapp, 'exec']);

        var muauthor = _rds.cli.multi();

        //循环为每个app的作者提取信息,必须每个都提取，即使为空也要补足,确保一一对应
        for (var n = 0; n < resapps.length; n++) {
            var authorid = resapps[n] ? resapps[n].uid : undefined;
            muauthor.hgetall(_rds.k.usr(authorid));
        };
        var resauthors = yield _ctnu([muauthor, 'exec']);

        //整理数据与合并数据
        var res = [];
        for (var m = 0; m < resapps.length; m++) {
            var item = resapps[m] ? resapps[m] : {};
            var author = resauthors[m] ? resauthors[m] : {};
            res.push({
                id: item.id,
                name: item.name,
                alias: item.alias,
                time: item.time,
                url: item.url,
                uid: item.uid,
                inladder: item.inladder,
                hasfavor: true,
                author: {
                    id: author.id,
                    nick: author.nick,
                    color: author.color,
                    avatar: author.avatar,
                },
                icon: item.icon,
                desc: item.desc,
                update: item.update,
            })
        };

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};




/**
 * admin:获取全部各种榜的APP榜单信息
 * 把各个ladder键都读取，交给前端处理分析;his键太大，不包含。
 * @returns {...}
 */

_rotr.apis.pie_admGetLadderList = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);
        if (uid != 1) throw Error('权限验证失败，当前用户无权进行此操作');

        //获取各个键的全部
        var show = yield _ctnu([_rds.cli, 'zrange'], _rds.k.ladderShow, 0, -1, 'withscores');
        var joinTime = yield _ctnu([_rds.cli, 'zrange'], _rds.k.ladderJoinTime, 0, -1, 'withscores');
        var ushow = yield _ctnu([_rds.cli, 'zrange'], _rds.k.ladderUsrShow, 0, -1, 'withscores');
        var hit = yield _ctnu([_rds.cli, 'zrange'], _rds.k.ladderHit, 0, -1, 'withscores');
        var weight = yield _ctnu([_rds.cli, 'zrange'], _rds.k.ladderWeight, 0, -1, 'withscores');

        var res = {
            show: show,
            joinTime: joinTime,
            ushow: ushow,
            hit: hit,
            weight: weight,
        }

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};


/**
 * 更新自己的app的update时间字段,时间由服务器决定
 * @param {Number} appId app的id
 * @param {Number} type 行为类型，_cfg.mgHisType:updatefile,createfile...
 * @param {object} param 附属参数，对象格式存入mongo
 * @returns {}
 */

_rotr.apis.pie_setAppUpdate = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        var appId = ctx.query.appId || ctx.request.body.appId;
        if (appId === undefined) throw Error('appID不能都为空.');

        var appKey = _rds.k.app(appId);

        //检查是否拥有此app
        var rdsUid = yield _ctnu([_rds.cli, 'hget'], appKey, 'uid');
        if (rdsUid != uid) throw Error('权限验证失败.');

        //异步执行修改
        _rds.cli.hset(appKey, 'update', (new Date()).getTime());

        //记入mongo数据库
        var type = ctx.query.type || ctx.request.body.type;
        var param = ctx.query.param || ctx.request.body.param;
        _mngs.fns.addHis({
            uid: Number(uid),
            type: Number(type),
            tarId: Number(appId),
            tarType: _cfg.mgTarType.app,
            param: param,
        });

        //如果是codeApp动作，提取编码数量length与动作值changes，
        //增加到rds的usr-uid.codeLength和codeChanges
        if (type == _cfg.mgHisType.codeApp && param) {
            if (param.length && param.changes) {
                var ukey = _rds.k.usr(uid);
                _rds.cli.hincrby(ukey, 'codeLength', param.length);
                _rds.cli.hincrby(ukey, 'codeChanges', param.changes);
            };
        };

        //返回数据
        ctx.body = __newMsg(1, 'ok');
        return ctx;
    });
    return co;
};


/**
 * 获取APP的自己的操作历史（不包含收藏，点赞历史），仅限本人
 * @param {Number} appId app的id
 * @param {Date} start 从多少条开始读取
 * @param {Date} count 最多读取多少条
 * @returns {Array} 历史记录对象数组
 */
_rotr.apis.pie_getAppHis = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        var appId = ctx.query.appId || ctx.request.body.appId;
        if (appId === undefined) throw Error('appID不能都为空.');

        var appKey = _rds.k.app(appId);

        //检查是否拥有此app
        var rdsUid = yield _ctnu([_rds.cli, 'hget'], appKey, 'uid');
        if (rdsUid != uid) throw Error('权限验证失败.');

        var start = ctx.query.start || ctx.request.body.start;
        if (start === undefined) start = 0;

        var count = ctx.query.count || ctx.request.body.count;
        if (!count) count = 10;

        //从mongo读取记录
        var res = yield _mngs.models.his.find({
            uid: Number(uid),
            tarId: Number(appId),
            tarType: _cfg.mgTarType.app,
        }).sort('-created_at').skip(Number(start)).limit(Number(count)).exec();

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};



/**
 * 获取我的编码历史统计信息
 * @param   {date} begin 开始时间,默认七天前
 * @param   {date} end 开始时间，默认为现在
 * @param   {number} appid 开始时间，默认为七天之前
 * @returns {array}    所有code
 */
_rotr.apis.pie_getMyCodeHis = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);


        var begin = ctx.query.begin || ctx.request.body.begin;
        begin = new Date(begin);
        if (!_fns.isDate(begin)) {
            begin = new Date();
        };
        begin = new Date(begin - _cfg.dur.day * 7);

        var end = ctx.query.end || ctx.request.body.end;
        end = new Date(end);
        if (!_fns.isDate(end)) {
            end = new Date();
        };

        //查询条件
        var query = {
            uid: Number(uid),
            type: _cfg.mgHisType.codeApp,
            created_at: {
                $gte: begin,
                $lt: end
            },
        };
        var appId = ctx.query.appId || ctx.request.body.appId;
        if (appId) query.param = {
            tarId: appId,
            tarType: _cfg.mgTarType.app,
        };

        //从mongo读取记录
        var res = yield _mngs.models.his.find(query).sort('-created_at').exec();

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};




/**
 * 更新自己的app的信息字段
 * @param {appId} app的id
 * @param {icon} app的icon
 * @param {alias} app的alias
 * @param {desc} app的desc
 * @returns {}
 */

_rotr.apis.pie_updateAppInfo = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        var appId = ctx.query.appId || ctx.request.body.appId;
        if (appId === undefined) throw Error('appID不能都为空.');

        var appKey = _rds.k.app(appId);

        //检查是否拥有此app
        var rdsUid = yield _ctnu([_rds.cli, 'hget'], appKey, 'uid');
        if (rdsUid != uid) throw Error('权限验证失败.');

        var mu = _rds.cli.multi();
        var appkey = _rds.k.app(appId);
        var param = {};

        //提取各个字段
        var icon = ctx.query.icon || ctx.request.body.icon;
        if (icon && !_cfg.regx.url.test(icon)) throw Error('图标链接格式错误');
        if (icon) {
            mu.hset(appkey, 'icon', icon);
            param.icon = icon;
        };

        var alias = ctx.query.alias || ctx.request.body.alias;
        if (alias && !_cfg.regx.appAlias.test(alias)) throw Error('名称格式错误');
        if (alias) {
            mu.hset(appkey, 'alias', alias);
            param.appkey = appkey;
        };

        var desc = ctx.query.desc || ctx.request.body.desc;
        if (desc && !_cfg.regx.appDesc.test(desc)) throw Error('描述信息格式错误');
        if (desc) {
            mu.hset(appkey, 'desc', desc);
            param.desc = desc;
        };

        var res = yield _ctnu([mu, 'exec']);

        _rds.cli.hset(appKey, 'update', (new Date()).getTime());
        //保存到mongo历史
        _mngs.fns.addHis({
            uid: Number(uid),
            type: _cfg.mgHisType.setApp,
            tarId: Number(appId),
            tarType: _cfg.mgTarType.app,
            param: param,
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};


/**
 * 更新自己的app的扩展信息字段
 * @param {string} wildDogAppSecret app的绑定的野狗超级密钥wildDogAppSecret
 * @param {string} customs 自定义变量对象，地址栏传参数需要以对象格式
 * @returns {}
 */

_rotr.apis.pie_updateAppInfoExt = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        var appId = ctx.query.appId || ctx.request.body.appId;
        if (appId === undefined) throw Error('appID不能都为空.');

        var appKey = _rds.k.app(appId);

        //检查是否拥有此app
        var rdsUid = yield _ctnu([_rds.cli, 'hget'], appKey, 'uid');
        if (rdsUid != uid) throw Error('权限验证失败.');

        var mu = _rds.cli.multi();
        var appextkey = _rds.k.appExt(appId);
        var param = {};

        //提取野狗密匙
        var wildDogAppSecret = ctx.query.wildDogAppSecret || ctx.request.body.wildDogAppSecret;
        if (wildDogAppSecret && !_cfg.regx.hash.test(wildDogAppSecret)) throw Error('野狗APP超级密匙格式错误');
        if (wildDogAppSecret) {
            mu.hset(appextkey, 'wildDogAppSecret', wildDogAppSecret);
            param.wildDogAppSecret = wildDogAppSecret;
        };

        //提取各个自定义字段,如果为空则删除这个字段
        var customs = JSON.safeParse(ctx.query.customs) || ctx.request.body.customs;
        for (var attr in customs) {
            var val = customs[attr];
            param[attr] = val;

            if (!val || val == '') {
                mu.hdel(appextkey, attr);
            } else {
                mu.hset(appextkey, attr, customs[attr]);
            }
        };

        var res = yield _ctnu([mu, 'exec']);

        _rds.cli.hset(appKey, 'update', (new Date()).getTime());
        //保存到mongo历史
        _mngs.fns.addHis({
            uid: Number(uid),
            type: _cfg.mgHisType.setAppExt,
            tarId: Number(appId),
            tarType: _cfg.mgTarType.app,
            param: param,
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};


/**
 * 接口：获取我的App的扩展信息
 * @req {appId} 创建的app的作者id
 * @returns {} 返回appext全部字段
 */
_rotr.apis.pie_getMyAppInfoExt = function () {
    var ctx = this;

    var co = $co(function* () {

        var uid = yield _fns.getUidByCtx(ctx);

        var appId = ctx.query.appId || ctx.request.body.appId;
        if (appId === undefined) throw Error('appID不能都为空.');

        var appKey = _rds.k.app(appId);

        //检查是否拥有此app
        var rdsUid = yield _ctnu([_rds.cli, 'hget'], appKey, 'uid');
        if (rdsUid != uid) throw Error('权限验证失败.');

        var mu = _rds.cli.multi();
        var appextkey = _rds.k.appExt(appId);

        var res = yield _ctnu([_rds.cli, 'hgetall'], appextkey);

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};


/**
 * 保存用户自己的编辑器设定
 * @returns {null}
 */
_rotr.apis.pie_saveConfig = function () {
    var ctx = this;

    var co = $co(function* () {
        var uid = yield _fns.getUidByCtx(ctx);

        var mu = _rds.cli.multi();
        var uPieConfKey = _rds.k.uPieConf(uid);
        var param = {};

        //仅保存限定的信息
        var showSaveConfirm = ctx.query.showSaveConfirm || ctx.request.body.showSaveConfirm;
        if (showSaveConfirm !== undefined) {
            mu.hset(uPieConfKey, 'showSaveConfirm', showSaveConfirm);
            param.showSaveConfirm = showSaveConfirm;
        };

        var themeName = ctx.query.themeName || ctx.request.body.themeName;
        if (themeName) {
            mu.hset(uPieConfKey, 'themeName', themeName);
            param.themeName = themeName
        }

        var fontSize = ctx.query.fontSize || ctx.request.body.fontSize;
        if (fontSize) {
            mu.hset(uPieConfKey, 'fontSize', fontSize);
            param.fontSize = fontSize;
        }

        var lineWrapping = ctx.query.lineWrapping || ctx.request.body.lineWrapping;
        if (lineWrapping !== undefined) {
            mu.hset(uPieConfKey, 'lineWrapping', lineWrapping);
            param.lineWrapping = lineWrapping;
        }

        var showLint = ctx.query.showLint || ctx.request.body.showLint;
        if (showLint !== undefined) {
            mu.hset(uPieConfKey, 'showLint', showLint);
            param.showLint = showLint;
        };

        var res = yield _ctnu([mu, 'exec']);

        //保存到mongo历史
        _mngs.fns.addHis({
            uid: Number(uid),
            type: _cfg.mgHisType.saveMyCfg,
            param: param,
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok');
        return ctx;
    });
    return co;
};


/**
 * 获取用户自己的编辑器设定
 * @returns {null}
 */
_rotr.apis.pie_getMyConfig = function () {
    var ctx = this;

    var co = $co(function* () {
        var uid = yield _fns.getUidByCtx(ctx);

        var uPieConfKey = _rds.k.uPieConf(uid);

        var res = yield _ctnu([_rds.cli, 'hgetall'], uPieConfKey);

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};







//导出模块
module.exports = _pie;
