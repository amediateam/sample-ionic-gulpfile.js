var bower = require('bower');
var del = require('del');
var concat = require('gulp-concat');
var gutil = require('gulp-util');
var gulp = require('gulp');
var header = require('gulp-header');
var minifyCss = require('gulp-minify-css');
var ngAnnotate = require('gulp-ng-annotate');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify');
var gulpCopy = require('gulp-copy');
var sh = require('shelljs');

var pkg = require('./package.json');
var banner = ['/**',
  ' * <%= pkg.name %> v<%= pkg.version %>',
  ' * <%= now %>',
  ' * @description <%= pkg.description %>',
  ' */',
  ''].join('\n');

var paths = {
  sass: ['./scss/**/*.scss'],
  src: [
    './www/js/helpers.js',
    './www/js/app.js',
    './www/js/user.js'
  ],
  release: {
    debug: [
      './release/app.js',
      './release/vendor.js'
    ],
    min: [
      './release/app.min.js',
      './release/vendor.min.js'
    ]
  },
  vendor: {
    min: [
      './bower_components/ionic/js/ionic.bundle.min.js',
      './bower_components/firebase/firebase.js'
    ],
    src: [
      './bower_components/ionic/js/ionic.bundle.js',
      './bower_components/firebase/firebase-debug.js'
    ]
  },
  css: [
    './release/ionic.app.min.css',
    './www/css/styles.css'
  ],
  fonts: [
    './bower_components/ionic/fonts/ionicons.eot',
    './bower_components/ionic/fonts/ionicons.svg',
    './bower_components/ionic/fonts/ionicons.ttf',
    './bower_components/ionic/fonts/ionicons.woff'
  ],
  releaseDir: './release/',
  distDir: './www/lib/',
};

function date(){
  var d = new Date();
  return d.toString();
}

gulp.task('build:vendor', function() {
  gulp.src(paths.vendor.src)
    .pipe(concat('vendor.js'))
    .pipe(header(banner, {pkg : pkg, now: date()}))
    .pipe(gulp.dest(paths.releaseDir));
  gulp.src('./release/vendor.js')
    .pipe(gulp.dest(paths.distDir));
});

gulp.task('build:app', function(){
  // concat
  gulp.src(paths.src)
    .pipe(concat('app.js'))
    .pipe(header(banner, {pkg : pkg, now: date()}))
    .pipe(ngAnnotate({single_quotes: true}))
    .pipe(gulp.dest(paths.releaseDir))
    .pipe(gulp.dest(paths.distDir));
});

gulp.task('build', ['build:vendor', 'build:app']);

gulp.task('release:vendor', function() {
  gulp.src(paths.vendor.min)
    .pipe(concat('vendor.js'))
    .pipe(header(banner, {pkg : pkg, now: date()}))
    .pipe(gulp.dest(paths.releaseDir))
    .pipe(gulp.dest(paths.distDir));
});

gulp.task('release:app', ['build:app'], function() {
  // create minified file
  gulp.src('./release/app.js')
    .pipe(uglify())
    .pipe(header(banner, {pkg : pkg, now: date()}))
    .pipe(gulp.dest(paths.releaseDir));
  // copy to dist
  gulp.src(['./release/app.js'])
    .pipe(gulp.dest(paths.distDir));
});

gulp.task('release', ['release:vendor', 'release:app']);


gulp.task('clean', function(){
  del('./www/lib');
});

gulp.task('sass', function(done) {
  gulp.src(paths.fonts, {base:'./bower_components/ionic'})
        .pipe(gulp.dest('./www/css/'));
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./release/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./release/'))
    .on('end', done);
  gulp.src('./release/ionic.app.min.css')
    .pipe(gulp.dest('./www/css/'));
});

gulp.task('watch', function() {
  gulp.watch(paths.sass, ['sass']);
  gulp.watch('./www/js/*.js', ['build']);
});

gulp.task('install', ['git-check'], function() {
  return bower.commands.install()
    .on('log', function(data) {
      gutil.log('bower', gutil.colors.cyan(data.id), data.message);
    });
});

gulp.task('git-check', function(done) {
  if (!sh.which('git')) {
    console.log(
      '  ' + gutil.colors.red('Git is not installed.'),
      '\n  Git, the version control system, is required to download Ionic.',
      '\n  Download git here:', gutil.colors.cyan('http://git-scm.com/downloads') + '.',
      '\n  Once git is installed, run \'' + gutil.colors.cyan('gulp install') + '\' again.'
    );
    process.exit(1);
  }
  done();
});

gulp.task('default', ['watch']);

