/* eslint-disable no-unused-vars, no-undef, no-unused-expressions */

import chai from 'chai';

import path from 'path';
import {
  LoggedInSession,
  SessionManager,
} from 'library';

const { expect, assert } = chai;

describe('Session Manager test', () => {
  describe('Basic', () => {
    const loginType01 = (sessionMgr, uid) => sessionMgr.login(uid, {
      connectUid: 'hi',
    });

    const verifyUserType01 = (newSession, uid) => {
      expect(newSession, 'newSession').to.be.an('object');
      expect(newSession.uid, 'newSession.uid').to.equal(uid);
      expect(newSession.data, 'newSession.data').to.be.an('object');
      expect(newSession.data.connectUid, 'newSession.data.connectUid').to.exist;
      expect(newSession.data.connectUid, 'newSession.data.connectUid').to.equal('hi');
      return newSession;
    };

    it('should able to login with Promise interface', () => {
      const sessionMgr = new SessionManager({});

      return loginType01(sessionMgr, 1)
      .then(newSession => verifyUserType01(newSession, 1));
    });

    it('should able to trigger "onLoggedIn" event', () => {
      let loggedInEventTriggered = false;
      const sessionMgr = new SessionManager({
        onLoggedIn: ((newSession) => {
          loggedInEventTriggered = true;
          verifyUserType01(newSession, 1);
        }),
      });

      return loginType01(sessionMgr, 1)
      .then((newSession) => {
        expect(newSession, 'newSession').to.be.an('object');
        expect(loggedInEventTriggered, 'loggedInEventTriggered').to.equal(true);
        return newSession;
      });
    });

    it('should able to logout with Promise interface', () => {
      const sessionMgr = new SessionManager({});

      return loginType01(sessionMgr, 1)
      .then(newSession => sessionMgr.logout(1))
      .then(newSession => verifyUserType01(newSession, 1));
    });

    it('should able to trigger "onLoggedOut" event', () => {
      let loggedOutEventTriggered = false;
      const sessionMgr = new SessionManager({
        onLoggedOut: ((existedSession, reason) => {
          loggedOutEventTriggered = true;
          expect(reason, 'reason').to.equal(sessionMgr.getLogoutReasons().RegularLogout);
          verifyUserType01(existedSession, 1);
        }),
      });

      return loginType01(sessionMgr, 1)
      .then(newSession => sessionMgr.logout(1))
      .then((existedSession) => {
        expect(existedSession, 'existedSession').to.be.an('object');
        expect(loggedOutEventTriggered, 'loggedOutEventTriggered').to.equal(true);
        return existedSession;
      });
    });

    it('should able to trigger "onUnexpectedLoggedOut" event', () => {
      let unexpectedLoggedOutTriggered = false;
      const sessionMgr = new SessionManager({
        onUnexpectedLoggedOut: ((existedSession, reason) => {
          unexpectedLoggedOutTriggered = true;
          expect(reason, 'reason').to.equal('ConnectionLost');
          verifyUserType01(existedSession, 1);
        }),
      });

      return loginType01(sessionMgr, 1)
      .then(newSession => sessionMgr.unexpectedLogout(1, 'ConnectionLost'))
      .then((existedSession) => {
        expect(sessionMgr.inactiveSessions.get(1), 'sessionMgr.inactiveSessions[1]').to.exist;
        expect(existedSession, 'existedSession').to.be.an('object');
        expect(unexpectedLoggedOutTriggered, 'unexpectedLoggedOutTriggered').to.equal(true);
        return existedSession;
      });
    });

    it('should able to trigger "onReloggedIn" event', () => {
      let reloggedInTriggered = false;
      const sessionMgr = new SessionManager({
        onReloggedIn: ((reloggedInSession, newData) => {
          reloggedInTriggered = true;
          verifyUserType01(reloggedInSession, 1);
        }),
      });

      return loginType01(sessionMgr, 1)
      .then(newSession => sessionMgr.unexpectedLogout(1, 'ConnectionLost'))
      .then(newSession => sessionMgr.relogin(1, {}))
      .then((reloggedInSession) => {
        expect(reloggedInSession, 'reloggedInSession').to.be.an('object');
        expect(reloggedInTriggered, 'reloggedInTriggered').to.equal(true);
        return reloggedInSession;
      });
    });

    it('should able to trigger "onDuplicateLogin" event', () => {
      let duplicateLoginEventTriggered = false;
      const sessionMgr = new SessionManager({
        onDuplicateLogin: ((existedSession, newSession, logoutExistedOne, denyLogin) => {
          duplicateLoginEventTriggered = true;
          expect(typeof logoutExistedOne, 'typeof logoutExistedOne').to.equals('function');
          expect(typeof denyLogin, 'typeof denyLogin').to.equals('function');

          verifyUserType01(existedSession, 1);
          verifyUserType01(newSession, 1);

          denyLogin();
          logoutExistedOne();
        }),
      });

      return loginType01(sessionMgr, 1)
      .then(newSession => loginType01(sessionMgr, 1))
      .then((newSession) => {
        throw Error('Passed');
      })
      .catch((error) => {
        expect(error.message, 'error.message').to.equal(sessionMgr.getLogoutReasons().DuplicateLogin);
        expect(duplicateLoginEventTriggered, 'duplicateLoginEventTriggered').to.equal(true);
        return error;
      });
    });

    // it('should able to login with Promise interface', () => {
    //   let sessionMgr = new SessionManager({
    //     SessionInfoClass: LoggedInSession,
    //     onDuplicateLogin: ((existedSession, newSession, logoutExistedOne, denyLogin) => {
    //       if(existedSession.data.connectUid === newSession.data.connectUid){
    //         console.log(' =======> Deny');
    //         denyLogin();
    //       }else{
    //         console.log(' =======> Kick');
    //         logoutExistedOne();
    //       }
    //     }),
    //     onLoggedIn: (session => {
    //       console.log(' ==> onLoggedIn :', session.uid);
    //     }),
    //     onUnexpectedLoggedOut: ((session, reason) => {
    //       // session.getWs().close();
    //       console.log(' ==> onUnexpectedLoggedOut :', session.uid);
    //     }),
    //     onReloggedIn: ((session, newData) => {
    //       console.log(' ==> onReloggedIn :', session.uid);
    //     }),
    //     onLoggedOut: ((session, reason) => {
    //       // session.getWs().close();
    //       console.log(' ==> onLoggedOut :', session.uid);
    //     }),
    //   });

    //   return sessionMgr.login(1, {
    //     connectUid: 'hi',
    //   })
    //   .then(newSession => {
    //     console.log('newSession :', newSession);
    //     // return Promise.resolve(newSession);
    //     return sessionMgr.login(1, {
    //       connectUid: 'hi',
    //     });
    //   })
    //   .catch(err => {
    //     if(err === SessionManager.ErrorMessage.DuplicateLogin){
    //       //lMsg.response.send({error: SessionManager.ErrorMessage.DuplicateLogin});
    //     }else{
    //       //lMsg.response.send({error: 'Unexpected login failure.'});
    //     }
    //     return Promise.reject(err);
    //   });
    // });
  });
});
