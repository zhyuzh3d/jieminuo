/*提供账号相关服务的接口*/
var _account = {};


/**
 * 使用手机验证码注册
 * @param {string} phone 11位电话号码
 * @param {string} code 6位验证码
 * @param {string} pw 32位Md5加密密码
 * @returns {usrObj} 用户对象
 */
_rotr.apis.acc_regByPhone = function () {
    var ctx = this;

    var co = $co(function* () {
        var phone = ctx.query.phone || ctx.request.body.phone;
        if (!phone || !_cfg.regx.phone.test(phone)) throw Error('手机号码格式错误.');

        var pw = ctx.query.pw || ctx.request.body.pw;
        if (!pw || !_cfg.regx.pw.test(pw)) throw Error('密码格式错误.');

        var phoneCode = ctx.query.phoneCode || ctx.request.body.phoneCode;
        if (!phoneCode || !_cfg.regx.phoneCode.test(phoneCode)) throw Error('验证码格式错误.');

        //检查验证码
        var codeKey = _rds.k.tmp_phoneRegCode(phone);
        var rdsPhoneCode = yield _ctnu([_rds.cli, 'get'], codeKey);
        if (rdsPhoneCode != phoneCode) throw Error('验证码错误，请重试.');

        //注册用户,map_cls2id计数++,创建_usr-id，
        var uid = yield _ctnu([_rds.cli, 'hincrby'], _rds.k.map_cls2id, 'usr', 1);
        var usrKey = _rds.k.usr(uid);
        var phoneMapKey = _rds.k.map_uphone2uid;
        var ukey = __uuid();

        //写入rds数据库usr类pw,phone，并更新ukey:uid
        var mu = _rds.cli.multi();
        mu.hset(_rds.k.map_ukey2uid, ukey, uid);
        mu.hset(_rds.k.map_uphone2uid, phone, uid);

        mu.hset(usrKey, 'id', uid);
        mu.hset(usrKey, 'phone', phone);
        mu.hset(usrKey, 'pw', pw);
        mu.hset(usrKey, 'ukey', ukey);
        mu.hset(usrKey, 'regtime', (new Date()).getTime());

        mu.del(codeKey);
        var res = yield _ctnu([mu, 'exec']);

        //将用户身份识别key写入用户浏览器,所有cookie都以m_开头
        ctx.cookies.set('m_ukey', undefined, {
            httpOnly: true,
            expires: new Date((new Date()).getTime() - 60000),
        });
        ctx.cookies.set('m_ukey', ukey, {
            httpOnly: true,
            expires: new Date((new Date()).getTime() + _cfg.dur.browserUkey),
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok');
        return ctx;
    });
    return co;
};



/**
 * 通过ukey获取uid，供其他模块服务器调用，比getMyinfo更快速，不读取用户信息
 * 支持url的ukey参数或post数据的ukey,或者cookie
 * @returns {int} 用户id
 */
_rotr.apis.acc_getUidByUkey = function () {
    var ctx = this;

    var co = $co(function* () {

        var ukey = ctx.query.ukey || ctx.request.body.ukey;

        if (!ukey) ukey = ctx.cookies.get('m_ukey');
        if (!ukey || !_cfg.regx.ukey.test(ukey)) throw Error('ukey不能为空.');

        //登陆情况，读取用户id
        var mpkey = _rds.k.map_ukey2uid;
        var uid = yield _ctnu([_rds.cli, 'hget'], _rds.k.map_ukey2uid, ukey);

        //未登录情况,清除ukey并返回错误
        if (!uid) {
            ukey = undefined;
            ctx.cookies.set('m_ukey', ukey, {
                httpOnly: true,
                expires: new Date((new Date()).getTime() + _cfg.dur.browserUkey),
            });
            throw Error('错误或无效的登录信息，请您手工登陆或注册.')
        }

        //返回uid
        var dat = {
            uid: uid
        };

        //返回数据
        ctx.body = __newMsg(1, 'ok', dat);
        return ctx;
    });
    return co;
};




/**
 * 兼容jsonp
 * 获取用户自己信息的接口，可以用来检测是否已经登陆,根据cookie里面的m_ukey判断
 * @returns {usr} 用户基础信息对象{id:12,phone:...,...}
 */
_rotr.apis.acc_getMyInfo = function () {
    var ctx = this;
    ctx.enableJsonp = true;

    var co = $co(function* () {
        var msg;

        //检测是否存在账号ukey，
        var ukey = ctx.cookies.get('m_ukey');
        if (!ukey) throw Error('没找到您的登录信息，请重新登陆或注册.');

        //登陆情况，读取用户id
        var mpkey = _rds.k.map_ukey2uid;
        var uid = yield _ctnu([_rds.cli, 'hget'], _rds.k.map_ukey2uid, ukey);


        //未登录情况,清除ukey并返回错误
        if (!uid) {
            ukey = undefined;
            ctx.cookies.set('m_ukey', ukey, {
                httpOnly: true,
                expires: new Date((new Date()).getTime() + _cfg.dur.browserUkey),
            });
            throw Error('错误或无效的登录信息，请您手工登陆或注册.')
        }

        //异步记录访问时间
        _rds.cli.hset(_rds.k.usr(uid), 'lasttime', (new Date()).getTime());

        //读取用户全部信息，仅返回部分安全信息
        var dat = yield _account.acc_getUsrInfoCo(uid);
        dat.ukey = undefined;

        //对用户的phone字段做隐藏134******37
        dat.phone = dat.phone.substr(0, 3) + '******' + dat.phone.substr(dat.phone.length - 2);

        ctx.body = __newMsg(1, 'ok', dat);
        return ctx;
    });
    return co;
};




/**
 * 保存用户自己信息的接口,根据cookie里面的m_ukey判断
 * @returns {null}
 */
_rotr.apis.acc_saveProfile = function () {
    var ctx = this;

    var co = $co(function* () {
        var msg;

        //检测是否存在账号ukey，
        var ukey = ctx.cookies.get('m_ukey');
        if (!ukey) throw Error('没找到您的登录信息，请重新登陆或注册.')

        //登陆情况，读取用户id
        var mpkey = _rds.k.map_ukey2uid;
        var uid = yield _ctnu([_rds.cli, 'hget'], _rds.k.map_ukey2uid, ukey);

        //未登录情况,清除ukey并返回错误
        if (!uid) {
            ukey = undefined;
            ctx.cookies.set('m_ukey', ukey, {
                httpOnly: true,
                expires: new Date((new Date()).getTime() + _cfg.dur.browserUkey),
            });
            throw Error('错误或无效的登录信息，请您手工登陆或注册.')
        }

        var usrkey = _rds.k.usr(uid);
        var mu = _rds.cli.multi();

        //仅保存限定的信息
        var nick = ctx.query.nick || ctx.request.body.nick;
        if (nick && _cfg.regx.nick.test(nick)) {
            mu.hset(usrkey, 'nick', nick);
        };

        var color = ctx.query.color || ctx.request.body.color;
        if (color && _cfg.regx.color.test(color)) {
            mu.hset(usrkey, 'color', color);
        };

        var icon = ctx.query.icon || ctx.request.body.icon;
        if (icon && _cfg.regx.icon.test(icon)) {
            mu.hset(usrkey, 'icon', icon);
        };

        var avatar = ctx.query.avatar || ctx.request.body.avatar;
        if (avatar && _cfg.regx.avatar.test(avatar)) {
            mu.hset(usrkey, 'avatar', avatar);
        };

        var res = yield _ctnu([mu, 'exec']);

        //返回数据
        ctx.body = __newMsg(1, 'ok');
        return ctx;
    });
    return co;
};




/**
 * 使用手机号和密码登录
 * @param {string} phone 用户手机号
 * @param {string} pw 加密后的密码，应该32位
 * @returns {usrObj} 用户基本信息
 */

_rotr.apis.acc_loginByPhone = function () {
    var ctx = this;

    var co = $co(function* () {
        var phone = ctx.query.phone || ctx.request.body.phone;
        if (!phone || !_cfg.regx.phone.test(phone)) throw Error('手机号码格式错误.');

        var pw = ctx.query.pw || ctx.request.body.pw;
        if (!pw || !_cfg.regx.pw.test(pw)) throw Error('密码格式错误.');

        //验证
        var uid = yield _ctnu([_rds.cli, 'hget'], _rds.k.map_uphone2uid, phone);
        if (!uid) throw Error('找不到这个手机号对应的账号.');

        var usrkey = _rds.k.usr(uid);
        var dbpw = yield _ctnu([_rds.cli, 'hget'], usrkey, 'pw');
        if (!dbpw) throw Error('账号异常，请尝试找回密码.');

        if (pw != dbpw) throw Error('密码不匹配，登陆失败.');

        //读取信息
        var dat = yield _account.acc_getUsrInfoCo(uid);

        //删除旧版本的cookie
        ctx.cookies.set('m_ukey');

        //将用户身份识别key写入用户浏览器,所有cookie都以m_开头
        ctx.cookies.set('m_ukey', dat.ukey, {
            httpOnly: true,
            expires: new Date((new Date()).getTime() + _cfg.dur.browserUkey),
        });
        dat.ukey = undefined;

        //返回数据
        ctx.body = __newMsg(1, 'ok', dat);
        return ctx;
    });
    return co;
};




/**
 * 读取用户基本信息的Co
 * @param   {uid} uid 用户id
 * @returns {usrObj} 用户数据对象
 */

_account.acc_getUsrInfoCo = function (uid) {
    var co = $co(function* () {
        var res;
        var dbusr = yield _ctnu([_rds.cli, 'hgetall'], _rds.k.usr(uid));
        if (!dbusr) throw Error('获取用户数据信息失败.');
        res = {
            id: dbusr.id,
            phone: dbusr.phone,
            ukey: dbusr.ukey,
            nick: dbusr.nick,
            color: dbusr.color,
            icon: dbusr.icon,
            avatar: dbusr.avatar,
            codeChanges: dbusr.codeChanges,
            codeLength: dbusr.codeLength,
        }

        return res;
    });
    return co;
}





/**
 * 注销账号，只是把浏览器的m_ukey清空
 * @returns {null}
 */
_rotr.apis.acc_loginOut = function () {
    var ctx = this;

    var co = $co(function* () {
        var msg;

        ctx.cookies.set('m_ukey', undefined, {
            httpOnly: true,
            expires: new Date((new Date()).getTime() - 60000),
        });

        //兼容旧有的未指定域名的key
        ctx.cookies.set('m_ukey', undefined, {
            httpOnly: true,
            expires: new Date((new Date()).getTime() - 60000),
        });

        //返回数据
        ctx.body = __newMsg(1, 'ok');
        return ctx;
    });
    return co;
};


/**
 * 向用户手机发送注册验证码的接口,需要使用验证码capKey和capVal
 * 检查map_uphone2uid
 * 写入tmp_phoneRegCode
 * @returns {null} null
 */

_rotr.apis.acc_getPhoneRegCode = function () {
    var ctx = this;

    var co = $co(function* () {
        var phone = ctx.query.phone || ctx.request.body.phone;
        if (!phone || !_cfg.regx.phone.test(phone)) throw Error('手机号码格式错误.');

        var capKey = ctx.query.capKey || ctx.request.body.capKey;
        if (!capKey || !_cfg.regx.ukey.test(capKey)) throw Error('验证码key错误，请刷新验证码再试.');

        var capVal = ctx.query.capVal || ctx.request.body.capVal;
        if (!capVal) throw Error('验证码输入格式错误，请重试.');


        //检查电话号码是否已经被注册
        var mapKey = _rds.k.map_uphone2uid;
        var hasUsed = yield _ctnu([_rds.cli, 'hget'], mapKey, phone);
        if (hasUsed) throw Error('电话号码已经被注册，您可以直接使用这个电话号码登陆.');

        //检查上一次发送的验证码是否过期
        var codeKey = _rds.k.tmp_phoneRegCode(phone);
        var hasSend = yield _ctnu([_rds.cli, 'EXISTS'], codeKey);
        if (hasSend) throw Error('您已经发送过注册验证码，请不要重复发送.');

        //发送验证码并记录到redis设定过期时间
        var res = yield _account.acc_sendPhoneCodeCo(phone, capKey, capVal);

        var code = res.code;
        _rds.cli.setex(codeKey, _cfg.dur.phoneCode, code);

        //返回数据
        ctx.body = __newMsg(1, 'ok', res.res);
        return ctx;
    });
    return co;
};


/**
 * 向用户手机发送重置密码验证码的接口,需要使用验证码capKey和capVal
 * 检查map_uphone2uid
 * 写入tmp_phoneRstCode
 * @returns {null} null
 */

_rotr.apis.acc_getPhoneRstCode = function () {
    var ctx = this;

    var co = $co(function* () {
        var phone = ctx.query.phone || ctx.request.body.phone;
        if (!phone || !_cfg.regx.phone.test(phone)) throw Error('手机号码格式错误.');

        var capKey = ctx.query.capKey || ctx.request.body.capKey;
        if (!capKey || !_cfg.regx.ukey.test(capKey)) throw Error('验证码key错误，请刷新验证码再试.');

        var capVal = ctx.query.capVal || ctx.request.body.capVal;
        if (!capVal) throw Error('验证码输入格式错误，请重试.');


        //检查电话号码是否已经被注册
        var mapKey = _rds.k.map_uphone2uid;
        var hasUsed = yield _ctnu([_rds.cli, 'hget'], mapKey, phone);
        if (!hasUsed) throw Error('电话号码尚未被注册，您可以直接使用这个电话号码注册新用户.');

        //检查上一次发送的验证码是否过期
        var codeKey = _rds.k.tmp_phoneRstCode(phone);
        var hasSend = yield _ctnu([_rds.cli, 'EXISTS'], codeKey);
        if (hasSend) throw Error('您已经发送过重置验证码，请不要重复发送.');

        //发送验证码并记录到redis设定过期时间
        var res = yield _account.acc_sendPhoneCodeCo(phone, capKey, capVal);
        var code = res.code;
        _rds.cli.setex(codeKey, _cfg.dur.phoneCode, code);

        //返回数据
        ctx.body = __newMsg(1, 'ok', res.res);
        return ctx;
    });
    return co;
};



/**
 * 重置密码，使用手机号码验证码重置,成功并自动登陆
 * @returns {null} 无，前端可单独请求getMyInfo接口获取信息
 */
_rotr.apis.acc_rstPwByPhone = function () {
    var ctx = this;

    var co = $co(function* () {
        var phone = ctx.query.phone || ctx.request.body.phone;
        if (!phone || !_cfg.regx.phone.test(phone)) throw Error('手机号码格式错误.');

        var pw = ctx.query.pw || ctx.request.body.pw;
        if (!pw || !_cfg.regx.pw.test(pw)) throw Error('密码格式错误.');

        var phoneCode = ctx.query.phoneCode || ctx.request.body.phoneCode;
        if (!phoneCode || !_cfg.regx.phoneCode.test(phoneCode)) throw Error('验证码格式错误.');

        //检查验证码
        var codeKey = _rds.k.tmp_phoneRstCode(phone);
        var rdsPhoneCode = yield _ctnu([_rds.cli, 'get'], codeKey);
        if (rdsPhoneCode != phoneCode) throw Error('验证码错误，请重试.');

        //用手机号获取用户id
        var uid = yield _ctnu([_rds.cli, 'hget'], _rds.k.map_uphone2uid, phone);
        var usrKey = _rds.k.usr(uid);

        //将新密码写入数据库usr.pw，返回值仅是新增属性个数，为0
        yield _ctnu([_rds.cli, 'hset'], usrKey, 'pw', pw);

        //获取用户ukey
        var ukey = yield _ctnu([_rds.cli, 'hget'], usrKey, 'ukey');

        //将用户身份识别key写入用户浏览器,所有cookie都以m_开头
        ctx.cookies.set('m_ukey', ukey, {
            httpOnly: true,
            expires: new Date((new Date()).getTime() + _cfg.dur.browserUkey),
        });

        //删除验证码
        _rds.cli.del(codeKey);

        //返回数据
        ctx.body = __newMsg(1, 'ok');
        return ctx;
    });
    return co;
};


/**
 * 凯信通版本：向指定手机发送六位验证码,需要图像验证码正确
 * @param   {string} phone 目标手机，1开头11位数字
 * @returns {string} 六位验证码
 */

_account.acc_sendPhoneCodeCo2 = function (phone, capKey, capVal) {
    var co = $co(function* () {
        //校验图像验证码
        var capcheck = yield _captcha.checkCo(capKey, capVal, true);
        if (!capcheck) throw Error('验证码输入错误，请重试.');

        //生成认证码
        var code = String(Math.random()).substr(2, 6);
        if (code.length < 6) {
            var n = 6 - code.length;
            for (var i = 0; i < n; i++) {
                code += '0';
            }
        };

        //发送验证码
        var minit = _cfg.dur.phoneCode / 60;
        var path = '/kingtto_media/106sms/106sms?mobile=' + phone;
        path += '&content=【杰米诺课堂】您的验证码是' + code + '，有效时间' + minit + '分钟，请不要告诉他人，如非本人操作请忽略此短信。';
        path += '&tag=2'; //json格式返回

        path = encodeURI(path);
        var opt = {
            hostname: 'apis.baidu.com',
            port: 80,
            path: path,
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'apikey': _xcfg.baidu.apikey,
            },
        };

        var res = yield _fns.httpReqPrms(opt);

        //如果失败，抛出错误
        var msg = JSON.safeParse(res.body);
        console.log('>acc_sendPhoneCodeCo info:', phone, code, msg);
        if (!msg || msg.returnstatus != 'Success') throw Error('发送失败，请稍后再试.');

        return {
            code: code,
            res: res
        };
    });
    return co;
};





/**
 * 短信网版本：向指定手机发送六位验证码,需要图像验证码正确;待测试
 * @param   {string} phone 目标手机，1开头11位数字
 * @returns {string} 六位验证码
 */

_account.acc_sendPhoneCodeCo = function (phone, capKey, capVal) {
    var co = $co(function* () {
        //校验图像验证码
        var capcheck = yield _captcha.checkCo(capKey, capVal, true);
        if (!capcheck) throw Error('验证码输入错误，请重试.');

        //生成认证码
        var code = String(Math.random()).substr(2, 6);
        if (code.length < 6) {
            var n = 6 - code.length;
            for (var i = 0; i < n; i++) {
                code += '0';
            }
        };


        //发送验证码
        var minit = _cfg.dur.phoneCode / 60;
        var path = '/asmx/smsservice.aspx?name=' + _xcfg.sms.name + '&pwd=' + _xcfg.sms.pwd;
        path += '&content=【人人都能学编程】您的杰米诺验证码是' + code + '，有效时间' + minit + '分钟，请不要告诉他人，如非本人操作请忽略此短信。欢迎访问www.jieminuoketang.com开启您的编程世界。&mobile=' + phone + '&stime=&sign=杰米诺课堂&type=pt&extno=1';

        path = encodeURI(path);
        var opt = {
            hostname: 'web.duanxinwang.cc',
            port: 80,
            path: path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'apikey': _xcfg.baidu.apikey,
            },
        };


        var res = yield _fns.httpReqPrms(opt);

        //如果失败，抛出错误
        var msg = res.body;
        if (!msg || msg[0] == '1') {
            console.log('>acc_sendPhoneCodeCo:', res);
            throw Error('发送失败，请稍后再试.');
        };

        return {
            code: code,
            res: 1
        };
    });
    return co;
}









