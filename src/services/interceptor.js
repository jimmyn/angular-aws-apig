import aws4 from '../lib/aws4';

function APIGInterceptorProvider() {
  this.headers = {
    'Content-Type': 'application/json;charset=UTF-8'
  };
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

  this.parseUrl = (url) => {
    const parser = document.createElement('a');
    parser.href = url;
    return {
      host: parser.host,
      path: parser.pathname
    };
  };

  this.transformData = (config) => {
    let data = config.data;
    if (Array.isArray(config.transformRequest)) {
      config.transformRequest.forEach((transformer) => {
        data = transformer(data);
      });
    } else {
      data = config.transformRequest(data);
    }
    return data;
  };

  this.$get = /*@ngInject*/($q, $injector, $rootScope) => {
    let config = this;
    return {
      request(request) {
        let urlRegex = new RegExp(config.urlRegex);
        if (urlRegex.test(request.url)) {
          Object.assign(request.headers, config.headers);
          const parser = config.parseUrl(request.url);
          const headers = $injector.invoke(config.headersGetter, this, {request});
          const params = request.params ? '?' + request.paramSerializer(request.params) : '';
          const data = config.transformData(request);
          const credsPromise = $q.when($injector.invoke(config.credentialsGetter, this, {request}));
          if (!data) delete headers['Content-Type'];
          return credsPromise.then((creds) => {
            const options = aws4.sign({
              service: config.service,
              region: config.region,
              host: parser.host,
              path: parser.path + params,
              method: request.method,
              body: data,
              headers
            }, creds);

            delete options.headers['Host'];
            delete options.headers['Content-Length'];

            request.headers = options.headers;
            request.data = options.body;
            request.transformRequest = [];
            return request;
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