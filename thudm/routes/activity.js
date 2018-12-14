const express = require('express');
const router = express.Router();
const rp = require('request-promise');
const fs = require('fs');
const multer = require('multer');
const promise = require('bluebird');
promise.promisifyAll(fs);
const errors = require('../common/errors');
const utils = require('../common/utils');
const consts = require('../common/consts');
const models = require('../models/models');
const Activity = models.Activity;

router.get('/list', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let admin_id = req.session.admin_id;

    Activity.find({ admin_id: admin_id })
        .then(activities => {
            return res.render('list', { items: activities });
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/detail', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;

    Activity.findById(activity_id)
        .then(act => {
            if (!act)
                throw new errors.NotExistError('Activity does not exist.');

            return res.send(act);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

let storage_list = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/../public/images/activity/' + req.session.activity_id);
    },
    limits: { fileSize: consts.MAX_IMG_SIZE, files: 1 },
    filename: function (req, file, cb) {
        cb(null, 'list.' + file.mimetype.split('/')[1]);
    }
});
let storage_bg = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, __dirname + '/../public/images/activity/' + req.session.activity_id);
    },
    limits: { fileSize: consts.MAX_IMG_SIZE, files: 1 },
    filename: function (req, file, cb) {
        cb(null, 'bg.' + file.mimetype.split('/')[1]);
    }
});
const upload_list = multer({ storage: storage_list });
const upload_bg = multer({ storage: storage_bg });

router.post('/upload/list', upload_list.single('list_image'), (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;

    return utils.upload_list_image(req, req.file.path)
        .then(err => {
            if (err && err.error) throw err.error;

            res.send(req.file.path);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.post('/upload/bg', upload_bg.single('bg_image'), (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    return res.send(req.file.path);
});

router.get('/create', (req, res, next) =>{
    res.render('create');
});

const createActivity = (req) => {
    let act = new Activity();
    return updateActivity(act, req);
}
const updateActivity = (act, req) => {
    act.admin_id = req.session.admin_id;
    act.title = req.body.title;
    act.sub_title = req.body.sub_title;
    act.bullet_color_num = req.body.bullet_color_num;
    act.bullet_colors = req.body.bullet_colors;
    act.bg_img_url = req.body.bg_img_url;
    act.list_media_id = req.body.list_media_id;
    return act.save();
}

// Create activity
router.post('/', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    createActivity(req)
        .then(act => {
            let activity_id = act._id.toString();
            req.session.activity_id = activity_id;
            utils.load_activity(req, activity_id);

            let rsmq = req.app.get('rsmq');
            rsmq.createQueue({ qname: activity_id })
                .then(done => {
                    console.log("QUEUE created");
                });

            // Create the activity's image directory
            // mkdir public/images/activity/:activity_id/fromuser
            fs.mkdirAsync('public/images/activity/' + activity_id)
                .then(() => {
                    return fs.mkdirAsync('public/images/activity/' + activity_id + '/fromuser');
                })
                .then(() => {
                    console.log('mkdir');
                    return res.send(act);
                });
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

// Update activity
router.put('/', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;

    let room = utils.get_room_info(req, activity_id);
    updateActivity(room.activity, req)
        .then(act => {
            return res.send(act);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/:activity_id', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    req.session.activity_id = req.params.activity_id;
    return res.redirect('detail');
});

module.exports = router;
