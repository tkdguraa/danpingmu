const express = require('express');
let router = express.Router();
const utils = require('../common/utils');
const errors = require('../common/errors');
const socketApi = require('../common/socketApi');
const models = require('../models/models');
const Lottery = models.Lottery;

router.get('/list', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let activity_id = req.session.activity_id;

    Lottery.find({ activity_id: activity_id })
        .then(lotteries => {
            console.log(lotteries);
            return res.render('lottery/list', { items: lotteries });
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/detail', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let lottery_id = req.session.lottery_id;

    Lottery.findById(lottery_id)
        .then(lottery => {
            if (!lottery)
                throw new errors.NotExistError('No lottery activity exists.');
            return res.render('lottery/detail', { items: lottery });
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/create', (req, res, next) =>{
    res.render('lottery/create');
});

router.get('/:lottery_id/draw', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let lottery_id = req.params.lottery_id;
    let lottery = null;
    let users = null;
    let sendData = {};

    Lottery.findById(lottery_id)
        .then(_lottery => {
            if (!_lottery || _lottery.status !== 'READY')
                throw new errors.NotExistError('No active lottery activity.');

            lottery = _lottery;

            // get all users in the activity
            users = req.app.get('cache').user_info;
            users = [...users].filter(e =>
                e[1].activity_id === lottery.activity_id
            );

            let winner_num = lottery.winner_num;
            let max_num = users.length;
            let min_num = 1;

            if (max_num === 0)
                return [];
            if (max_num <= winner_num)
                return Array.from(Array(max_num).keys()).map(e => e + 1);

            return utils.request_random_nums(winner_num, min_num, max_num)
        })
        .then(data => {
            let result = data.map(num => users[num - 1][1]);
            lottery.result = result;
            lottery.status = 'OVER';
            lottery.save();
            
            sendData.duration = lottery.duration;
            //sendData.data = data;
            sendData.result = result;
            sendData.users = JSON.stringify(users);
            res.render('lottery', { items: sendData });
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

router.get('/:lottery_id/result', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let lottery_id = req.params.lottery_id;

    Lottery.findById(lottery_id)
        .then(lottery => {
            if (!lottery || lottery.status !== 'OVER')
                throw new errors.NotExistError('Result not exist.');
            return res.render('lottery/result', { items: lottery });
        })
        .catch(err => {
            console
            console.error(err);
            next(err);
        });
});


router.get('/:lottery_id', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    req.session.lottery_id = req.params.lottery_id;
    return res.redirect('detail');
});

const createLottery = (req) => {
    let lottery = new Lottery();
    return updateLottery(lottery, req);
}
const updateLottery = (lottery, req) => {
    lottery.activity_id = req.session.activity_id;
    lottery.title = req.body.title;
    lottery.sub_title = req.body.sub_title;
    lottery.winner_num = req.body.winner_num;
    lottery.duration = req.body.duration;
    return lottery.save();
}

// Create lottery activity
router.post('/', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    createLottery(req)
        .then(lottery => {
            req.session.lottery_id = lottery._id;
            return res.send(lottery);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

// Update lottery activity
router.put('/', (req, res, next) => {
    if (!req.session.login)
        throw new errors.NotLoggedInError();

    let lottery_id = req.session.lottery_id;

    Lottery.findById(lottery_id)
        .then(lottery => {
            if (!lottery)
                throw new errors.NotExistError('No lottery Activity exists.');

            return updateLottery(lottery, req);
        })
        .then(lottery => {
            return res.send(lottery);
        })
        .catch(err => {
            console.error(err);
            next(err);
        });
});

module.exports = router;
