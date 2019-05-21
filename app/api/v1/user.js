const Router = require('koa-router')

const {
    RegisterValidator,
    UserLoginValidator
} = require('../../validators/user')

const {LoginType} = require('../../lib/enum');
const {WXManager} = require('../../service/wx');
const {userManager} = require('../../service/user');
const {UserDao} = require('../../dao/user');
const {Auth} = require('../../../middlewares/auth');

const {Resolve} = require('../../lib/helper');
const res = new Resolve();

const router = new Router({
    prefix: '/v1/user'
})

// 用户注册
router.post('/register', async (ctx) => {

    // 通过验证器校验参数是否通过
    const v = await new RegisterValidator().validate(ctx);

    // 创建用户
    await UserDao.createUser(v);

    // 返回结果
    ctx.response.status = 200;
    ctx.body = res.success('注册成功');
})

// 用户登录
router.post('/login', async (ctx) => {

    const v = await new UserLoginValidator().validate(ctx);

    let token;
    switch (v.get('body.type')) {
        // 用户邮箱登录
        case LoginType.USER_EMAIL:
            token = await userManager.email(v.get('body.account'), v.get('body.secret'));
            break;

        // 管理员登录
        case LoginType.ADMIN_EMAIL:
            break;

        // 小程序登录
        case LoginType.USER_MINI_PROGRAM:
            token = await WXManager.codeToToken(v.get('body.account'));
            break;

        default:
            throw new global.errs.ParameterException('没有相应的处理函数')
    }

    ctx.response.status = 200;
    ctx.body = {
        msg: '登录成功',
        token
    }
})


// 获取用户信息
router.post('/info', new Auth().m, async (ctx) => {

    // 获取用户ID
    const id = ctx.auth.uid;

    // 查询用户信息
    let userInfo = await UserDao.getUserInfo(id);

    // 返回结果
    ctx.response.status = 200;
    ctx.body = res.json(userInfo)
})

module.exports = router
