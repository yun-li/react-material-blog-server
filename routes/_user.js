let userProxy = require('../proxy/user')

module.exports = function(router) {

    // 用户注册
    router.post('/register', function(req, res, next) {
        let params = {
            email: req.body.email,
            nickname: req.body.nickname,
            password: req.body.password,
            verified: false,
        }
        userProxy.saveUser(params, function(result) {
            // 注册成功返回真，邮箱已被注册返回假
            res.json({'registerSuccessful': result})
        })
    })

    // 用户验证
    router.get(/^\/verify\/\S+/, function(req, res, next) {
        let key = /^\/verify\/(\S+)/.exec(req.path)[1]
        userProxy.verifyEmail(key, function(result) {
            // 通过query成功验证账户返回真，否则返回假
            res.json({'verifySuccessful': result})
        })
    })

    // 用户登录
    router.post('/login', function(req, res, next) {
        let session = req.session
        let email = req.body.email
        let password = req.body.password
        userProxy.login(email, password, function(resCode) {
            switch (resCode) {
                case 1:
                    session.currentUserEmail = email
                    return res.json({ret_code: 1})
                    break;
                default:
                    return res.json({ret_code: resCode})
            }
        })
    })

    // 用户注销
    router.get('/logout', function(req, res, next) {
        req.session.currentUserEmail = ''
        res.clearCookie('rhaegoSessionKey')
        res.redirect('/')
    })

    return router

}