/**
 * admin，获取用户列表,
 * @returns {} hgetall读取_map:usr.phone:usr.id键，全部返回给前端
 */
_rotr.apis.acc_admGetUsrList = function () {
    var ctx = this;

    var co = $co(function* () {
        var uid = yield _fns.getUidByCtx(ctx);
        if (uid != 1) throw Error('权限验证失败，当前用户无权获取用户列表');

        var rdskey = _rds.k.map_uphone2uid;
        var res = yield _ctnu([_rds.cli, 'hgetall'], rdskey);

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};


/**
 * admin，获取单个用户详细信息,
 * @returns {} hgetall读取usr-4键和uApps-4，全部返回给前端
 */
_rotr.apis.acc_admGetUsrDetails = function () {
    var ctx = this;

    var co = $co(function* () {
        var uid = yield _fns.getUidByCtx(ctx);
        if (uid != 1) throw Error('权限验证失败，当前用户无权进行此操作');

        var id = ctx.query.id || ctx.request.body.id;
        if (!id) throw Error('没有收到用户id.');


        var usrkey = _rds.k.usr(id);
        var usr = yield _ctnu([_rds.cli, 'hgetall'], usrkey);

        var uappkey = _rds.k.usrApps(id);
        var uapps = yield _ctnu([_rds.cli, 'zrange'], uappkey, 0, -1, 'withscores');


        //返回数据
        ctx.body = __newMsg(1, 'ok', {
            usr: usr,
            uapps: uapps,
        });
        return ctx;
    });
    return co;
};


/**
 * admin，修改单个用户的属性, 只能修改usr-4键的属性
 * id,key,val
 * @returns {}
 */
_rotr.apis.acc_admSetUsrAttr = function () {
    var ctx = this;

    var co = $co(function* () {
        var uid = yield _fns.getUidByCtx(ctx);
        if (uid != 1) throw Error('权限验证失败，当前用户无权进行此操作');

        var id = ctx.query.id || ctx.request.body.id;
        if (!id) throw Error('没有收到目标用户id.');

        var key = ctx.query.key || ctx.request.body.key;
        if (!key || key == '') throw Error('没有收到key.');

        var val = ctx.query.val || ctx.request.body.val;
        if (!val) throw Error('没有收到val.');


        var usrkey = _rds.k.usr(id);
        var usr = yield _ctnu([_rds.cli, 'hset'], usrkey, key, val);

        //返回数据
        ctx.body = __newMsg(1, 'ok');
        return ctx;
    });
    return co;
};

/**
 * admin，移除一个用户，只是从索引里面去掉
 * _map:usr.phone:usr.id索引，_map:usr.ukey:usr.id索引，_tmp:phoneRstCode-uid键
 * id
 * @returns {}
 */
_rotr.apis.acc_admRemoveUsr = function () {
    var ctx = this;

    var co = $co(function* () {
        var uid = yield _fns.getUidByCtx(ctx);
        if (uid != 1) throw Error('权限验证失败，当前用户无权进行此操作');

        var id = ctx.query.id || ctx.request.body.id;
        if (!id) throw Error('没有收到目标用户id');

        //获取用户的phone和ukey
        var theusrkey = _rds.k.usr(id);
        var thephone = yield _ctnu([_rds.cli, 'hget'], theusrkey, 'phone');
        var theukey = yield _ctnu([_rds.cli, 'hget'], theusrkey, 'ukey');

        //移除索引和重置密码临时key，将usr-id键设定1个月后过期自动销毁
        var mu = _rds.cli.multi();

        var phonemapkey = _rds.k.map_uphone2uid;
        mu.hdel(phonemapkey, thephone);
        var ukeymapkey = _rds.k.map_ukey2uid;
        mu.hdel(ukeymapkey, theukey);
        var theurstkey = _rds.k.tmp_phoneRstCode(thephone);
        mu.del(theurstkey, theurstkey);

        mu.expire(theusrkey, _cfg.dur.month) ;

        var res = yield _ctnu([mu, 'exec']);

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};









//导出模块
module.exports = _account;
