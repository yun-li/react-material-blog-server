const shortid = require('shortid')
const {assert} = require('../utils')

const userValidator = {
  $and: [
    {
      email: {
        $type: 'string',
        $regex: /^([a-zA-Z0-9]+[\w-]*)(@[\w]{2,})(\.[\w]{2,4})(\.[\w]{2,4})?$/,
      },
    },
    {
      password: {
        $type: 'string',
        $regex: /^.{6,20}$/,
      },
    },
    {
      nickname: {
        $type: 'string',
        $regex: /^[a-zA-Z0-9\x80-\xff]{2,10}$/,
      },
    },
    {
      created: {
        $type: 'date',
      },
    },
    {
      verified: {
        $type: 'bool',
      },
    },
  ],
}

const addUserCollection = (db, cb) => {
  db.createCollection('users', {
    validator: userValidator,
  })
}

/**
根据email取得用户文档
@param email {string} 目标账户的邮箱
@param cb {function} 查找完成回调，传入找到的用户文档或null
*/
const findUserByEmail = (userCollection, email, cb) => {
  userCollection
    .find({ email })
    .toArray((err, docs) => {
      assert(err)
      cb(doc)
    })
}

/**
保存用户文档
@param params {object} 参数对象，包含_id、邮箱、昵称、密码、是否已验证
@param cb {function} 保存行为的回调，成功保存传入true，邮箱已存在传入false
*/
const saveUser = (userCollection, params, cb) => {
  let {email, password, nickname} = params
  let userDoc = {
    id: shortid.generate(),
    email,
    nickname,
    password,
    created: new Date(),
    verified: false,
  }
  findUserByEmail(userCollection, email, (doc) => {
    if (doc === null) {
      userCollection.insertOne(userDoc, (err, res) => {
        assert(err)
        // sendVerifyEmail(userDoc)
        cb(true)
      })
    } else {
      cb(false)
    }
  })
}

// let nodemailer = require('nodemailer')
// let Hashes= require('jshashes')
// let shortid = require('shortid')
//
// let config = require('../config')
//
// let accountVerificationKey = config.accountVerificationKey
// let smtpConfig = config.smtpConfig
//
// /**
// 从固定发件邮箱发送邮件
// @param optionsArg {object} 参数对象，必须包含to(收件邮箱)、subject(主题)、html(内容)
// @param cb {?function} 可选的发送完成回调，成功传入true，失败传入false
// */
// const sendEmail = (function(optionsArg, cb) {
//   // 邮件配置
//   const SMTP_CONFIG = {
//     host: smtpConfig.host,
//     port: smtpConfig.port,
//     auth: smtpConfig.auth
//   }
//   const DEFAULT_OPTIONS = {
//     from: smtpConfig.senderInfo
//   }
//   let transporter = nodemailer.createTransport(SMTP_CONFIG)
//   return function(optionsArg) {
//     let options = Object.assign(DEFAULT_OPTIONS, optionsArg)
//     console.log('--- sending email --- \n', options)
//     transporter.sendMail(options, function(error, response) {
//       if (error) {
//         console.log("--- sending email fail --- \n" + error)
//         if (typeof cb === 'function') {
//           cb(true)
//         }
//       } else {
//         console.log("--- sending email success --- \n" + response)
//         if (typeof cb === 'function') {
//           cb(false)
//         }
//       }
//     })
//   }
// })()
//
//
//
// /**
// 生产加盐的密钥，作为验证邮箱url的pathname，发送至该邮箱
// @param doc {object} 目标用户的文档
// */
// function sendVerifyEmail(doc) {
//   let email = doc.email
//   let key = new Hashes.SHA1().hex_hmac(accountVerificationKey, email) + '!' + email
//   sendEmail({
//     to: email,
//     subject: 'YouKnowznM Site Verification',
//     html: `
//       <h3>
//         Dear ${doc.nickname},
//       </h3>
//       <p>
//         Thanks for registering at <i>youknowznm.com</i>. <a href="http://${config.siteAddress}/verify/${key}">Click here</a> to verify your account.
//       </p>
//       <p>
//         Please ignore this mail if you haven't visited <i>youknowznm.com</i>.
//       </p>
//     `,
//   })
// }
//
// /**
// 验证账户邮箱
// @param key {string} 从邮件提供的url中取得的字符串
// @param cb {function} 验证完成的回调，成功传入该账户的邮箱和昵称，失败传入null
// */
// function verifyEmail(key, cb) {
//   let _hash = key.split('!')[0]
//   let _email = key.split('!')[1]
//   let targetKey = new Hashes.SHA1().hex_hmac(accountVerificationKey, _email) + '!' + _email
//   let verifiedAccount = null
//   if (targetKey === key) {
//     getUserByEmail(_email, function(doc) {
//       UserModel.update(
//         doc,
//         { verified: true },
//         function() {
//           console.log('--- verified --- \n')
//           verifiedAccount = {
//             email: doc.email,
//             nickname: doc.nickname
//           }
//           cb(verifiedAccount)
//         }
//       )
//     })
//   } else {
//     cb(verifiedAccount)
//   }
// }
//
// /**
// 登录
// @param email {string} 用户邮箱
// @param password {string} 用户密码
// @param cb {function} 登录回调，参数对象的属性为：
//             loginResultCode:
//               0 该邮箱尚未注册
//               1 登陆成功
//               2 密码错误
//               3 尚未验证该邮箱
//               4 服务器错误
//             loginUserNickname:
//               登陆成功的用户名或空字符串
// */
// function login(email, password, cb) {
//   let loginResultCode
//   let loginUserNickname = ''
//   UserModel.findOne(
//     { email },
//     function(e, doc) {
//       if (e) {
//         console.error(e)
//         // 服务器错误
//         loginResultCode = 4
//       } else {
//         if (doc === null) {
//           // 该邮箱尚未注册
//           loginResultCode = 0
//         } else {
//           if (doc.password !== password) {
//             // 密码错误
//             loginResultCode = 2
//           } else {
//             if (doc.verified === false) {
//               // 尚未验证该邮箱
//               loginResultCode = 3
//             } else {
//               // 登陆成功
//               loginResultCode = 1
//               loginUserNickname = doc.nickname
//             }
//           }
//         }
//       }
//       cb({
//         loginResultCode,
//         loginUserNickname,
//       })
//     }
//   )
// }

module.exports = {
  addUserCollection,
  findUserByEmail,
  saveUser,
}