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







//导出模块
module.exports = _rds;
