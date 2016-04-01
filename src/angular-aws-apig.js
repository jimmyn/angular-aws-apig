import APIGInterceptorProvider from './services/interceptor'

angular.module('angular-aws-apig', [])
  .provider('APIGInterceptor', APIGInterceptorProvider);