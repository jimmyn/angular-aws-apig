'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const browserify = require('browserify');
const babelify = require('babelify');
const aliasify = require('aliasify');
const source = require('vinyl-source-stream');

gulp.task('build', function () {
  return browserify('./src/angular-aws-apig.js', { entry: true })
    .transform(babelify)
    .transform(aliasify, {
      aliases: {querystring: 'querystring-browser'},
      global: true
    })
    .bundle()
    .on('error', function(err){
      gutil.log(err.message);
      this.emit('end');
    })
    .pipe(source('angular-aws-apig.js'))
    .pipe(gulp.dest('dist'));
});

gulp.task('watch', ['build'], function () {
  gulp.watch('./src/**/*.js', ['build']);
});

gulp.task('default', ['watch']);