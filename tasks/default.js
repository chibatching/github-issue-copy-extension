import gulp from 'gulp'

gulp.task('default', gulp.series('build', function (callback) {
  return callback()
}))
