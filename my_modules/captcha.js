/*验证码相关
 */

var _captcha = {};
_captcha.expire = 300; //300秒5分钟过期

/**
 * 生成一个验证码，有效期5分钟，写入rds自动过期;存储时候区分大小写
 * @returns {key} rds键名
 * @returns {img} svg图像数据
 */

_rotr.apis.captcha_get = function () {
    var ctx = this;

    var co = $co(function* () {
        var expire = _captcha.expire;

        //生成svg
        var text = $scaptcha.randomText();
        var svg = $scaptcha(text);

        //写入rds
        var key = __uuid();
        var capkey = _rds.k.tmp_captcha(key);
        _rds.cli.set(capkey, text);
        _rds.cli.expire(capkey, 300);

        res = {
            key: key,
            svg: svg,
            expire: _captcha.expire,
        };

        //返回数据
        ctx.body = __newMsg(1, 'ok', res);
        return ctx;
    });
    return co;
};




/**
 * 验证图像识别码
 * @param   {key} rds存储的键名的基本key
 * @returns {val} rds存储的键名的值，不区分大小写
 * @returns {remove} 验证成功后是否删除
 * @param {boolean} 是否成功
 */

_captcha.checkCo = function (key, val, remove) {
    var co = $co(function* () {

        var capkey = _rds.k.tmp_captcha(key);
        var text = yield _ctnu([_rds.cli, 'get'], capkey);

        if (!text) return false;

        var res = false;
        if (text.toUpperCase() == val.toUpperCase()) {
            res = true;
            _rds.cli.del(capkey);
        }

        return res;
    });
    return co;
}









//导出模块
module.exports = _captcha;
