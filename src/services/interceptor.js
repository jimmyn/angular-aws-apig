import AWS4 from './../aws-signature-v4';

function APIGInterceptorProvider() {
  this.headers = {};
  this.region = 'us-east-1';
  this.service = 'execute-api';
  this.urlRegex = '';

  this.headersGetter = /*@ngInject*/(request) => {
    return request.headers
  };

  this.credentialsGetter = () => {
    try {
      return AWS.config.credentials;
    } catch(err) {
      throw new Error(err + ', please specify credentialsGetter function');
    }
  };

  this.config = (options) => {
    Object.assign(this, options);
  };

  this.$get = /*@ngInject*/($q, $injector, $rootScope) => {
    let config = this;
    let aws4 = new AWS4({
      service: config.service,
      region: config.region
    });
    return {
      request(request) {
        let urlRegex = new RegExp(config.urlRegex);
        if (urlRegex.test(request.url)) {
          Object.assign(request.headers, config.headers);
          request.headers = $injector.invoke(config.headersGetter, this, {request});
          const credsPromise = $q.when($injector.invoke(config.credentialsGetter, this, {request}));
          return credsPromise.then((creds) => {
            return aws4.sign(request, creds);
          });
        } else {
          return request;
        }
      },
      responseError(rejection) {
        $rootScope.$broadcast('$APIGError', rejection.data);
        return $q.reject(rejection);
      }
    };
  }
}

export default APIGInterceptorProvider;