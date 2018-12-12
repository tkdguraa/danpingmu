const request = require('supertest');
const session = require('supertest-session');
const app = require('../app_test');
const models = require('../models/models'); 

let admin_session = null;

describe('POST /auth/login/', () => {
    let test_session = null;
    let auth_session = null;

    beforeAll(() => {
        test_session = session(app);
    });

    test('It should login success', (done) => {
        const input_id = 'bbb';
        const input_pw = '12345678';
        const activity_id = '5c03ba2fec64483fe182a7d2';

        return test_session
            .post('/auth/login/')
            .type('form')
            .send({ input_id: input_id, input_pw: input_pw })
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(302);
                    auth_session = test_session;
                    auth_session
                        .get('/activity/' + activity_id)
                        .then(() => {
                            admin_session = auth_session;
                            done();
                        });
                }, 500);
            });
    });
});

describe('GET /vote/:vote_id', () => {
    const vote_id = '5c04f7be1cab9d6c156f401c';

    test('It should redirect to /vote/detail', (done) => {
        return admin_session
            .get('/vote/' + vote_id)
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });
});

describe('GET /vote/detail', () => {
    test('It should return vote information with the vote id', (done) => {
        return admin_session
            .get('/vote/detail')
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch('activity_id');
                    expect(res.text).toMatch('title');
                    expect(res.text).toMatch('option_num');
                    expect(res.text).toMatch('options');
                    expect(res.text).toMatch('status');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('GET /vote/list', () => {
    test('It should return vote list that the activity has', (done) => {
        return admin_session
            .get('/vote/list')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode === 200 ||
                           res.statusCode === 304).toBeTruthy();
                    done();
                }, 500);
            });
    });
});

describe('GET /vote/:vote_id/result', () => {
    const vote_id = '5c04f7be1cab9d6c156f401c';
    test('It should redirect to /vote/result', (done) => {
        return admin_session
            .get('/vote/' + vote_id + '/result')
            .then(res => {
                expect(res.statusCode).toBe(302);
                done();
            });
    });
});

describe('GET /vote/result', () => {
    test('It should return vote result with the vote id', (done) => {
        return admin_session
            .get('/vote/result')
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toMatch('result');
                    expect(res.text).toMatch('options');
                    expect(res.text).toMatch('pic_url');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });
});

describe('GET /vote/:vote_id/user', () => {
    const vote_id = '5c04f7be1cab9d6c156f401c';
    const wrong_vote_id = 'aaa4f7be1cab9d6c156f401c';

    test('It should return vote information with the vote id for user', (done) => {
            request(app)
            .get('/vote/' + vote_id + '/user')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should fail to return vote information with the vote id for user', (done) => {
            request(app)
            .get('/vote/' + wrong_vote_id + '/user')
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(204);
                    done();
                }, 500);
            });
    });
});

describe('GET /vote/:vote_id/votefor/:option_id', () => {
    const vote_id = '5c04f7be1cab9d6c156f401c';
    const open_id = 'o9T2M1c89iwXQ4RG7pdEOzfa55sc'
    const option_id = 1;

    test('It should vote successfully', (done) => {
        request(app)
            .get('/vote/' + vote_id + '/votefor/' + option_id
                 + '?open_id=' + open_id)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should fail to vote', (done) => {
        request(app)
            .get('/vote/' + vote_id + '/votefor/' + option_id
                 + '?open_id=' + open_id)
            .then(res => {
                setTimeout(() => {
                    expect(res.statusCode).toBe(403);
                    done();
                }, 500);
            });
    });

    afterAll(() => {
        app.get('redis').delAsync('voteuser_' + vote_id).then(()=>{});
        app.get('redis').delAsync('vote_' + vote_id).then(()=>{});
    });
});

describe('POST /vote', () => {
    const test_title = 'test vote';

    test('It should create new Vote', (done) => {
        return admin_session
            .post('/vote')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: "sub title",
                option_num: 3,
                options: [ "A", "B", "C" ],
                pic_urls: [ "url1", "url2", "url3" ],
                status: "ONGOING"
            })
            .then(res => {
                setTimeout(() => {
                    expect(res.text).toBe('{"result":1}');
                    expect(res.statusCode).toBe(200);
                    done();
                }, 500);
            });
    });

    test('It should login first to create new Vote', (done) => {
        return request(app)
            .post('/vote')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: "sub title",
                option_num: 3,
                options: [ "A", "B", "C" ],
                pic_urls: [ "url1", "url2", "url3" ],
                status: "ONGOING"
            })
            .then(res => {
                expect(res.statusCode).toBe(401);
                done();
            });
    });

    test('It should fail to create new Vote if there is no option', (done) => {
        return admin_session
            .post('/vote')
            .set('Accept', 'application/json')
            .send({
                title: test_title,
                sub_title: "sub title",
                option_num: 0,
                options: [],
                pic_urls: [],
                status: "ONGOING"
            })
            .then(res => {
                expect(res.statusCode).toBe(500);
                done();
            });
    });

    afterAll(() => {
        models.Vote.deleteOne({ title: test_title })
            .then(() => {});
    });
});
