const request = require('supertest');
const session = require('supertest-session');
const app = require('../app_test');
const models = require('../models/models'); 
const utils = require('../common/utils');

let admin_session = null;

const admin_id = 'bbb';
const admin_pw = '12345678';
const activity_id = '5c03ba2fec64483fe182a7d2';
const lottery_id = '5c18e4841b2ff83af2c56309';
const lottery_id_draw_2 = '5c13e3f82e42b62b621dfffd';
const wrong_lottery_id = 'aaa89594778fb6bc06161989';
const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc'

const login = () => {
    let test_session = session(app);
    return new Promise((resolve, reject) => {
        test_session
            .post('/auth/login/')
            .type('form')
            .send({ input_id: admin_id, input_pw: admin_pw })
            .then(res => {
                return setTimeout(() => {
                    expect(res.statusCode).toBe(302);
                    admin_session = test_session;
                    // admin session get one actiivty information
                    admin_session
                        .get('/activity/' + activity_id)
                        .then(() => {
                            resolve();
                        });
                }, 500);
            });
    });
}

describe('POST /auth/login/', () => {
    test_session = session(app);

    test('It should login success', (done) => {
        return test_session
            .post('/auth/login/')
            .type('form')
            .send({ input_id: admin_id, input_pw: admin_pw })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(302);
                    admin_session = test_session;
                    // admin session get one actiivty information
                    admin_session
                        .get('/activity/' + activity_id)
                        .then(() => {
                            done();
                        });
                }, 500);
            });
    });
});

describe('GET /lottery/:wrong_lottery_id and GET /lottery/detail', () => {
    test('It should redirect to /lottery/detail', (done) => {
        return admin_session
            .get('/lottery/' + wrong_lottery_id)
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });

    test('It should fail to return lottery information', (done) => {
        return admin_session
            .get('/lottery/detail')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(204);
                    done();
                }, 500);
            });
    });
});

describe('GET /lottery/:lottery_id and GET /lottery/detail', () => {
    test('It should redirect to /lottery/detail', (done) => {
        return admin_session
            .get('/lottery/' + lottery_id)
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });

    test('It needs login to redirect to /lottery/detail', (done) => {
        return request(app)
            .get('/lottery/' + lottery_id)
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should return lottery information with the lottery id', (done) => {
        return admin_session
            .get('/lottery/detail')
            .then(res => {
                setTimeout(() => {
                    //FIXME:
                    //expect(res.text).toMatch('activity_id');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It needs login to get lottery information with the lottery id', (done) => {
        return request(app)
            .get('/lottery/detail')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(401);
                    done();
                }, 500);
            });
    });
});

describe('GET /lottery/list', () => {
    test('It should return lottery list that the activity has', (done) => {
        return admin_session
            .get('/lottery/list')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should login to get lottery list that the activity has', (done) => {
        return request(app)
            .get('/lottery/list')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(401);
                    done();
                }, 500);
            });
    });
});

describe('GET /lottery/create', () => {
    test('It should return create lottery page', (done) => {
        return admin_session
            .get('/lottery/create')
            .then(res => {
                expect(res.statusCode).toBe(200);
                done();
            });
    });
});

describe('GET /lottery/:lottery_id/draw', () => {
    beforeEach(done => {
        models.Lottery.findById(lottery_id)
            .then(lottery => {
                lottery.status = 'READY';
                lottery.save();
            })
            .then(() => {
                models.Lottery.findById(lottery_id_draw_2)
                    .then(lottery => {
                        lottery.status = 'READY';
                        lottery.save();
                        done();
                    });
            })
    });

    test('No user participates in the lottery event', (done) => {
        login()
            .then(() => {
                admin_session
                    .get('/lottery/' + lottery_id + '/draw')
                    .then(res => {
                        setTimeout(() => {
                            expect(res.statusCode).toBe(200);
                            done();
                        }, 500);
                    });
            });
    });

    test('One user participates in the lottery event and should not draw twice', (done) => {
        app.get('cache').user_info.set('testopenid1', {
            open_id: 'testopenid1',
            head_img_url: 'testheadimgurl1',
            nickname: 'testnickname1',
            activity_id: activity_id
        });
        login()
            .then(() => {
                admin_session
                    .get('/lottery/' + lottery_id + '/draw')
                    .then(res => {
                        setTimeout(() => {
                            expect(res.statusCode).toBe(200);
                            return;
                        }, 500);
                    })
                    .then(() => {
                        admin_session
                            .get('/lottery/' + lottery_id + '/draw')
                            .then(res => {
                                setTimeout(() => {
                                    expect(res.statusCode).toBe(204);
                                    done();
                                }, 500);
                            });
                    });
            });
    });

    test('One user participates in the lottery event but draw more than one winner', (done) => {
        app.get('cache').user_info.set('testopenid1', {
            open_id: 'testopenid1',
            head_img_url: 'testheadimgurl1',
            nickname: 'testnickname1',
            activity_id: activity_id
        });
        login()
            .then(() => {
                admin_session
                    .get('/lottery/' + lottery_id_draw_2 + '/draw')
                    .then(res => {
                        setTimeout(() => {
                            expect(res.statusCode).toBe(200);
                            done();
                        }, 500);
                    });
            });
    });

    test('More than one users participate in the lottery event', (done) => {
        app.get('cache').user_info.set('testopenid1', {
            open_id: 'testopenid1',
            head_img_url: 'testheadimgurl1',
            nickname: 'testnickname1',
            activity_id: activity_id
        });
        app.get('cache').user_info.set('testopenid2', {
            open_id: 'testopenid2',
            head_img_url: 'testheadimgurl2',
            nickname: 'testnickname2',
            activity_id: activity_id
        });
        login()
            .then(() => {
                admin_session
                    .get('/lottery/' + lottery_id + '/draw')
                    .then(res => {
                        setTimeout(() => {
                            expect(res.statusCode).toBe(200);
                            done();
                        }, 500);
                    });
            });
    });

    test('It should fail to draw the winner', (done) => {
        login()
            .then(() => {
                admin_session
                    .get('/lottery/' + wrong_lottery_id + '/draw')
                    .then(res => {
                        setTimeout(() => {
                            expect(res.statusCode).toBe(204);
                            done();
                        }, 500);
                    });
            });
    });

    test('It needs login to draw the winner', (done) => {
        request(app)
            .get('/lottery/' + lottery_id + '/draw')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(401);
                    done();
                }, 500);
            });
    });
});

