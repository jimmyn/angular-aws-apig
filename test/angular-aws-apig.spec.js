'use strict';

describe('Main Module', () => {

  let module;

  beforeEach(function() {
    module = angular.module('angular-aws-apig');
  });

  it('should load correctly', function() {
    expect(module.name).to.equal('angular-aws-apig');
  });

});