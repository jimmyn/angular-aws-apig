'use strict';

describe('Interceptor', () => {

  let $httpProvider;
  let APIGInterceptor;

  beforeEach(function() {
    module('angular-aws-apig', (_$httpProvider_, _APIGInterceptor_) => {
      $httpProvider = _$httpProvider_;
      APIGInterceptor = _APIGInterceptor_;
    });
  });

  it('should load interceptor module', function() {
    expect(APIGInterceptor).should.exist;
  });

});