describe('GET /lottery/:lottery_id/result', () => {
    beforeEach(done => {
        models.Lottery.findById(lottery_id)
            .then(lottery => {
                lottery.status = 'OVER';
                lottery.result = [{ open_id: open_id }];
                lottery.save();
            })
            .then(() => {
                models.Lottery.findById(lottery_id_draw_2)
                    .then(lottery => {
                        lottery.status = 'READY';
                        lottery.save();
                        done();
                    });
            });
    });

    test('It should return a lottery result', (done) => {
        return admin_session
            .get('/lottery/' + lottery_id + '/result')
            .set('Accept', 'application/json')
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch('{"duration":20,"status":"OVER","result":[{"open_id":"o9T2M1c89iwXQ4RG7pdEOzfa55sc"}],"_id":"5c18e4841b2ff83af2c56309","activity_id":"5c03ba2fec64483fe182a7d2","title":"draw 1","sub_title":"changed sub title","winner_num":3');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should not return a lottery result of not finished vote activity', (done) => {
        return admin_session
            .get('/lottery/' + lottery_id_draw_2 + '/result')
            .set('Accept', 'application/json')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(204);
                    done();
                }, 500);
            });
    });
});

describe('POST /lottery and PUT /lottery', () => {
    const title = 'test lottery';
    const sub_title = 'sub title';
    const changed_sub_title = 'changed sub title';
    const wrong_type_winner_num = 'num';
    const wrong_type_winner_num2 = 3.5;

    test('It should create new Lottery', (done) => {
        return admin_session
            .post('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: title,
                sub_title: sub_title,
                winner_num: 1
            })
            .then(res => {
                setTimeout(() => {
                    let result = JSON.parse(res.text);
                    let keys = Object.keys(result);
                    expect(keys).toContain('title');
                    expect(keys).toContain('sub_title');
                    expect(keys).toContain('winner_num');
                    expect(result.title).toBe(title);
                    expect(result.sub_title).toBe(sub_title);
                    expect(result.winner_num).toBe(1);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('Winner number should be greater than 0', (done) => {
        return admin_session
            .post('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: title,
                sub_title: 'testsubtitle',
                winner_num: 0
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(500);
                    done();
                }, 500);
            });
    });

    test('The type of the fields should be correct', (done) => {
        return admin_session
            .post('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: title,
                sub_title: sub_title,
                winner_num: wrong_type_winner_num
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(500);
                    done();
                }, 500);
            });
    });

    test('The type of the fields should be correct 2', (done) => {
        return admin_session
            .post('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: title,
                sub_title: sub_title,
                winner_num: wrong_type_winner_num2
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(500);
                    done();
                }, 500);
            });
    });

    test('It needs login to create new Lottery', (done) => {
        return request(app)
            .post('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: title,
                sub_title: sub_title,
                winner_num: 1,
                duration: 20,
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(401);
                    done();
                }, 500);
            });
    });

    test('It should update the Lottery', (done) => {
        return admin_session
            .put('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: title,
                sub_title: changed_sub_title,
                winner_num: 3,
                duration: 20,
            })
            .then(res => {
                setTimeout(() => {
                    let result = JSON.parse(res.text);
                    let keys = Object.keys(result);
                    expect(keys).toContain('title');
                    expect(keys).toContain('sub_title');
                    expect(keys).toContain('winner_num');
                    expect(result.title).toBe(title);
                    expect(result.sub_title).toBe(changed_sub_title);
                    expect(result.winner_num).toBe(3);
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('The type of the fields should be correct', (done) => {
        return admin_session
            .put('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: title,
                sub_title: changed_sub_title,
                winner_num: wrong_type_winner_num,
                duration: 20,
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(500);
                    done();
                }, 500);
            });
    });

    test('It needs login to update the Lottery', (done) => {
        return request(app)
            .put('/lottery')
            .set('Accept', 'application/json')
            .send({
                title: title,
                sub_title: changed_sub_title,
                winner_num: 1,
                duration: 20,
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(401);
                    done();
                }, 500);
            });
    });

    afterAll(() => {
        models.Lottery.deleteOne({ title: title })
            .then(() => {});
    });
});
