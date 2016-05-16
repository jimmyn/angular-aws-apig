'use strict';

const gulp = require('gulp');
const gutil = require('gulp-util');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const ngAnnotate = require('gulp-ng-annotate');
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

gulp.task('build', function () {
  return browserify('./src/angular-aws-apig.js', { entry: true })
    .transform(babelify)
    .bundle()
    .on('error', function(err){
      gutil.log(err.message);
      this.emit('end');
    })
    .pipe(source('angular-aws-apig.js'))
    .pipe(buffer())
    .pipe(ngAnnotate())
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(rename('angular-aws-apig.min.js'))
    .pipe(gulp.dest('./dist'))
});


gulp.task('watch', ['build'], function () {
  gulp.watch('./src/**/*.js', ['build']);
});

gulp.task('default', ['watch']);