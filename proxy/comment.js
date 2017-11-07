let CommentModel = require('../models/comment').CommentModel
let articleProxy = require('./article')
let userProxy = require('./user')
let shortid = require('shortid')

/**
保存评论文档，将它作为【相应文章文档的子文档】；将【该评论的作者的用户文档】作为它的子文档
@param params {object} 参数对象，包含_id、作者邮箱、评论内容、创建时间和相对文章文档的_id。当文章id为'INDEPENDENT_MESSAGES'时，作为独立的留言存储
@param cb {function} 完成的回调，
    参数1：未找到相应的文章/用户文档而导致保存失败时传入false，保存成功传入true
    参数2：保存失败传入null，保存成功传入comment doc
*/
function saveComment(params, cb) {
    let { articleId, email, content, created } = params
    userProxy.getUserByEmail(email, function(userDoc) {
        // 根据参数未找到用户文档时执行回调，传入false
        if (userDoc === null) {
            return cb(false, null)
        } else {
            // 找到用户文档则创建评论文档，注意设置其isMessage值
            let commentDoc = new CommentModel({
                _id: shortid.generate(),
                author: [userDoc],
                content,
                created,
                isMessage: (articleId === 'INDEPENDENT_MESSAGES') ? true : false
            })
            console.log(333,commentDoc.author[0]);
            // console.log(userDoc);
            if (articleId === 'INDEPENDENT_MESSAGES') {
                commentDoc.save(cb(true, commentDoc))
            } else {
                articleProxy.getArticleById(articleId, function(articleDoc) {
                    // 根据参数未找到文章文档时执行回调，传入false
                    if (articleDoc === null) {
                        return cb(false, null)
                    } else {
                        // 成功找到文章则将该评论文档推入父文章文档的comments数组，执行回调，传入true
                        commentDoc.save()
                        let currentComments = articleDoc.comments
                        currentComments.push(commentDoc)
                        currentComments.sort(function(c1, c2) {
                            return c1.created.valueOf() - c2.created.valueOf()
                        })
                        articleDoc.save(cb(true, commentDoc))
                    }
                })
            }
        }
    })
}

/**
删除评论文档。为文章的评论时，从该文章subdoc中移除之并删除；否则只删除
@param params {object} 参数对象，包含articleId,、commentId 和 email
@param cb {function} 完成的回调。成功传入true，否则传入false
*/
function removeComment(params, cb) {
    let { articleId, commentId, email } = params
    if (articleId === 'INDEPENDENT_MESSAGES') {
        CommentModel.remove(
            {
                _id: commentId
            },
            function() {
                return cb(true)
            }
        )
    } else {
        articleProxy.getArticleById(articleId, function(articleDoc) {
            // 根据参数未找到文章文档时执行回调，传入false
            if (articleDoc === null) {
                return cb(false)
            } else {
                let targetCommentDoc = articleDoc.comments.find(function(item) {
                    return item._id === commentId
                })
                if (targetCommentDoc === null) {
                    return cb(false)
                } else {
                    if (targetCommentDoc.author[0].email !== email) {
                        return cb(false)
                    } else {
                        articleDoc.comments.pull({
                            _id: commentId
                        })
                        articleDoc.save()
                        CommentModel.remove(
                            {
                                _id: commentId
                            },
                            function() {
                                return cb(true)
                            }
                        )
                    }
                }
            }
        })
    }
}

/*
取得所有独立评论（即isMessage为true的文档对象）
@param cb {function} 读取完成的回调
*/
function getIndependentMessages(cb) {
    CommentModel.find(
        {
            isMessage: true
        },
        function(e, docs) {
            console.log(11,docs);
            return cb(docs);
        }
    )
}

module.exports = {
    saveComment,
    removeComment,
    getIndependentMessages,
}