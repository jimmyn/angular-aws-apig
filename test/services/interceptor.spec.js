'use strict';

describe('Interceptor', () => {

  let APIGInterceptorProvider;
  let APIGInterceptor;
  let $httpProvider;
  let $httpBackend;
  let $http;
  let $rootScope;

  const credentials = {
    accessKeyId: 'ABCDEF',
    secretAccessKey: 'abcdef1234567890',
    sessionToken: 'qwertyuiopasdfghjklzxcvbnm1234567890'
  };

  const asyncCredentials = {
    accessKeyId: 'GHJKLNB',
    secretAccessKey: 'hgfjhgfu6eru6rfjhgcu65iugbv',
    sessionToken: 'hfd875gh976087ykhvjgfd6569786pgkjhg9776'
  };

  window.AWS = {
    config:{credentials}
  };

  beforeEach(() => {
    module('angular-aws-apig', (_$httpProvider_, _APIGInterceptorProvider_) =>{
      APIGInterceptorProvider = _APIGInterceptorProvider_;
      $httpProvider = _$httpProvider_;
      $httpProvider.interceptors.push('APIGInterceptor');
    });
    inject((_APIGInterceptor_, _$httpBackend_, _$http_, _$rootScope_) => {
      APIGInterceptor = _APIGInterceptor_;
      $httpBackend = _$httpBackend_;
      $http = _$http_;
      $rootScope = _$rootScope_;
    })
  });

  afterEach(inject(($httpBackend) => {
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  }));

  it('should load APIGInterceptorProvider', () => {
    expect(APIGInterceptorProvider).to.be.an('object');
  });

  it('should load APIGInterceptor', () => {
    expect(APIGInterceptor).to.be.an('object');
  });

  it('should be in http interceptors', () => {
    expect($httpProvider.interceptors).to.contain('APIGInterceptor');
  });

  describe('http GET request', () => {
    let headers;
    beforeEach(() => {
      $rootScope.bar = '54321';
      APIGInterceptorProvider.config({
        headers: {foo: '12345'}
      });

      APIGInterceptorProvider.headerGetter = ($rootScope, request) => {
        request.headers.bar = $rootScope.bar;
        return request.headers;
      };

      $httpBackend.expect('GET', 'fake/url', null, (h) => {
        headers = h;
        return true;
      }).respond(200, {});

      $http.get('fake/url');
      $httpBackend.flush();
    });

    it('should have foo header form config function', () => {
      expect(headers.foo).to.equal('12345');
    });

    it('should have bar header form headerGetter function', () => {
      expect(headers.bar).to.equal('54321');
    });

    it('should have correct SignedHeaders', () => {
      expect(headers.Authorization).to.contain('SignedHeaders=accept;bar;foo;host;x-amz-date;x-amz-security-token');
    });

    it('should have correct accessKeyId', () => {
      expect(headers.Authorization).to.contain(credentials.accessKeyId);
    });

    it('should have correct X-Amz-Security-Token', () => {
      expect(headers['X-Amz-Security-Token']).to.equal(credentials.sessionToken);
    });

    it('should not have Content-Type header', () => {
      expect(headers['Content-Type']).to.be.an('undefined');
    });
  });

  it('credentialsGetter should work with promise', () => {
    let headers;
    APIGInterceptorProvider.credentialsGetter = ($q) => {
      return $q.when(asyncCredentials);
    };

    $httpBackend.expect('GET', 'fake/url', null, (h) => {
      headers = h;
      return true;
    }).respond(200, {});

    $http.get('fake/url');
    $httpBackend.flush();
    expect(headers['X-Amz-Security-Token']).to.equal(asyncCredentials.sessionToken);
  });
});