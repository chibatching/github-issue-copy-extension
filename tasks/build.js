import gulp from 'gulp'
import plumber from 'gulp-plumber'
import { colors, log } from 'gulp-util'
import jsonTransform from 'gulp-json-transform'
import applyBrowserPrefixesFor from './lib/applyBrowserPrefixesFor'
import args from './lib/args'
import gulpif from 'gulp-if'
import livereload from 'gulp-livereload'
import named from 'vinyl-named'
import gulpWebpack from 'webpack-stream'
import webpack from 'webpack'
import TerserPlugin from 'terser-webpack-plugin'
import sourcemaps from 'gulp-sourcemaps'
import cleanCSS from 'gulp-clean-css'
import less from 'gulp-less'
import gutil from 'gulp-util'
import sass from 'gulp-sass'
import imagemin from 'gulp-imagemin'
import del from 'del'

gulp.task('clean', () => {
  return del(`dist/${args.vendor}/**/*`)
})

gulp.task('manifest', () => {
  return gulp.src('app/manifest.json')
    .pipe(plumber({
      errorHandler: error => {
        if (error) {
          log('manifest:', colors.red('Invalid manifest.json'))
        }
      }
    }))
    .pipe(
      jsonTransform(
        applyBrowserPrefixesFor(args.vendor),
        2 /* whitespace */
      )
    )
    .pipe(gulp.dest(`dist/${args.vendor}`))
    .pipe(gulpif(args.watch, livereload()))
})

const ENV = args.production ? 'production' : 'development'
gulp.task('scripts', (cb) => {
  return gulp.src(['app/scripts/*.js', 'app/scripts/*.ts'])
    .pipe(plumber({
      // Webpack will log the errors
      errorHandler () {
      }
    }))
    .pipe(named())
    .pipe(gulpWebpack({
        devtool: args.sourcemaps ? 'inline-source-map' : false,
        watch: args.watch,
        plugins: [
          new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify(ENV),
            'process.env.VENDOR': JSON.stringify(args.vendor)
          })
        ].concat(args.production ? [
          new TerserPlugin({ terserOptions: { ecma: 6 } }),
          new webpack.optimize.ModuleConcatenationPlugin()
        ] : []),
        module: {
          rules: [
            {
              test: /\.ts$/,
              loader: 'ts-loader',
              exclude: /node_modules/
            }
          ]
        },
        resolve: {
          extensions: ['.ts', '.js'],
          modules: [
            'node_modules/',
            'app/scripts/'
          ]
        }
      },
      webpack,
      (err, stats) => {
        if (err) return
        log(`Finished '${colors.cyan('scripts')}'`, stats.toString({
          chunks: false,
          colors: true,
          cached: false,
          children: false
        }))
      }))
    .pipe(gulp.dest(`dist/${args.vendor}/scripts`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('styles:css', function () {
  return gulp.src('app/styles/*.css')
    .pipe(gulpif(args.sourcemaps, sourcemaps.init()))
    .pipe(gulpif(args.production, cleanCSS()))
    .pipe(gulpif(args.sourcemaps, sourcemaps.write()))
    .pipe(gulp.dest(`dist/${args.vendor}/styles`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('styles:less', function () {
  return gulp.src('app/styles/*.less')
    .pipe(gulpif(args.sourcemaps, sourcemaps.init()))
    .pipe(less({ paths: ['./app'] }).on('error', function (error) {
      gutil.log(gutil.colors.red('Error (' + error.plugin + '): ' + error.message))
      this.emit('end')
    }))
    .pipe(gulpif(args.production, cleanCSS()))
    .pipe(gulpif(args.sourcemaps, sourcemaps.write()))
    .pipe(gulp.dest(`dist/${args.vendor}/styles`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('styles:sass', function () {
  return gulp.src('app/styles/*.scss')
    .pipe(gulpif(args.sourcemaps, sourcemaps.init()))
    .pipe(sass({ includePaths: ['./app', './node_modules'] }).on('error', function (error) {
      gutil.log(gutil.colors.red('Error (' + error.plugin + '): ' + error.message))
      this.emit('end')
    }))
    .pipe(gulpif(args.production, cleanCSS()))
    .pipe(gulpif(args.sourcemaps, sourcemaps.write()))
    .pipe(gulp.dest(`dist/${args.vendor}/styles`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('styles', gulp.parallel(
  'styles:css', 'styles:less', 'styles:sass', function (callback) {
    return callback()
  }
))

gulp.task('pages', () => {
  return gulp.src('app/pages/**/*.html')
    .pipe(gulp.dest(`dist/${args.vendor}/pages`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('locales', () => {
  return gulp.src('app/_locales/**/*.json')
    .pipe(gulp.dest(`dist/${args.vendor}/_locales`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('images', () => {
  return gulp.src('app/images/**/*')
    .pipe(gulpif(args.production, imagemin()))
    .pipe(gulp.dest(`dist/${args.vendor}/images`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('fonts', () => {
  return gulp.src('app/fonts/**/*.{woff,woff2,ttf,eot,svg}')
    .pipe(gulp.dest(`dist/${args.vendor}/fonts`))
    .pipe(gulpif(args.watch, livereload()))
})

gulp.task('chromereload', (cb) => {
  // This task runs only if the
  // watch argument is present!
  if (!args.watch) return cb()

  // Start livereload server
  livereload.listen({
    reloadPage: 'Extension',
    quiet: !args.verbose
  })

  gutil.log('Starting', gutil.colors.cyan('\'livereload-server\''))

  // The watching for javascript files is done by webpack
  // Check out ./tasks/scripts.js for further info.
  gulp.watch('app/manifest.json', gulp.task('manifest'))
  gulp.watch('app/styles/**/*.css', gulp.task('styles:css'))
  gulp.watch('app/styles/**/*.less', gulp.task('styles:less'))
  gulp.watch('app/styles/**/*.scss', gulp.task('styles:sass'))
  gulp.watch('app/pages/**/*.html', gulp.task('pages'))
  gulp.watch('app/_locales/**/*', gulp.task('locales'))
  gulp.watch('app/images/**/*', gulp.task('images'))
  gulp.watch('app/fonts/**/*.{woff,ttf,eot,svg}', gulp.task('fonts'))
})

gulp.task('build', gulp.series(
  'clean', gulp.parallel(
    'manifest',
    'scripts',
    'styles',
    'pages',
    'locales',
    'images',
    'fonts',
    'chromereload'
  )
))
