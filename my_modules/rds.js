/*连接redis服务器
提供redis相关的基础功能函数
_cls（zset）键存储所有类型对象的autoid，由创建对象的时候incryby自动补齐
_map:key1.attr:key2.attr(hash/zset)存储各类映射检索，如果后者key2.attr是id数字，那么使用zset,否则使用hash
*/

var _rds = {};
var cli = _rds.cli = $redis.createClient(6379, 'localhost', {});


//全部key列表,所有映射map_开头,所有临时tmp_开头,所有对象直接写
_rds.k = {
    //应用,hash
    app: function (id) {
        return 'app-' + id;
    },

    //用户的app列表,zsort,{appName:appid}
    usrApps: function (uid) {
        return 'uApps-' + uid;
    },



    //存储类的自增id,hash
    map_cls2id: '_map:cls:id',

    //用户手机号码到用户id映射,hash
    map_uphone2uid: '_map:usr.phone:usr.id',

    //用户ukey到用户id的映射,hash
    map_ukey2uid: '_map:usr.ukey:usr.id',

    //用户,hash
    usr: function (id) {
        return 'usr-' + id;
    },

    //向用户发送的手机注册验证码,string
    tmp_phoneRegCode: function (phone) {
        return '_tmp:phoneRegCode-' + phone;
    },
    //向用户发送的手机注册验证码,string
    tmp_phoneRstCode: function (phone) {
        return '_tmp:phoneRstCode-' + phone;
    },
};


//先重命名文件，然后启动bgsave命令
_rds.saveDbBak = function (bak) {
    var ts = (new Date()).getTime();
    if (bak == true || bak === undefined) {
        $fs.rename("/var/lib/redis/dump.rdb", "/var/lib/redis/dump.rdb." + ts, function (err) {
            if (err) {
                console.log(">_rds:saveDbBak:rename dump.rdb failed！");
            } else {
                console.log(">_rds:saveDbBak:rename dump.rdb ok:" + ts);
                _rds.cli.bgsave();
            }
        });
    } else {
        _rds.cli.bgsave();
    }
};

//每次启动先备份当前数据库
_rds.saveDbBak();

//每小时自动执行备份
_rds.autoBakId = setTimeout(function () {
    _rds.saveDbBak();
}, 1000 * 3600);
console.log(">_rds:autoBak is running,id is rds.autoBakId ...");


/**
 * admin，直接远程运行命令，接收命令一定为数组模式，不超过5个参数，并返回结果，
 * @returns {} 命令的结果
 */
_rotr.apis.rds_admRunCmd = function () {
    var ctx = this;

    var co = $co(function* () {
        var uid = yield _fns.getUidByCtx(ctx);
        if (uid != 1) throw Error('权限验证失败，当前用户无权进行此操作');

        var cmd = ctx.query.cmd || ctx.request.body.cmd;
        if (!cmd) throw Error('没有收到cmd.');

        var paras = JSON.safeParse(cmd);
        if (paras.constructor != Array || paras.length == 0) throw Error('参数格式必须是数组.');

        //如果包含flush则不操作，直接返回成功
        if (paras[0].toLowerCase().indexOf('flush') != -1) {
            ctx.body = __newMsg(1, 'ok', '操作成功!');
            return ctx;
        };

        //执行操作
        var res;
        if (paras.length == 1) {
            res = yield _ctnu([_rds.cli, paras[0]]);
        } else if (paras.length == 2) {
            res = yield _ctnu([_rds.cli, paras[0]], paras[1]);
        } else if (paras.length == 3) {
            res = yield _ctnu([_rds.cli, paras[0]], paras[1], paras[2]);
        } else if (paras.length == 4) {
            res = yield _ctnu([_rds.cli, paras[0]], paras[1], paras[2], paras[3]);
        } else if (paras.length == 5) {
            res = yield _ctnu([_rds.cli, paras[0]], paras[1], paras[2], paras[3], paras[4]);
        };

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};






//导出模块
module.exports = _rds;
