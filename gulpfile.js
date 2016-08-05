var gulp = require('gulp')
var babel = require('gulp-babel')

gulp.task('build', function (cb) {
  gulp.src(['./src/**/*.json'])
    .pipe(gulp.dest('./lib'))

  return gulp.src(['./src/**/*.js'])
    .pipe(babel({
      "presets": ["es2015"]
    }))
    .pipe(gulp.dest('./lib'))
})